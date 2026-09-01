#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env, Symbol};
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient as TokenAdminClient};

fn create_token<'a>(env: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let contract_address = sac.address();
    (
        TokenClient::new(env, &contract_address),
        TokenAdminClient::new(env, &contract_address),
    )
}

// TEST 1: Instant atomic zero-dust payment execution
#[test]
fn test_splitsync_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client_wallet = Address::generate(&env);
    let dev_wallet = Address::generate(&env);
    let designer_wallet = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&client_wallet, &1000);

    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    // Initialize 70/30 split
    let shares = vec![
        &env,
        Share { recipient: dev_wallet.clone(), basis_points: 7000 },
        Share { recipient: designer_wallet.clone(), basis_points: 3000 },
    ];
    contract_client.init(&admin, &shares);

    // Execute instant payment
    contract_client.pay(&token.address, &client_wallet, &1000);

    assert_eq!(token.balance(&dev_wallet), 700);
    assert_eq!(token.balance(&designer_wallet), 300);
    assert_eq!(token.balance(&client_wallet), 0);
    assert_eq!(token.balance(&contract_id), 0);
}

// TEST 2: Basis points must equal 10,000
#[test]
fn test_init_invalid_basis_points() {
    let env = Env::default();
    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let dev_wallet = Address::generate(&env);
    let designer_wallet = Address::generate(&env);

    let shares = vec![
        &env,
        Share { recipient: dev_wallet, basis_points: 7000 },
        Share { recipient: designer_wallet, basis_points: 4000 }, // 11,000 total
    ];

    let res = contract_client.try_init(&admin, &shares);
    assert_eq!(res, Err(Ok(Error::InvalidBasisPoints)));
}

// TEST 3: On-Chain Milestone Escrow creation, funding, and progressive milestone releases
#[test]
fn test_milestone_escrow_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client_wallet = Address::generate(&env);
    let dev_wallet = Address::generate(&env);
    let designer_wallet = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&client_wallet, &5000);

    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    // Initialize 60/40 squad split
    let shares = vec![
        &env,
        Share { recipient: dev_wallet.clone(), basis_points: 6000 },
        Share { recipient: designer_wallet.clone(), basis_points: 4000 },
    ];
    contract_client.init(&admin, &shares);

    // Define 2 milestones (50% upfront, 50% on deliverable completion)
    let milestones = vec![
        &env,
        Milestone { description: Symbol::new(&env, "UI_PROTOTYPE"), basis_points: 5000, released: false },
        Milestone { description: Symbol::new(&env, "FINAL_WASM"), basis_points: 5000, released: false },
    ];

    // Create escrow for 5000 USDC
    let escrow_id = contract_client.create_escrow(&client_wallet, &token.address, &5000, &milestones, &arbiter);
    assert_eq!(escrow_id, 1);

    // Client funds escrow
    contract_client.fund_escrow(&client_wallet, &escrow_id);
    assert_eq!(token.balance(&contract_id), 5000);
    assert_eq!(token.balance(&client_wallet), 0);

    // Release Milestone 0 (50% = 2500 USDC)
    contract_client.release_milestone(&client_wallet, &escrow_id, &0);
    // Dev gets 60% of 2500 = 1500; Designer gets 40% of 2500 = 1000
    assert_eq!(token.balance(&dev_wallet), 1500);
    assert_eq!(token.balance(&designer_wallet), 1000);
    assert_eq!(token.balance(&contract_id), 2500);

    // Release Milestone 1 (Remaining 2500 USDC)
    contract_client.release_milestone(&client_wallet, &escrow_id, &1);
    assert_eq!(token.balance(&dev_wallet), 3000);
    assert_eq!(token.balance(&designer_wallet), 2000);
    assert_eq!(token.balance(&contract_id), 0);

    let escrow = contract_client.get_escrow(&escrow_id).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Completed);
}

