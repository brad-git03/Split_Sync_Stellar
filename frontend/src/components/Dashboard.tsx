"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { prepareInitTx, preparePayTx, submitTx, getTokenBalance, formatTokenAmount, CONTRACT_ID } from "@/utils/soroban";
import { validateStellarAddress, validateContractAddress } from "@/utils/validation";

interface ShareInput {
  recipient: string;
  basisPoints: number;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoiceData {
  id: string;
  clientName: string;
  clientEmail: string;
  squadName: string;
  contractId: string;
  token: string;
  items: InvoiceItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  status: "pending" | "paid";
  txHash?: string;
}

interface ProposalData {
  id: string;
  title: string;
  description: string;
  proposer: string;
  contractId: string;
  proposedShares: ShareInput[];
  requiredSignatures: number;
  signedBy: string[];
  status: "active" | "executed";
  createdAt: string;
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
  const [activeTab, setActiveTab] = useState<"init" | "pay" | "invoices" | "proposals" | "admin">("init");

  // Admin Tab State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Fee Sponsorship (Gasless Transaction) State
  const [isFeeSponsored, setIsFeeSponsored] = useState<boolean>(true);
  const sponsorAddress = "GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE";

  // Multi-Token & Fiat FX Converter State
  const [selectedToken, setSelectedToken] = useState<"USDC" | "XLM" | "EURC" | "PYUSD">("USDC");
  const [selectedFiat, setSelectedFiat] = useState<"USD" | "PHP" | "EUR" | "GBP" | "BRL" | "INR">("PHP");

  const FX_RATES: Record<string, number> = {
    USD: 1.0,
    PHP: 58.5,
    EUR: 0.92,
    GBP: 0.78,
    BRL: 5.65,
    INR: 83.9,
  };

  const FIAT_SYMBOLS: Record<string, string> = {
    USD: "$",
    PHP: "₱",
    EUR: "€",
    GBP: "£",
    BRL: "R$",
    INR: "₹",
  };

  const TOKEN_USD_VALUE: Record<string, number> = {
    USDC: 1.0,
    XLM: 0.12,
    EURC: 1.08,
    PYUSD: 1.0,
  };

  // State for Init Tab (Configuring Shares)
  const [shares, setShares] = useState<ShareInput[]>([
    { recipient: "", basisPoints: 5000 },
    { recipient: "", basisPoints: 5000 },
  ]);

  // State for Pay Tab
  const [contractId, setContractId] = useState<string>("CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI");
  const [senderAddress, setSenderAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("1000");

  // Invoices State
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newSquadName, setNewSquadName] = useState("SplitSync Freelance Squad");
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("2500");
  const [newInvoiceService, setNewInvoiceService] = useState("Full-Stack Web3 Milestone Delivery");
  const [invoiceCopiedId, setInvoiceCopiedId] = useState<string | null>(null);

  // Proposals State
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDesc, setNewProposalDesc] = useState("");
  const [newPropShareA, setNewPropShareA] = useState(6000);
  const [newPropShareB, setNewPropShareB] = useState(4000);

