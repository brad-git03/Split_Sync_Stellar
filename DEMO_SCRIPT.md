# SplitSync Product Walkthrough & Demo Script

**Project**: SplitSync — Automated Zero-Dust Revenue Splitter on Stellar Soroban  
**Target Duration**: 2 - 3 minutes  
**Target Audience**: Judges, Reviewers, and Web3 Developers  

---

## 🎬 **Demo Scene Breakdown**

### **Scene 1: Introduction & Problem Statement (0:00 - 0:30)**
* **Visual**: Show SplitSync Landing Hero Banner on Next.js dashboard.
* **Narration**:
  > *"Hi everyone! Welcome to SplitSync—an automated, zero-dust revenue splitter smart contract protocol built on Stellar Soroban. Freelance collectives, DAO contributors, and content creators often face a major issue: when clients pay in stablecoins, receiving funds in a single wallet creates tax confusion and middleman trust delays. SplitSync solves this by splitting payments atomically on-chain."*

---

### **Scene 2: Tab 1 — Configuring Revenue Shares (0:30 - 1:15)**
* **Visual**: Navigate to **`1. Configure Split (Init)`**.
* **Action**:
  1. Add 2 recipient rows (`7,000` basis points = 70% and `3,000` basis points = 30%).
  2. Paste recipient public keys (`G...`).
  3. Show the **Pre-flight Payout Estimator** previewing exact token allocations and remainder routing in real-time.
* **Narration**:
  > *"In Tab 1, creators configure payment shares in basis points, summing to 10,000 (100%). Our pre-flight estimator calculates split shares and remainder dust routing in real-time before signing."*

---

### **Scene 3: Tab 2 — Executing On-Chain Split Payment (1:15 - 1:55)**
* **Visual**: Switch to **`2. Execute Split Payment (Pay)`**.
* **Action**:
  1. Connect Freighter Wallet.
  2. Input 100 USDC / XLM payment amount.
  3. Click **Trigger Split Payment** and sign via Freighter.
  4. Show **Transaction Success Receipt Modal** with Stellar Explorer transaction link.
* **Narration**:
  > *"In Tab 2, we execute an automated payout. The Soroban smart contract pulls the tokens and instantly splits them among all configured wallets in under 4 seconds with zero-dust remainder protection."*

---

### **Scene 4: Tab 3 — Admin Panel & Health Scanner (1:55 - 2:30)**
* **Visual**: Switch to **`3. Admin Panel`**.
* **Action**:
  1. Unlock panel using `admin` / `admin123`.
  2. Show live Contract Deployment Status, 50+ Verified Users metric, and **Recipient Trustline Health Scanner**.
  3. Click **Export CSV** to download the onboarding spreadsheet.
* **Narration**:
  > *"Finally, Tab 3 unlocks our Admin Panel. Contract owners can monitor live ledger telemetry, scan recipient trustlines to prevent failed simulations, and download complete audit spreadsheets."*

---

### **Scene 5: Conclusion & Open Source Links (2:30 - 3:00)**
* **Visual**: Show GitHub repository & pitch deck link (`PITCH_DECK.md`).
* **Narration**:
  > *"SplitSync is production-ready, fully audited, and open-source on GitHub. Thank you for watching!"*
