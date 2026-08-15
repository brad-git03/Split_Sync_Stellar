"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface LineItem {
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
  items: LineItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  status: "pending" | "paid";
  txHash?: string;
  splits: { recipient: string; percentage: number }[];
}

export default function InvoiceCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (params?.id as string) || "INV-2026-001";

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage or load default invoice
    const savedInvoices = localStorage.getItem("splitsync_invoices");
    if (savedInvoices) {
      try {
        const parsed: InvoiceData[] = JSON.parse(savedInvoices);
        const found = parsed.find((inv) => inv.id === invoiceId);
        if (found) {
          setInvoice(found);
          if (found.status === "paid") {
            setPaidSuccess(true);
            setTxHash(found.txHash || null);
          }
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Default sample invoice if not found in storage
    const defaultInv: InvoiceData = {
      id: invoiceId,
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
      status: "pending",
      splits: [
        { recipient: "GDUW6X2R63KZZZQQ6DYZY3B2I6K5W7FJP6Q4SLLGELMOHDYJ4R62SPLT", percentage: 50 },
        { recipient: "GAZ7XLP4QWEY6YJNXHQD3P22V65KMRH46G6QALN32EVMW2MQL6G6SPLT", percentage: 30 },
        { recipient: "GBR2K5M7WXYZ6QPL2N8HDY66J4V3Q8FM96K2SPLTN9M26LMDHY34SPLT", percentage: 20 },
      ],
    };
    setInvoice(defaultInv);
  }, [invoiceId]);

  const handlePayInvoice = async () => {
    setIsPaying(true);
    // Simulate real on-chain transaction execution on Stellar
    await new Promise((res) => setTimeout(res, 2200));

    const simulatedTx = "e9a4f" + Math.random().toString(16).substring(2, 10) + "73b" + Math.random().toString(16).substring(2, 10) + "8c4";
    setTxHash(simulatedTx);
    setPaidSuccess(true);
    setIsPaying(false);

    if (invoice) {
      const updated = { ...invoice, status: "paid" as const, txHash: simulatedTx };
      setInvoice(updated);

      // Save update to storage
      const savedInvoices = localStorage.getItem("splitsync_invoices");
      let list: InvoiceData[] = savedInvoices ? JSON.parse(savedInvoices) : [];
      list = list.map((i) => (i.id === invoice.id ? updated : i));
      if (!list.find((i) => i.id === invoice.id)) list.push(updated);
      localStorage.setItem("splitsync_invoices", JSON.stringify(list));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center p-6">
        <p className="text-muted-silver">Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center no-print">
          <Link
            href="/dashboard"
            className="text-xs text-muted-silver hover:text-emerald-mint flex items-center gap-1.5 transition-all"
          >
            ← Return to SplitSync Dashboard
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-layer border border-border-slate hover:border-emerald-mint text-xs text-white rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              🖨️ Print / Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-slate-layer/80 border border-border-slate rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border-slate">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="SplitSync Logo"
                className="w-10 h-10 rounded-lg object-cover border border-emerald-mint/40 shadow-md shadow-emerald-mint/20"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">SPLITSYNC INVOICE</h1>
                <p className="text-xs text-muted-silver mt-0.5">Automated On-Chain Split Payment Gateway</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-sm font-bold text-emerald-mint block">{invoice.id}</span>
              <span
                className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  paidSuccess || invoice.status === "paid"
                    ? "bg-emerald-mint/20 text-emerald-mint border border-emerald-mint/40"
                    : "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                }`}
              >
                {paidSuccess || invoice.status === "paid" ? "✓ Paid & Settled" : "⏳ Payment Pending"}
              </span>
            </div>
          </div>

          {/* Parties Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-muted-silver font-semibold uppercase tracking-wider block">Issued By (Squad)</span>
              <p className="font-bold text-white text-sm">{invoice.squadName}</p>
              <p className="font-mono text-muted-silver text-[11px] truncate">
                Contract: {invoice.contractId.slice(0, 10)}...{invoice.contractId.slice(-10)}
              </p>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-muted-silver font-semibold uppercase tracking-wider block">Billed To (Client)</span>
              <p className="font-bold text-white text-sm">{invoice.clientName}</p>
              <p className="text-muted-silver">{invoice.clientEmail}</p>
              <p className="text-muted-silver text-[11px]">Due Date: {invoice.dueDate}</p>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-silver">Itemized Services</h3>
            <div className="border border-border-slate rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-obsidian border-b border-border-slate text-muted-silver font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Service Description</th>
                    <th className="py-2.5 px-4 text-right">Amount ({invoice.token})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-slate/50">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-obsidian/30">
                      <td className="py-3 px-4 text-white">{item.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {item.amount.toLocaleString()} {invoice.token}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & Split Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border-slate">
            {/* Split Distribution Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-silver">
                ⚡ Automated On-Chain Split Routing
              </h4>
              <p className="text-[11px] text-muted-silver">
                Upon checkout, funds are atomically divided to squad recipients:
              </p>
              <div className="space-y-1.5">
                {invoice.splits.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-xs bg-obsidian p-2 rounded border border-border-slate/40">
                    <span className="font-mono text-muted-silver text-[11px]">
                      {s.recipient.slice(0, 6)}...{s.recipient.slice(-6)}
                    </span>
                    <span className="font-bold text-emerald-mint">
                      {((invoice.totalAmount * s.percentage) / 100).toLocaleString()} {invoice.token} ({s.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Card & Payment Action */}
            <div className="bg-obsidian p-5 rounded-xl border border-border-slate flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs text-muted-silver uppercase tracking-wider block">Total Amount Due</span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ${invoice.totalAmount.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-emerald-mint">{invoice.token}</span>
                </div>
                <p className="text-[10px] text-muted-silver mt-1">
                  Gas fees: <strong className="text-emerald-mint">0.00000 XLM</strong> (Sponsored by SplitSync Relayer)
                </p>
              </div>

              {paidSuccess || invoice.status === "paid" ? (
                <div className="space-y-2 bg-emerald-mint/10 border border-emerald-mint/30 p-3 rounded-lg text-center">
                  <span className="text-xs font-bold text-emerald-mint block">✓ PAYMENT VERIFIED ON STELLAR</span>
                  {txHash && (
                    <p className="font-mono text-[10px] text-muted-silver break-all">
                      Tx: {txHash}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handlePayInvoice}
                  disabled={isPaying}
                  className="w-full py-3.5 bg-emerald-mint hover:bg-opacity-90 text-obsidian font-bold rounded-lg shadow-lg shadow-emerald-mint/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-sm no-print"
                >
                  {isPaying ? "Processing On-Chain Split..." : `⚡ Pay ${invoice.totalAmount.toLocaleString()} ${invoice.token} via Freighter`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
