'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface SplitActivityItem {
  id: string;
  collectiveName: string;
  category: string;
  payer: string;
  asset: 'USDC' | 'XLM' | 'EURC';
  amount: number;
  fiatPhp: number;
  splitPreset: string;
  recipients: {
    role: string;
    percentage: number;
    amount: number;
  }[];
  timestamp: string;
  txHash: string;
  settlementSpeed: string;
}

const INITIAL_ACTIVITIES: SplitActivityItem[] = [
  {
    id: 'SPLT-9042',
    collectiveName: 'Apex Web3 UI/UX Studio',
    category: 'Design & Frontend Gig',
    payer: 'Client: FinTech Global DAO',
    asset: 'USDC',
    amount: 3200,
    fiatPhp: 185600,
    splitPreset: '60/40 Split',
    recipients: [
      { role: 'Lead UI/UX (Quinn W.)', percentage: 60, amount: 1920 },
      { role: 'Frontend Dev (Leo G.)', percentage: 40, amount: 1280 },
    ],
    timestamp: '2 mins ago',
    txHash: '1205235b334b9ea5528718714cdc53bc3e2397f82c320375164bbd018a2affb2',
    settlementSpeed: '3.4s'
  },
  {
    id: 'SPLT-9041',
    collectiveName: 'Soroban Security Audit Pod',
    category: 'Smart Contract Audit',
    payer: 'Client: Stellar DEX Protocol',
    asset: 'USDC',
    amount: 5000,
    fiatPhp: 290000,
    splitPreset: '50/50 Equal',
    recipients: [
      { role: 'Rust Sec Lead (Sam M.)', percentage: 50, amount: 2500 },
      { role: 'ZK Verifier (Peter M.)', percentage: 50, amount: 2500 },
    ],
    timestamp: '6 mins ago',
    txHash: '03f2f505c21f50326ea4a4111d65c4987f6f39320d018ab446c9bd6c95e87c3c',
    settlementSpeed: '3.8s'
  },
  {
    id: 'SPLT-9040',
    collectiveName: 'HyperScale Full-Stack Squad',
    category: 'SaaS MVP Milestone',
    payer: 'Client: Venture Studio Inc',
    asset: 'XLM',
    amount: 8500,
    fiatPhp: 59500,
    splitPreset: '40/30/30 Pod',
    recipients: [
      { role: 'Backend Architect', percentage: 40, amount: 3400 },
      { role: 'Frontend Dev', percentage: 30, amount: 2550 },
      { role: 'DevOps & QA', percentage: 30, amount: 2550 },
    ],
    timestamp: '14 mins ago',
    txHash: '35c3be6cda137f732224d669a0352f7f4505f8a78aca212593557e35e45fe2d4',
    settlementSpeed: '3.1s'
  },
  {
    id: 'SPLT-9039',
    collectiveName: '3D Game Assets Collective',
    category: 'Metaverse Modeling',
    payer: 'Client: GameFi Studios',
    asset: 'USDC',
    amount: 2400,
    fiatPhp: 139200,
    splitPreset: '70/30 Split',
    recipients: [
      { role: 'Lead 3D Animator (Leo H.)', percentage: 70, amount: 1680 },
      { role: 'Sound Engineer (David M.)', percentage: 30, amount: 720 },
    ],
    timestamp: '28 mins ago',
    txHash: 'c8927acebd81f70f4664d532827942c87da3546b54f38783fc6fb304987dd4a6',
    settlementSpeed: '3.6s'
  },
  {
    id: 'SPLT-9038',
    collectiveName: 'Content & Technical Writing Guild',
    category: 'Ecosystem Docs & Whitepaper',
    payer: 'Client: Layer-1 Foundation',
    asset: 'EURC',
    amount: 1800,
    fiatPhp: 113400,
    splitPreset: '50/50 Equal',
    recipients: [
      { role: 'Technical Writer (Frank G.)', percentage: 50, amount: 900 },
      { role: 'Translator & Editor', percentage: 50, amount: 900 },
    ],
    timestamp: '42 mins ago',
    txHash: '3c8e91c59dd5253454f30943f2c73c7fe1190563f0a1ac0317849d0f69e34c7f',
    settlementSpeed: '3.9s'
  },
  {
    id: 'SPLT-9037',
    collectiveName: 'DeFi Data Analytics Guild',
    category: 'Indexer & Dune Dashboards',
    payer: 'Client: Yield Vault DAO',
    asset: 'USDC',
    amount: 4500,
    fiatPhp: 261000,
    splitPreset: '60/40 Split',
    recipients: [
      { role: 'Data Engineer (Sam A.)', percentage: 60, amount: 2700 },
      { role: 'Smart Contract Dev', percentage: 40, amount: 1800 },
    ],
    timestamp: '1 hour ago',
    txHash: 'ae6c052560dca84befc842e7649b4d6f9a162424a2608c2490f56b82a641644c',
    settlementSpeed: '3.2s'
  }
];

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<SplitActivityItem[]>(INITIAL_ACTIVITIES);
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [lastSynced, setLastSynced] = useState<string>('Just now');

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const filteredActivities = activities.filter(
    (item) => selectedAsset === 'ALL' || item.asset === selectedAsset
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-14 border-t border-border-slate/50">
      {/* Header with Live Pulse */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-xs font-bold text-emerald-mint mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE ON-CHAIN SETTLEMENT ACTIVITY
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Real-Time Revenue Splits on Stellar
          </h2>
          <p className="text-sm text-muted-silver mt-1 max-w-xl">
            Live verifiable proof of freelance collective disbursements, DAO contractor splits, and client invoice payouts settled via Soroban smart contracts.
          </p>
        </div>

        {/* Live Metrics Pill & Asset Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-layer px-4 py-2 rounded-xl border border-border-slate text-xs text-white">
            <span className="text-emerald-mint font-bold">⚡ Latency: 3.8s</span>
            <span className="text-border-slate">|</span>
            <span className="text-muted-silver">0 Lost Stroops</span>
            <span className="text-border-slate">|</span>
            <span className="text-xs text-muted-silver">Synced: {lastSynced}</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-layer p-1 border border-border-slate text-xs font-semibold">
            {['ALL', 'USDC', 'XLM', 'EURC'].map((asset) => (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedAsset === asset
                    ? 'bg-emerald-mint text-obsidian font-bold shadow-xs'
                    : 'text-muted-silver hover:text-white'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActivities.map((act) => (
          <div
            key={act.id}
            className="bg-slate-layer/80 backdrop-blur-sm rounded-2xl p-5 border border-border-slate hover:border-emerald-mint/50 transition-all duration-200 flex flex-col justify-between group shadow-lg"
          >
            <div>
              {/* Card Top: ID, Asset & Preset Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-muted-silver bg-obsidian/70 px-2 py-0.5 rounded-md border border-border-slate">
                  {act.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-mint bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {act.splitPreset}
                  </span>
                  <span className="text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {act.asset}
                  </span>
                </div>
              </div>

              {/* Collective Name & Payer */}
              <h3 className="text-base font-bold text-white group-hover:text-emerald-mint transition-colors">
                {act.collectiveName}
              </h3>
              <p className="text-xs text-muted-silver mt-0.5">{act.category} • <span className="text-slate-400">{act.payer}</span></p>

              {/* Total Dispersed & Fiat Conversion */}
              <div className="mt-4 p-3 bg-obsidian/60 rounded-xl border border-border-slate/70">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-medium text-muted-silver">Total Dispersed:</span>
                  <span className="text-base font-black text-white">
                    {act.amount.toLocaleString()} {act.asset}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 text-[11px] text-emerald-mint">
                  <span>Estimated Fiat:</span>
                  <span className="font-semibold">≈ ₱{act.fiatPhp.toLocaleString()} PHP (${(act.fiatPhp / 58).toFixed(2)} USD)</span>
                </div>
              </div>

              {/* Member Breakdown */}
              <div className="mt-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-silver block">
                  Automatic Member Take-Home:
                </span>
                {act.recipients.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-layer/50 border border-border-slate/40">
                    <span className="text-slate-300 font-medium truncate max-w-[140px]">{rec.role}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-silver font-mono">({rec.percentage}%)</span>
                      <span className="font-bold text-white">
                        {rec.amount.toLocaleString()} {act.asset}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Tx Explorer Link & Time */}
            <div className="mt-5 pt-3.5 border-t border-border-slate/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-silver">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{act.timestamp}</span>
                <span className="text-[10px] text-slate-500 font-mono">({act.settlementSpeed})</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${act.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-mint hover:underline"
              >
                <span>Proof Tx ↗</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <div className="mt-8 p-5 bg-gradient-to-r from-slate-layer to-obsidian rounded-2xl border border-border-slate flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Ready to automate your team&apos;s revenue sharing?</h4>
          <p className="text-xs text-muted-silver mt-0.5">Deploy your squad split contract or generate a client invoice in seconds on Stellar.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-emerald-mint text-obsidian text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-md"
          >
            Launch Dashboard 🚀
          </Link>
        </div>
      </div>
    </section>
  );
}

export default LiveActivityFeed;
