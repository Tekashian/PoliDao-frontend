// src/components/TopDonors.tsx
'use client';
import React from 'react';
import type { DonorInfo } from '@/hooks/useFundraiserDonors';

interface TopDonorsProps {
  donors: DonorInfo[];
  tokenSymbol?: string;
  isLoading?: boolean;
  etherscanBase?: string;
}

export function TopDonors({ 
  donors, 
  tokenSymbol = 'USDC', 
  isLoading,
  etherscanBase = 'https://sepolia.etherscan.io'
}: TopDonorsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-16"></div>
        ))}
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Brak darczyńców</p>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getMedalEmoji = (rank?: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-2">
      {donors.slice(0, 10).map((donor, index) => (
        <div
          key={donor.address}
          className={`
            flex items-center justify-between p-3 rounded-lg
            ${index < 3 
              ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' 
              : 'bg-gray-50 dark:bg-gray-800/50'
            }
            border border-gray-200 dark:border-gray-700
            hover:shadow-md transition-shadow
          `}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`
              text-xl font-bold
              ${index < 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}
            `}>
              {getMedalEmoji(donor.rank || index + 1)}
            </div>
            
            <div className="flex-1">
              <a
                href={`${etherscanBase}/address/${donor.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {formatAddress(donor.address)}
              </a>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {donor.donationCount} {donor.donationCount === 1 ? 'dotacja' : 'dotacje'}
                </span>
                <span>•</span>
                <span>
                  śr. {donor.averageDonation.toLocaleString('pl-PL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} {tokenSymbol}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`
              text-lg font-bold
              ${index < 3 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-700 dark:text-gray-300'
              }
            `}>
              {donor.totalAmountFormatted.toLocaleString('pl-PL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {tokenSymbol}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
