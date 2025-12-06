// src/hooks/useFundraiserDonors.ts
import { useEffect, useState, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { keccak256, toUtf8Bytes, formatUnits } from 'ethers';
import { poliDaoAnalyticsAbi } from '@/blockchain/analyticsAbi';
import { poliDaoStorageAbi } from '@/blockchain/storageAbi';
import { STORAGE_ADDRESS } from '@/blockchain/contracts';
import type { DonationRecord } from './useFundraiserDonations';

const ANALYTICS_KEY = keccak256(toUtf8Bytes('ANALYTICS')) as `0x${string}`;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export interface DonorInfo {
  address: string;
  totalAmount: bigint;
  totalAmountFormatted: number;
  donationCount: number;
  firstDonation: number; // timestamp
  lastDonation: number; // timestamp
  averageDonation: number;
  isTopDonor: boolean;
  rank?: number;
}

interface UseFundraiserDonorsOptions {
  fundraiserId: number | null;
  donations?: DonationRecord[]; // Can optionally provide pre-fetched donations
  limit?: number;
  decimals?: number;
  enabled?: boolean;
}

interface UseFundraiserDonorsResult {
  donors: DonorInfo[];
  topDonors: DonorInfo[];
  donorsCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Professional hook for managing fundraiser donors data
 * Combines Analytics contract calls with event-based donation history
 */
export function useFundraiserDonors({
  fundraiserId,
  donations = [],
  limit = 50,
  decimals = 6,
  enabled = true,
}: UseFundraiserDonorsOptions): UseFundraiserDonorsResult {
  const [isLoading, setIsLoading] = useState(true);

  // Get Analytics module address
  const { data: analyticsAddress } = useReadContract({
    address: STORAGE_ADDRESS,
    abi: poliDaoStorageAbi,
    functionName: 'modules',
    args: [ANALYTICS_KEY],
    chainId: sepolia.id,
  });

  const analyticsResolved = analyticsAddress && analyticsAddress !== ZERO_ADDR 
    ? analyticsAddress 
    : null;

  // Get donors count from Analytics
  const { 
    data: donorsCountData, 
    isLoading: isCountLoading,
    refetch: refetchCount 
  } = useReadContract({
    address: analyticsResolved || undefined,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonorsCount',
    args: fundraiserId !== null && fundraiserId >= 0 ? [BigInt(fundraiserId)] : undefined,
    chainId: sepolia.id,
    query: { 
      enabled: !!analyticsResolved && enabled && fundraiserId !== null && fundraiserId >= 0 
    },
  });

  // Get donors list from Analytics
  const { 
    data: donorsData,
    isLoading: isDonorsLoading,
    refetch: refetchDonors 
  } = useReadContract({
    address: analyticsResolved || undefined,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonors',
    args: fundraiserId !== null && fundraiserId >= 0 
      ? [BigInt(fundraiserId), 0n, BigInt(limit)] 
      : undefined,
    chainId: sepolia.id,
    query: { 
      enabled: !!analyticsResolved && enabled && fundraiserId !== null && fundraiserId >= 0 
    },
  });

  // Get top donors from Analytics
  const { 
    data: topDonorsData,
    refetch: refetchTopDonors 
  } = useReadContract({
    address: analyticsResolved || undefined,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getTopDonors',
    args: fundraiserId !== null && fundraiserId >= 0 
      ? [BigInt(fundraiserId), BigInt(10)] // Top 10
      : undefined,
    chainId: sepolia.id,
    query: { 
      enabled: !!analyticsResolved && enabled && fundraiserId !== null && fundraiserId >= 0 
    },
  });

  /**
   * Process donors from multiple sources:
   * 1. Analytics.getDonors() - on-chain aggregated data
   * 2. Donation events - historical transaction data
   */
  const processedDonors = useMemo(() => {
    const donorMap = new Map<string, DonorInfo>();

    // First, process Analytics contract data (if available)
    if (donorsData && Array.isArray(donorsData) && donorsData.length >= 2) {
      const [addresses, amounts, total] = donorsData as unknown as [readonly `0x${string}`[], readonly bigint[], bigint];
      void total; // unused but part of return type
      
      addresses.forEach((addr, idx) => {
        const amount = amounts[idx] || 0n;
        const normalized = addr.toLowerCase();
        
        donorMap.set(normalized, {
          address: normalized,
          totalAmount: amount,
          totalAmountFormatted: Number(formatUnits(amount, decimals)),
          donationCount: 1, // Will be updated from events
          firstDonation: 0,
          lastDonation: 0,
          averageDonation: Number(formatUnits(amount, decimals)),
          isTopDonor: false,
        });
      });
    }

    // Then, enhance/supplement with event data
    if (donations.length > 0) {
      donations.forEach(donation => {
        const normalized = donation.donor.toLowerCase();
        const existing = donorMap.get(normalized);

        if (existing) {
          // Update existing donor from Analytics data
          existing.donationCount += 1;
          existing.firstDonation = existing.firstDonation === 0 
            ? donation.timestamp 
            : Math.min(existing.firstDonation, donation.timestamp);
          existing.lastDonation = Math.max(existing.lastDonation || 0, donation.timestamp);
          existing.averageDonation = existing.totalAmountFormatted / existing.donationCount;
        } else {
          // Add new donor from events (not yet in Analytics data)
          const existingDonations = donations.filter(d => d.donor.toLowerCase() === normalized);
          const totalAmount = existingDonations.reduce((sum, d) => sum + d.netAmount, 0n);
          const totalFormatted = Number(formatUnits(totalAmount, decimals));

          donorMap.set(normalized, {
            address: normalized,
            totalAmount,
            totalAmountFormatted: totalFormatted,
            donationCount: existingDonations.length,
            firstDonation: Math.min(...existingDonations.map(d => d.timestamp)),
            lastDonation: Math.max(...existingDonations.map(d => d.timestamp)),
            averageDonation: totalFormatted / existingDonations.length,
            isTopDonor: false,
          });
        }
      });
    }

    return Array.from(donorMap.values())
      .sort((a, b) => Number(b.totalAmount - a.totalAmount));
  }, [donorsData, donations, decimals]);

  /**
   * Mark top donors and assign ranks
   */
  const topDonors = useMemo(() => {
    const topAddresses = new Set<string>();
    
    // Get top donor addresses from Analytics
    if (topDonorsData && Array.isArray(topDonorsData) && topDonorsData.length >= 1) {
      const [addresses, amounts] = topDonorsData as unknown as [readonly `0x${string}`[], readonly bigint[]];
      void amounts; // unused but part of return type
      addresses.forEach(addr => topAddresses.add(addr.toLowerCase()));
    }

    // Mark top donors and assign ranks
    return processedDonors.slice(0, 10).map((donor, idx) => ({
      ...donor,
      isTopDonor: true,
      rank: idx + 1,
    }));
  }, [processedDonors, topDonorsData]);

  // Update isTopDonor flag in main donors list
  const donors = useMemo(() => {
    const topAddresses = new Set(topDonors.map(d => d.address));
    return processedDonors.map(donor => ({
      ...donor,
      isTopDonor: topAddresses.has(donor.address),
    }));
  }, [processedDonors, topDonors]);

  // Calculate donors count (prefer Analytics, fallback to derived)
  const donorsCount = useMemo(() => {
    if (donorsCountData !== undefined) {
      return Number(donorsCountData);
    }
    return donors.length;
  }, [donorsCountData, donors.length]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isCountLoading || isDonorsLoading);
  }, [isCountLoading, isDonorsLoading]);

  // Refetch all data
  const refetch = () => {
    refetchCount();
    refetchDonors();
    refetchTopDonors();
  };

  return {
    donors,
    topDonors,
    donorsCount,
    isLoading,
    error: null,
    refetch,
  };
}
