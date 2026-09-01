/**
 * SplitSync frontend integration handlers.
 * Interacts with Soroban Smart Contracts via @stellar/stellar-sdk.
 */

import {
  Contract,
  Address,
  rpc,
  TransactionBuilder,
  Account,
  Networks,
  xdr,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI";
export const RPC_URL = "https://soroban-testnet.stellar.org";

/**
 * Builds a single Share struct ScVal.
 * In Soroban, a struct with named fields is represented as an scvMap with keys sorted alphabetically.
 * "basis_points" is sorted before "recipient".
 */
export function buildShareScVal(recipient: string, basisPoints: number): xdr.ScVal {
  // recipient must be an Address ScVal
  const recipientScVal = nativeToScVal(Address.fromString(recipient.trim()));
  // basis_points is u32
  const basisPointsScVal = nativeToScVal(basisPoints, { type: "u32" });

  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("basis_points"),
      val: basisPointsScVal,
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("recipient"),
      val: recipientScVal,
    }),
  ]);
}

/**
 * Prepares the transaction to initialize the contract with split shares.
 */
export async function prepareInitTx(
  senderAddress: string,
  shares: { recipient: string; basisPoints: number }[]
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  
  // Fetch current account sequence number
  const account = await server.getAccount(senderAddress.trim());
  
  // Build the shares ScVal vector
  const sharesVecScVal = xdr.ScVal.scvVec(
    shares.map((s) => buildShareScVal(s.recipient, s.basisPoints))
  );

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call("init", sharesVecScVal);

  const tx = new TransactionBuilder(
    new Account(senderAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000", // baseline base fee, will be updated during simulation
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate transaction to get footprints and gas fees
  const simulated = await server.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // Assemble transaction with simulation resource footprint
  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

/**
 * Prepares the transaction to distribute payment.
 */
export async function preparePayTx(
  senderAddress: string,
  tokenAddress: string,
  amount: string
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  
  // Fetch current account sequence number
  const account = await server.getAccount(senderAddress.trim());

  // Encode inputs
  const tokenScVal = nativeToScVal(Address.fromString(tokenAddress.trim()));
  const senderScVal = nativeToScVal(Address.fromString(senderAddress.trim()));
  const amountScVal = nativeToScVal(BigInt(amount), { type: "i128" });

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call("pay", tokenScVal, senderScVal, amountScVal);

  const tx = new TransactionBuilder(
    new Account(senderAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

/**
 * Helper to submit signed XDR transaction to Soroban RPC gateway.
 */
export async function submitTx(signedXdr: string): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.sendTransaction(tx);

  if (response.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(response)}`);
  }

  const hash = response.hash;
  
  // Wait for the transaction to close in a ledger so that frontend state updates (like balance) reflect instantly
  const pollResult = await server.pollTransaction(hash);
  
  if (pollResult.status === "FAILED") {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(pollResult)}`);
  }
  
  if (pollResult.status === "NOT_FOUND") {
    throw new Error("Transaction timed out or was not found in any ledger.");
  }

  return hash;
}

/**
 * Reads the token balance for a user address on the ledger via simulation (free, read-only).
 */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
): Promise<string> {
  try {
    const server = new rpc.Server(RPC_URL);
    const contract = new Contract(tokenAddress.trim());
    const userScVal = nativeToScVal(Address.fromString(userAddress.trim()));

    // Construct a dummy transaction for simulation
    const tx = new TransactionBuilder(
      new Account(userAddress.trim(), "0"),
      {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      }
    )
      .addOperation(contract.call("balance", userScVal))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulated)) {
      // Check if it is a missing trustline error (HostError Error(Contract, #13))
      if (simulated.error?.includes("Contract, #13") || simulated.error?.includes("trustline")) {
        return "0 (No Trustline)";
      }
      throw new Error(`Simulation error: ${simulated.error}`);
    }

    if (simulated.result) {
      const resultVal = simulated.result.retval;
      const nativeVal = scValToNative(resultVal);
      return String(nativeVal);
    }

    return "0";
  } catch (err) {
    console.error("Failed to fetch token balance:", err);
    return "0";
  }
}

