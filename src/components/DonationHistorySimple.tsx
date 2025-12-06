// src/components/DonationHistorySimple.tsx
import React from 'react';
import { Donation } from '@/hooks/useDonationHistory';

interface DonationHistorySimpleProps {
  donations: Donation[];
  isLoading: boolean;
}

export function DonationHistorySimple({ donations, isLoading }: DonationHistorySimpleProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-md shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1F4E79] mb-4">Historia wpłat</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1F4E79] mb-4">Historia wpłat</h2>
        <p className="text-sm text-gray-500 text-center py-8">
          Brak wpłat do wyświetlenia
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-[#1F4E79]">Historia wpłat</h2>
        <p className="text-xs text-gray-500 mt-1">
          Ostatnie {donations.length} wpłat (odświeża się co 15s)
        </p>
      </div>
      
      <ul className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
        {donations.map((donation, idx) => (
          <li key={`${donation.txHash}-${idx}`} className="flex justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <a
                href={`https://sepolia.etherscan.io/address/${donation.donor}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                title={donation.donor}
              >
                {donation.donor.slice(0, 6)}...{donation.donor.slice(-4)}
              </a>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(donation.timestamp).toLocaleString('pl-PL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <p className="text-sm font-semibold text-green-600">
                {Number(donation.netAmount).toFixed(2)} USDC
              </p>
              {donation.amount !== donation.netAmount && (
                <p className="text-xs text-gray-400">
                  brutto: {Number(donation.amount).toFixed(2)}
                </p>
              )}
              {donation.txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${donation.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1"
                >
                  TX ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
