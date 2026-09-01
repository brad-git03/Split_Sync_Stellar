//! SplitSync: Advanced Multi-Module Revenue-Splitting, Milestone Escrow & Governance Protocol on Stellar Soroban.
//! Designed for freelance dev collectives, DAO contributor pods, and creator agencies.

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
    Symbol, Vec,
};

/// Custom typed error codes for SplitSync Soroban Protocol
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidBasisPoints = 3,
    Unauthorized = 4,
    EscrowNotFound = 5,
    EscrowAlreadyFunded = 6,
    EscrowNotFunded = 7,
    MilestoneAlreadyReleased = 8,
    InvalidMilestoneIndex = 9,
    ProposalNotFound = 10,
    ProposalAlreadyExecuted = 11,
    QuorumNotReached = 12,
    AlreadyVoted = 13,
    DisputeNotAllowed = 14,
    ZeroAmount = 15,
}

/// Represents a single recipient and their percentage allocation in basis points (10000 = 100%)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Share {
    pub recipient: Address,
    pub basis_points: u32,
}

/// Represents a deliverable milestone inside a client escrow
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub description: Symbol,
    pub basis_points: u32,
    pub released: bool,
}

/// Lifecycle status for milestone escrows
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowStatus {
    Created = 1,
    Funded = 2,
    Completed = 3,
    Disputed = 4,
    Resolved = 5,
}

/// On-chain milestone escrow record
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub payer: Address,
    pub token: Address,
    pub total_amount: i128,
    pub remaining_balance: i128,
    pub milestones: Vec<Milestone>,
    pub status: EscrowStatus,
    pub arbiter: Address,
}

/// Lifecycle status for multi-sig governance proposals
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalStatus {
    Active = 1,
    Executed = 2,
    Rejected = 3,
}

/// On-chain multi-sig share revision proposal
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub new_shares: Vec<Share>,
    pub required_votes: u32,
    pub current_votes: u32,
    pub status: ProposalStatus,
}

/// Storage keys for contract instance and persistent maps
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Shares,
    EscrowCounter,
    Escrow(u64),
    ProposalCounter,
    Proposal(u64),
    ProposalVote(u64, Address),
}

#[contract]
pub struct SplitSyncContract;

