'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Lokalny interfejs Campaign (usuń import z usePoliDao)
interface Campaign {
  campaignId: string;
  targetAmount: bigint;
  raisedAmount: bigint;
  creator: string;
  token: string;
  endTime: bigint;
  isFlexible: boolean;
}

interface CampaignCardProps {
  campaign: Campaign;
  metadata: {
    title: string;
    description: string;
    image: string;
  };
}

// Zastąp formatUnits z ethers własną funkcją
function formatUSDC(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = Number(amount) / Number(divisor);
  return quotient.toFixed(2);
}

export default function CampaignCard({ campaign, metadata }: CampaignCardProps) {
  const raised = parseFloat(formatUSDC(campaign.raisedAmount, 6));
  const target = parseFloat(formatUSDC(campaign.targetAmount, 6));
  const progress = target > 0 ? Math.min((raised / target) * 100, 100) : 0;
  const remaining = Math.max(target - raised, 0);

  return (
    <Link 
      href={`/campaigns/${campaign.campaignId}`} 
      className="block w-full max-w-sm bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative w-full h-60">
        <Image
          src={metadata.image || '/placeholder.jpg'}
          alt={metadata.title}
          fill // Zastąp layout="fill"
          style={{ objectFit: 'cover' }} // Zastąp objectFit="cover"
          className="rounded-t-xl"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-4">
        <h2 className="text-blue-700 font-semibold text-lg leading-tight mb-1">
          <span className="text-red-600 mr-1">❗</span>
          {metadata.title}
        </h2>

        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
          {metadata.description}
        </p>

        <div className="text-green-700 font-bold text-lg">
          {raised.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD', // Zmieniono z PLN na USD dla USDC
          })}{' '}
          <span className="text-sm text-green-600">({progress.toFixed(1)}%)</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-2">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <p className="text-sm text-gray-600">
          Brakuje <span className="font-semibold">
            {remaining.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </p>

        {/* Dodatkowe informacje */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {campaign.isFlexible ? '🔄 Elastyczna' : '🎯 Z celem'}
            </span>
            <span>
              ID: {campaign.campaignId}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Twórca:</span>
            <span className="font-mono">
              {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}