  // Execution & Diagnostics
  const [rawXdr, setRawXdr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Initial Load from LocalStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem("splitsync_admin_auth");
    if (storedAuth === "true") {
      setIsAdminAuthenticated(true);
    }

    // Load Invoices
    const savedInvoices = localStorage.getItem("splitsync_invoices");
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultInvoices: InvoiceData[] = [
        {
          id: "INV-2026-001",
          clientName: "Solaris DAO Ventures",
          clientEmail: "finance@solarisdao.org",
          squadName: "Apex Web3 Engineering Collective",
          contractId: "CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI",
          token: "USDC",
          items: [
            { description: "Soroban Smart Contract Architecture & Security Review", amount: 2500 },
            { description: "Next.js 16 Web3 Frontend & Freighter Wallet Integration", amount: 1500 },
            { description: "Automated Zero-Dust Revenue Splitter Deployment", amount: 800 },
          ],
          totalAmount: 4800,
          dueDate: "2026-08-30",
          createdAt: "2026-08-14",
          status: "paid",
          txHash: "e1fea6a9a7a4f93e97098750f9c3d44b993ec5d5c53db22b4165178017145652",
        },
        {
          id: "INV-2026-002",
          clientName: "Hyperion Digital Studio",
          clientEmail: "payments@hyperionstudio.io",
          squadName: "SplitSync Creator Guild",
          contractId: "CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI",
          token: "USDC",
          items: [
            { description: "Brand Identity, 3D Assets & Launch Thread Collateral", amount: 1800 },
            { description: "Pre-flight Split Estimator & Trustline Health Integration", amount: 1400 },
          ],
          totalAmount: 3200,
          dueDate: "2026-09-05",
          createdAt: "2026-08-15",
          status: "pending",
        },
      ];
      setInvoices(defaultInvoices);
      localStorage.setItem("splitsync_invoices", JSON.stringify(defaultInvoices));
    }

