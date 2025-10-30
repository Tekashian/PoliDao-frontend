'use client';

import React, { useEffect, useState } from 'react';
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

  const DEFAULT_IMG = '/images/zbiorka.png';
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_IMG);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch campaign image from MongoDB
  useEffect(() => {
    const fetchCampaignImage = async () => {
      try {
        setImageLoading(true);
        console.log('🔍 CampaignCard fetching image for ID:', campaign.campaignId);
        const response = await fetch(`/api/campaigns/${campaign.campaignId}/images`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            console.log('✅ CampaignCard found image:', data.imageUrl);
            setImgSrc(data.imageUrl);
          } else {
            console.log('⚠️ CampaignCard no imageUrl in response');
            setImgSrc(DEFAULT_IMG);
          }
        } else {
          console.log('❌ CampaignCard API response not ok:', response.status);
          setImgSrc(DEFAULT_IMG);
        }
      } catch (error) {
        console.error('❌ CampaignCard error fetching image:', error);
        setImgSrc(DEFAULT_IMG);
      } finally {
        setImageLoading(false);
      }
    };

    if (campaign.campaignId) {
      fetchCampaignImage();
    }
  }, [campaign.campaignId]);

  return (
    <Link 
      href={`/campaigns/${campaign.campaignId}`}
      // group + GPU transform for smooth scale & lift + accessible focus ring
      // make card a fixed-height vertical flex so all cards have equal height
      className="group block w-full max-w-full bg-white rounded-xl shadow-md overflow-hidden transform-gpu transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#10b981]/20 flex flex-col h-[520px]"
      style={{ willChange: 'transform' }}
    >
      {/* proportional image: zmniejszono, żeby opis miał miejsce na ~5 wierszy */}
      <div className="relative w-full h-60"> {/* h-60: dopasowane proporcje obrazek ↔ opis */}
         {imageLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-500 text-sm">Ładowanie...</span>
          </div>
         ) : (
           <Image
             src={imgSrc}
             alt={metadata?.title || `Kampania #${campaign.campaignId}`}
             fill
             style={{ objectFit: 'cover' }}
             // gentle image zoom on parent hover for depth
             className="rounded-t-xl transform-gpu transition-transform duration-500 group-hover:scale-105"
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             onError={() => setImgSrc(DEFAULT_IMG)}
           />
         )}
       </div>

       <div className="p-4 flex flex-col flex-1 overflow-hidden"> {/* flex-1 pozwala wypchnąć footer na dół */}
         <h2 className="text-blue-700 font-semibold text-lg leading-tight mb-1">
           <span className="text-red-600 mr-1">❗</span>
           {metadata.title}
         </h2>

         {/* Stała wysokość bloku opisu + overflow-hidden, z nakładką gradientową */}
         <div className="relative mb-3">
          <div
            className="text-gray-700 text-sm leading-6 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 5,        // limit do 5 wierszy
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {metadata.description}
          </div>
          {/* gradientowa nakładka u dołu, aby uzyskać efekt "zanikania" */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0"
            style={{
              height: '1.8rem', // subtelny gradient nad obciętym 5. wierszem
               background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
             }}
          />
        </div>

        {/* Stały obszar statystyk o stałej wysokości dla wyrównania kart.
            Dla kampanii z celem pokaż procent, pasek i 'Brakuje'.
            Dla kampanii elastycznych pokaż tylko zebrane środki. */}
        <div className="mt-2 h-24 flex flex-col justify-center">
          <div className="text-green-700 font-bold text-lg">
            {raised.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
            {!campaign.isFlexible && (
              <span className="text-sm text-green-600 ml-2">({progress.toFixed(1)}%)</span>
            )}
          </div>

          {/* progress bar + remaining only when campaign has a target */}
          {!campaign.isFlexible ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Brakuje <span className="font-semibold">
                  {remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </p>
            </>
          ) : (
            // utrzymujemy wysokość obszaru; można tu dodać subtelny opis, jeśli chcesz
            <div className="mt-2" aria-hidden />
          )}
        </div>

        {/* Dodatkowe informacje */}
        <div className="mt-auto pt-3 border-t border-gray-100"> {/* mt-auto = footer przylega do dołu karty */}
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

            {/* button zamiast <a> — zapobiega zagnieżdżeniu <a> wewnątrz Link */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // zapobiega propagacji do zewnętrznego Link (nawigacja)
                e.preventDefault();
                const url = `https://etherscan.io/address/${campaign.creator}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="font-mono break-all text-blue-600 hover:underline flex items-center gap-1 bg-transparent border-0 p-0"
              title="Otwórz adres twórcy na Etherscan (otwiera w nowej karcie)"
              aria-label={`Otwórz adres twórcy ${campaign.creator} na Etherscan w nowej karcie`}
            >
              {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
              <span aria-hidden>🔗</span>
            </button>

          </div>
        </div>
      </div>
    </Link>
  );
}