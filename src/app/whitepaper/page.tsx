// src/app/white-paper/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function WhitePaperPage() {
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sections = ['executive-summary', 'problem', 'solution', 'technology', 'tokenomics', 'roadmap', 'team', 'legal'];
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
    { id: 'executive-summary', title: 'Streszczenie zarządcze', icon: '📋' },
    { id: 'problem', title: 'Opis problemu', icon: '❗' },
    { id: 'solution', title: 'Nasze rozwiązanie', icon: '💡' },
    { id: 'technology', title: 'Technologia', icon: '⚙️' },
    { id: 'tokenomics', title: 'Tokenomika', icon: '💰' },
    { id: 'roadmap', title: 'Mapa drogowa', icon: '🗺️' },
    { id: 'team', title: 'Zespół', icon: '👥' },
    { id: 'legal', title: 'Aspekty prawne', icon: '⚖️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Navigation */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center w-full p-3 mb-2 last:mb-0 rounded-xl transition-all duration-300 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
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

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-8">
              Biała Księga
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              PoliDAO: Zdecentralizowane Zarządzanie Demokratyczne
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              Kompleksowy przegląd techniczny i strategiczny wizji PoliDAO dla uczestnictwa demokratycznego 
              opartego na blockchain, mechanizmów finansowania społecznościowego i zdecentralizowanego zarządzania autonomicznego.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center">
                <span className="mr-3 text-xl">📄</span>
                Pobierz wersję PDF
              </button>
              <button 
                onClick={() => scrollToSection('executive-summary')}
                className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl transition-all duration-300 border border-gray-200 hover:shadow-lg flex items-center"
              >
                <span className="mr-3 text-xl">👇</span>
                Czytaj online
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-gray-600">Stron</div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">8</div>
                <div className="text-gray-600">Sekcji</div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600">2024</div>
                <div className="text-gray-600">Wersja</div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">Darmowy</div>
                <div className="text-gray-600">Dostęp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Executive Summary */}
        <section id="executive-summary" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Streszczenie zarządcze</h2>
                <p className="text-gray-600">Kluczowe założenia i przegląd strategiczny</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Misja</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  PoliDAO rewolucjonizuje udział demokratyczny poprzez połączenie technologii blockchain 
                  z przejrzystymi mechanizmami zarządzania. Umożliwiamy społecznościom tworzenie, finansowanie 
                  i głosowanie nad propozycjami w pełni zdecentralizowanym środowisku.
                </p>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">🔑 Kluczowe funkcje</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Zdecentralizowane tworzenie propozycji i głosowanie
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Elastyczne i celowane kampanie crowdfundingowe
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Przejrzyste zarządzanie i dystrybucja środków
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    Mechanizmy zarządzania napędzane przez społeczność
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Możliwości rynkowe</h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">$2.3B</div>
                    <div className="text-gray-600">Światowy rynek crowdfundingu do 2028</div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 Przewaga konkurencyjna</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="font-semibold text-green-800">Przejrzystość blockchain</div>
                    <div className="text-green-700 text-sm">Wszystkie transakcje są publicznie weryfikowalne</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="font-semibold text-blue-800">Niższe opłaty</div>
                    <div className="text-blue-700 text-sm">Zmniejszone koszty pośredników</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="font-semibold text-purple-800">Globalny dostęp</div>
                    <div className="text-purple-700 text-sm">Brak ograniczeń geograficznych</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section id="problem" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">❗</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Problem Statement</h2>
                <p className="text-gray-600">Current challenges in democratic participation and fundraising</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-red-800 mb-4">🏛️ Traditional Democracy Limitations</h3>
                <ul className="space-y-2 text-red-700">
                  <li>• Limited participation mechanisms</li>
                  <li>• Lack of transparency in decision-making</li>
                  <li>• Geographical and time constraints</li>
                  <li>• High barriers to entry for proposals</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-orange-800 mb-4">💸 Centralized Fundraising Issues</h3>
                <ul className="space-y-2 text-orange-700">
                  <li>• High platform fees (5-10%)</li>
                  <li>• Payment processor limitations</li>
                  <li>• Risk of fund mismanagement</li>
                  <li>• Limited global accessibility</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">🔒 Trust and Accountability</h3>
                <ul className="space-y-2 text-yellow-700">
                  <li>• Opaque fund allocation</li>
                  <li>• Limited tracking of outcomes</li>
                  <li>• Centralized control points</li>
                  <li>• Voter manipulation risks</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📈 Market Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-red-600">73%</div>
                  <div className="text-gray-600">of people feel disconnected from political decisions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">$1.2B</div>
                  <div className="text-gray-600">lost annually to crowdfunding platform fees</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-600">45%</div>
                  <div className="text-gray-600">of campaigns fail due to trust issues</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">2.8B</div>
                  <div className="text-gray-600">people lack access to democratic participation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">💡</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Solution</h2>
                <p className="text-gray-600">How PoliDAO addresses current market gaps</p>
              </div>
            </div>

            <div className="mb-12">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">🌐 Decentralized Democratic Platform</h3>
                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                  PoliDAO leverages blockchain technology to create a transparent, accessible, and efficient 
                  platform for democratic participation and community fundraising.
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

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">🔗 Core Platform Features</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Security First</h4>
                  <p className="text-blue-100">Audited smart contracts and secure fund management</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Fast & Efficient</h4>
                  <p className="text-blue-100">Quick transactions and real-time updates</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Globally Accessible</h4>
                  <p className="text-blue-100">Available to anyone with internet access</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="technology" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">⚙️</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Technology Stack</h2>
                <p className="text-gray-600">Blockchain infrastructure and smart contract architecture</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">🔗 Blockchain Layer</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 flex items-center mb-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                      Ethereum Mainnet
                    </h4>
                    <p className="text-gray-600 text-sm">Primary deployment for maximum security and decentralization</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-6">📝 Smart Contracts</h3>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Governance Contract</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Proposal creation and voting</li>
                        <li>• Token-weighted democracy</li>
                        <li>• Result calculation and execution</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Fundraising Contract</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Campaign creation and management</li>
                        <li>• Fund collection and distribution</li>
                        <li>• Refund mechanisms</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Token Contract</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• ERC-20 governance token</li>
                        <li>• Staking and rewards</li>
                        <li>• Voting power calculation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">💻 Technical Architecture</h3>
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

        {/* Tokenomics */}
        <section id="tokenomics" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Tokenomics</h2>
                <p className="text-gray-600">POLI token economics and distribution model</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">🪙 Token Overview</h3>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Token Name:</span>
                      <span className="font-bold text-gray-900">PoliDAO Token</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Symbol:</span>
                      <span className="font-bold text-gray-900">POLI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Supply:</span>
                      <span className="font-bold text-gray-900">1,000,000,000 POLI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Standard:</span>
                      <span className="font-bold text-gray-900">ERC-20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Decimals:</span>
                      <span className="font-bold text-gray-900">18</span>
                    </div>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-gray-900 mt-8 mb-4">🎯 Token Utility</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Governance voting rights
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Platform fee discounts
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Staking rewards
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    Proposal creation requirements
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Token Distribution</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-blue-800">Community & Ecosystem</span>
                      <span className="font-bold text-blue-800">40%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">400M POLI for community rewards and growth</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-purple-800">Team & Advisors</span>
                      <span className="font-bold text-purple-800">20%</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <p className="text-purple-700 text-sm mt-2">200M POLI with 4-year vesting schedule</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-green-800">Public Sale</span>
                      <span className="font-bold text-green-800">25%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <p className="text-green-700 text-sm mt-2">250M POLI for public token sale</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-orange-800">Treasury & Development</span>
                      <span className="font-bold text-orange-800">15%</span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <p className="text-orange-700 text-sm mt-2">150M POLI for platform development</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">💎 Staking & Rewards</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">5-15%</div>
                  <div className="text-yellow-100">Annual Staking Rewards</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">30 Days</div>
                  <div className="text-yellow-100">Minimum Staking Period</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">1:1</div>
                  <div className="text-yellow-100">Voting Power Ratio</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
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
              {/* Q1 2024 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-green-800 mb-2">Q1 2024 - Foundation ✅</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-green-700">
                        <li>✅ Smart contract development</li>
                        <li>✅ Frontend application MVP</li>
                        <li>✅ Initial security audits</li>
                        <li>✅ Community building</li>
                      </ul>
                      <ul className="space-y-2 text-green-700">
                        <li>✅ Testnet deployment</li>
                        <li>✅ Documentation creation</li>
                        <li>✅ Team formation</li>
                        <li>✅ Advisory board setup</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Q2 2024 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🔄</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-blue-800 mb-2">Q2 2024 - Launch Phase 🔄</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-blue-700">
                        <li>🔄 Mainnet deployment</li>
                        <li>🔄 Public beta testing</li>
                        <li>🔄 Token generation event</li>
                        <li>🔄 Exchange listings</li>
                      </ul>
                      <ul className="space-y-2 text-blue-700">
                        <li>🔄 Community governance activation</li>
                        <li>🔄 Partnership announcements</li>
                        <li>🔄 Marketing campaign launch</li>
                        <li>🔄 Bug bounty program</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Q3 2024 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">📋</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-purple-800 mb-2">Q3 2024 - Expansion 📋</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-purple-700">
                        <li>📋 Mobile application development</li>
                        <li>📋 Advanced analytics dashboard</li>
                        <li>📋 Multi-language support</li>
                        <li>📋 API for third-party integrations</li>
                      </ul>
                      <ul className="space-y-2 text-purple-700">
                        <li>📋 Layer 2 scaling solutions</li>
                        <li>📋 Enhanced security features</li>
                        <li>📋 Community governance tools</li>
                        <li>📋 Educational content platform</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Q4 2024 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🚀</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Q4 2024 - Global Scale 🚀</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-orange-700">
                        <li>🚀 Cross-chain compatibility</li>
                        <li>🚀 Enterprise partnerships</li>
                        <li>🚀 Advanced governance mechanisms</li>
                        <li>🚀 Institutional onboarding</li>
                      </ul>
                      <ul className="space-y-2 text-orange-700">
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
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mr-6">
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Team & Advisors</h2>
                <p className="text-gray-600">Meet the team building the future of democratic participation</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">👨‍💻</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Alex Johnson</h3>
                <p className="text-blue-600 font-medium mb-3">Co-Founder & CEO</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Former VP of Engineering at major DeFi protocol. 10+ years in blockchain technology 
                  and democratic governance systems.
                </p>
                <div className="flex justify-center space-x-3 mt-4">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">in</span>
                  </span>
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">𝕏</span>
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">👩‍🔬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sarah Chen</h3>
                <p className="text-green-600 font-medium mb-3">Co-Founder & CTO</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  PhD in Computer Science, former Google researcher. Expert in smart contract security 
                  and scalable blockchain architecture.
                </p>
                <div className="flex justify-center space-x-3 mt-4">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">in</span>
                  </span>
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">𝕏</span>
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">👨‍💼</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Michael Rodriguez</h3>
                <p className="text-purple-600 font-medium mb-3">Head of Operations</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Former McKinsey consultant with expertise in scaling technology platforms. 
                  Led operations for multiple successful fintech startups.
                </p>
                <div className="flex justify-center space-x-3 mt-4">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">in</span>
                  </span>
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">𝕏</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎓 Advisory Board</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Dr. Emily Watson</h4>
                    <p className="text-indigo-600 text-sm">Political Science Professor, Harvard</p>
                    <p className="text-gray-600 text-xs">Democratic governance expert</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">James Thompson</h4>
                    <p className="text-purple-600 text-sm">Partner, Blockchain Legal Group</p>
                    <p className="text-gray-600 text-xs">Regulatory compliance specialist</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Lisa Park</h4>
                    <p className="text-green-600 text-sm">Former CEO, TechCorp</p>
                    <p className="text-gray-600 text-xs">Business strategy and scaling</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Robert Kim</h4>
                    <p className="text-orange-600 text-sm">Security Researcher</p>
                    <p className="text-gray-600 text-xs">Smart contract auditing expert</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Compliance */}
        <section id="legal" className="mb-20">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">⚠️ Important Disclaimers</h3>
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

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Join the Future of Democracy?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of the revolutionary platform that's democratizing governance and fundraising through blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              📄 Download Full White Paper
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/30 transition-all duration-300 border border-white/30">
              🚀 Join Our Community
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}