export async function getRealAccountBalance(
  userAddress: string,
  preferredAsset: string = "XLM"
): Promise<{ xlm: string; usdc: string; display: string }> {
  try {
    const cleanAddr = userAddress.trim();
    if (!cleanAddr) return { xlm: "0.00", usdc: "0.00", display: "0.00 XLM" };

    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${cleanAddr}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { xlm: "0.00", usdc: "0.00", display: "0.00 XLM (Unfunded)" };
      }
      throw new Error(`Horizon status: ${res.status}`);
    }

    const data = await res.json();
    const balances = data.balances || [];

    let xlmBal = "0.00";
    let usdcBal = "0.00";

    for (const b of balances) {
      if (b.asset_type === "native") {
        const num = parseFloat(b.balance || "0");
        xlmBal = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      } else if (b.asset_code === "USDC") {
        const num = parseFloat(b.balance || "0");
        usdcBal = num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }

    const display = preferredAsset === "USDC" ? `${usdcBal} USDC` : `${xlmBal} XLM`;
    return { xlm: xlmBal, usdc: usdcBal, display };
  } catch (err) {
    console.error("Failed to query Horizon for real wallet balance:", err);
    return { xlm: "0.00", usdc: "0.00", display: "0.00 XLM" };
  }
}

/**
 * Builds a single Milestone struct ScVal.
 */
export function buildMilestoneScVal(description: string, basisPoints: number): xdr.ScVal {
  const descScVal = xdr.ScVal.scvSymbol(description.trim().substring(0, 32));
  const basisPointsScVal = nativeToScVal(basisPoints, { type: "u32" });
  const releasedScVal = nativeToScVal(false);

  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("basis_points"),
      val: basisPointsScVal,
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("description"),
      val: descScVal,
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("released"),
      val: releasedScVal,
    }),
  ]);
}

/**
 * Prepares the transaction to create a multi-stage milestone escrow.
 */
export async function prepareCreateEscrowTx(
  senderAddress: string,
  payerAddress: string,
  tokenAddress: string,
  totalAmount: string,
  milestones: { description: string; basisPoints: number }[],
  arbiterAddress: string
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(senderAddress.trim());

  const payerScVal = nativeToScVal(Address.fromString(payerAddress.trim()));
  const tokenScVal = nativeToScVal(Address.fromString(tokenAddress.trim()));
  const totalAmountScVal = nativeToScVal(BigInt(totalAmount), { type: "i128" });
  const milestonesVecScVal = xdr.ScVal.scvVec(
    milestones.map((m) => buildMilestoneScVal(m.description, m.basisPoints))
  );
  const arbiterScVal = nativeToScVal(Address.fromString(arbiterAddress.trim()));

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call(
    "create_escrow",
    payerScVal,
    tokenScVal,
    totalAmountScVal,
    milestonesVecScVal,
    arbiterScVal
  );

  const tx = new TransactionBuilder(
    new Account(senderAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

/**
 * Prepares the transaction to fund an escrow.
 */
export async function prepareFundEscrowTx(
  payerAddress: string,
  escrowId: number
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(payerAddress.trim());

  const payerScVal = nativeToScVal(Address.fromString(payerAddress.trim()));
  const escrowIdScVal = nativeToScVal(BigInt(escrowId), { type: "u64" });

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call("fund_escrow", payerScVal, escrowIdScVal);

  const tx = new TransactionBuilder(
    new Account(payerAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

/**
 * Prepares the transaction to release a completed milestone.
 */
export async function prepareReleaseMilestoneTx(
  payerAddress: string,
  escrowId: number,
  milestoneIndex: number
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(payerAddress.trim());

  const payerScVal = nativeToScVal(Address.fromString(payerAddress.trim()));
  const escrowIdScVal = nativeToScVal(BigInt(escrowId), { type: "u64" });
  const milestoneIndexScVal = nativeToScVal(milestoneIndex, { type: "u32" });

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call(
    "release_milestone",
    payerScVal,
    escrowIdScVal,
    milestoneIndexScVal
  );

  const tx = new TransactionBuilder(
    new Account(payerAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

/**
 * Prepares the transaction to propose a new split revision.
 */
export async function prepareProposeSplitTx(
  proposerAddress: string,
  newShares: { recipient: string; basisPoints: number }[],
  requiredVotes: number
): Promise<string> {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(proposerAddress.trim());

  const proposerScVal = nativeToScVal(Address.fromString(proposerAddress.trim()));
  const newSharesVecScVal = xdr.ScVal.scvVec(
    newShares.map((s) => buildShareScVal(s.recipient, s.basisPoints))
  );
  const requiredVotesScVal = nativeToScVal(requiredVotes, { type: "u32" });

  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call(
    "propose_split",
    proposerScVal,
    newSharesVecScVal,
    requiredVotesScVal
  );

  const tx = new TransactionBuilder(
    new Account(proposerAddress.trim(), account.sequenceNumber()),
    {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    }
  )
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simulated).build();
  return assembledTx.toXDR();
}

export { formatTokenAmount } from "./format";


