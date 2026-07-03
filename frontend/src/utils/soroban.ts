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

/**
 * Formats a raw token amount in base units (7 decimal places) into a user-friendly decimal string.
 */
export function formatTokenAmount(amountStr: string): string {
  if (!amountStr) return "0";
  if (amountStr.includes("No Trustline")) {
    return amountStr;
  }
  try {
    const val = BigInt(amountStr);
    const decimals = 7;
    const factor = BigInt(10 ** decimals);
    const integerPart = val / factor;
    const fractionalPart = val % factor;

    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    // Trim trailing zeros in fractional part to keep it clean
    fractionalStr = fractionalStr.replace(/0+$/, "");

    // Format integer part with commas (locale-aware)
    const formattedInteger = integerPart.toLocaleString("en-US");

    if (fractionalStr.length > 0) {
      return `${formattedInteger}.${fractionalStr}`;
    }
    return formattedInteger;
  } catch (err) {
    return amountStr;
  }
}


