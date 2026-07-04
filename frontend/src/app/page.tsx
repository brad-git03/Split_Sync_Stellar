"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle Navbar Background on Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-obsidian min-h-screen text-white font-sans overflow-x-hidden select-none selection:bg-emerald-mint/30 selection:text-white">
      {/* Sticky Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-layer/80 backdrop-blur-md border-b border-border-slate/40 py-3 shadow-lg"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="w-3.5 h-3.5 bg-emerald-mint rounded-full inline-block animate-pulse"></span>
            SplitSync
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-silver">
            <Link href="#" className="text-white hover:text-white transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-emerald-mint hover:bg-opacity-90 text-xs font-bold text-obsidian rounded-md shadow-lg shadow-emerald-mint/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburguer */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-muted-silver hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-layer border-b border-border-slate p-6 space-y-4 shadow-2xl animate-in slide-in-from-top-5 duration-200">
            <div className="flex flex-col gap-4 text-sm font-medium text-muted-silver">
              <Link
                href="#"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white py-1 transition-colors"
              >
                Home
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white py-1 transition-colors"
              >
                About
              </a>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-center text-xs font-bold text-obsidian rounded-md shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden">
        {/* Ambient Glowing Backgrounds */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-glow-emerald rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-glow-slate rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-glow-emerald rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-layer/60 border border-border-slate rounded-full text-xs font-medium text-emerald-mint">
              <span className="w-2 h-2 bg-emerald-mint rounded-full inline-block animate-ping"></span>
              Stellar Challenge Submission
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Manage Shared Expenses <span className="text-emerald-mint">Smarter</span> with SplitSync
            </h2>
            <p className="text-base md:text-lg text-muted-silver max-w-xl mx-auto lg:mx-0">
              Track shared expenses, split bills fairly, monitor balances, and settle payments effortlessly with an intelligent expense management platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-mint hover:bg-opacity-90 font-bold text-obsidian rounded-md shadow-xl shadow-emerald-mint/10 hover:scale-[1.03] active:scale-[0.97] transition-all text-center cursor-pointer"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-layer border border-border-slate hover:border-emerald-mint font-semibold text-white rounded-md transition-all text-center cursor-pointer"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Right Floating Dashboard Cards */}
          <div className="lg:col-span-6 relative w-full min-h-[450px] flex items-center justify-center">
            {/* Visual Center Grid Grid Container */}
            <div className="relative w-full max-w-md h-full space-y-4 lg:space-y-0">
              
              {/* Card 1: Balance (Floating) */}
              <div className="lg:absolute lg:top-[-20px] lg:left-[-30px] w-full lg:w-72 bg-slate-layer/70 backdrop-blur-md border border-border-slate p-5 rounded-2xl shadow-2xl animate-float-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-silver">Current Balance</span>
                    <h3 className="text-2xl font-bold mt-1 text-white">2,262.61 USDC</h3>
                  </div>
                  <span className="p-2 bg-emerald-mint/10 rounded-lg text-emerald-mint text-xs font-semibold">Active</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-silver">
                    <span>Target Goal (USDC)</span>
                    <span>100% complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-obsidian rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-mint rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Settlement Reminder */}
              <div className="lg:absolute lg:top-[120px] lg:right-[-40px] w-full lg:w-64 bg-slate-layer/70 backdrop-blur-md border border-border-slate p-4 rounded-xl shadow-2xl animate-float-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted-crimson/10 border border-muted-crimson/20 flex items-center justify-center text-muted-crimson font-bold text-sm">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted-silver block">Settlement Alert</span>
                    <span className="text-xs text-white font-medium block mt-0.5 truncate">Bob owes you 300.00 USDC</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link href="/dashboard" className="px-3 py-1.5 bg-emerald-mint hover:bg-opacity-95 text-[10px] font-bold text-obsidian rounded-md transition-all">
                    Settle Now
                  </Link>
                </div>
              </div>

              {/* Card 3: Active Groups */}
              <div className="lg:absolute lg:bottom-[-30px] lg:left-[-20px] w-full lg:w-64 bg-slate-layer/70 backdrop-blur-md border border-border-slate p-4 rounded-xl shadow-2xl animate-float-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-silver">Active Collectives</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-medium">Design Gig Split</span>
                    <span className="text-[10px] text-emerald-mint font-semibold bg-emerald-mint/10 px-2 py-0.5 rounded-full">70/30</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-medium">Dev Collective B</span>
                    <span className="text-[10px] text-emerald-mint font-semibold bg-emerald-mint/10 px-2 py-0.5 rounded-full">50/50</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Expense Analytics */}
              <div className="lg:absolute lg:bottom-[80px] lg:right-[-30px] w-full lg:w-64 bg-slate-layer/70 backdrop-blur-md border border-border-slate p-4 rounded-xl shadow-2xl animate-float-4">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-silver">Allocation Analytics</h4>
                <div className="mt-3 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white">
                      <span>Server Hosting</span>
                      <span>50%</span>
                    </div>
                    <div className="w-full h-1 bg-obsidian rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-mint rounded-full w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white">
                      <span>Marketing</span>
                      <span>30%</span>
                    </div>
                    <div className="w-full h-1 bg-obsidian rounded-full overflow-hidden">
                      <div className="h-full bg-sage-ice rounded-full w-[30%]"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-border-slate/40 relative">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-mint">Product Capabilities</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Smart Expense Management Features</h2>
            <p className="text-sm md:text-base text-muted-silver">
              Everything you need to split expenses, monitor balances, and settle payments in one place.
            </p>
          </div>

          {/* 8 Premium Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Expense Tracking</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Log every shared expenditure on the decentralized ledger for total auditing clarity.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7h7m-7-7h7M6 10a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Smart Bill Splitting</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Dynamically calculate split distributions down to the stroop with zero contract dust left behind.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Group Management</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Easily bundle friends, roommates, or remote dev squads into designated split groups.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Balance Overview</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Inspect live balances instantly using read-only simulations that execute in milliseconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Payment History</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Verify past split disbursements with immutable, cryptographically verifiable transaction logs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Settlement Reminders</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Send alerts when groups need to pay up, prompting clean split execution.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Expense Analytics</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Visualize where the collective's capital is allocated with custom chart modules.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-slate-layer border border-border-slate hover:border-emerald-mint p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-mint/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-4">Secure Cloud Sync</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Leverage Stellar’s decentralized consensus to store and sync split rules globally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-layer/30 border-t border-border-slate/40 relative">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-mint">Simple Walkthrough</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">How SplitSync Works</h2>
            <p className="text-sm md:text-base text-muted-silver">
              Follow these simple steps to start trustless revenue splitting on the Stellar network.
            </p>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-layer border border-border-slate rounded-2xl relative shadow-xl">
              <span className="absolute -top-4 left-6 bg-emerald-mint text-obsidian text-xs font-black w-8 h-8 rounded-full flex items-center justify-center">
                1
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-5">Create an Account</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Connect your browser wallet (Freighter, Albedo, or xBull) to authenticate instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-layer border border-border-slate rounded-2xl relative shadow-xl">
              <span className="absolute -top-4 left-6 bg-emerald-mint text-obsidian text-xs font-black w-8 h-8 rounded-full flex items-center justify-center">
                2
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-5">Create or Join a Group</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Register a contract defining each freelancer's allocation share in basis points.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-layer border border-border-slate rounded-2xl relative shadow-xl">
              <span className="absolute -top-4 left-6 bg-emerald-mint text-obsidian text-xs font-black w-8 h-8 rounded-full flex items-center justify-center">
                3
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-5">Add Shared Expenses</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Log invoices or collective expenses to prepare for client token payout splits.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-6 bg-slate-layer border border-border-slate rounded-2xl relative shadow-xl">
              <span className="absolute -top-4 left-6 bg-emerald-mint text-obsidian text-xs font-black w-8 h-8 rounded-full flex items-center justify-center">
                4
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-mint/10 flex items-center justify-center text-emerald-mint">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mt-5">Track & Settle Payments</h3>
              <p className="text-xs text-muted-silver mt-2 leading-relaxed">
                Trigger payouts atomically, routing USDC or XLM directly to member wallets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 border-t border-border-slate/40 relative">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left illustration */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-slate-layer border border-border-slate rounded-2xl shadow-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-glow-emerald rounded-full"></div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-mint rounded-full inline-block"></span>
                Invoice Splitting System
              </h3>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-obsidian border border-border-slate rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Invoice Amount</span>
                    <span>$1,000.00 USDC</span>
                  </div>
                  <div className="text-[10px] text-muted-silver">Client payment to SplitSync Contract</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-obsidian/30 border border-border-slate/50 rounded-lg">
                    <span className="font-mono text-white">Alice (Dev)</span>
                    <span className="text-emerald-mint font-semibold">+$700.00 (70%)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-obsidian/30 border border-border-slate/50 rounded-lg">
                    <span className="font-mono text-white">Bob (Design)</span>
                    <span className="text-emerald-mint font-semibold">+$300.00 (30%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-mint">Who is it for?</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">Designed for Collaborative Teams</h2>
              <p className="text-sm md:text-base text-muted-silver">
                SplitSync helps Friends, Families, Classmates, Roommates, and remote Teams coordinate their shared expenditures with cryptographic certainty.
              </p>
            </div>

            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-sm text-white">
                <span className="w-5 h-5 bg-emerald-mint/10 text-emerald-mint rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                Automated basis-point splits (exact math down to 0.0000001 units).
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <span className="w-5 h-5 bg-emerald-mint/10 text-emerald-mint rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                Transparent on-chain balance tracking for complete audits.
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <span className="w-5 h-5 bg-emerald-mint/10 text-emerald-mint rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                Smart settlements routing remainders directly to prevent locked dust.
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <span className="w-5 h-5 bg-emerald-mint/10 text-emerald-mint rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                Real-time synchronization across all members on the Stellar ledger.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-glow-emerald rounded-full pointer-events-none -z-10"></div>
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-layer/80 backdrop-blur-md border border-border-slate rounded-3xl p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-mint/5 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-layer/50 rounded-full"></div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Ready to simplify your shared expenses?
            </h2>
            <p className="text-sm md:text-base text-muted-silver max-w-xl mx-auto">
              Deploy your own immutable SplitSync agreement on the Stellar Testnet in seconds.
            </p>
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="px-10 py-4 bg-emerald-mint hover:bg-opacity-90 font-bold text-obsidian rounded-md shadow-xl shadow-emerald-mint/20 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-slate/40 bg-slate-layer/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-white text-base">
              <span className="w-3 h-3 bg-emerald-mint rounded-full inline-block"></span>
              SplitSync
            </Link>
            <div className="text-xs text-muted-silver">
              &copy; 2026 SplitSync. All rights reserved. Built for the Stellar Challenge.
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted-silver font-medium">
            <Link href="#" className="hover:text-white transition-colors">Home</Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link href="/dashboard" className="text-emerald-mint hover:underline font-bold">Get Started</Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-muted-silver">
            <a href="https://github.com/brad-git03/Split-Sync-Main" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