// TEST 4: Milestone escrow dispute and arbiter resolution
#[test]
fn test_milestone_escrow_dispute_and_resolution() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client_wallet = Address::generate(&env);
    let dev_wallet = Address::generate(&env);
    let designer_wallet = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&client_wallet, &4000);

    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    let shares = vec![
        &env,
        Share { recipient: dev_wallet.clone(), basis_points: 5000 },
        Share { recipient: designer_wallet.clone(), basis_points: 5000 },
    ];
    contract_client.init(&admin, &shares);

    let milestones = vec![
        &env,
        Milestone { description: Symbol::new(&env, "FULL_PROJECT"), basis_points: 10000, released: false },
    ];

    let escrow_id = contract_client.create_escrow(&client_wallet, &token.address, &4000, &milestones, &arbiter);
    contract_client.fund_escrow(&client_wallet, &escrow_id);

    // Client disputes deliverables
    contract_client.dispute_escrow(&client_wallet, &escrow_id);

    // Arbiter resolves dispute: 50% refund to client, 50% payout to squad
    contract_client.resolve_dispute(&arbiter, &escrow_id, &5000);

    assert_eq!(token.balance(&client_wallet), 2000); // 50% refunded
    assert_eq!(token.balance(&dev_wallet), 1000);     // 50% split to dev
    assert_eq!(token.balance(&designer_wallet), 1000);// 50% split to designer
    assert_eq!(token.balance(&contract_id), 0);
}

// TEST 5: On-Chain Multi-Sig Share Governance Proposal & Execution
#[test]
fn test_proposal_voting_and_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let dev1 = Address::generate(&env);
    let dev2 = Address::generate(&env);
    let dev3 = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token, token_admin_client) = create_token(&env, &token_admin);
    let client = Address::generate(&env);
    token_admin_client.mint(&client, &10000);

    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    // Initial equal split: 50/50 between dev1 & dev2
    let initial_shares = vec![
        &env,
        Share { recipient: dev1.clone(), basis_points: 5000 },
        Share { recipient: dev2.clone(), basis_points: 5000 },
    ];
    contract_client.init(&admin, &initial_shares);

    // Propose bringing on dev3 for a 40/30/30 split (Requires 2 votes)
    let new_shares = vec![
        &env,
        Share { recipient: dev1.clone(), basis_points: 4000 },
        Share { recipient: dev2.clone(), basis_points: 3000 },
        Share { recipient: dev3.clone(), basis_points: 3000 },
    ];
    let proposal_id = contract_client.propose_split(&dev1, &new_shares, &2);

    // Dev2 votes in favor
    contract_client.vote_proposal(&dev2, &proposal_id);

    // Execute proposal
    contract_client.execute_proposal(&proposal_id);

    // Verify updated shares
    let updated_shares = contract_client.get_shares();
    assert_eq!(updated_shares.len(), 3);
    assert_eq!(updated_shares.get(0).unwrap().basis_points, 4000);
    assert_eq!(updated_shares.get(1).unwrap().basis_points, 3000);
    assert_eq!(updated_shares.get(2).unwrap().basis_points, 3000);

    // Pay client funds and verify new 40/30/30 distribution
    contract_client.pay(&token.address, &client, &10000);
    assert_eq!(token.balance(&dev1), 4000);
    assert_eq!(token.balance(&dev2), 3000);
    assert_eq!(token.balance(&dev3), 3000);
}

// TEST 6: Zero remainder dust invariant on odd amounts
#[test]
fn test_zero_dust_odd_amounts() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let dev1 = Address::generate(&env);
    let dev2 = Address::generate(&env);
    let dev3 = Address::generate(&env);
    let client = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token, token_admin_client) = create_token(&env, &token_admin);
    token_admin_client.mint(&client, &100);

    let contract_id = env.register(SplitSyncContract, ());
    let contract_client = SplitSyncContractClient::new(&env, &contract_id);

    // 33.33% / 33.33% / 33.34% (Total = 10,000 BP)
    let shares = vec![
        &env,
        Share { recipient: dev1.clone(), basis_points: 3333 },
        Share { recipient: dev2.clone(), basis_points: 3333 },
        Share { recipient: dev3.clone(), basis_points: 3334 },
    ];
    contract_client.init(&admin, &shares);

    // Pay 100 stroops
    contract_client.pay(&token.address, &client, &100);

    let b1 = token.balance(&dev1);
    let b2 = token.balance(&dev2);
    let b3 = token.balance(&dev3);

    assert_eq!(b1 + b2 + b3, 100);
    assert_eq!(token.balance(&contract_id), 0); // Contract vault is identically 0
}