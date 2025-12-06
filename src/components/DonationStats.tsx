// src/components/DonationStats.tsx
'use client';
import React from 'react';
import type { DonationStats } from '@/hooks/useFundraiserDonations';

interface DonationStatsProps {
  stats: DonationStats;
  tokenSymbol?: string;
  isLoading?: boolean;
}

export function DonationStatsCard({ stats, tokenSymbol = 'USDC', isLoading }: DonationStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Łączna kwota',
      value: stats.totalAmount.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      suffix: tokenSymbol,
      icon: '💰',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Liczba dotacji',
      value: stats.totalCount.toLocaleString('pl-PL'),
      icon: '📊',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Unikalni darczyńcy',
      value: stats.uniqueDonors.toLocaleString('pl-PL'),
      icon: '👥',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Średnia dotacja',
      value: stats.averageDonation.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      suffix: tokenSymbol,
      icon: '📈',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'Maksymalna dotacja',
      value: stats.maxDonation.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      suffix: tokenSymbol,
      icon: '🏆',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Minimalna dotacja',
      value: stats.minDonation > 0 ? stats.minDonation.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) : '0',
      suffix: tokenSymbol,
      icon: '📉',
      color: 'text-gray-600 dark:text-gray-400',
    },
    {
      label: 'Ostatnie 24h',
      value: stats.last24h.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      suffix: tokenSymbol,
      icon: '⏰',
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Ostatnie 7 dni',
      value: stats.last7days.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      suffix: tokenSymbol,
      icon: '📅',
      color: 'text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl">{item.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${item.color} mb-1`}>
            {item.value}
            {item.suffix && (
              <span className="text-sm font-normal ml-1 text-gray-600 dark:text-gray-400">
                {item.suffix}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
