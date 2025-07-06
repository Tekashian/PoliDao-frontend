// src/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import ProposalCard from "./components/ProposalCard";
import CampaignCard from "./components/CampaignCard";
import { useAccount } from 'wagmi';
import { polidaoContractConfig } from './blockchain/contracts';
import { useGetAllFundraisers, useGetAllProposals, type Campaign, type Proposal } from './hooks/usePoliDao';

// Komponent karty propozycji dla zakładki głosowań (mniejszy niż główny ProposalCard)
function MiniProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;
  
  const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (24 * 60 * 60)) / 3600));
  
  const isActive = timeLeft > 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-4">
            {proposal.question}
          </h3>
          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
            isActive 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-800"
          }`}>
            {isActive ? 
              (daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`) : 
              "Zakończone"
            }
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Propozycja #{proposal.id.toString()}
        </p>
      </div>

      <div className="space-y-3">
        {/* Wyniki głosowania */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-600">TAK</span>
            <span className="text-sm font-bold text-green-600">
              {Number(proposal.yesVotes)} ({yesPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-600">NIE</span>
            <span className="text-sm font-bold text-red-600">
              {Number(proposal.noVotes)} ({noPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>Łącznie głosów: {totalVotes}</span>
          <span>Twórca: {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</span>
        </div>

        {isActive ? (
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm">
              Głosuj TAK
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm">
              Głosuj NIE
            </button>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-sm text-gray-500">Głosowanie zakończone</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  // Używaj nowych hooków
  const { 
    campaigns, 
    isLoading: campaignsLoading, 
    error: campaignsError, 
    refetchCampaigns, 
    campaignCount 
  } = useGetAllFundraisers();

  const { 
    proposals, 
    isLoading: proposalsLoading, 
    error: proposalsError, 
    refetchProposals, 
    proposalCount 
  } = useGetAllProposals();

  const [activeTab, setActiveTab] = useState<"zbiorki" | "glosowania">("glosowania");
  const { isConnected } = useAccount();

  // Sprawdź czy są aktywne propozycje
  const hasActiveProposals = proposals && proposals.some((proposal: Proposal) => {
    const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
    return timeLeft > 0;
  });

  // Funkcja do formatowania nazw kampanii na podstawie prawdziwych danych
  const getCampaignMetadata = (campaign: Campaign) => {
    // Sprawdź czy to USDC (6 decimals) czy inny token (18 decimals)
    const isUSDC = campaign.token.toLowerCase() === '0xa0b86a33e6441caacfd336e3b3c5a8e52d4b8b5c' || 
                   campaign.token.toLowerCase().includes('usdc');
    
    const decimals = isUSDC ? 6 : 18;
    const symbol = isUSDC ? 'USDC' : 'tokens';
    const targetAmount = Number(campaign.target) / Math.pow(10, decimals);
    
    return {
      title: campaign.isFlexible ? 
        `Elastyczna zbiórka #${campaign.id}` : 
        `Cel: ${targetAmount.toLocaleString()} ${symbol} (#${campaign.id})`,
      description: campaign.isFlexible ?
        `Elastyczna zbiórka bez określonego celu. Każda kwota pomaga!` :
        `Zbiórka z celem ${targetAmount.toLocaleString()} ${symbol}. Wszystko albo nic!`,
      image: '/images/zbiorka.png',
    };
  };

  // Debug effect - usuń w produkcji
  useEffect(() => {
    console.log('Fundraisers data:', { campaigns, campaignsLoading, campaignsError });
    console.log('Proposals data:', { proposals, proposalsLoading, proposalsError });
  }, [campaigns, campaignsLoading, campaignsError, proposals, proposalsLoading, proposalsError]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* GŁÓWNY HERO BANNER Z INTERAKTYWNYM GŁOSOWANIEM */}
      {/* Pokazuj tylko gdy są aktywne propozycje, albo gdy zakładka głosowania jest wybrana */}
      {(hasActiveProposals || activeTab === "glosowania") && (
        <ProposalCard />
      )}

      {/* TABS */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("glosowania")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "glosowania"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-600"
            }`}
          >
            🗳️ Głosowania ({proposalCount})
          </button>
          <button
            onClick={() => setActiveTab("zbiorki")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "zbiorki"
                ? "border-green-500 text-green-500"
                : "border-transparent text-gray-600"
            }`}
          >
            🎯 Zbiórki ({campaignCount})
          </button>
        </div>

        {/* Informacja o połączeniu */}
        {!isConnected && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-500 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-800">Portfel niepołączony</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Połącz swój portfel, aby móc uczestniczyć w zbiórkach i głosowaniach.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug info dla developera */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <strong>Debug:</strong> Contract: {polidaoContractConfig.address.slice(0, 8)}... | 
            Campaigns: {campaignCount} | Proposals: {proposalCount} |
            Loading: {campaignsLoading || proposalsLoading ? 'Yes' : 'No'}
          </div>
        )}

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "glosowania" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Wszystkie głosowania
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (prawdziwe dane blockchain)
                  </span>
                </h2>
                <button
                  onClick={refetchProposals}
                  disabled={proposalsLoading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    proposalsLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {proposalsLoading ? '⏳ Ładowanie...' : '🔄 Odśwież'}
                </button>
              </div>

              {proposalsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Pobieranie danych z kontraktu...</span>
                </div>
              )}

              {proposalsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <div>
                      <h3 className="font-bold text-red-800">Błąd ładowania propozycji</h3>
                      <p className="text-red-700 text-sm mt-1">{proposalsError.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {!proposalsLoading && !proposalsError && (
                <>
                  {proposals && proposals.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {proposals.map((proposal: Proposal) => (
                        <MiniProposalCard
                          key={proposal.id.toString()}
                          proposal={proposal}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <span className="text-4xl mb-4 block">🗳️</span>
                      <p className="text-gray-500 text-lg">Brak propozycji na kontrakcie</p>
                      <p className="text-gray-400 mt-2">Utwórz pierwszą propozycję, aby zobaczyć ją tutaj!</p>
                      <p className="text-gray-400 text-sm mt-1">Contract: {polidaoContractConfig.address}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "zbiorki" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Zbiórki z kontraktu
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (prawdziwe dane blockchain)
                  </span>
                </h2>
                <button
                  onClick={refetchCampaigns}
                  disabled={campaignsLoading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    campaignsLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  {campaignsLoading ? '⏳ Ładowanie...' : '🔄 Odśwież'}
                </button>
              </div>

              {campaignsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Pobieranie danych z kontraktu...</span>
                </div>
              )}

              {campaignsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <div>
                      <h3 className="font-bold text-red-800">Błąd ładowania kampanii</h3>
                      <p className="text-red-700 text-sm mt-1">{campaignsError.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {!campaignsLoading && !campaignsError && (
                <>
                  {campaigns && campaigns.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {campaigns.map((campaign: Campaign) => {
                        const metadata = getCampaignMetadata(campaign);
                        
                        // Adaptuj strukturę danych dla CampaignCard
                        const adaptedCampaign = {
                          campaignId: campaign.id.toString(),
                          targetAmount: campaign.target,
                          raisedAmount: campaign.raised,
                          creator: campaign.creator,
                          token: campaign.token,
                          endTime: campaign.endTime,
                          isFlexible: campaign.isFlexible,
                        };

                        return (
                          <CampaignCard
                            key={campaign.id.toString()}
                            campaign={adaptedCampaign}
                            metadata={metadata}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <span className="text-4xl mb-4 block">🌱</span>
                      <p className="text-gray-500 text-lg">Brak zbiórek na kontrakcie</p>
                      <p className="text-gray-400 mt-2">Utwórz pierwszą zbiórkę, aby zobaczyć ją tutaj!</p>
                      <p className="text-gray-400 text-sm mt-1">Contract: {polidaoContractConfig.address}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}