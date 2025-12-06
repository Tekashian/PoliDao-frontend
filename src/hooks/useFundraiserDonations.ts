// src/hooks/useFundraiserDonations.ts
import { useEffect, useState, useCallback } from 'react';
import { Interface, formatUnits } from 'ethers';
import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { keccak256, toUtf8Bytes } from 'ethers';
import { poliDaoAnalyticsAbi } from '@/blockchain/analyticsAbi';
import { poliDaoStorageAbi } from '@/blockchain/storageAbi';
import { STORAGE_ADDRESS } from '@/blockchain/contracts';
import { getSmartProvider } from '@/lib/provider';

const ANALYTICS_KEY = keccak256(toUtf8Bytes('ANALYTICS')) as `0x${string}`;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export interface DonationRecord {
  id: string;
  fundraiserId: number;
  donor: string;
  token: string;
  amount: bigint;
  netAmount: bigint;
  amountFormatted: number;
  netAmountFormatted: number;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface DonationStats {
  totalAmount: number;
  totalCount: number;
  uniqueDonors: number;
  averageDonation: number;
  maxDonation: number;
  minDonation: number;
  last24h: number;
  last7days: number;
}

interface UseFundraiserDonationsOptions {
  fundraiserId: number | null;
  decimals?: number;
  enabled?: boolean;
  pollInterval?: number;
  blockRange?: number; // CRITICAL: Free-tier RPC limit is exactly 10 blocks for eth_getLogs. Use 9 to be safe and avoid edge cases.
}

interface UseFundraiserDonationsResult {
  donations: DonationRecord[];
  stats: DonationStats;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Professional hook for fetching and managing fundraiser donation history
 * 
 * Strategy:
 * - Polls Analytics module DonationMade events every 15 seconds
 * - Fetches only last 10 blocks (~2 minutes) due to free-tier RPC limits
 * - Real-time updates via frequent polling compensate for small block range
 * - Calculates comprehensive statistics (total, unique donors, avg/max/min, 24h/7d)
 * 
 * Note: For production with paid RPC, increase blockRange to 10000+ for full history
 */
export function useFundraiserDonations({
  fundraiserId,
  decimals = 6,
  enabled = true,
  pollInterval = 15000,
  blockRange = 9, // CRITICAL: Free-tier RPC limit is 10 blocks max, use 9 to be safe
}: UseFundraiserDonationsOptions): UseFundraiserDonationsResult {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get Analytics module address from Storage
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

  /**
   * Fetch donation logs from Analytics module
   */
  const fetchDonations = useCallback(async () => {
    if (!enabled || fundraiserId === null || fundraiserId < 0) {
      setDonations([]);
      setIsLoading(false);
      return;
    }

    if (!analyticsResolved) {
      console.warn('⚠️ Analytics module not resolved yet');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await getSmartProvider();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iface = new Interface(poliDaoAnalyticsAbi as any);

      // Get DonationMade event
      const donationEvent = iface.fragments.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f.type === 'event' && f.name === 'DonationMade'
      );

      if (!donationEvent) {
        throw new Error('DonationMade event not found in ABI');
      }

      // Create event topic
      const eventTopic = iface.getEvent('DonationMade')?.topicHash;
      if (!eventTopic) {
        throw new Error('Could not generate event topic');
      }

      // Encode fundraiserId as indexed parameter (padded to 32 bytes)
      const fundraiserTopic = '0x' + BigInt(fundraiserId).toString(16).padStart(64, '0');

      // Get block range - strict limit for free tier (max 10 blocks)
      const latestBlock = await provider.getBlockNumber();
      const safeBlockRange = Math.min(blockRange, 9); // Always stay under 10 block limit
      const fromBlock = Math.max(0, latestBlock - safeBlockRange);

      console.log(`📊 Fetching donations for fundraiser ${fundraiserId} from block ${fromBlock} to ${latestBlock} (range: ${latestBlock - fromBlock} blocks)`);

      // Fetch logs with indexed fundraiserId
      const logs = await provider.getLogs({
        address: analyticsResolved as string,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(latestBlock),
        topics: [eventTopic, fundraiserTopic], // Filter by DonationMade AND fundraiserId
      });

      console.log(`✅ Found ${logs.length} donation logs`);

      // Parse logs in parallel
      const parsedDonations = await Promise.all(
        logs.map(async (log, index) => {
          try {
            const parsed = iface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });

            if (!parsed) return null;

            const args = parsed.args;
            
            // Get block timestamp
            const block = await provider.getBlock(log.blockHash!);
            const timestamp = block ? Number(block.timestamp) * 1000 : Date.now();

            // Extract event parameters (DonationMade has: fundraiserId, donor, token, amount, netAmount)
            const donation: DonationRecord = {
              id: `${log.transactionHash}-${log.index || index}`,
              fundraiserId: Number(args.fundraiserId),
              donor: (args.donor as string).toLowerCase(),
              token: args.token as string,
              amount: args.amount as bigint,
              netAmount: args.netAmount as bigint,
              amountFormatted: Number(formatUnits(args.amount, decimals)),
              netAmountFormatted: Number(formatUnits(args.netAmount, decimals)),
              timestamp,
              blockNumber: log.blockNumber || 0,
              txHash: log.transactionHash || '',
            };

            return donation;
          } catch (err) {
            console.error('Error parsing donation log:', err, log);
            return null;
          }
        })
      );

      // Filter out null results and sort by timestamp (newest first)
      const validDonations = parsedDonations
        .filter((d): d is DonationRecord => d !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      setDonations(validDonations);
      setIsLoading(false);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching donations');
      console.error('❌ Error fetching donations:', error);
      setError(error);
      setIsLoading(false);
    }
  }, [fundraiserId, analyticsResolved, decimals, enabled, blockRange]);

  /**
   * Calculate statistics from donations
   */
  const stats: DonationStats = useCallback(() => {
    if (donations.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        uniqueDonors: 0,
        averageDonation: 0,
        maxDonation: 0,
        minDonation: 0,
        last24h: 0,
        last7days: 0,
      };
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    const amounts = donations.map(d => d.netAmountFormatted);
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
    const uniqueDonors = new Set(donations.map(d => d.donor)).size;
    
    const last24h = donations
      .filter(d => now - d.timestamp < day)
      .reduce((sum, d) => sum + d.netAmountFormatted, 0);
    
    const last7days = donations
      .filter(d => now - d.timestamp < week)
      .reduce((sum, d) => sum + d.netAmountFormatted, 0);

    return {
      totalAmount,
      totalCount: donations.length,
      uniqueDonors,
      averageDonation: totalAmount / donations.length,
      maxDonation: Math.max(...amounts),
      minDonation: Math.min(...amounts),
      last24h,
      last7days,
    };
  }, [donations])();

  // Initial fetch and polling
  useEffect(() => {
    fetchDonations();

    if (pollInterval > 0) {
      const interval = setInterval(fetchDonations, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchDonations, pollInterval]);

  return {
    donations,
    stats,
    isLoading,
    error,
    refetch: fetchDonations,
  };
}
