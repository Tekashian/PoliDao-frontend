"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { POLIDAO_ABI } from "../blockchain/poliDaoAbi";
import { polidaoContractConfig } from "../blockchain/contracts";
import { useGetAllProposals, type Proposal } from '../hooks/usePoliDao';
import Hero3D from "./Hero3D";

export default function ProposalCard() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // States
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [vote, setVote] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Hook do pobierania propozycji
  const { 
    proposals, 
    isLoading: proposalsLoading, 
    error: proposalsError, 
    refetchProposals 
  } = useGetAllProposals();

  // Dodatkowe dane dla wybranej propozycji
  const { data: proposalDetails, refetch: refetchProposalDetails } = useReadContract({
    address: polidaoContractConfig.address,
    abi: POLIDAO_ABI,
    functionName: "getProposal",
    args: selectedProposal !== null ? [BigInt(selectedProposal)] : undefined,
  });

  const { data: hasUserVoted } = useReadContract({
    address: polidaoContractConfig.address,
    abi: POLIDAO_ABI,
    functionName: "hasVoted",
    args: selectedProposal !== null && address ? [BigInt(selectedProposal), address] : undefined,
  });

  // proposalSummary usunięte – korzystamy z selectedProposalData (hook + getProposal)

  // Automatyczne wybieranie pierwszej aktywnej propozycji
  useEffect(() => {
    if (proposals && proposals.length > 0 && selectedProposal === null) {
      // Znajdź pierwszą aktywną propozycję
      const activeProposal = proposals.find((proposal: Proposal) => {
        const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
        return timeLeft > 0;
      });

      if (activeProposal) {
        setSelectedProposal(Number(activeProposal.id));
      } else {
        // Jeśli brak aktywnych, wybierz pierwszą
        setSelectedProposal(Number(proposals[0].id));
      }
    }
  }, [proposals, selectedProposal]);

  // Pobierz dane wybranej propozycji
  const selectedProposalData = proposals?.find(p => Number(p.id) === selectedProposal);
  const isCurrentProposalActive = selectedProposalData ? 
    (Number(selectedProposalData.endTime) - Math.floor(Date.now() / 1000)) > 0 : false;

  // Funkcja głosowania
  const handleVote = async () => {
    if (!address) {
      setError("Podłącz portfel aby głosować");
      return;
    }

    if (selectedProposal === null || vote === null) {
      setError("Wybierz opcję głosowania");
      return;
    }

    if (hasUserVoted) {
      setError("Już zagłosowałeś w tej propozycji");
      return;
    }

    if (!isCurrentProposalActive) {
      setError("To głosowanie zostało zakończone");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const txHash = await writeContractAsync({
        address: polidaoContractConfig.address,
        abi: POLIDAO_ABI,
        functionName: "vote",
        args: [BigInt(selectedProposal), vote],
      });

      setSuccess(`Głos oddany pomyślnie! Hash: ${txHash.slice(0, 10)}...`);
      setShowResults(true);
      
      // Odśwież dane
      setTimeout(() => {
        refetchProposalDetails();
        refetchProposals();
        setVote(null);
        setSuccess("");
      }, 3000);

    } catch (err: any) {
      console.error("Error voting:", err);
      setError(err.message || "Błąd podczas głosowania");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset vote when proposal changes
  useEffect(() => {
    setVote(null);
    setShowResults(false);
    setError("");
    setSuccess("");
  }, [selectedProposal]);

  // Format time left
  const formatTimeLeft = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    
    if (timeLeft <= 0) return "Zakończone";
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate vote percentage
  const getVotePercentage = (votes: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return Number((votes * 100n) / total);
  };

  const totalVotes = selectedProposalData ? selectedProposalData.yesVotes + selectedProposalData.noVotes : 0n;
  const timeLeft = selectedProposalData ? formatTimeLeft(selectedProposalData.endTime) : "";
  const isActive = timeLeft !== "Zakończone";

  return (
    <div className="min-h-screen relative">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <Hero3D />
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        
        {/* Error & Success Messages */}
        {error && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full">
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg shadow-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full">
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-r-lg shadow-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {proposalsLoading && (
          <div className="bg-white/95 backdrop-blur-lg px-8 py-12 rounded-3xl shadow-xl border border-white/20 max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ładowanie głosowań</h3>
              <p className="text-gray-600">Pobieramy dane z blockchain...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {proposalsError && (
          <div className="bg-white/95 backdrop-blur-lg px-8 py-12 rounded-3xl shadow-xl border border-white/20 max-w-md">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Błąd ładowania</h3>
              <p className="text-gray-600 mb-4">{proposalsError.message}</p>
              <button
                onClick={refetchProposals}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                🔄 Spróbuj ponownie
              </button>
            </div>
          </div>
        )}

        {/* No Proposals */}
        {!proposalsLoading && !proposalsError && (!proposals || proposals.length === 0) && (
          <div className="bg-white/95 backdrop-blur-lg px-8 py-12 rounded-3xl shadow-xl border border-white/20 max-w-md">
            <div className="text-center">
              <div className="text-6xl mb-4">🗳️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Brak propozycji</h3>
              <p className="text-gray-600">Obecnie nie ma żadnych propozycji do głosowania.</p>
            </div>
          </div>
        )}

        {/* Main Proposal Card */}
        {!proposalsLoading && !proposalsError && selectedProposalData && (
          <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            
            {/* Header z pytaniem */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 border-b border-blue-100">
              <div className="text-center space-y-3">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {isActive ? `🟢 AKTYWNE - ${timeLeft}` : '🔴 ZAKOŃCZONE'}
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-gray-800 text-lg leading-relaxed font-semibold">{selectedProposalData.question}</h2>
                  <p className="text-gray-500 text-sm mt-2">Propozycja #{selectedProposal}</p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              
              {/* Voting Interface - gdy aktywne i nie głosowano */}
              {isActive && !hasUserVoted && !showResults && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Oddaj swój głos</h3>
                    <p className="text-gray-600">Wybierz jedną z opcji poniżej</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Opcja TAK */}
                    <div
                      onClick={() => setVote(true)}
                      className={`
                        group relative p-8 rounded-2xl border-2 cursor-pointer select-none
                        transition-all duration-300 ease-in-out transform-gpu
                        ${vote === true 
                          ? 'bg-green-500 border-green-400 text-white scale-105 shadow-xl -rotate-1' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:scale-110 hover:-rotate-1 hover:shadow-2xl'
                        }
                      `}
                    >
                      <div className="text-center space-y-3 relative z-10">
                        <div 
                          className={`text-6xl transition-all duration-300 ease-in-out transform-gpu
                            ${vote === true 
                              ? 'text-white scale-110' 
                              : 'text-gray-300 group-hover:text-green-500 group-hover:scale-125'
                            }`}
                        >
                          ✓
                        </div>
                        <div className={`font-bold text-2xl transition-all duration-300 ${
                          vote === true ? 'text-white' : 'text-gray-800'
                        }`}>
                          TAK
                        </div>
                        <div className={`text-sm transition-all duration-300 ${
                          vote === true ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          Popieram tę propozycję
                        </div>
                      </div>
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/0 via-green-500/0 to-green-400/0 group-hover:from-green-400/20 group-hover:via-green-500/30 group-hover:to-green-400/20 transition-all duration-300 pointer-events-none"></div>
                      
                      {/* Selected glow effect */}
                      {vote === true && (
                        <div className="absolute inset-0 rounded-2xl bg-green-400/20 animate-pulse pointer-events-none"></div>
                      )}
                    </div>

                    {/* Opcja NIE */}
                    <div
                      onClick={() => setVote(false)}
                      className={`
                        group relative p-8 rounded-2xl border-2 cursor-pointer select-none
                        transition-all duration-300 ease-in-out transform-gpu
                        ${vote === false 
                          ? 'bg-red-500 border-red-400 text-white scale-105 shadow-xl rotate-1' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:scale-110 hover:rotate-1 hover:shadow-2xl'
                        }
                      `}
                    >
                      <div className="text-center space-y-3 relative z-10">
                        <div 
                          className={`text-6xl transition-all duration-300 ease-in-out transform-gpu
                            ${vote === false 
                              ? 'text-white scale-110' 
                              : 'text-gray-300 group-hover:text-red-500 group-hover:scale-125'
                            }`}
                        >
                          ✗
                        </div>
                        <div className={`font-bold text-2xl transition-all duration-300 ${
                          vote === false ? 'text-white' : 'text-gray-800'
                        }`}>
                          NIE
                        </div>
                        <div className={`text-sm transition-all duration-300 ${
                          vote === false ? 'text-red-100' : 'text-gray-500'
                        }`}>
                          Odrzucam tę propozycję
                        </div>
                      </div>
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/0 via-red-500/0 to-red-400/0 group-hover:from-red-400/20 group-hover:via-red-500/30 group-hover:to-red-400/20 transition-all duration-300 pointer-events-none"></div>
                      
                      {/* Selected glow effect */}
                      {vote === false && (
                        <div className="absolute inset-0 rounded-2xl bg-red-400/20 animate-pulse pointer-events-none"></div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  {vote !== null && (
                    <button
                      onClick={handleVote}
                      disabled={submitting || !address}
                      className={`
                        w-full py-4 rounded-2xl font-bold text-lg 
                        transition-all duration-300 ease-in-out transform-gpu
                        ${submitting || !address
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                          : vote === true
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:scale-105 hover:shadow-xl"
                            : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:scale-105 hover:shadow-xl"
                        }
                      `}
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center space-x-3">
                          <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Przetwarzanie głosu...</span>
                        </div>
                      ) : !address ? (
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-2xl">🔗</span>
                          <span>Podłącz portfel aby głosować</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-2xl">🗳️</span>
                          <span>Zagłosuj {vote ? "TAK" : "NIE"}</span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Komunikat o oddanym głosie */}
              {hasUserVoted && !showResults && (
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-100 border-2 border-emerald-200 py-8 rounded-2xl">
                    <div className="flex items-center justify-center text-emerald-700 mb-4">
                      <svg className="w-12 h-12 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-bold text-2xl">Głos zapisany!</h3>
                        <p className="text-emerald-600 mt-1">Twój głos został pomyślnie dodany do blockchain</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowResults(true)}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors transform-gpu hover:scale-105"
                    >
                      📊 Zobacz wyniki głosowania
                    </button>
                  </div>
                </div>
              )}

              {/* Wyniki głosowania */}
              {showResults && selectedProposalData && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Wyniki głosowania</h3>
                    <p className="text-gray-600">Łączna liczba głosów: {Number(totalVotes)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Wyniki TAK */}
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200 hover:scale-105 transition-transform duration-300">
                      <div className="text-center space-y-3">
                        <div className="text-4xl text-green-500">✓</div>
                        <div className="font-bold text-xl text-green-700">TAK</div>
                        <div className="space-y-1">
                          <div className="text-3xl font-bold text-green-600">{Number(selectedProposalData.yesVotes)}</div>
                          <div className="text-lg text-green-600">{getVotePercentage(selectedProposalData.yesVotes, totalVotes).toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${getVotePercentage(selectedProposalData.yesVotes, totalVotes)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Wyniki NIE */}
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-200 hover:scale-105 transition-transform duration-300">
                      <div className="text-center space-y-3">
                        <div className="text-4xl text-red-500">✗</div>
                        <div className="font-bold text-xl text-red-700">NIE</div>
                        <div className="space-y-1">
                          <div className="text-3xl font-bold text-red-600">{Number(selectedProposalData.noVotes)}</div>
                          <div className="text-lg text-red-600">{getVotePercentage(selectedProposalData.noVotes, totalVotes).toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${getVotePercentage(selectedProposalData.noVotes, totalVotes)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status głosowania */}
                  <div className="text-center bg-gray-50 p-4 rounded-xl">
                    <div className="inline-flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {isActive ? `Głosowanie aktywne - pozostało ${timeLeft}` : 'Głosowanie zakończone'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gdy głosowanie nieaktywne */}
              {!isActive && (
                <div className="text-center py-8">
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                    <div className="text-6xl mb-4">⏰</div>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">Głosowanie zakończone</h3>
                    <p className="text-gray-500">To głosowanie zostało już zakończone. Zobacz wyniki w zakładce Głosowania.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation for multiple proposals */}
        {proposals && proposals.length > 1 && selectedProposalData && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white/90 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-lg border border-white/20 flex items-center space-x-4">
              <span className="text-gray-600 font-medium">Propozycja:</span>
              <div className="flex space-x-2">
                {proposals.map((proposal: Proposal) => {
                  const isActiveProposal = (Number(proposal.endTime) - Math.floor(Date.now() / 1000)) > 0;
                  const isSelected = Number(proposal.id) === selectedProposal;
                  
                  return (
                    <button
                      key={proposal.id.toString()}
                      onClick={() => setSelectedProposal(Number(proposal.id))}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${isSelected 
                          ? (isActiveProposal ? 'bg-green-500 text-white shadow-md' : 'bg-gray-500 text-white shadow-md')
                          : (isActiveProposal ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                        }
                      `}
                    >
                      #{Number(proposal.id)}
                      {isActiveProposal && <span className="ml-1">🟢</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}