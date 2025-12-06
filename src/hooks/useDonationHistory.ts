// src/hooks/useDonationHistory.ts
import { useEffect, useState } from 'react';
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

export interface Donation {
  donor: string;
  amount: string;
  netAmount: string;
  timestamp: number;
  txHash: string;
}

interface UseDonationHistoryOptions {
  fundraiserId: number | null;
  enabled?: boolean;
}

export function useDonationHistory({ fundraiserId, enabled = true }: UseDonationHistoryOptions) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get Analytics module address
  const { data: analyticsAddress } = useReadContract({
    address: STORAGE_ADDRESS,
    abi: poliDaoStorageAbi,
    functionName: 'modules',
    args: [ANALYTICS_KEY],
    chainId: sepolia.id,
    query: { enabled: enabled && fundraiserId !== null },
  });

  useEffect(() => {
    if (!enabled || fundraiserId === null || !analyticsAddress || analyticsAddress === ZERO_ADDR) {
      setDonations([]);
      setIsLoading(false);
      return;
    }

    let disposed = false;

    const fetchDonations = async () => {
      try {
        setIsLoading(true);
        const provider = await getSmartProvider();
        
        // Create interface for DonationMade event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iface = new Interface(poliDaoAnalyticsAbi as any);
        
        // Get latest block
        const latestBlock = await provider.getBlockNumber();
        // Only fetch last 9 blocks (free tier limit is 10, use 9 to be safe)
        const safeBlockRange = 9;
        const fromBlock = Math.max(0, latestBlock - safeBlockRange);
        
        console.log(`📊 [useDonationHistory] Fetching from block ${fromBlock} to ${latestBlock} (range: ${latestBlock - fromBlock} blocks)`);
        
        // Query logs for this fundraiser
        const logs = await provider.getLogs({
          address: analyticsAddress as string,
          fromBlock,
          toBlock: latestBlock,
          topics: [
            // DonationMade event signature
            keccak256(toUtf8Bytes('DonationMade(uint256,uint256,address,address,uint256,uint256)')),
            null, // donationId (not indexed)
            // fundraiserId as indexed parameter
            '0x' + BigInt(fundraiserId).toString(16).padStart(64, '0'),
          ],
        });

        const parsed: Donation[] = [];
        for (const log of logs) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = iface.parseLog(log as any);
            if (!decoded) continue;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const args = decoded.args as any;
            const block = await provider.getBlock(log.blockHash!);

            parsed.push({
              donor: args.donor || args[2],
              amount: formatUnits(args.amount || args[4] || 0n, 6),
              netAmount: formatUnits(args.netAmount || args[5] || 0n, 6),
              timestamp: block ? Number(block.timestamp) * 1000 : Date.now(),
              txHash: log.transactionHash || '',
            });
          } catch (err) {
            console.warn('Failed to parse donation log:', err);
          }
        }

        if (!disposed) {
          setDonations(parsed.reverse()); // newest first
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching donations:', err);
        if (!disposed) {
          setError(err as Error);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    fetchDonations();
    
    // Poll every 15 seconds for updates
    const interval = setInterval(fetchDonations, 15000);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [fundraiserId, analyticsAddress, enabled]);

  return { donations, isLoading, error };
}
