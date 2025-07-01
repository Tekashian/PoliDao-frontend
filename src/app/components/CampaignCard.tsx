'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatUnits } from 'ethers';
import { Campaign } from '../hooks/useCrowdfund';

interface CampaignCardProps {
  campaign: Campaign;
  metadata: {
    title: string;
    description: string;
    image: string;
  };
}

export default function CampaignCard({ campaign, metadata }: CampaignCardProps) {
  const raised = parseFloat(formatUnits(campaign.raisedAmount, 6));
  const target = parseFloat(formatUnits(campaign.targetAmount, 6));
  const progress = Math.min((raised / target) * 100, 100).toFixed(2);
  const remaining = Math.max(target - raised, 0).toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  });

  return (
    <Link href={`/campaigns/${campaign.campaignId}`} className="block w-full max-w-sm bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-60">
        <Image
          src={metadata.image || '/placeholder.jpg'}
          alt={metadata.title}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
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
          {raised.toLocaleString('pl-PL', {
            style: 'currency',
            currency: 'PLN',
          })}{' '}
          <span className="text-sm text-green-600">({progress}%)</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-2">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-600">
          Brakuje <span className="font-semibold">{remaining}</span>
        </p>
      </div>
    </Link>
  );
}