#[contractimpl]
impl SplitSyncContract {
    /// Initializes the SplitSync protocol with an admin and initial split configuration.
    /// Asserts that member allocations strictly equal 10,000 basis points (100.00%).
    pub fn init(env: Env, admin: Address, shares: Vec<Share>) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Shares) {
            return Err(Error::AlreadyInitialized);
        }

        let mut total = 0;
        for share in shares.iter() {
            total += share.basis_points;
        }

        if total != 10000 {
            return Err(Error::InvalidBasisPoints);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Shares, &shares);
        env.storage().instance().set(&DataKey::EscrowCounter, &0u64);
        env.storage().instance().set(&DataKey::ProposalCounter, &0u64);

        // Emit protocol initialization event
        env.events().publish(
            (symbol_short!("SPLIT"), symbol_short!("INIT")),
            (admin, shares.len()),
        );

        Ok(())
    }

    /// Pulls funds from payer and immediately distributes them atomically
    /// to all configured recipients using the zero-dust division algorithm.
    pub fn pay(env: Env, token: Address, sender: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        sender.require_auth();

        let shares: Vec<Share> = env
            .storage()
            .instance()
            .get(&DataKey::Shares)
            .ok_or(Error::NotInitialized)?;

        let client = token::Client::new(&env, &token);

        // Disperse funds directly to recipients without trapping remainder stroops
        let mut remaining = amount;
        let len = shares.len();
        for (i, share) in shares.iter().enumerate() {
            let payout = if i == (len - 1) as usize {
                remaining // Remainder routed to final recipient
            } else {
                (amount * (share.basis_points as i128)) / 10000
            };
            remaining -= payout;
            if payout > 0 {
                client.transfer(&sender, &share.recipient, &payout);
            }
        }

        // Emit payment dispersed event
        env.events().publish(
            (symbol_short!("SPLIT"), symbol_short!("PAY")),
            (token, sender, amount),
        );

        Ok(())
    }

    // =========================================================================
    // MODULE 1: ON-CHAIN MILESTONE ESCROW & ARBITRATION
    // =========================================================================

    /// Creates an itemized milestone escrow for client deliverables.
    pub fn create_escrow(
        env: Env,
        payer: Address,
        token: Address,
        total_amount: i128,
        milestones: Vec<Milestone>,
        arbiter: Address,
    ) -> Result<u64, Error> {
        if total_amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        // Validate milestone basis points sum to 10,000 (100%)
        let mut total_bp = 0;
        for m in milestones.iter() {
            total_bp += m.basis_points;
        }
        if total_bp != 10000 {
            return Err(Error::InvalidBasisPoints);
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowCounter)
            .unwrap_or(0);
        counter += 1;

        let escrow = Escrow {
            id: counter,
            payer: payer.clone(),
            token: token.clone(),
            total_amount,
            remaining_balance: total_amount,
            milestones,
            status: EscrowStatus::Created,
            arbiter: arbiter.clone(),
        };

        env.storage().instance().set(&DataKey::Escrow(counter), &escrow);
        env.storage().instance().set(&DataKey::EscrowCounter, &counter);

        env.events().publish(
            (symbol_short!("ESCROW"), symbol_short!("CREATE")),
            (counter, payer, total_amount),
        );

        Ok(counter)
    }

    /// Payer funds the escrow, locking payment tokens into the contract vault.
    pub fn fund_escrow(env: Env, payer: Address, escrow_id: u64) -> Result<(), Error> {
        payer.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)?;

        if escrow.payer != payer {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Created {
            return Err(Error::EscrowAlreadyFunded);
        }

        let client = token::Client::new(&env, &escrow.token);
        client.transfer(&payer, &env.current_contract_address(), &escrow.total_amount);

        escrow.status = EscrowStatus::Funded;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("ESCROW"), symbol_short!("FUND")),
            (escrow_id, payer, escrow.total_amount),
        );

        Ok(())
    }

    /// Payer releases a completed milestone. The payout is split atomically across squad shares.
    pub fn release_milestone(
        env: Env,
        payer: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), Error> {
        payer.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)?;

        if escrow.payer != payer {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Funded {
            return Err(Error::EscrowNotFunded);
        }
        if milestone_index as usize >= escrow.milestones.len() as usize {
            return Err(Error::InvalidMilestoneIndex);
        }

        let mut milestone = escrow.milestones.get(milestone_index).unwrap();
        if milestone.released {
            return Err(Error::MilestoneAlreadyReleased);
        }

        // Calculate milestone portion of total amount
        let milestone_payout = (escrow.total_amount * (milestone.basis_points as i128)) / 10000;
        let shares: Vec<Share> = env
            .storage()
            .instance()
            .get(&DataKey::Shares)
            .ok_or(Error::NotInitialized)?;

        let client = token::Client::new(&env, &escrow.token);

        // Distribute milestone payout across all squad shares using zero-dust logic
        let mut remaining = milestone_payout;
        let len = shares.len();
        for (i, share) in shares.iter().enumerate() {
            let payout = if i == (len - 1) as usize {
                remaining
            } else {
                (milestone_payout * (share.basis_points as i128)) / 10000
            };
            remaining -= payout;
            if payout > 0 {
                client.transfer(&env.current_contract_address(), &share.recipient, &payout);
            }
        }

        milestone.released = true;
        escrow.milestones.set(milestone_index, milestone);
        escrow.remaining_balance -= milestone_payout;

        // Check if all milestones are released
        let mut all_completed = true;
        for m in escrow.milestones.iter() {
            if !m.released {
                all_completed = false;
                break;
            }
        }
        if all_completed {
            escrow.status = EscrowStatus::Completed;
        }

        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("ESCROW"), symbol_short!("RELEASE")),
            (escrow_id, milestone_index, milestone_payout),
        );

        Ok(())
    }

    /// Payer or squad member flags an active escrow as disputed.
    pub fn dispute_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), Error> {
        caller.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)?;

        if escrow.status != EscrowStatus::Funded {
            return Err(Error::DisputeNotAllowed);
        }

        escrow.status = EscrowStatus::Disputed;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("ESCROW"), symbol_short!("DISPUTE")),
            (escrow_id, caller),
        );

        Ok(())
    }

    /// Arbiter resolves a dispute by setting the refund percentage back to payer (in basis points).
    /// Remainder of remaining balance is split across squad members.
    pub fn resolve_dispute(
        env: Env,
        arbiter: Address,
        escrow_id: u64,
        refund_payer_basis_points: u32,
    ) -> Result<(), Error> {
        arbiter.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)?;

        if escrow.arbiter != arbiter {
            return Err(Error::Unauthorized);
        }
        if escrow.status != EscrowStatus::Disputed {
            return Err(Error::DisputeNotAllowed);
        }
        if refund_payer_basis_points > 10000 {
            return Err(Error::InvalidBasisPoints);
        }

        let client = token::Client::new(&env, &escrow.token);
        let refund_amount =
            (escrow.remaining_balance * (refund_payer_basis_points as i128)) / 10000;
        let squad_amount = escrow.remaining_balance - refund_amount;

        // Refund portion to payer
        if refund_amount > 0 {
            client.transfer(
                &env.current_contract_address(),
                &escrow.payer,
                &refund_amount,
            );
        }

        // Distribute remainder across squad shares
        if squad_amount > 0 {
            let shares: Vec<Share> = env
                .storage()
                .instance()
                .get(&DataKey::Shares)
                .ok_or(Error::NotInitialized)?;

            let mut remaining = squad_amount;
            let len = shares.len();
            for (i, share) in shares.iter().enumerate() {
                let payout = if i == (len - 1) as usize {
                    remaining
                } else {
                    (squad_amount * (share.basis_points as i128)) / 10000
                };
                remaining -= payout;
                if payout > 0 {
                    client.transfer(&env.current_contract_address(), &share.recipient, &payout);
                }
            }
        }

        escrow.remaining_balance = 0;
        escrow.status = EscrowStatus::Resolved;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("ESCROW"), symbol_short!("RESOLVE")),
            (escrow_id, refund_amount, squad_amount),
        );

        Ok(())
    }

    // =========================================================================
    // MODULE 2: ON-CHAIN MULTI-SIG SHARE PROPOSALS & GOVERNANCE
    // =========================================================================

    /// Creates a proposal to update the contract's revenue split percentages.
    pub fn propose_split(
        env: Env,
        proposer: Address,
        new_shares: Vec<Share>,
        required_votes: u32,
    ) -> Result<u64, Error> {
        proposer.require_auth();

        // Validate new shares total 10,000 BP
        let mut total = 0;
        for share in new_shares.iter() {
            total += share.basis_points;
        }
        if total != 10000 {
            return Err(Error::InvalidBasisPoints);
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCounter)
            .unwrap_or(0);
        counter += 1;

        let proposal = Proposal {
            id: counter,
            proposer: proposer.clone(),
            new_shares,
            required_votes,
            current_votes: 1, // Proposer automatically votes yes
            status: ProposalStatus::Active,
        };

        env.storage()
            .instance()
            .set(&DataKey::Proposal(counter), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalVote(counter, proposer.clone()), &true);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCounter, &counter);

        env.events().publish(
            (symbol_short!("PROP"), symbol_short!("CREATE")),
            (counter, proposer, required_votes),
        );

        Ok(counter)
    }

    /// Squad member votes in favor of a proposal.
    pub fn vote_proposal(env: Env, voter: Address, proposal_id: u64) -> Result<(), Error> {
        voter.require_auth();

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Active {
            return Err(Error::ProposalAlreadyExecuted);
        }

        let already_voted = env
            .storage()
            .instance()
            .has(&DataKey::ProposalVote(proposal_id, voter.clone()));
        if already_voted {
            return Err(Error::AlreadyVoted);
        }

        proposal.current_votes += 1;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalVote(proposal_id, voter.clone()), &true);

        env.events().publish(
            (symbol_short!("PROP"), symbol_short!("VOTE")),
            (proposal_id, voter, proposal.current_votes),
        );

        Ok(())
    }

    /// Executes an approved proposal once vote quorum is reached, updating contract shares.
    pub fn execute_proposal(env: Env, proposal_id: u64) -> Result<(), Error> {
        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Active {
            return Err(Error::ProposalAlreadyExecuted);
        }
        if proposal.current_votes < proposal.required_votes {
            return Err(Error::QuorumNotReached);
        }

        // Apply new split configuration
        env.storage()
            .instance()
            .set(&DataKey::Shares, &proposal.new_shares);

        proposal.status = ProposalStatus::Executed;
        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.events().publish(
            (symbol_short!("PROP"), symbol_short!("EXEC")),
            (proposal_id, proposal.new_shares.len()),
        );

        Ok(())
    }

    // =========================================================================
    // MODULE 3: READ QUERIES & GETTERS
    // =========================================================================

    /// Returns the current active split shares configuration.
    pub fn get_shares(env: Env) -> Result<Vec<Share>, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Shares)
            .ok_or(Error::NotInitialized)
    }

    /// Returns the details of a milestone escrow.
    pub fn get_escrow(env: Env, escrow_id: u64) -> Option<Escrow> {
        env.storage().instance().get(&DataKey::Escrow(escrow_id))
    }

    /// Returns the details of a governance proposal.
    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        env.storage().instance().get(&DataKey::Proposal(proposal_id))
    }
}

#[cfg(test)]
mod test;