# Building Automated Zero-Dust Revenue Splitters on Stellar Soroban

**Author**: SplitSync Core Engineering Team  
**Category**: Developer Tutorial & Ecosystem Technical Contribution  
**Target Platform**: Stellar Soroban Smart Contracts + Next.js + Freighter Wallet  

---

## 💡 **Introduction**

In Web3 freelance collectives, DAO contributor squads, and digital content platforms, splitting incoming revenue equitably among multiple contributors is a core challenge. Manual revenue distribution leads to:
1. **Tax Liabilities**: A single wallet receiving 100% of gross revenue faces tax burdens for funds that belong to co-creators.
2. **Trust & Delay**: Co-creators must wait for manual transfers, risking delays or human error.
3. **Division Dust Loss**: Simple integer division often truncates fractional tokens, permanently locking remainder tokens.

In this tutorial, we will build **SplitSync**—a Soroban smart contract and dApp that splits payments **atomically on-chain** with **zero-dust remainder guarantees**.

---

## 🛠️ **Smart Contract Architecture**

### 1. Data Structures & State
In Soroban Rust, we represent shares using basis points (where 10,000 basis points = 100.00%):

```rust
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Share {
    pub recipient: Address,
    pub basis_points: u32,
}
```

### 2. Zero-Dust Payout Execution
When executing a payout of `amount` from `from`, we compute each recipient's share and automatically allocate leftover remainder fractions to the last recipient:

```rust
pub fn split_pay(
    env: Env,
    from: Address,
    token: Address,
    amount: i128,
    shares: Vec<Share>,
) {
    from.require_auth();

    let client = token::Client::new(&env, &token);
    let mut total_allocated: i128 = 0;
    let shares_len = shares.len();

    for (i, share) in shares.iter().enumerate() {
        let mut recipient_amount = (amount * (share.basis_points as i128)) / 10000;
        
        // Zero-Dust Remainder Guarantee: Route remaining fraction to last recipient
        if i == shares_len - 1 {
            recipient_amount = amount - total_allocated;
        }

        total_allocated += recipient_amount;

        if recipient_amount > 0 {
            client.transfer(&from, &share.recipient, &recipient_amount);
        }
    }
}
```

---

## 🖥️ **Frontend & Client Integration**

Using `@stellar/stellar-sdk` and Freighter Wallet, we build a Next.js interface that previews exact token shares and handles low-level WASM panic exceptions if a recipient lacks a token trustline.

---

## 🔐 **Conclusion**

By leveraging Soroban's atomic execution and Stellar Asset Contracts (SAC), SplitSync provides trustless, instant, zero-dust revenue distribution for Web3 teams.
