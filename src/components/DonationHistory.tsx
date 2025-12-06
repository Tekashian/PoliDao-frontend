// src/components/DonationHistory.tsx
'use client';
import React from 'react';
import { formatDistance } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { DonationRecord } from '@/hooks/useFundraiserDonations';

interface DonationHistoryProps {
  donations: DonationRecord[];
  isLoading?: boolean;
  tokenSymbol?: string;
  etherscanBase?: string;
}

export function DonationHistory({ 
  donations, 
  isLoading, 
  tokenSymbol = 'USDC',
  etherscanBase = 'https://sepolia.etherscan.io'
}: DonationHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-20"></div>
        ))}
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg font-medium">Brak dotacji</p>
        <p className="text-sm">Ta zbiórka jeszcze nie otrzymała żadnych dotacji</p>
      </div>
    );
  }

  const formatDonor = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-3">
      {donations.map((donation) => (
        <div 
          key={donation.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <a
                  href={`${etherscanBase}/address/${donation.donor}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {formatDonor(donation.donor)}
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistance(donation.timestamp, new Date(), { 
                    addSuffix: true, 
                    locale: pl 
                  })}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {donation.amountFormatted.toLocaleString('pl-PL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {tokenSymbol}
                </span>
              </div>

              {donation.netAmountFormatted !== donation.amountFormatted && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Netto: {donation.netAmountFormatted.toLocaleString('pl-PL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {tokenSymbol}
                  <span className="ml-1">
                    (prowizja: {(donation.amountFormatted - donation.netAmountFormatted).toFixed(2)})
                  </span>
                </div>
              )}
            </div>

            <a
              href={`${etherscanBase}/tx/${donation.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Zobacz transakcję"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
