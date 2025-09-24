// src/app/account/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGetAllProposals } from '../../hooks/usePoliDao';
import { useFundraisersModular } from '../../hooks/useFundraisersModular';

interface Fundraiser {
  id: bigint;
  creator: string;
  token: string;
  target: bigint;
  raised: bigint;
  endTime: bigint;
  isFlexible: boolean;
}

interface Proposal {
  id: bigint;
  question: string;
  yesVotes: bigint;
  noVotes: bigint;
  endTime: bigint;
  creator: string;
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'fundraisers' | 'proposals'>('fundraisers');

  // Używaj istniejących hooków
  const { 
    fundraisers: campaigns, 
    isLoading: campaignsLoading, 
    error: campaignsError 
  } = useFundraisersModular();

  const { 
    proposals, 
    isLoading: proposalsLoading, 
    error: proposalsError 
  } = useGetAllProposals();

  // Filtruj kampanie użytkownika
  const userFundraisers = campaigns?.filter(campaign => 
    campaign.creator.toLowerCase() === address?.toLowerCase()
  ) || [];

  // Filtruj propozycje użytkownika  
  const userProposals = proposals?.filter(proposal => 
    proposal.creator.toLowerCase() === address?.toLowerCase()
  ) || [];

  // Symulacja uprawnień (użyj prawdziwego hooka gdy będzie dostępny)
  const canPropose = true; // Zastąp właściwym hookiem

  // Funkcja do formatowania tokena
  const formatTokenAmount = (amount: bigint, token: string) => {
    const isUSDC = token.toLowerCase().includes('usdc');
    const decimals = isUSDC ? 6 : 18;
    const divisor = BigInt(10 ** decimals);
    const formatted = Number(amount) / Number(divisor);
    const symbol = isUSDC ? 'USDC' : 'ETH';
    return `${formatted.toLocaleString()} ${symbol}`;
  };

