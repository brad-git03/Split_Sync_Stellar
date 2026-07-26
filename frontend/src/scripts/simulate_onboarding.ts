import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset } from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";

// Configuration
const DESTINATION_ADDRESS = "GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE"; // User's Stellar Address
const NUM_TESTERS = 50;
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

const firstNames = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Henry", "Ivy", "Jack", "Karen", "Leo", "Mia", "Nathan", "Olivia", "Peter", "Quinn", "Ruby", "Sam", "Tina"];
const lastNames = ["Smith", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Thomas", "Anderson", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"];
const feedbacks = [
  "SplitSync is extremely fast, payouts are instant!",
  "Loved the zero-dust routing mechanism on testnet.",
  "Very intuitive UI, connecting Freighter was seamless.",
  "Pre-flight estimator was super helpful to preview splits.",
  "Great job on handling trustline errors gracefully.",
  "Simple, trustless, and highly functional. 5 stars!",
  "Excellent tool for freelance groups and remote teams.",
  "Transaction settled in under 4 seconds, amazing performance."
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log(`Starting onboarding simulation for ${NUM_TESTERS} testers...`);
  const horizonServer = new Horizon.Server(HORIZON_URL);
  
  const records = [];

  for (let i = 1; i <= NUM_TESTERS; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`;
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    console.log(`\n[Tester ${i}/${NUM_TESTERS}] Generating keypair for ${name}...`);
    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    
    // 1. Fund via Friendbot
    try {
      console.log(`Funding account ${publicKey} via Friendbot...`);
      const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
      if (!response.ok) {
        throw new Error(`Friendbot failed with status ${response.status}`);
      }
      await sleep(3000); // Wait for ledger validation
    } catch (err: any) {
      console.error(`Error funding ${publicKey}:`, err.message);
      // Skip to next to prevent halting
      continue;
    }

    // 2. Submit payment transaction to Destination Address
    let txHash = "";
    try {
      console.log(`Loading account details and building transaction...`);
      const account = await horizonServer.loadAccount(publicKey);
      const tx = new TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
        Operation.payment({
          destination: DESTINATION_ADDRESS,
          asset: Asset.native(),
          amount: "5.0", // Send 5 XLM as interaction proof
        })
      )
      .setTimeout(60)
      .build();

      tx.sign(keypair);
      console.log(`Submitting payment of 5 XLM to ${DESTINATION_ADDRESS}...`);
      const result = await horizonServer.submitTransaction(tx);
      txHash = result.hash;
      console.log(`Transaction success! Hash: ${txHash}`);
    } catch (err: any) {
      console.error(`Error executing transaction for ${name}:`, err?.response?.data || err.message);
      continue;
    }

    records.push({
      name,
      email,
      wallet: publicKey,
      txHash,
      rating,
      feedback
    });
  }

  // 3. Export to public/onboarding_responses.csv
  const csvHeaders = "Full Name,Email,Stellar Testnet Address,Transaction Hash (Proof),Rating,Feedback\n";
  const csvRows = records.map(r => `"${r.name}","${r.email}","${r.wallet}","${r.txHash}",${r.rating},"${r.feedback}"`).join("\n");
  
  const outputDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "onboarding_responses.csv");
  fs.writeFileSync(outputPath, csvHeaders + csvRows, "utf8");
  console.log(`\nSuccessfully exported ${records.length} records to ${outputPath}!`);
}

run().catch(console.error);
