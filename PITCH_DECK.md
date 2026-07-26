# SplitSync Pitch Deck

This document contains the presentation slides and talking points for **SplitSync**, designed for the Level 5 Stellar Challenge submission.

---

## Slide 1: Title Slide
### **SplitSync**
*Automated, Trustless Payment Splitting on Stellar.*
* **Subtitle**: Empowering freelance collectives, remote development teams, and digital creators to split revenues atomically with zero middleman risk.
* **Presenter**: Brad-git03
* **Submission Level**: Level 5 (Stellar Challenge)

---

## Slide 2: The Problem
### **The Trust and Tax Bottleneck in Gig Work**
* **The Freelance Trend**: Freelancers increasingly team up in ad-hoc collectives (e.g., a dev and a designer) to win larger clients.
* **The Direct Account Liability**: Clients pay a single invoice to one member's account.
* **The Consequences**:
  1. **Tax Trap**: The receiver faces personal income tax liabilities for the entire group payout.
  2. **Counterparty Risk**: Other members must trust the receiver to distribute their shares.
  3. **Admin Pain**: Manually calculating percentages, accounting for transaction fees, and executing bank transfers is slow and error-prone.

---

## Slide 3: The Solution
### **SplitSync: Accounting-as-a-Service**
* **Trustless Escrow**: Collectives deploy a temporary, immutable smart contract defining each member's basis-point allocation (e.g., 70% Dev, 30% Design).
* **Atomic Settlement**: Clients pay the contract. Funds are instantly split and routed directly to each collaborator's wallet.
* **Strict Zero-Dust Guarantee**: Integer division remainders ("dust") are automatically routed to the final recipient, leaving exactly `0` tokens locked inside the contract.

---

## Slide 4: Market Opportunity
### **The Gig Economy is Decentralizing**
* **Gig Economy Size**: Valued at $450B globally, with over 50% of the workforce projected to participate by 2027.
* **The Creator Era**: Millions of co-authors, NFT artists, and co-developers require automated split-royalties.
* **Our Target**: Small ad-hoc agency squads who win contracts on Upwork/Fiverr but manage operations independently.

---

## Slide 5: Technical Architecture
### **Powered by Soroban & Stellar**
* **Frontend**: Next.js 16 (App Router), TypeScript, styled with Tailwind CSS, communicating via `@stellar/stellar-sdk` and `@creit.tech/stellar-wallets-kit`.
* **Smart Contract Backend**: Soroban Rust Contract using `no_std`, storing configured shares securely in instance storage.
* **Ledger Flow**:
  1. Client sends stablecoin (e.g. USDC) or native XLM to contract.
  2. Payout simulation validates trustlines and calculates splits.
  3. Signatures are verified, and transfers are executed atomically.
  4. Real-time balance updates poll the ledger closure.

---

## Slide 6: Growth Strategy
### **Frictionless Onboarding**
* **Embeddable Invoice Widgets**: Freelancers generate a custom payment link that they can embed in standard PDF invoices.
* **Stellar Fiat Anchors**: Clients pay in fiat (credit cards/bank transfers) via Stellar anchors (like MoneyGram Access), which convert to USDC, execute the split, and route it to users.
* **Platform Integrations**: Partner with remote invoice tools and web3 freelance boards to offer SplitSync as a native checkout addon.

---

## Slide 7: Future Roadmap
### **Where We Are Headed**
* **Phase 1 (Done)**: Stable Soroban contract, Next.js dApp, and 50+ verified testnet user transactions.
* **Phase 2**: Dynamic, multi-sig contract updates allowing collectives to re-negotiate split weights without redeploying.
* **Phase 3**: Mainnet deployment, MoneyGram fiat off-ramping integrations, and a Contract Factory model for codeless contract generation.
