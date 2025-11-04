// src/app/white-paper/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './whitepaperstyles.css'; // scoped dark theme for this page

export default function WhitePaperPage() {
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedCore, setCopiedCore] = useState(false);
  const CORE_ADDRESS = '0x9362d1b929c8cC161830292b95Ad5E1187239a38';
  
  // Scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = ['executive-summary', 'problem', 'solution', 'technology', 'roadmap', 'team', 'legal'];
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'executive-summary', title: 'Executive Summary', icon: '📋' },
    { id: 'problem', title: 'Problem Statement', icon: '❗' },
    { id: 'solution', title: 'Solution & Architecture', icon: '💡' },
    { id: 'technology', title: 'Core Contract & Modules', icon: '⚙️' },
    { id: 'roadmap', title: 'Roadmap', icon: '🗺️' },
    { id: 'team', title: 'Team & Advisors', icon: '👥' },
    { id: 'legal', title: 'Legal & Risk', icon: '⚖️' }
  ];

  return (
    <div className="whitepaper wp-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      <Header />
      
      {/* Progress Bar (green accent) */}
      <div className="wp-progress fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="wp-progress-inner h-full transition-all duration-300"
          style={{ width: `${scrollProgress}%`, background: 'linear-gradient(90deg,#10b981,#065f46)' }}
        />
      </div>

      {/* Floating Navigation */}
      <div className="wp-float-nav fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center w-full p-3 mb-2 last:mb-0 rounded-xl transition-all duration-300 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-[#10b981] to-[#065f46] text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={section.title}
            >
              <span className="text-lg mr-3">{section.icon}</span>
              <span className="text-sm font-medium hidden xl:block">{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section (PolyFund, green theme) */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="hero-overlay absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(6,95,70,0.06))', backdropFilter: 'blur(18px)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent mb-6" style={{ backgroundImage: 'linear-gradient(90deg,#10b981,#065f46)' }}>
              PolyFund Whitepaper
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
              PolyFund: Decentralized Community Funding & Governance
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed mb-10">
              This document describes PolyFund's architecture and the lightweight core contract (PolyFundCore) that coordinates storage, modules, and extensions.
              It explains fundraising primitives, governance interactions, fee mechanics, withdrawal and refund behavior, and security considerations.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="/polyfund-whitepaper.pdf"
                download
                className="inline-flex items-center bg-gradient-to-r from-[#10b981] to-[#065f46] text-white font-bold py-3 px-6 rounded-2xl transition-transform hover:scale-105 shadow-lg"
                aria-label="Download PolyFund Whitepaper PDF"
              >
                <span className="mr-3 text-xl">📄</span>
                Download PDF
              </a>
              <button 
                onClick={() => scrollToSection('executive-summary')}
                className="wp-secondary-btn bg-white/90 hover:bg-white text-gray-900 font-bold py-3 px-6 rounded-2xl transition-all duration-200 border border-gray-200 shadow-sm"
              >
                <span className="mr-2 text-lg">👇</span>
                Read online
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 text-center border">
                <div className="text-3xl font-bold text-[#10b981]">50+</div>
                <div className="text-gray-600">Pages</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center border">
                <div className="text-3xl font-bold text-[#10b981]">7</div>
                <div className="text-gray-600">Sections</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center border">
                <div className="text-3xl font-bold text-[#10b981]">2024</div>
                <div className="text-gray-600">Version</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center border">
                <div className="text-3xl font-bold text-[#10b981]">Free</div>
                <div className="text-gray-600">Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content (English, contract-driven) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Executive Summary */}
        <section id="executive-summary" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-[#10b981] bg-opacity-12 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Executive Summary</h2>
                <p className="text-gray-600">An overview of PolyFund's mission, approach and core contract.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mission</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  PolyFund provides a transparent on‑chain framework for community fundraising and governance.
                  A lightweight core contract (PolyFundCore) coordinates immutable storage and modular extensions,
                  delegating complex behavior to specialized modules (governance, security, analytics, web3 integrations).
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Key Capabilities</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>• Decentralized proposal creation and token-weighted voting</li>
                  <li>• Flexible (no-goal) and targeted fundraisers</li>
                  <li>• Transparent fund settlement and withdrawal lifecycle</li>
                  <li>• Modular architecture enabling upgrades and security policies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Market Opportunity</h3>
                <div className="rounded-2xl p-6 mb-6 border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#10b981] mb-1">$2.3B</div>
                    <div className="text-gray-600">Crowdfunding market (projected)</div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Competitive Advantages</h3>
                <div className="space-y-3">
                  <div className="rounded-xl p-4 border">
                    <div className="font-semibold text-[#10b981]">Blockchain transparency</div>
                    <div className="text-sm text-gray-600">All transactions and state transitions are auditable on-chain</div>
                  </div>
                  <div className="rounded-xl p-4 border">
                    <div className="font-semibold text-[#10b981]">Low platform fees</div>
                    <div className="text-sm text-gray-600">On-chain settlement and fee configurability</div>
                  </div>
                  <div className="rounded-xl p-4 border">
                    <div className="font-semibold text-[#10b981]">Global accessibility</div>
                    <div className="text-sm text-gray-600">Open to contributors worldwide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section id="problem" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">❗</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Problem Statement</h2>
                <p className="text-gray-600">Key challenges in governance and community fundraising today.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-5 border">
                <h3 className="text-lg font-semibold mb-3">Traditional Governance Limits</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Low participation and limited transparency</li>
                  <li>• Centralized control and slow decision cycles</li>
                </ul>
              </div>
              <div className="rounded-2xl p-5 border">
                <h3 className="text-lg font-semibold mb-3">Centralized Fundraising Problems</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• High middleman fees and limited auditability</li>
                  <li>• Fragmented tooling for global donors</li>
                </ul>
              </div>
              <div className="rounded-2xl p-5 border">
                <h3 className="text-lg font-semibold mb-3">Trust & Accountability</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Difficulty tracking funds and outcomes</li>
                  <li>• Insufficient automated governance controls</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">💡</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Our Solution</h2>
                <p className="text-gray-600">How PolyFund's design addresses the gaps with a lightweight core + modules</p>
              </div>
            </div>
 
            <div className="mb-8">
              <div className="rounded-2xl p-6 text-center border">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Decentralized Democratic Platform</h3>
                <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed">
                  PolyFund combines a slim Core contract coordinating Storage and Modules with specialized libraries for Withdraw and Refund logic.
                  This enables auditable donations, configurable fees, and modular governance execution.
                </p>
              </div>
            </div>
 
            <div className="grid md:grid-cols-2 gap-8 mb-12">
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-6">🗳️ Governance Solutions</h3>
                 <div className="space-y-4">
                   <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                     <h4 className="font-bold text-blue-800">Token-Based Voting</h4>
                     <p className="text-blue-700 text-sm">Proportional representation based on stake</p>
                   </div>
                   <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                     <h4 className="font-bold text-purple-800">Proposal Creation</h4>
                     <p className="text-purple-700 text-sm">Democratic proposal submission and discussion</p>
                   </div>
                   <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                     <h4 className="font-bold text-green-800">Transparent Results</h4>
                     <p className="text-green-700 text-sm">Real-time, immutable voting records</p>
                   </div>
                 </div>
               </div>
 
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-6">💰 Fundraising Solutions</h3>
                 <div className="space-y-4">
                   <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                     <h4 className="font-bold text-orange-800">Flexible Campaigns</h4>
                     <p className="text-orange-700 text-sm">Both target-based and continuous funding</p>
                   </div>
                   <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                     <h4 className="font-bold text-pink-800">Low Fees</h4>
                     <p className="text-pink-700 text-sm">Minimal transaction costs on blockchain</p>
                   </div>
                   <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                     <h4 className="font-bold text-indigo-800">Global Access</h4>
                     <p className="text-indigo-700 text-sm">No geographical or currency restrictions</p>
                   </div>
                 </div>
               </div>
             </div>
 
            <div className="rounded-2xl p-8 border bg-white">
              <h3 className="text-2xl font-bold mb-6 text-center">🔗 Core Platform Features</h3>
               <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Security First</h4>
                  <p className="text-gray-600 text-sm">Audited contracts and strict withdrawal controls</p>
                </div>
                <div>
                  <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Efficient</h4>
                  <p className="text-gray-600 text-sm">Simple Core delegates to optimized libraries (WithdrawLogic, RefundLogic)</p>
                </div>
                <div>
                  <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">Globally Accessible</h4>
                  <p className="text-gray-600 text-sm">Composable modules enable multi-network deployment</p>
                </div>
               </div>
             </div>
           </div>
         </section>
 
        {/* Technology / Core Contract */}
         <section id="technology" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
             <div className="flex items-center mb-8">
               <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mr-6">
                 <span className="text-3xl">⚙️</span>
               </div>
               <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">PolyFundCore — Lightweight Core</h2>
                <p className="text-gray-600">The Core coordinates storage and modules and delegates complex logic to specialized libraries.</p>
               </div>
             </div>
 
             <div className="grid md:grid-cols-2 gap-8 mb-12">
               <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Blockchain Layer</h3>
                 <div className="space-y-4">
                   <div className="border border-gray-200 rounded-xl p-4">
                     <h4 className="font-bold text-gray-800 flex items-center mb-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                      Ethereum Mainnet
                    </h4>
                    <p className="text-gray-600 text-sm">Primary deployment for maximum security and decentralization</p>
                   </div>
                   <div className="border border-gray-200 srounded-xl p-4">
                     <h4 className="font-bold text-gray-800 flex items-center mb-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                      Polygon Network
                    </h4>
                    <p className="text-gray-600 text-sm">Layer 2 scaling for faster and cheaper transactions</p>
                   </div>
                   <div className="border border-gray-200 rounded-xl p-4">
                     <h4 className="font-bold text-gray-800 flex items-center mb-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      Multi-Chain Support
                    </h4>
                    <p className="text-gray-600 text-sm">Future expansion to additional networks</p>
                   </div>
                 </div>
               </div>
 
               <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Core Contract & Libraries</h3>
                 <div className="bg-gray-50 rounded-2xl p-6">
                   <div className="space-y-4">
                     <div>
                      <h4 className="font-bold text-gray-800 mb-2">Core: PolyFundCore</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        A thin controller (PolyFundCore) that: resolves module addresses, coordinates router/extension calls, and exposes view functions (getFundraiserDetails, getFundraiserCount, getDonationAmount).
                      </p>
                      {/* Core contract address + copy button */}
                      <div className="flex items-center gap-3 mt-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500">Core contract (Mainnet):</div>
                          <div className="font-mono text-sm text-gray-800 break-all sm:break-normal sm:truncate sm:whitespace-nowrap">
                            {CORE_ADDRESS}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(CORE_ADDRESS);
                              setCopiedCore(true);
                              setTimeout(() => setCopiedCore(false), 2000);
                            } catch {}
                          }}
                          className="inline-flex items-center px-3 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-50 shadow-sm flex-shrink-0"
                          aria-label="Copy core contract address"
                        >
                          {copiedCore ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                     </div>
                     <div>
                      <h4 className="font-bold text-gray-800 mb-2">Libraries & Modules</h4>
                       <ul className="text-sm text-gray-600 space-y-1">
                        <li>• WithdrawLogic — robust withdrawal flow with fee handling and analytics recording</li>
                        <li>• RefundLogic — controlled refund claiming, blocked when withdrawals start</li>
                        <li>• FundraiserLogic — creation and basic validation</li>
                       </ul>
                     </div>
                     <div>
                      <h4 className="font-bold text-gray-800 mb-2">Core Behaviors (high level)</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Fee configuration: donationFeeBps, successWithdrawFeeBps, flexibleWithdrawFeeBps</li>
                        <li>• Donation flow: transfer to Core → Core forwards net to Storage and records donation event</li>
                        <li>• Withdrawals: WithdrawLogic executes net payouts and marks withdrawalsStarted to block refunds in some scenarios</li>
                        <li>• Refunds: RefundLogic.claimRefund allows controlled refunds; refund() direct call is disabled (reverts RefundNotAllowed)</li>
                      </ul>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
 
            <div className="rounded-2xl p-6 border bg-white">
              <h3 className="text-2xl font-bold mb-6">Technical Architecture</h3>
               <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <h4 className="font-bold mb-2">Frontend</h4>
                  <p className="text-gray-300 text-sm">Next.js, React, TypeScript</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <h4 className="font-bold mb-2">Web3</h4>
                  <p className="text-gray-300 text-sm">Wagmi, Viem, RainbowKit</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📜</span>
                  </div>
                  <h4 className="font-bold mb-2">Contracts</h4>
                  <p className="text-gray-300 text-sm">Solidity, OpenZeppelin</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">☁️</span>
                  </div>
                  <h4 className="font-bold mb-2">Infrastructure</h4>
                  <p className="text-gray-300 text-sm">IPFS, Vercel, Alchemy</p>
                </div>
               </div>
             </div>
           </div>
         </section>
 
        {/* Roadmap */}
         <section id="roadmap" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
             <div className="flex items-center mb-8">
               <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mr-6">
                 <span className="text-3xl">🗺️</span>
               </div>
               <div>
                 <h2 className="text-4xl font-bold text-gray-900 mb-2">Development Roadmap</h2>
                 <p className="text-gray-600">Strategic milestones and timeline</p>
               </div>
             </div>

             <div className="space-y-8">
               {/* Q4 2025 */}
               <div className="flex items-start space-x-6">
                 <div className="flex-shrink-0">
                   <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                     <span className="text-white font-bold">🚀</span>
                   </div>
                 </div>
                 <div className="flex-1">
                   <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                     <h3 className="text-xl font-bold text-indigo-800 mb-2">Q4 2025 - Global Scale & Expansion 🚀</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                       <ul className="space-y-2 text-indigo-700">
                         <li>🚀 Cross-chain compatibility</li>
                         <li>🚀 Enterprise partnerships</li>
                         <li>🚀 Advanced governance mechanisms</li>
                         <li>🚀 Institutional onboarding</li>
                       </ul>
                       <ul className="space-y-2 text-indigo-700">
                         <li>🚀 Global compliance framework</li>
                         <li>🚀 Advanced staking options</li>
                         <li>🚀 DAO treasury management</li>
                         <li>🚀 1M+ user milestone</li>
                       </ul>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
         </section>
 
        {/* Team */}
         <section id="team" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
             <div className="flex items-center mb-8">
               <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mr-6">
                 <span className="text-3xl">👥</span>
               </div>
               <div>
                 <h2 className="text-4xl font-bold text-gray-900 mb-2">Team & Advisors</h2>
                 <p className="text-gray-600">All roles: Jakub Lacki</p>
               </div>
             </div>
 
             <div className="flex flex-col items-center justify-center mb-12">
               <div className="text-center">
                 <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-4xl text-white">👤</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Jakub Lacki</h3>
                 <p className="text-blue-600 font-medium mb-3">Founder, Developer, Advisor</p>
                 <p className="text-gray-600 text-sm leading-relaxed">
                   Responsible for all aspects of PolyFund: smart contracts, frontend, backend, governance, and strategy.
                 </p>
               </div>
             </div>
           </div>
         </section>
 
        {/* Legal & Compliance */}
         <section id="legal" className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12">
             <div className="flex items-center mb-8">
               <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mr-6">
                 <span className="text-3xl">⚖️</span>
               </div>
               <div>
                 <h2 className="text-4xl font-bold text-gray-900 mb-2">Legal & Compliance</h2>
                 <p className="text-gray-600">Regulatory framework and risk management</p>
               </div>
             </div>
 
             <div className="grid md:grid-cols-2 gap-8 mb-12">
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 Regulatory Compliance</h3>
                 <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-bold text-green-800 mb-2">✅ Know Your Customer (KYC)</h4>
                    <p className="text-green-700 text-sm">
                      Optional KYC verification for enhanced features and higher transaction limits
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-bold text-blue-800 mb-2">🛡️ Anti-Money Laundering (AML)</h4>
                    <p className="text-blue-700 text-sm">
                      Comprehensive AML policies and transaction monitoring systems
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="font-bold text-purple-800 mb-2">🌍 Global Compliance</h4>
                    <p className="text-purple-700 text-sm">
                      Adherence to international regulatory standards and local requirements
                    </p>
                  </div>
                 </div>
               </div>
 
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-6">⚠️ Risk Factors</h3>
                 <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-bold text-yellow-800 mb-2">📊 Market Risk</h4>
                    <p className="text-yellow-700 text-sm">
                      Token value volatility and cryptocurrency market fluctuations
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <h4 className="font-bold text-orange-800 mb-2">🔧 Technology Risk</h4>
                    <p className="text-orange-700 text-sm">
                      Smart contract vulnerabilities and blockchain network risks
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="font-bold text-red-800 mb-2">⚖️ Regulatory Risk</h4>
                    <p className="text-red-700 text-sm">
                      Potential changes in cryptocurrency and DAO regulations
                    </p>
                  </div>
                 </div>
               </div>
             </div>
 
             <div className="bg-gray-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">📄 Legal Documentation</h3>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h4 className="font-bold mb-2">Terms of Service</h4>
                  <p className="text-gray-300 text-sm">Platform usage terms and conditions</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h4 className="font-bold mb-2">Privacy Policy</h4>
                  <p className="text-gray-300 text-sm">Data protection and privacy measures</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <h4 className="font-bold mb-2">Legal Opinion</h4>
                  <p className="text-gray-300 text-sm">Professional legal assessment</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h4 className="font-bold mb-2">Security Audit</h4>
                  <p className="text-gray-300 text-sm">Third-party security assessment</p>
                </div>
              </div>
             </div>
 
             <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">⚠️ Important Disclaimers</h3>
              <div className="space-y-4 text-gray-700">
                <p className="text-sm leading-relaxed">
                  <strong>Investment Risk:</strong> Participation in PoliDAO involves significant risk. 
                  Token values may fluctuate dramatically, and you may lose some or all of your investment.
                </p>
                <p className="text-sm leading-relaxed">
                  <strong>No Investment Advice:</strong> This white paper does not constitute investment advice. 
                  Please consult with qualified financial advisors before making any investment decisions.
                </p>
                <p className="text-sm leading-relaxed">
                  <strong>Regulatory Uncertainty:</strong> The regulatory environment for cryptocurrencies 
                  and DAOs is evolving. Future regulations may impact the platform's operations.
                </p>
                <p className="text-sm leading-relaxed">
                  <strong>Technology Risks:</strong> Blockchain technology is still developing. 
                  Smart contracts may contain bugs or vulnerabilities despite thorough auditing.
                </p>
              </div>
             </div>
           </div>
         </section>
       </div>
 
      {/* CTA Section (green themed) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl p-12 text-center border" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.06), rgba(6,95,70,0.03))' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to collaborate with PolyFund?</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Review the architecture above and download the full specification to integrate or deploy PolyFund modules.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center border border-[#10b981] text-[#10b981] font-semibold py-3 px-6 rounded-2xl hover:bg-[#10b981]/10">
              🚀 Contact the Team
            </a>
          </div>
        </div>
      </div>
 
       <Footer />
     </div>
   );
 }