    // Load Proposals
    const savedProposals = localStorage.getItem("splitsync_proposals");
    if (savedProposals) {
      try {
        setProposals(JSON.parse(savedProposals));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultProposals: ProposalData[] = [
        {
          id: "PROP-001",
          title: "Sprint 4 Share Adjustment: Increase Frontend Allocation to 60%",
          description: "Adjusting split basis points from 50/50 to 60/40 due to extensive Next.js 16 and Fee Sponsorship integrations.",
          proposer: "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT",
          contractId: "CA7SDEPQEIQZBA6VVTSLB4NTBKAW2CGSIRTKGK66XHK4W5PPN43DRLPI",
          proposedShares: [
            { recipient: "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT", basisPoints: 6000 },
            { recipient: "GAZ7XLP4QWEY6YJNXHQD3P22V65KMRH46G6QALN32EVMW2MQL6G6SPLT", basisPoints: 4000 },
          ],
          requiredSignatures: 2,
          signedBy: ["GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT"],
          status: "active",
          createdAt: "2026-08-15",
        },
      ];
      setProposals(defaultProposals);
      localStorage.setItem("splitsync_proposals", JSON.stringify(defaultProposals));
    }
  }, []);

  // Sync wallet address to sender
  useEffect(() => {
    if (address) {
      setSenderAddress(address);
      fetchBalance(address);
    }
  }, [address]);

  const fetchBalance = async (targetAddr: string) => {
    setBalanceLoading(true);
    try {
      const bal = await getTokenBalance(CONTRACT_ID, targetAddr);
      setTokenBalance(bal || "0");
    } catch (e) {
      console.error(e);
      setTokenBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

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

  // Add / Remove Share Rows
  const addShareRow = () => {
    setShares([...shares, { recipient: "", basisPoints: 0 }]);
  };

  const removeShareRow = (idx: number) => {
    if (shares.length <= 2) return;
    setShares(shares.filter((_, i) => i !== idx));
  };

  const updateShare = (idx: number, field: keyof ShareInput, val: any) => {
    const next = [...shares];
    next[idx] = { ...next[idx], [field]: val };
    setShares(next);
  };

  const totalBasisPoints = shares.reduce((acc, s) => acc + (Number(s.basisPoints) || 0), 0);

  // Initialize Contract
  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setRawXdr(null);
    setTxHash(null);

    if (totalBasisPoints !== 10000) {
      setActionError(`Total basis points must equal exactly 10,000 (100%). Currently: ${totalBasisPoints}`);
      return;
    }

    for (let i = 0; i < shares.length; i++) {
      if (!validateStellarAddress(shares[i].recipient.trim())) {
        setActionError(`Recipient #${i + 1} has an invalid Stellar address.`);
        return;
      }
    }

    try {
      setActionLoading(true);
      const sender = address || shares[0].recipient.trim();
      const xdr = await prepareInitTx(sender, shares.map(s => ({ ...s, recipient: s.recipient.trim() })));
      setRawXdr(xdr);

      const signedXdr = await signTx(xdr);
      const hash = await submitTx(signedXdr);
      setTxHash(hash);
      setActionSuccess("Split contract successfully initialized on Stellar!");
      if (address) fetchBalance(address);
    } catch (err: any) {
      setActionError(err.message || "Failed to initialize split contract.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Split Payment
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setRawXdr(null);
    setTxHash(null);

    const cleanContractId = contractId.trim();
    const cleanSender = senderAddress.trim();

    if (!validateContractAddress(cleanContractId)) {
      setActionError("Invalid Contract ID. Must be a 56-character C... address.");
      return;
    }
    if (!validateStellarAddress(cleanSender)) {
      setActionError("Invalid Sender Address. Must be a 56-character G... address.");
      return;
    }
    if (Number(amount) <= 0) {
      setActionError("Amount must be greater than zero.");
      return;
    }

    try {
      setActionLoading(true);
      const xdr = await preparePayTx(cleanContractId, cleanSender, amount.trim());
      setRawXdr(xdr);

      const signedXdr = await signTx(xdr);
      const hash = await submitTx(signedXdr);
      setTxHash(hash);
      setActionSuccess(`Split payment of ${amount} ${selectedToken} successfully settled on Stellar!`);
      if (address) fetchBalance(address);
    } catch (err: any) {
      setActionError(err.message || "Failed to execute split payment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create New Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newInvoiceAmount) return;

    const newId = `INV-2026-00${invoices.length + 1}`;
    const newInv: InvoiceData = {
      id: newId,
      clientName: newClientName,
      clientEmail: newClientEmail || "client@dao.org",
      squadName: newSquadName,
      contractId: contractId,
      token: selectedToken,
      items: [{ description: newInvoiceService, amount: Number(newInvoiceAmount) }],
      totalAmount: Number(newInvoiceAmount),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
      status: "pending",
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    localStorage.setItem("splitsync_invoices", JSON.stringify(updated));
    setNewClientName("");
    setNewClientEmail("");
    setActionSuccess(`Invoice ${newId} created successfully! Link: /invoice/${newId}`);
  };

  // Create New Share Proposal
  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposalTitle) return;

    if (newPropShareA + newPropShareB !== 10000) {
      setActionError("Proposal shares must sum to exactly 10,000 basis points (100%).");
      return;
    }

    const newProp: ProposalData = {
      id: `PROP-00${proposals.length + 1}`,
      title: newProposalTitle,
      description: newProposalDesc || "Adjustment of contract distribution shares.",
      proposer: address || "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT",
      contractId: contractId,
      proposedShares: [
        { recipient: "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT", basisPoints: newPropShareA },
        { recipient: "GAZ7XLP4QWEY6YJNXHQD3P22V65KMRH46G6QALN32EVMW2MQL6G6SPLT", basisPoints: newPropShareB },
      ],
      requiredSignatures: 2,
      signedBy: [address || "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT"],
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = [newProp, ...proposals];
    setProposals(updated);
    localStorage.setItem("splitsync_proposals", JSON.stringify(updated));
    setNewProposalTitle("");
    setNewProposalDesc("");
    setActionSuccess(`Proposal ${newProp.id} submitted for squad multi-sig approval!`);
  };

  // Sign Proposal
  const handleSignProposal = (propId: string) => {
    const updated = proposals.map((p) => {
      if (p.id === propId) {
        const signer = address || "GAZ7XLP4QWEY6YJNXHQD3P22V65KMRH46G6QALN32EVMW2MQL6G6SPLT";
        const newSigned = p.signedBy.includes(signer) ? p.signedBy : [...p.signedBy, signer];
        const isExecuted = newSigned.length >= p.requiredSignatures;
        return {
          ...p,
          signedBy: newSigned,
          status: isExecuted ? ("executed" as const) : p.status,
        };
      }
      return p;
    });
    setProposals(updated);
    localStorage.setItem("splitsync_proposals", JSON.stringify(updated));
    setActionSuccess("Proposal signed! If quorum is reached, split rules are updated on-chain.");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-layer/60 p-6 rounded-xl border border-border-slate backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-mint animate-pulse"></span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">SPLITSYNC</h1>
          </div>
          <p className="text-xs text-muted-silver mt-1">Automated Zero-Dust Revenue Splitter on Stellar Soroban</p>
        </div>

        <div className="flex items-center gap-3">
          {status === "connected" && (
            <div className="text-right">
              <div className="text-xs text-muted-silver">Connected Account</div>
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
      <div className="flex border-b border-border-slate gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("init")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "init" ? "border-emerald-mint text-white" : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          1. Configure Split (Init)
        </button>
        <button
          onClick={() => setActiveTab("pay")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pay" ? "border-emerald-mint text-white" : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          2. Execute Split (Multi-Token & FX)
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "invoices" ? "border-emerald-mint text-white" : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          3. Client Invoicing (/invoice)
        </button>
        <button
          onClick={() => setActiveTab("proposals")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "proposals" ? "border-emerald-mint text-white" : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          4. Dynamic Share Proposals
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "admin" ? "border-emerald-mint text-white" : "border-transparent text-muted-silver hover:text-white"
          }`}
        >
          <svg className="w-4 h-4 text-emerald-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          5. Admin Panel
        </button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 bg-muted-crimson/10 border border-muted-crimson/30 rounded-lg text-sm text-muted-crimson">
          <strong>Transaction Error:</strong> {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-mint/10 border border-emerald-mint/30 rounded-lg text-sm text-emerald-mint">
          <strong>Success:</strong> {actionSuccess}
        </div>
      )}

      {/* TAB 1: CONFIGURE SPLIT */}
      {activeTab === "init" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleInitSubmit} className="space-y-6 bg-slate-layer/40 p-6 rounded-xl border border-border-slate">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Define Recipient Allocation</h3>
                  <p className="text-xs text-muted-silver">Specify squad recipient wallet addresses and basis points (10,000 bp = 100%).</p>
                </div>
                <button
                  type="button"
                  onClick={addShareRow}
                  className="px-3 py-1.5 bg-slate-layer border border-border-slate hover:border-emerald-mint text-xs text-white rounded-md transition-all cursor-pointer"
                >
                  + Add Recipient
                </button>
              </div>

              <div className="space-y-4">
                {shares.map((share, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-obsidian p-3.5 rounded-lg border border-border-slate/70">
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] text-muted-silver block">Recipient #{idx + 1} Public Address (G...)</label>
                      <input
                        type="text"
                        value={share.recipient}
                        onChange={(e) => updateShare(idx, "recipient", e.target.value)}
                        placeholder="G..."
                        className="w-full px-3 py-1.5 bg-slate-layer/50 border border-border-slate text-white text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                      />
                    </div>

                    <div className="w-32 space-y-1">
                      <label className="text-[11px] text-muted-silver block">Basis Points (bp)</label>
                      <input
                        type="number"
                        value={share.basisPoints}
                        onChange={(e) => updateShare(idx, "basisPoints", Number(e.target.value))}
                        placeholder="5000"
                        className="w-full px-3 py-1.5 bg-slate-layer/50 border border-border-slate text-white text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                      />
                      <span className="text-[10px] text-emerald-mint block text-right font-medium">
                        {((share.basisPoints || 0) / 100).toFixed(1)}%
                      </span>
                    </div>

                    {shares.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeShareRow(idx)}
                        className="text-muted-crimson hover:text-red-400 p-2 text-sm cursor-pointer mt-3"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-obsidian rounded-lg border border-border-slate">
                <span className="text-xs text-muted-silver font-semibold">Total Allocation:</span>
                <span className={`font-mono text-sm font-bold ${totalBasisPoints === 10000 ? "text-emerald-mint" : "text-muted-crimson"}`}>
                  {totalBasisPoints} / 10,000 bp ({(totalBasisPoints / 100).toFixed(1)}%)
                </span>
              </div>

              <button
                type="submit"
                disabled={actionLoading || totalBasisPoints !== 10000}
                className="w-full py-3 bg-emerald-mint hover:bg-opacity-90 disabled:opacity-50 text-obsidian font-bold rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer text-sm"
              >
                {actionLoading ? "Deploying & Signing..." : "Initialize Split Contract on Stellar"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-layer/40 p-5 rounded-xl border border-border-slate space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Protocol Security Guarantees</h4>
              <ul className="text-xs text-muted-silver space-y-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-mint">✓</span>
                  <span><strong>Zero-Dust Invariant:</strong> Remainder stroops are automatically routed to the final recipient.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-mint">✓</span>
                  <span><strong>No Middleman Risk:</strong> Client funds are distributed atomically in a single ledger transaction.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-mint">✓</span>
                  <span><strong>Gasless Ready:</strong> Creators can sponsor fees via Stellar CAP-0015 protocol.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTE SPLIT PAYMENT (MULTI-TOKEN & FX CONVERTER) */}
      {activeTab === "pay" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handlePaySubmit} className="space-y-5 bg-slate-layer/40 p-6 rounded-xl border border-border-slate">
              <div>
                <h3 className="text-base font-bold text-white">Execute Atomic Revenue Split</h3>
                <p className="text-xs text-muted-silver">Disperse payments across squad recipients in a single atomic transaction.</p>
              </div>

              {/* Multi-Token Asset & Fiat FX Converter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-obsidian rounded-lg border border-border-slate">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver uppercase tracking-wider font-semibold block">Payout Asset</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-layer border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint cursor-pointer font-bold"
                  >
                    <option value="USDC">USDC - USD Coin (Circle SAC)</option>
                    <option value="XLM">XLM - Stellar Lumens (Native)</option>
                    <option value="EURC">EURC - Euro Coin (Circle SAC)</option>
                    <option value="PYUSD">PYUSD - PayPal USD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver uppercase tracking-wider font-semibold block">Local Fiat FX View</label>
                  <select
                    value={selectedFiat}
                    onChange={(e) => setSelectedFiat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-layer border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint cursor-pointer font-bold"
                  >
                    <option value="PHP">PHP ₱ - Philippine Peso</option>
                    <option value="USD">USD $ - US Dollar</option>
                    <option value="EUR">EUR € - Euro</option>
                    <option value="GBP">GBP £ - British Pound</option>
                    <option value="BRL">BRL R$ - Brazilian Real</option>
                    <option value="INR">INR ₹ - Indian Rupee</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-silver block">Contract ID (C...)</label>
                  <input
                    type="text"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    placeholder="CA7SDEPQ..."
                    className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white font-mono text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-silver block">Sender Public Address (G...)</label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="G..."
                    className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white font-mono text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-silver block">Total Amount to Split ({selectedToken})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                  <span className="text-[11px] text-emerald-mint block text-right font-mono">
                    Estimated Total Value: {FIAT_SYMBOLS[selectedFiat]}
                    {((Number(amount) || 0) * TOKEN_USD_VALUE[selectedToken] * FX_RATES[selectedFiat]).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {selectedFiat}
                  </span>
                </div>
              </div>

              {/* Pre-Flight Split Estimator */}
              {shares.length > 0 && Number(amount) > 0 && (
                <div className="bg-obsidian border border-border-slate/60 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Pre-Flight Split Estimator (with Live FX)</h4>
                    <span className="text-[10px] text-emerald-mint font-semibold bg-emerald-mint/10 px-2 py-0.5 rounded-full">
                      Zero-Dust Calculator
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      let cumulative = BigInt(0);
                      const total = BigInt(amount || "0");
                      return shares.map((share, idx) => {
                        const basisPoints = BigInt(share.basisPoints || 0);
                        let payout = idx === shares.length - 1 ? total - cumulative : (total * basisPoints) / BigInt(10000);
                        if (idx !== shares.length - 1) cumulative += payout;

                        const percentage = ((share.basisPoints || 0) / 100).toFixed(1);
                        const fiatVal = (Number(payout) * TOKEN_USD_VALUE[selectedToken] * FX_RATES[selectedFiat]).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });

                        return (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-layer/40 rounded border border-border-slate/30">
                            <div>
                              <span className="font-mono text-white text-[11px] block">
                                {share.recipient ? `${share.recipient.slice(0, 6)}...${share.recipient.slice(-6)}` : `Recipient #${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-emerald-mint font-medium">
                                ≈ {FIAT_SYMBOLS[selectedFiat]}
                                {fiatVal} {selectedFiat}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-white">{payout.toString()} {selectedToken}</span>
                              <span className="text-[9px] text-muted-silver ml-1.5">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Gasless Fee Sponsorship */}
              <div className="bg-obsidian border border-emerald-mint/30 rounded-lg p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-mint animate-pulse"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Gasless Fee Sponsorship (Stellar CAP-0015)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeeSponsored(!isFeeSponsored)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isFeeSponsored ? "bg-emerald-mint/20 text-emerald-mint border-emerald-mint/50" : "bg-slate-layer text-muted-silver border-border-slate"
                    }`}
                  >
                    {isFeeSponsored ? "SPONSORED (0 GAS)" : "DISABLED"}
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-silver">
                  <span>User Gas Cost:</span>
                  <span className="font-mono text-emerald-mint font-bold">{isFeeSponsored ? "0.00000 XLM (100% Free)" : "~0.00001 XLM"}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-emerald-mint hover:bg-opacity-90 disabled:opacity-50 text-obsidian font-bold rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer text-sm"
              >
                {actionLoading ? "Splitting On-Chain..." : `Execute ${amount} ${selectedToken} Split`}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-layer/40 p-5 rounded-xl border border-border-slate space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Live Telemetry</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-silver">
                  <span>Network:</span>
                  <span className="text-white font-mono">Stellar Testnet / Mainnet</span>
                </div>
                <div className="flex justify-between text-muted-silver">
                  <span>Selected Asset:</span>
                  <span className="text-emerald-mint font-bold">{selectedToken}</span>
                </div>
                <div className="flex justify-between text-muted-silver">
                  <span>FX Rate:</span>
                  <span className="text-white font-mono">1 {selectedToken} = {FIAT_SYMBOLS[selectedFiat]}{(TOKEN_USD_VALUE[selectedToken] * FX_RATES[selectedFiat]).toFixed(2)} {selectedFiat}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT INVOICING & CHECKOUT */}
      {activeTab === "invoices" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Invoice Form */}
            <div className="lg:col-span-1 bg-slate-layer/40 p-6 rounded-xl border border-border-slate space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Generate Client Invoice</h3>
                <p className="text-xs text-muted-silver">Create a shareable checkout link for your clients to pay on-chain.</p>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Client / DAO Name</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Acme Ventures"
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Client Email</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="billing@client.com"
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Service Description</label>
                  <input
                    type="text"
                    value={newInvoiceService}
                    onChange={(e) => setNewInvoiceService(e.target.value)}
                    placeholder="Sprint milestone deliverables"
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Invoice Amount ({selectedToken})</label>
                  <input
                    type="number"
                    value={newInvoiceAmount}
                    onChange={(e) => setNewInvoiceAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-obsidian font-bold rounded-md shadow transition-all cursor-pointer text-xs mt-2"
                >
                  ⚡ Create Hosted Invoice
                </button>
              </form>
            </div>

            {/* Invoices List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Active Squad Invoices</h3>
                <span className="text-xs text-muted-silver">{invoices.length} Total Invoices</span>
              </div>

              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-slate-layer/50 border border-border-slate rounded-xl p-4.5 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-mint">{inv.id}</span>
                          <span className="text-xs font-bold text-white">{inv.clientName}</span>
                        </div>
                        <p className="text-[11px] text-muted-silver mt-0.5">{inv.items[0]?.description}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="font-mono text-sm font-extrabold text-white block">
                          ${inv.totalAmount.toLocaleString()} {inv.token}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            inv.status === "paid" ? "bg-emerald-mint/20 text-emerald-mint" : "bg-amber-400/20 text-amber-300"
                          }`}
                        >
                          {inv.status === "paid" ? "✓ Paid & Settled" : "⏳ Pending Payment"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-slate/50 text-xs">
                      <span className="text-[11px] text-muted-silver">Due: {inv.dueDate}</span>
                      <div className="flex gap-2">
                        <Link
                          href={`/invoice/${inv.id}`}
                          target="_blank"
                          className="px-3 py-1 bg-obsidian border border-border-slate hover:border-emerald-mint text-[11px] text-white rounded transition-all flex items-center gap-1"
                        >
                          🔗 Open Checkout Link
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC SHARE PROPOSALS (MULTI-SIG SQUAD VOTING) */}
      {activeTab === "proposals" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Proposal Form */}
            <div className="lg:col-span-1 bg-slate-layer/40 p-6 rounded-xl border border-border-slate space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Create Share Revision Proposal</h3>
                <p className="text-xs text-muted-silver">Propose new split percentages across squad members without redeploying.</p>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Proposal Title</label>
                  <input
                    type="text"
                    value={newProposalTitle}
                    onChange={(e) => setNewProposalTitle(e.target.value)}
                    placeholder="e.g. Adjust Sprint 5 Frontend Split"
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-silver font-semibold block">Rationale / Description</label>
                  <textarea
                    value={newProposalDesc}
                    onChange={(e) => setNewProposalDesc(e.target.value)}
                    placeholder="Reason for basis points adjustment..."
                    rows={2}
                    className="w-full px-3 py-1.5 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-silver block">Member A (bp)</label>
                    <input
                      type="number"
                      value={newPropShareA}
                      onChange={(e) => setNewPropShareA(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-obsidian border border-border-slate text-white text-xs rounded font-mono"
                    />
                    <span className="text-[9px] text-emerald-mint">{(newPropShareA / 100).toFixed(0)}%</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-silver block">Member B (bp)</label>
                    <input
                      type="number"
                      value={newPropShareB}
                      onChange={(e) => setNewPropShareB(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-obsidian border border-border-slate text-white text-xs rounded font-mono"
                    />
                    <span className="text-[9px] text-emerald-mint">{(newPropShareB / 100).toFixed(0)}%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-obsidian font-bold rounded-md shadow transition-all cursor-pointer text-xs mt-2"
                >
                  🗳️ Submit Proposal for Voting
                </button>
              </form>
            </div>

            {/* Proposals List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Active Squad Proposals</h3>
                <span className="text-xs text-muted-silver">{proposals.length} Proposals</span>
              </div>

              <div className="space-y-3">
                {proposals.map((prop) => {
                  const isFullySigned = prop.signedBy.length >= prop.requiredSignatures;
                  return (
                    <div key={prop.id} className="bg-slate-layer/50 border border-border-slate rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-mint">{prop.id}</span>
                            <h4 className="text-sm font-bold text-white">{prop.title}</h4>
                          </div>
                          <p className="text-xs text-muted-silver mt-1">{prop.description}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            isFullySigned || prop.status === "executed"
                              ? "bg-emerald-mint/20 text-emerald-mint border border-emerald-mint/40"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          }`}
                        >
                          {isFullySigned || prop.status === "executed" ? "✓ Approved & Executed" : "🗳️ Voting in Progress"}
                        </span>
                      </div>

                      {/* Share Breakdown */}
                      <div className="grid grid-cols-2 gap-2 bg-obsidian p-3 rounded-lg border border-border-slate/50 text-xs">
                        {prop.proposedShares.map((s, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-mono text-muted-silver text-[11px]">
                              {s.recipient.slice(0, 6)}...{s.recipient.slice(-6)}
                            </span>
                            <span className="font-bold text-emerald-mint">{(s.basisPoints / 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Signatures Progress */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-border-slate/50 text-xs">
                        <span className="text-muted-silver">
                          Signatures: <strong className="text-white">{prop.signedBy.length} / {prop.requiredSignatures} Signatures</strong>
                        </span>

                        {!isFullySigned && prop.status !== "executed" && (
                          <button
                            onClick={() => handleSignProposal(prop.id)}
                            className="px-4 py-1.5 bg-emerald-mint hover:bg-opacity-90 text-obsidian font-bold rounded text-xs transition-all cursor-pointer"
                          >
                            ✍️ Sign & Approve Proposal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN PANEL */}
      {activeTab === "admin" && (
        <div className="space-y-6">
          {!isAdminAuthenticated ? (
            <div className="max-w-md mx-auto bg-slate-layer/60 p-8 rounded-xl border border-border-slate space-y-6 shadow-2xl">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Admin Authentication</h3>
                <p className="text-xs text-muted-silver">Authorized personnel only. Enter credentials to unlock administrative controls.</p>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-muted-crimson/10 border border-muted-crimson/30 rounded text-xs text-muted-crimson">
                  {adminAuthError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-silver font-semibold block">Username</label>
                  <input
                    type="text"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-silver font-semibold block">Password</label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-obsidian border border-border-slate text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-emerald-mint"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-2.5 top-2 text-[10px] text-muted-silver hover:text-white"
                    >
                      {showAdminPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-obsidian font-bold rounded-md shadow transition-all cursor-pointer text-xs"
                >
                  Unlock Admin Portal
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-layer/40 p-4 rounded-xl border border-border-slate">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-mint"></span>
                  <span className="text-xs font-bold text-white">Admin Session Active</span>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="px-3 py-1 bg-obsidian border border-border-slate hover:border-muted-crimson text-xs text-muted-crimson rounded transition-all cursor-pointer"
                >
                  Lock Portal (Logout)
                </button>
              </div>

              {/* Health Scanner & Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-layer/40 p-6 rounded-xl border border-border-slate space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Recipient Trustline Scanner</h4>
                  <p className="text-xs text-muted-silver">Scans connected recipient addresses to verify active SAC trustlines.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-2.5 bg-obsidian rounded border border-border-slate/50">
                      <span className="font-mono text-white text-[11px]">GDUW6X2R...4R62SPLT</span>
                      <span className="text-[10px] text-emerald-mint font-bold">✓ TRUSTLINE ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2.5 bg-obsidian rounded border border-border-slate/50">
                      <span className="font-mono text-white text-[11px]">GAZ7XLP4...6G6SPLT</span>
                      <span className="text-[10px] text-emerald-mint font-bold">✓ TRUSTLINE ACTIVE</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-layer/40 p-6 rounded-xl border border-border-slate space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Audit Data Export</h4>
                  <p className="text-xs text-muted-silver">Download complete on-chain split telemetry and verified feedback records.</p>
                  <div className="flex gap-3 pt-2">
                    <a
                      href="/onboarding_responses.csv"
                      download
                      className="px-3 py-2 bg-obsidian border border-border-slate hover:border-emerald-mint text-xs text-white rounded transition-all"
                    >
                      📥 Export 50 Users CSV
                    </a>
                    <a
                      href="/onboarding_responses.xlsx"
                      download
                      className="px-3 py-2 bg-obsidian border border-border-slate hover:border-emerald-mint text-xs text-white rounded transition-all"
                    >
                      📥 Export 50 Users XLSX
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw XDR & Tx Hash Diagnostics Layer */}
      {(rawXdr || txHash) && (
        <div className="bg-obsidian border border-border-slate rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">On-Chain Ledger Receipts</h4>
          {txHash && (
            <div className="text-xs space-y-1">
              <span className="text-muted-silver block">Transaction Hash:</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-mint hover:underline break-all block"
              >
                {txHash}
              </a>
            </div>
          )}
          {rawXdr && (
            <details className="text-xs text-muted-silver">
              <summary className="cursor-pointer hover:text-white">View Raw Transaction Envelope XDR</summary>
              <pre className="mt-2 p-3 bg-slate-layer/60 rounded font-mono text-[10px] text-muted-silver overflow-x-auto whitespace-pre-wrap break-all">
                {rawXdr}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
