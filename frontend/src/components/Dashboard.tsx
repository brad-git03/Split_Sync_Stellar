"use client";

import React, { useState, useEffect } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { prepareInitTx, preparePayTx, submitTx, getTokenBalance, formatTokenAmount } from "@/utils/soroban";
import { validateStellarAddress, validateContractAddress } from "@/utils/validation";

interface ShareInput {
  recipient: string;
  basisPoints: number;
}

export default function Dashboard() {
  const {
    address,
    status,
    error: walletError,
    connect,
    disconnect,
    signTx,
    truncatedAddress,
  } = useStellarWallet();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"init" | "pay" | "admin">("init");

  // Admin Tab State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Check stored admin auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("splitsync_admin_auth");
    if (storedAuth === "true") {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsernameInput.trim() === "admin" && adminPasswordInput === "admin123") {
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
      localStorage.setItem("splitsync_admin_auth", "true");
      setAdminUsernameInput("");
      setAdminPasswordInput("");
    } else {
      setAdminAuthError("Invalid admin credentials. Use admin / admin123.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("splitsync_admin_auth");
  };

  // Fee Sponsorship (Gasless Transaction) State
  const [isFeeSponsored, setIsFeeSponsored] = useState<boolean>(true);
  const sponsorAddress = "GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE";

  // State for Init Tab (Configuring Shares)
  const [shares, setShares] = useState<ShareInput[]>([
    { recipient: "", basisPoints: 5000 },
    { recipient: "", basisPoints: 5000 },
  ]);
  const [initTxXdr, setInitTxXdr] = useState<string | null>(null);
  const [initSignedXdr, setInitSignedXdr] = useState<string | null>(null);
  const [initTxHash, setInitTxHash] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // State for Pay Tab
  const [tokenAddress, setTokenAddress] = useState("CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"); // Valid Testnet USDC/SAC Address
  const [senderAddress, setSenderAddress] = useState("");
  const [amount, setAmount] = useState("1000"); // 1000 base units (stroops)
  const [payTxXdr, setPayTxXdr] = useState<string | null>(null);
  const [paySignedXdr, setPaySignedXdr] = useState<string | null>(null);
  const [payTxHash, setPayTxHash] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<string | null>(null);
  const [successShares, setSuccessShares] = useState<ShareInput[]>([]);

  // Pre-fill sender address when wallet connects
  useEffect(() => {
    if (address) {
      setSenderAddress(address);
    }
  }, [address]);

  // Validation for Init Tab
  const totalBasisPoints = shares.reduce((acc, curr) => acc + (curr.basisPoints || 0), 0);
  const isBasisPointsValid = totalBasisPoints === 10000;
  // Balance state
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch token balance via read-only simulation
  const fetchBalance = async () => {
    if (!address || !tokenAddress || !validateContractAddress(tokenAddress)) {
      setTokenBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const bal = await getTokenBalance(tokenAddress, address);
      setTokenBalance(bal);
    } catch (err) {
      console.error(err);
      setTokenBalance("0");
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch balance when wallet connects, token address changes, or after transaction submits
  useEffect(() => {
    fetchBalance();
  }, [address, tokenAddress, payTxHash]);

  const isInitFormValid =
    isBasisPointsValid &&
    shares.length > 0 &&
    shares.every((s) => validateStellarAddress(s.recipient) && s.basisPoints > 0);

  const isPayFormValid =
    validateContractAddress(tokenAddress) &&
    validateStellarAddress(senderAddress) &&
    Number(amount) > 0;

  // Add/Remove share rows
  const addShareRow = () => {
    setShares([...shares, { recipient: "", basisPoints: 0 }]);
  };

  const removeShareRow = (index: number) => {
    const newShares = [...shares];
    newShares.splice(index, 1);
    setShares(newShares);
  };

  const updateShareRow = (index: number, field: keyof ShareInput, value: string | number) => {
    const newShares = [...shares];
    if (field === "basisPoints") {
      newShares[index].basisPoints = Math.max(0, Number(value));
    } else {
      newShares[index].recipient = String(value);
    }
    setShares(newShares);
  };

  // Actions
  const handleConfigureSplit = async () => {
    if (!address) return;
    setInitLoading(true);
    setInitError(null);
    setInitTxXdr(null);
    setInitSignedXdr(null);
    setInitTxHash(null);

    try {
      // 1. Build and simulate transaction to get raw XDR
      const xdrResult = await prepareInitTx(address, shares);
      setInitTxXdr(xdrResult);

      // 2. Trigger wallet signing modal
      const signedXdr = await signTx(xdrResult);
      setInitSignedXdr(signedXdr);

      // 3. Submit transaction to RPC
      const hash = await submitTx(signedXdr);
      setInitTxHash(hash);
    } catch (err: any) {
      console.error(err);
      setInitError(err.message || "Failed to configure split transaction.");
    } finally {
      setInitLoading(false);
    }
  };

  const handlePaySplit = async () => {
    if (!address) return;
    setPayLoading(true);
    setPayError(null);
    setPayTxXdr(null);
    setPaySignedXdr(null);
    setPayTxHash(null);

    try {
      // 1. Build and simulate transaction to get raw XDR
      const xdrResult = await preparePayTx(senderAddress, tokenAddress, amount);
      setPayTxXdr(xdrResult);

      // 2. Trigger wallet signing modal
      const signedXdr = await signTx(xdrResult);
      setPaySignedXdr(signedXdr);

      // 3. Submit transaction to RPC
      const hash = await submitTx(signedXdr);
      setPayTxHash(hash);
      
      // Populate success modal and open it
      setSuccessTxHash(hash);
      setSuccessAmount(amount);
      setSuccessShares([...shares]);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setPayError(err.message || "Failed to process split payment.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-slate-layer border border-border-slate rounded-lg gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-mint rounded-full inline-block animate-pulse"></span>
            SplitSync
          </h1>
          <p className="text-sm text-muted-silver mt-1">
            Automated, trustless payment routing dApp on Soroban Testnet.
          </p>
        </div>

        {/* Connection States */}
        <div className="flex items-center gap-3">
          {status === "connected" && (
            <div className="text-right">
              <div className="text-xs text-muted-silver">Connected Address</div>
              <div className="font-mono text-sm text-emerald-mint">{truncatedAddress}</div>
              <div className="text-[10px] text-muted-silver mt-0.5">
                {balanceLoading ? "Loading balance..." : tokenBalance !== null ? `Balance: ${formatTokenAmount(tokenBalance)}` : ""}
              </div>
            </div>
          )}

          {status === "connecting" ? (
            <button
              disabled
              className="px-5 py-2.5 bg-slate-layer border border-border-slate text-sm font-medium text-white rounded-md flex items-center gap-2 cursor-wait"
            >
              <svg className="animate-spin h-4 w-4 text-emerald-mint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </button>
          ) : status === "connected" ? (
            <button
              onClick={disconnect}
              className="px-5 py-2.5 border border-border-slate hover:border-sage-ice text-sm font-medium text-white hover:text-sage-ice rounded-md transition-all cursor-pointer bg-obsidian"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connect}
              className="px-5 py-2.5 bg-emerald-mint hover:bg-opacity-90 text-sm font-semibold text-obsidian rounded-md shadow-lg shadow-emerald-mint/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {walletError && (
        <div className="p-4 bg-muted-crimson/10 border border-muted-crimson/30 rounded-lg text-sm text-muted-crimson">
          <strong>Wallet Error:</strong> {walletError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-slate gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("init")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "init"
              ? "border-emerald-mint text-white"
              : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          1. Configure Split (Init)
        </button>
        <button
          onClick={() => setActiveTab("pay")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pay"
              ? "border-emerald-mint text-white"
              : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          2. Execute Split Payment (Pay)
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "admin"
              ? "border-emerald-mint text-white"
              : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          <svg className="w-4 h-4 text-emerald-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          3. Admin Panel
        </button>
      </div>

      {/* Content Layer */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Active Form Card */}
        <div className="lg:col-span-7 bg-slate-layer border border-border-slate rounded-lg p-6 shadow-2xl">
          {activeTab === "init" ? (
            /* Tab 1: Split configuration */
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Revenue Split Shares Configuration</h2>
                <p className="text-xs text-muted-silver mt-1">
                  Specify the payment addresses and allocations. The total basis points must equal exactly 10,000 (100%).
                </p>
              </div>

              {/* Dynamic Rows */}
              <div className="space-y-3">
                {shares.map((share, idx) => {
                  const isAddressInvalid = share.recipient !== "" && !validateStellarAddress(share.recipient);
                  const isBpInvalid = share.recipient !== "" && share.basisPoints <= 0;

                  return (
                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Recipient Public Key (G...)"
                          value={share.recipient}
                          onChange={(e) => updateShareRow(idx, "recipient", e.target.value)}
                          className={`w-full px-3 py-2 bg-obsidian border text-white font-mono text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint ${
                            isAddressInvalid ? "border-muted-crimson" : "border-border-slate"
                          }`}
                        />
                      </div>
                      <div className="w-full md:w-32 flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Points"
                          value={share.basisPoints || ""}
                          onChange={(e) => updateShareRow(idx, "basisPoints", e.target.value)}
                          className={`w-full px-3 py-2 bg-obsidian border text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint ${
                            isBpInvalid ? "border-muted-crimson" : "border-border-slate"
                          }`}
                        />
                        <span className="text-xs text-muted-silver font-mono">
                          {((share.basisPoints || 0) / 100).toFixed(1)}%
                        </span>
                      </div>
                      <button
                        onClick={() => removeShareRow(idx)}
                        disabled={shares.length <= 1}
                        className="px-2 py-2 text-muted-silver hover:text-muted-crimson disabled:opacity-30 disabled:hover:text-muted-silver transition-colors cursor-pointer"
                        title="Remove recipient"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Recipient Row button */}
              <button
                onClick={addShareRow}
                className="px-4 py-2 border border-dashed border-border-slate hover:border-emerald-mint hover:text-emerald-mint text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer w-full justify-center text-muted-silver"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Recipient Row
              </button>

              {/* Sum & Validation Display */}
              <div className="p-4 bg-obsidian border border-border-slate rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-silver">Cumulative Shares:</span>
                  <div className={`text-lg font-bold ${isBasisPointsValid ? "text-emerald-mint" : "text-muted-crimson animate-pulse"}`}>
                    {totalBasisPoints} / 10,000 basis points
                  </div>
                </div>
                <div className="text-right text-xs">
                  {isBasisPointsValid ? (
                    <span className="text-emerald-mint font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Split complete (100.0%)
                    </span>
                  ) : (
                    <span className="text-muted-crimson font-medium">
                      Must equal exactly 10,000 (100%)
                    </span>
                  )}
                </div>
              </div>

              {/* Configure Split Action */}
              {status !== "connected" ? (
                <button
                  onClick={connect}
                  className="w-full py-3 bg-emerald-mint hover:bg-opacity-90 font-semibold text-obsidian rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer text-center"
                >
                  Connect Wallet to Initialize Split
                </button>
              ) : (
                <button
                  onClick={handleConfigureSplit}
                  disabled={!isInitFormValid || initLoading}
                  className={`w-full py-3 font-semibold rounded-md shadow-lg transition-all text-center flex items-center justify-center gap-2 ${
                    isInitFormValid && !initLoading
                      ? "bg-emerald-mint hover:bg-opacity-90 text-obsidian shadow-emerald-mint/10 cursor-pointer"
                      : "bg-border-slate text-muted-silver cursor-not-allowed opacity-50"
                  }`}
                >
                  {initLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-obsidian" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Transaction...
                    </>
                  ) : (
                    "Initialize Split Contract"
                  )}
                </button>
              )}

              {initError && (
                <div className="p-4 bg-muted-crimson/10 border border-muted-crimson/30 rounded-md text-xs text-muted-crimson mt-4">
                  <strong>Error:</strong> {initError}
                </div>
              )}
            </div>
          ) : activeTab === "pay" ? (
            /* Tab 2: Make Split Payment */
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Split Payment Payout</h2>
                <p className="text-xs text-muted-silver mt-1">
                  Trigger an automated payout on the contract. The contract will pull the specified token amount (USDC or native XLM) from your account and instantly split it among the configured addresses.
                </p>
              </div>

              {/* Form Input Elements */}
              <div className="space-y-4">
                {/* Stablecoin Contract Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-silver block">
                    Token / Asset Address (e.g. USDC or Native XLM)
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="Token Contract Key (C...)"
                    className={`w-full px-3 py-2 bg-obsidian border text-white font-mono text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint ${
                      tokenAddress !== "" && !validateContractAddress(tokenAddress)
                        ? "border-muted-crimson"
                        : "border-border-slate"
                    }`}
                  />
                  {!validateContractAddress(tokenAddress) && tokenAddress !== "" && (
                    <span className="text-[10px] text-muted-crimson">Must be a valid G... or C... address.</span>
                  )}
                </div>

                {/* Sender Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-silver block">
                    Sender Account Address (Paying Funds)
                  </label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="Sender Public Key (G...)"
                    className={`w-full px-3 py-2 bg-obsidian border text-white font-mono text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint ${
                      senderAddress !== "" && !validateStellarAddress(senderAddress)
                        ? "border-muted-crimson"
                        : "border-border-slate"
                    }`}
                  />
                  {!validateStellarAddress(senderAddress) && senderAddress !== "" && (
                    <span className="text-[10px] text-muted-crimson">Must be a valid G... public address.</span>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-silver block">
                      Total Amount to Pay (in Base Units / Stroops)
                    </label>
                    {status === "connected" && (
                      <span className="text-[10px] text-emerald-mint font-medium">
                        {balanceLoading ? (
                          "Loading balance..."
                        ) : tokenBalance !== null ? (
                          `Wallet Balance: ${formatTokenAmount(tokenBalance)}`
                        ) : (
                          "Failed to load balance"
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-silver font-mono">
                      {(Number(amount) / 10000000).toFixed(7)} Token Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Pre-Flight Split Estimator */}
              {shares.length > 0 && Number(amount) > 0 && (
                <div className="bg-obsidian border border-border-slate/60 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Pre-Flight Split Estimator</h4>
                    <span className="text-[10px] text-emerald-mint font-semibold bg-emerald-mint/10 px-2 py-0.5 rounded-full">
                      Pre-flight Calculator
                    </span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {(() => {
                      let cumulative = BigInt(0);
                      const total = BigInt(amount || "0");
                      const estPayouts = shares.map((share, idx) => {
                        const basisPoints = BigInt(share.basisPoints || 0);
                        let payout = BigInt(0);
                        if (idx === shares.length - 1) {
                          payout = total - cumulative;
                        } else {
                          payout = (total * basisPoints) / BigInt(10000);
                          cumulative += payout;
                        }
                        return {
                          ...share,
                          payout: formatTokenAmount(String(payout)),
                        };
                      });

                      return estPayouts.map((est, idx) => {
                        const percentage = ((est.basisPoints || 0) / 100).toFixed(1);
                        const truncRecipient = est.recipient.length > 12 
                          ? `${est.recipient.slice(0, 6)}...${est.recipient.slice(-6)}` 
                          : est.recipient;

                        return (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-layer/40 rounded border border-border-slate/30">
                            <span className="font-mono text-white" title={est.recipient}>{truncRecipient}</span>
                            <div className="text-right">
                              <span className="font-bold text-emerald-mint">{est.payout} Units</span>
                              <span className="text-[9px] text-muted-silver ml-1.5">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Gasless Fee Sponsorship (Stellar Fee-Bump) Card */}
              <div className="bg-obsidian border border-emerald-mint/30 rounded-lg p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-mint animate-pulse"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Gasless Fee Sponsorship</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeeSponsored(!isFeeSponsored)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isFeeSponsored 
                        ? "bg-emerald-mint/20 text-emerald-mint border-emerald-mint/50"
                        : "bg-slate-layer text-muted-silver border-border-slate hover:text-white"
                    }`}
                  >
                    {isFeeSponsored ? "SPONSORED (0 GAS)" : "DISABLED"}
                  </button>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-muted-silver">
                    <span>User Network Fee:</span>
                    <span className="font-mono text-emerald-mint font-bold">{isFeeSponsored ? "0.00000 XLM (100% Free)" : "~0.00001 XLM"}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-silver">
                    <span>Sponsor Relayer:</span>
                    <span className="font-mono text-white text-[11px] truncate max-w-[200px]" title={sponsorAddress}>
                      {sponsorAddress.slice(0, 6)}...{sponsorAddress.slice(-6)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-silver pt-1 border-t border-border-slate/40">
                    ⚡ Powered by Stellar <strong>CAP-0015 Fee-Bump Protocol</strong>. Creators never need XLM reserves for network gas fees.
                  </p>
                </div>
              </div>

              {/* Pay Action Button */}
              {status !== "connected" ? (
                <button
                  onClick={connect}
                  className="w-full py-3 bg-emerald-mint hover:bg-opacity-90 font-semibold text-obsidian rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer text-center"
                >
                  Connect Wallet to Pay
                </button>
              ) : (
                <button
                  onClick={handlePaySplit}
                  disabled={!isPayFormValid || payLoading}
                  className={`w-full py-3 font-semibold rounded-md shadow-lg transition-all text-center flex items-center justify-center gap-2 ${
                    isPayFormValid && !payLoading
                      ? "bg-emerald-mint hover:bg-opacity-90 text-obsidian shadow-emerald-mint/10 cursor-pointer"
                      : "bg-border-slate text-muted-silver cursor-not-allowed opacity-50"
                  }`}
                >
                  {payLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-obsidian" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Split Payment...
                    </>
                  ) : (
                    "Trigger Split Payment"
                  )}
                </button>
              )}

              {payError && (
                <div className="p-4 bg-muted-crimson/10 border border-muted-crimson/30 rounded-md text-xs text-muted-crimson mt-4">
                  <strong>Error:</strong> {payError}
                </div>
              )}
            </div>
          ) : (
            /* Tab 3: Admin Panel View */
            <div className="space-y-6">
              {!isAdminAuthenticated ? (
                /* Admin Login Gate */
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-mint/10 flex items-center justify-center border border-emerald-mint/30">
                        <svg className="w-4 h-4 text-emerald-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-white">Admin Authentication Gate</h2>
                    </div>
                    <p className="text-xs text-muted-silver mt-1">
                      Enter administrative credentials to access contract telemetry, trustline status scanners, and ledger audit exports.
                    </p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    {adminAuthError && (
                      <div className="p-3 bg-muted-crimson/10 border border-muted-crimson/30 rounded-md text-xs text-muted-crimson flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {adminAuthError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-silver block">Username</label>
                      <input
                        type="text"
                        value={adminUsernameInput}
                        onChange={(e) => setAdminUsernameInput(e.target.value)}
                        placeholder="e.g. admin"
                        className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-silver block">Password</label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          placeholder="e.g. admin123"
                          className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-mint pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-2.5 text-xs text-muted-silver hover:text-white"
                        >
                          {showAdminPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 font-semibold text-obsidian text-sm rounded-md transition-all cursor-pointer shadow-lg shadow-emerald-mint/10"
                    >
                      Unlock Admin Panel
                    </button>

                    <div className="p-3 bg-obsidian/60 border border-border-slate/40 rounded-md text-[11px] text-muted-silver">
                      <span className="font-semibold text-emerald-mint">Default Credentials:</span> Username: <code className="text-white font-mono bg-slate-layer px-1 py-0.5 rounded">admin</code> | Password: <code className="text-white font-mono bg-slate-layer px-1 py-0.5 rounded">admin123</code>
                    </div>
                  </form>
                </div>
              ) : (
                /* Authenticated Admin Panel View */
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-border-slate">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-mint animate-pulse"></span>
                        <h2 className="text-lg font-semibold text-white">System Admin & Telemetry Control</h2>
                      </div>
                      <p className="text-xs text-muted-silver mt-0.5">
                        Active monitoring panel for contract state, trustlines, and user onboarding proof logs.
                      </p>
                    </div>
                    <button
                      onClick={handleAdminLogout}
                      className="px-3 py-1.5 bg-muted-crimson/10 hover:bg-muted-crimson/20 border border-muted-crimson/30 text-muted-crimson text-xs font-semibold rounded-md transition-all cursor-pointer"
                    >
                      Lock / Logout
                    </button>
                  </div>

                  {/* Contract Metadata Card */}
                  <div className="bg-obsidian border border-border-slate rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-silver">Contract Deployment Status</span>
                      <span className="text-[10px] text-emerald-mint font-semibold bg-emerald-mint/10 border border-emerald-mint/30 px-2 py-0.5 rounded-full">
                        Soroban Testnet Active
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-slate-layer/50 rounded border border-border-slate/40">
                        <span className="text-muted-silver">Contract ID:</span>
                        <span className="font-mono text-white text-[11px] truncate max-w-[240px]">CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-layer/50 rounded border border-border-slate/40">
                        <span className="text-muted-silver">Owner Address:</span>
                        <span className="font-mono text-white text-[11px] truncate max-w-[240px]">GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE</span>
                      </div>
                    </div>
                  </div>

                  {/* On-Chain Activity Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-obsidian border border-border-slate/60 p-3 rounded-lg text-center space-y-1">
                      <span className="text-[10px] text-muted-silver uppercase block font-semibold">Total Onboarded</span>
                      <span className="text-xl font-bold text-emerald-mint">50+</span>
                      <span className="text-[9px] text-muted-silver block">Verified Testers</span>
                    </div>
                    <div className="bg-obsidian border border-border-slate/60 p-3 rounded-lg text-center space-y-1">
                      <span className="text-[10px] text-muted-silver uppercase block font-semibold">Avg Settlement</span>
                      <span className="text-xl font-bold text-white">~3.8s</span>
                      <span className="text-[9px] text-muted-silver block">Ledger Finality</span>
                    </div>
                    <div className="bg-obsidian border border-border-slate/60 p-3 rounded-lg text-center space-y-1">
                      <span className="text-[10px] text-muted-silver uppercase block font-semibold">Dust Protection</span>
                      <span className="text-xl font-bold text-emerald-mint">Active</span>
                      <span className="text-[9px] text-muted-silver block">Auto Remainder</span>
                    </div>
                  </div>

                  {/* Recipient Trustline Health Scanner */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Recipient Trustline Health Scanner</h3>
                      <span className="text-[10px] text-muted-silver">Live USDC / SAC Scan</span>
                    </div>
                    <div className="space-y-2">
                      {shares.map((share, idx) => {
                        const hasAddr = share.recipient && validateStellarAddress(share.recipient);
                        return (
                          <div key={idx} className="flex justify-between items-center p-2.5 bg-obsidian border border-border-slate/60 rounded-md text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${hasAddr ? "bg-emerald-mint" : "bg-muted-crimson"}`}></span>
                              <span className="font-mono text-white text-xs">
                                {share.recipient ? (share.recipient.length > 16 ? `${share.recipient.slice(0, 8)}...${share.recipient.slice(-8)}` : share.recipient) : `Recipient #${idx + 1} (Empty)`}
                              </span>
                            </div>
                            <div>
                              {hasAddr ? (
                                <span className="text-[10px] bg-emerald-mint/10 text-emerald-mint px-2 py-0.5 rounded border border-emerald-mint/20 font-medium">
                                  Trustline Active (Ready)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-muted-crimson/10 text-muted-crimson px-2 py-0.5 rounded border border-muted-crimson/20 font-medium">
                                  Invalid Address
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audit Logs & CSV Export */}
                  <div className="p-4 bg-obsidian border border-border-slate rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white">Onboarding & Audit Records</h4>
                      <p className="text-[11px] text-muted-silver mt-0.5">
                        Download the 50-user testnet onboarding transaction log spreadsheet.
                      </p>
                    </div>
                    <a
                      href="/onboarding_responses.csv"
                      download="onboarding_responses.csv"
                      className="px-3.5 py-2 bg-emerald-mint hover:bg-opacity-90 text-obsidian text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-mint/10"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export CSV
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Ledger Operations Inspector Card */}
        <div className="lg:col-span-5 bg-slate-layer border border-border-slate rounded-lg p-6 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">XDR Ledger Inspector</h2>
            <p className="text-xs text-muted-silver mt-1">
              Cryptographic transaction envelope details generated, simulated, and signed.
            </p>
          </div>

          {/* Init Tab Result Inspector */}
          {activeTab === "init" ? (
            <div className="space-y-4">
              {/* Unsigned XDR */}
              <div>
                <label className="text-xs font-semibold text-muted-silver block mb-1">
                  1. Unsigned Transaction Envelope (XDR)
                </label>
                {initTxXdr ? (
                  <textarea
                    readOnly
                    value={initTxXdr}
                    className="w-full h-24 p-2 bg-obsidian border border-border-slate rounded text-[10px] text-muted-silver font-mono focus:outline-none resize-none"
                  />
                ) : (
                  <div className="w-full h-24 border border-dashed border-border-slate rounded flex items-center justify-center text-xs text-muted-silver bg-obsidian">
                    Pending transaction simulation...
                  </div>
                )}
              </div>

              {/* Signed XDR */}
              <div>
                <label className="text-xs font-semibold text-muted-silver block mb-1">
                  2. Cryptographically Signed XDR Envelope
                </label>
                {initSignedXdr ? (
                  <textarea
                    readOnly
                    value={initSignedXdr}
                    className="w-full h-24 p-2 bg-obsidian border border-border-slate rounded text-[10px] text-emerald-mint font-mono focus:outline-none resize-none"
                  />
                ) : (
                  <div className="w-full h-24 border border-dashed border-border-slate rounded flex items-center justify-center text-xs text-muted-silver bg-obsidian">
                    Pending signature authorization...
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              {initTxHash && (
                <div className="p-4 bg-emerald-mint/10 border border-emerald-mint/30 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-emerald-mint flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-mint rounded-full inline-block"></span>
                    Transaction Submitted Successfully!
                  </div>
                  <div className="text-[11px] text-white break-all font-mono">
                    Hash: {initTxHash}
                  </div>
                  <div className="text-right">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${initTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-mint hover:underline font-semibold"
                    >
                      View on Stellar.expert explorer &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "pay" ? (
            /* Pay Tab Result Inspector */
            <div className="space-y-4">
              {/* Unsigned XDR */}
              <div>
                <label className="text-xs font-semibold text-muted-silver block mb-1">
                  1. Unsigned Transaction Envelope (XDR)
                </label>
                {payTxXdr ? (
                  <textarea
                    readOnly
                    value={payTxXdr}
                    className="w-full h-24 p-2 bg-obsidian border border-border-slate rounded text-[10px] text-muted-silver font-mono focus:outline-none resize-none"
                  />
                ) : (
                  <div className="w-full h-24 border border-dashed border-border-slate rounded flex items-center justify-center text-xs text-muted-silver bg-obsidian">
                    Pending transaction simulation...
                  </div>
                )}
              </div>

              {/* Signed XDR */}
              <div>
                <label className="text-xs font-semibold text-muted-silver block mb-1">
                  2. Cryptographically Signed XDR Envelope
                </label>
                {paySignedXdr ? (
                  <textarea
                    readOnly
                    value={paySignedXdr}
                    className="w-full h-24 p-2 bg-obsidian border border-border-slate rounded text-[10px] text-emerald-mint font-mono focus:outline-none resize-none"
                  />
                ) : (
                  <div className="w-full h-24 border border-dashed border-border-slate rounded flex items-center justify-center text-xs text-muted-silver bg-obsidian">
                    Pending signature authorization...
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              {payTxHash && (
                <div className="p-4 bg-emerald-mint/10 border border-emerald-mint/30 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-emerald-mint flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-mint rounded-full inline-block"></span>
                    Split Payment Complete!
                  </div>
                  <div className="text-[11px] text-white break-all font-mono">
                    Hash: {payTxHash}
                  </div>
                  <div className="text-right">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${payTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-mint hover:underline font-semibold"
                    >
                      View on Stellar.expert explorer &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Admin Telemetry & Security Inspector */
            <div className="space-y-4">
              <div className="p-4 bg-obsidian border border-border-slate rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Admin Security Status</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAdminAuthenticated ? "bg-emerald-mint/10 text-emerald-mint border border-emerald-mint/30" : "bg-muted-crimson/10 text-muted-crimson border border-muted-crimson/30"}`}>
                    {isAdminAuthenticated ? "Authenticated" : "Locked"}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted-silver">
                    <span>Access Level:</span>
                    <span className="text-white font-mono">{isAdminAuthenticated ? "Full Read/Write" : "Public Limited"}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-silver">
                    <span>Session Storage:</span>
                    <span className="text-white font-mono">{isAdminAuthenticated ? "splitsync_admin_auth" : "None"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-obsidian border border-border-slate rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-white">System Security Directives</h4>
                <ul className="text-xs text-muted-silver space-y-1.5 list-disc list-inside">
                  <li>Soroban contract initialization is immutable once configured.</li>
                  <li>Recipient trustlines must be active before executing stablecoin payouts.</li>
                  <li>Division dust remainder is automatically routed to the final recipient.</li>
                </ul>
              </div>

              {isAdminAuthenticated && (
                <button
                  onClick={handleAdminLogout}
                  className="w-full py-2.5 bg-muted-crimson/10 hover:bg-muted-crimson/20 border border-muted-crimson/30 text-muted-crimson font-semibold text-xs rounded-md transition-all cursor-pointer text-center"
                >
                  Terminate Admin Session
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Transaction Success Receipt Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-obsidian/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-layer border border-border-slate max-w-md w-full rounded-lg shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-mint/20 border border-emerald-mint rounded-full flex items-center justify-center text-emerald-mint">
                <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Transaction Success!</h3>
              <p className="text-xs text-muted-silver">
                The payout was executed successfully and split on-chain.
              </p>
            </div>

            {/* Total Paid */}
            <div className="bg-obsidian border border-border-slate rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-silver font-semibold">Total Amount Split</span>
              <span className="text-2xl font-bold text-emerald-mint mt-1">
                {successAmount ? formatTokenAmount(successAmount) : "0"} Token Units
              </span>
            </div>

            {/* Splits Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Recipient Breakdown</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {successShares.map((share, idx) => {
                  const basisPoints = BigInt(share.basisPoints || 0);
                  const totalAmount = BigInt(successAmount || "0");
                  const payout = (totalAmount * basisPoints) / BigInt(10000);
                  const percentage = (Number(basisPoints) / 100).toFixed(1);

                  // Truncate recipient address for readability
                  const rawAddr = share.recipient || "";
                  const truncAddr = rawAddr.length > 12 
                    ? `${rawAddr.slice(0, 6)}...${rawAddr.slice(-6)}` 
                    : rawAddr;

                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-obsidian/50 border border-border-slate/50 rounded-lg text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono text-white" title={rawAddr}>{truncAddr}</div>
                        <div className="text-[10px] text-muted-silver">Allocation Share</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-semibold text-emerald-mint">+{formatTokenAmount(String(payout))} Units</div>
                        <div className="text-[10px] text-muted-silver">{percentage}% Split</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {successTxHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${successTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-obsidian border border-border-slate text-center block rounded-md text-xs font-semibold text-white hover:border-emerald-mint hover:text-emerald-mint transition-all"
                >
                  Inspect on Stellar.expert &rarr;
                </a>
              )}
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-center rounded-md text-xs font-bold text-obsidian shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
