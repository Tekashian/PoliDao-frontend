// src/app/page.tsx
"use client";

import React, { useState } from "react";
import Header from "./components/Header";
import Hero3D from "./components/Hero3D";
import HeroWithForm from "./components/HeroWithForm";
import { useGetAllCampaigns, Campaign } from "./hooks/usePoliDao";
import { useAccount, useReadContracts } from 'wagmi';
import { polidaoContractConfig } from './blockchain/contracts';
import { sepolia } from '@reown/appkit/networks';

// Komponent do testowania połączenia z kontraktem
function ContractConnectionTest() {
  const { address, isConnected, chain } = useAccount();

  // Test podstawowych funkcji kontraktu
  const { data: contractData, error, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: polidaoContractConfig.address,
        abi: polidaoContractConfig.abi,
        functionName: 'owner',
        chainId: sepolia.id,
      },
      {
        address: polidaoContractConfig.address,
        abi: polidaoContractConfig.abi,
        functionName: 'getFundraiserCount',
        chainId: sepolia.id,
      },
      {
        address: polidaoContractConfig.address,
        abi: polidaoContractConfig.abi,
        functionName: 'getWhitelistedTokens',
        chainId: sepolia.id,
      },
      {
        address: polidaoContractConfig.address,
        abi: polidaoContractConfig.abi,
        functionName: 'successCommission',
        chainId: sepolia.id,
      },
    ],
  });

  const [ownerResult, countResult, tokensResult, commissionResult] = contractData || [];

  const owner = ownerResult?.result as string;
  const fundraiserCount = countResult?.result as bigint;
  const whitelistedTokens = tokensResult?.result as string[];
  const successCommission = commissionResult?.result as bigint;

  const hasErrors = ownerResult?.error || countResult?.error || tokensResult?.error || commissionResult?.error;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 m-4 border-l-4 border-blue-500">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">🔍</span>
        <h2 className="text-2xl font-bold text-gray-800">Test połączenia z kontraktem</h2>
      </div>

      {/* Status Wallet */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-2">👛 Status portfela</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Połączenie:</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '✅ Połączony' : '❌ Niepołączony'}
            </span>
          </div>
          {isConnected && (
            <>
              <div className="flex justify-between">
                <span>Adres:</span>
                <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sieć:</span>
                <span className="font-medium text-blue-600">
                  {chain?.name} (ID: {chain?.id})
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status kontraktu */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-2">📜 Status kontraktu</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Adres:</span>
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
              {polidaoContractConfig.address.slice(0, 6)}...{polidaoContractConfig.address.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Sieć:</span>
            <span className="font-medium text-blue-600">Sepolia Testnet</span>
          </div>
        </div>
      </div>

      {/* Wyniki testów */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Testowanie połączenia...</span>
          </div>
        )}

        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-800 mb-2">❌ Błędy połączenia</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {ownerResult?.error && <li>• Owner: {ownerResult.error.message}</li>}
              {countResult?.error && <li>• Count: {countResult.error.message}</li>}
              {tokensResult?.error && <li>• Tokens: {tokensResult.error.message}</li>}
              {commissionResult?.error && <li>• Commission: {commissionResult.error.message}</li>}
            </ul>
          </div>
        )}

        {!isLoading && !hasErrors && contractData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-800 mb-3">✅ Kontrakt działa poprawnie!</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-gray-700">Owner kontraktu</div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  {owner?.slice(0, 10)}...{owner?.slice(-6)}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-gray-700">Liczba fundraiserów</div>
                <div className="text-lg font-bold text-blue-600">
                  {fundraiserCount ? Number(fundraiserCount) : 0}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-gray-700">Akceptowane tokeny</div>
                <div className="text-lg font-bold text-green-600">
                  {whitelistedTokens ? whitelistedTokens.length : 0} tokenów
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-gray-700">Komisja sukcesu</div>
                <div className="text-lg font-bold text-purple-600">
                  {successCommission ? `${Number(successCommission)} bps` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Przycisk refresh */}
      <div className="mt-6 text-center">
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg transition-colors ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isLoading ? '⏳ Testowanie...' : '🔄 Ponów test'}
        </button>
      </div>

      {/* Wskazówki */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-bold text-yellow-800 mb-2">💡 Wskazówki</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Upewnij się, że jesteś na sieci Sepolia</li>
          <li>• Sprawdź czy adres kontraktu jest prawidłowy</li>
          <li>• Kontrakt musi być wdrożony na blockchain</li>
          <li>• ABI musi być zgodne z kontraktem</li>
        </ul>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { campaigns, isLoading, error, refetchCampaigns } = useGetAllCampaigns();
  const [activeTab, setActiveTab] = useState<"zbiorki" | "glosowania" | "test">("test");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* HERO BANNER + FORM */}
      <div className="relative w-full aspect-[1920/800] overflow-hidden">
        <Hero3D />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <HeroWithForm />
        </div>
      </div>

      {/* TABS */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("test")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "test"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-600"
            }`}
          >
            🔍 Test kontraktu
          </button>
          <button
            onClick={() => setActiveTab("zbiorki")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "zbiorki"
                ? "border-green-500 text-green-500"
                : "border-transparent text-gray-600"
            }`}
          >
            Zbiórki ({campaigns?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("glosowania")}
            className={`py-2 px-4 -mb-px border-b-2 font-medium ${
              activeTab === "glosowania"
                ? "border-green-500 text-green-500"
                : "border-transparent text-gray-600"
            }`}
          >
            Głosowania
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "test" && (
            <ContractConnectionTest />
          )}

          {activeTab === "zbiorki" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Aktywne zbiórki</h2>
                <button
                  onClick={refetchCampaigns}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  🔄 Odśwież
                </button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Ładowanie kampanii...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <div>
                      <h3 className="font-bold text-red-800">Błąd ładowania kampanii</h3>
                      <p className="text-red-700 text-sm mt-1">{error.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && !error && (
                <>
                  {campaigns && campaigns.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {campaigns.map((c: Campaign) => (
                        <div
                          key={c.id}
                          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                        >
                          <div className="mb-4">
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">
                              Kampania #{c.id}
                            </h3>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              c.isFlexible 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {c.isFlexible ? "Elastyczna" : "Z celem"}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Twórca:</span>
                              <span className="font-mono text-xs">
                                {c.creator.slice(0, 6)}...{c.creator.slice(-4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Token:</span>
                              <span className="font-mono text-xs">
                                {c.token.slice(0, 6)}...{c.token.slice(-4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cel:</span>
                              <span className="font-semibold">
                                {c.target > 0 
                                  ? `${(Number(c.target) / 1e6).toLocaleString()} USDC`
                                  : "Bez limitu"
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Zebrano:</span>
                              <span className="font-semibold text-green-600">
                                {(Number(c.raised) / 1e6).toLocaleString()} USDC
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Zakończenie:</span>
                              <span className="text-sm">
                                {new Date(Number(c.endTime) * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {c.target > 0 && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Postęp</span>
                                <span>{Math.min((Number(c.raised) / Number(c.target)) * 100, 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((Number(c.raised) / Number(c.target)) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors">
                            Zobacz szczegóły
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <span className="text-4xl mb-4 block">🌱</span>
                      <p className="text-gray-500 text-lg">Brak aktywnych zbiórek</p>
                      <p className="text-gray-400 mt-2">Utwórz pierwszą zbiórkę powyżej!</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "glosowania" && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <span className="text-4xl mb-4 block">🗳️</span>
              <p className="text-gray-500 text-lg">
                Zakładka głosowania w przygotowaniu
              </p>
              <p className="text-gray-400 mt-2">
                Potrzebny hook do pobrania propozycji („getAllProposals")
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}