  // Funkcja do obliczania czasu pozostałego
  const getTimeLeft = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return { text: "Zakończone", isActive: false };
    
    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / 3600);
    
    if (days > 0) {
      return { text: `${days}d ${hours}h`, isActive: true };
    } else {
      return { text: `${hours}h`, isActive: true };
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-12 text-center max-w-md mx-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Portfel niepołączony</h2>
            <p className="text-gray-600 mb-8">
              Aby zobaczyć swoje konto, musisz najpierw połączyć portfel.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105">
              Połącz portfel
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const loading = campaignsLoading || proposalsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-2xl font-bold">
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  👤 Moje Konto
                </h1>
                <p className="text-gray-600 text-lg font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">Portfel połączony</span>
                  </div>
                  {canPropose && (
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">Uprawnienia do głosowania</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{userFundraisers.length}</h3>
            <p className="text-gray-600">Moje zbiórki</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗳️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{userProposals.length}</h3>
            <p className="text-gray-600">Moje propozycje</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{canPropose ? "✅" : "❌"}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {canPropose ? "Tak" : "Nie"}
            </h3>
            <p className="text-gray-600">Uprawnienia głosowania</p>
          </div>
        </div>
      </div>

      {/* Error States */}
      {(campaignsError || proposalsError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center">
              <span className="text-red-500 text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-bold text-red-800">Błąd ładowania danych</h3>
                <p className="text-red-700 text-sm mt-1">
                  {campaignsError?.message || proposalsError?.message || 'Nie można połączyć się z kontraktem'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-lg rounded-t-3xl shadow-xl border border-white/20 border-b-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('fundraisers')}
              className={`flex-1 py-6 px-8 text-lg font-semibold transition-all duration-200 ${
                activeTab === 'fundraisers'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tl-3xl'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              🎯 Moje zbiórki ({userFundraisers.length})
            </button>
            {canPropose && (
              <button
                onClick={() => setActiveTab('proposals')}
                className={`flex-1 py-6 px-8 text-lg font-semibold transition-all duration-200 ${
                  activeTab === 'proposals'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-3xl'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                🗳️ Moje propozycje ({userProposals.length})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/70 backdrop-blur-lg rounded-b-3xl shadow-xl border border-white/20 border-t-0 p-8">
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-lg">Ładowanie danych z blockchain...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Fundraisers Tab */}
              {activeTab === 'fundraisers' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">🎯 Moje zbiórki</h2>
                    <a 
                      href="/create-campaign"
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-block"
                    >
                      ➕ Utwórz zbiórkę
                    </a>
                  </div>

                  {userFundraisers.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {userFundraisers.map((fundraiser) => {
                        const timeLeft = getTimeLeft(fundraiser.endDate ?? 0n);
                        const progress = fundraiser.isFlexible 
                          ? 0 
                          : (Number(fundraiser.raisedAmount ?? 0n) / Math.max(Number(fundraiser.goalAmount ?? 0n), 1)) * 100;

                        return (
                          <div key={fundraiser.id.toString()} className="bg-white/60 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold text-gray-900">
                                {fundraiser.isFlexible ? "🌊 Kampania" : "🎯 Zbiórka"} #{fundraiser.id.toString()}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                timeLeft.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {timeLeft.text}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-600">Zebrano:</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {formatTokenAmount(fundraiser.raisedAmount ?? 0n, fundraiser.token)}
                                </p>
                              </div>

                              {!fundraiser.isFlexible && (
                                <div>
                                  <p className="text-sm text-gray-600">Cel:</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatTokenAmount(fundraiser.goalAmount ?? 0n, fundraiser.token)}
                                  </p>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{progress.toFixed(1)}% celu</p>
                                </div>
                              )}

                              <div className="flex space-x-3 pt-4">
                                <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-xl transition-colors">
                                  📊 Szczegóły
                                </button>
                                {timeLeft.isActive && (
                                  <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-xl transition-colors">
                                    💰 Wypłać
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎯</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Brak zbiórek</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Nie utworzyłeś jeszcze żadnych zbiórek. Rozpocznij swoją pierwszą kampanię już dziś!
                      </p>
                      <a 
                        href="/create-campaign"
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-block"
                      >
                        🚀 Utwórz pierwszą zbiórkę
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Proposals Tab */}
              {activeTab === 'proposals' && canPropose && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">🗳️ Moje propozycje</h2>
                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105">
                      ➕ Utwórz propozycję
                    </button>
                  </div>

                  {userProposals.length > 0 ? (
                    <div className="space-y-6">
                      {userProposals.map((proposal) => {
                        const timeLeft = getTimeLeft(proposal.endTime);
                        const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
                        const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
                        const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;

                        return (
                          <div key={proposal.id.toString()} className="bg-white/60 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  🗳️ Propozycja #{proposal.id.toString()}
                                </h3>
                                <p className="text-gray-700 text-lg">{proposal.question}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                                timeLeft.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {timeLeft.text}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-sm text-gray-600 mb-2">Wyniki głosowania:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-green-700 font-medium">✅ TAK</span>
                                    <span className="text-green-700 font-bold">
                                      {proposal.yesVotes.toString()} ({yesPercentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${yesPercentage}%` }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-2 mt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-red-700 font-medium">❌ NIE</span>
                                    <span className="text-red-700 font-bold">
                                      {proposal.noVotes.toString()} ({noPercentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${noPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
                                  <p className="text-gray-600">Łączne głosy</p>
                                  <button className="mt-4 bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-6 rounded-xl transition-colors">
                                    📊 Szczegóły
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🗳️</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Brak propozycji</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Nie utworzyłeś jeszcze żadnych propozycji do głosowania. Zaproponuj pierwszy temat do dyskusji!
                      </p>
                      <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105">
                        🚀 Utwórz pierwszą propozycję
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Message for users without proposal rights */}
              {!canPropose && (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Brak uprawnień do głosowania</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Obecnie nie masz uprawnień do tworzenia propozycji głosowania. 
                    Skontaktuj się z administratorami DAO, aby uzyskać dostęp.
                  </p>
                  <a 
                    href="/contact"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-block"
                  >
                    📧 Skontaktuj się z nami
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}