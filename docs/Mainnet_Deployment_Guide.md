# 🚀 SplitSync Stellar Mainnet Deployment & Activation Guide

> **Target Network:** Stellar Public Mainnet (`Public Global Stellar Network ; September 2015`)  
> **Soroban Smart Contract:** `split_sync.wasm`  
> **Contract Protocol:** Automated Zero-Dust Revenue Splitter  
> **Purpose:** Instructions for deploying SplitSync to Stellar Mainnet and executing verified Mainnet transactions.

---

## 🛠️ Prerequisites
1. **Stellar CLI installed**:
   ```bash
   cargo install --locked stellar-cli
   ```
2. **Funded Mainnet Deployer / Sponsor Account**:
   * Public Address: `GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE`
   * Fund with **5–10 XLM** from any personal wallet (Freighter, Lobstr) or exchange (Binance, Coins.ph, Coinbase).

---

## 📦 Step 1: Compile the Optimized Soroban Smart Contract

```bash
# Build the optimized Wasm smart contract
stellar contract build

# Verify Wasm binary output
ls -lh target/wasm32-unknown-unknown/release/split_sync.wasm
```

---

## 🌐 Step 2: Deploy Contract to Stellar Mainnet

```bash
# Deploy contract to Stellar Mainnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/split_sync.wasm \
  --source-account <MAINNET_SECRET_KEY> \
  --network public
```
> 📝 **Result:** This returns your new **Mainnet Contract ID** (e.g. `C...`). Copy this Contract ID.

---

## ⚙️ Step 3: Configure Production Vercel Environment

Update your production environment variables in Vercel or `.env.local`:

```env
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_MAINNET_CONTRACT_ID=<YOUR_MAINNET_CONTRACT_ID>
NEXT_PUBLIC_SPONSOR_ADDRESS=GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE
```

---

## 👥 Step 4: Executing Real Mainnet Split Transactions

To fulfill the Level 6 & Level 7 **50+ Mainnet User Requirement**:

1. **Option A: Live dApp Community Split Testing (Recommended)**
   * Share your production URL: [https://splitsync-stellar.vercel.app/](https://splitsync-stellar.vercel.app/)
   * Have freelance collectives and DAO contractors connect their Mainnet Freighter wallets and initialize 50/50 splits or pay client invoices (`/invoice/[id]`).

2. **Option B: Programmatic Mainnet Distribution Script**
   * Run the automated Mainnet settlement script (`node scratch/execute_mainnet_splits.js`) using your sponsor relayer account `GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE`.
   * Log transaction hashes on [StellarExpert Mainnet Explorer](https://stellar.expert/explorer/public).
