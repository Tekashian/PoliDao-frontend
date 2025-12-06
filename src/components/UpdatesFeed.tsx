// src/components/UpdatesFeed.tsx
'use client';
import React from 'react';
import { formatDistance } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { UpdateRecord } from '@/hooks/useFundraiserUpdates';

interface UpdatesFeedProps {
  updates: UpdateRecord[];
  isLoading?: boolean;
  etherscanBase?: string;
}

export function UpdatesFeed({ 
  updates, 
  isLoading,
  etherscanBase = 'https://sepolia.etherscan.io'
}: UpdatesFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">Brak aktualności</p>
        <p className="text-sm">Ta zbiórka nie ma jeszcze żadnych aktualności</p>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'System';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUpdateTypeIcon = (type: number) => {
    switch (type) {
      case 0: return '📢'; // General
      case 1: return '✅'; // Milestone
      case 2: return '⚠️'; // Alert
      case 3: return '🎉'; // Achievement
      default: return '📝';
    }
  };

  const getUpdateTypeBadge = (type: number) => {
    switch (type) {
      case 0: return { label: 'Ogłoszenie', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 1: return { label: 'Kamień milowy', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 2: return { label: 'Alert', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      case 3: return { label: 'Osiągnięcie', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
      default: return { label: 'Aktualizacja', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    }
  };

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        const typeBadge = getUpdateTypeBadge(update.updateType);
        
        return (
          <div
            key={update.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">
                {getUpdateTypeIcon(update.updateType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>
                  
                  {update.updateId > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      #{update.updateId}
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistance(update.timestamp, new Date(), { 
                      addSuffix: true, 
                      locale: pl 
                    })}
                  </span>
                </div>

                <div className="prose dark:prose-invert prose-sm max-w-none mb-3">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {update.content}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <a
                    href={`${etherscanBase}/address/${update.author}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {formatAddress(update.author)}
                  </a>
                  
                  <span>•</span>
                  
                  <a
                    href={`${etherscanBase}/tx/${update.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                  >
                    <span>Transakcja</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
