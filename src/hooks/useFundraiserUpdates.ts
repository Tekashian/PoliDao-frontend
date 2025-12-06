// src/hooks/useFundraiserUpdates.ts
import { useEffect, useState, useCallback } from 'react';
import { Interface } from 'ethers';
import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { keccak256, toUtf8Bytes } from 'ethers';
import { poliDaoStorageAbi } from '@/blockchain/storageAbi';
import { STORAGE_ADDRESS } from '@/blockchain/contracts';
import { getSmartProvider } from '@/lib/provider';

const UPDATES_KEY = keccak256(toUtf8Bytes('UPDATES')) as `0x${string}`;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export interface UpdateRecord {
  id: string;
  updateId: number;
  fundraiserId: number;
  author: string;
  content: string;
  updateType: number;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

interface UseFundraiserUpdatesOptions {
  fundraiserId: number | null;
  enabled?: boolean;
  pollInterval?: number;
  blockRange?: number; // Free-tier RPC limit: max 10 blocks for eth_getLogs (Infura/Alchemy)
}

interface UseFundraiserUpdatesResult {
  updates: UpdateRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Professional hook for fetching fundraiser updates/aktualności
 * Fetches UpdatePosted events from Updates module with Storage fallback
 */
export function useFundraiserUpdates({
  fundraiserId,
  enabled = true,
  pollInterval = 20000,
  blockRange = 10, // Free-tier RPC limit: 10 blocks max for eth_getLogs
}: UseFundraiserUpdatesOptions): UseFundraiserUpdatesResult {
  const [updates, setUpdates] = useState<UpdateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get Updates module address from Storage
  const { data: updatesAddress } = useReadContract({
    address: STORAGE_ADDRESS,
    abi: poliDaoStorageAbi,
    functionName: 'modules',
    args: [UPDATES_KEY],
    chainId: sepolia.id,
  });

  const updatesResolved = updatesAddress && updatesAddress !== ZERO_ADDR 
    ? updatesAddress 
    : null;

  /**
   * Fetch updates from Updates module
   */
  const fetchUpdates = useCallback(async () => {
    if (!enabled || fundraiserId === null || fundraiserId < 0) {
      setUpdates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await getSmartProvider();
      let parsedUpdates: UpdateRecord[] = [];

      // Try Updates module first (if available)
      if (updatesResolved) {
        console.log(`📝 Fetching updates from Updates module: ${updatesResolved}`);
        
        const updatesIface = new Interface([
          'event UpdatePosted(uint256 indexed updateId, uint256 indexed fundraiserId, address indexed author, string content, uint8 updateType)'
        ]);

        const eventTopic = updatesIface.getEvent('UpdatePosted')?.topicHash;
        if (!eventTopic) {
          throw new Error('Could not generate UpdatePosted topic');
        }

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - blockRange);

        // Topic1 is updateId (not filtering), Topic2 is fundraiserId (filtering)
        const fundraiserTopic = '0x' + BigInt(fundraiserId).toString(16).padStart(64, '0');

        const logs = await provider.getLogs({
          address: updatesResolved as string,
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(latestBlock),
          topics: [
            eventTopic,
            null, // updateId (any)
            fundraiserTopic, // fundraiserId (specific)
          ],
        });

        console.log(`✅ Found ${logs.length} update logs`);

        parsedUpdates = await Promise.all(
          logs.map(async (log, index) => {
            try {
              const parsed = updatesIface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });

              if (!parsed) return null;

              const args = parsed.args;
              const block = await provider.getBlock(log.blockHash!);
              const timestamp = block ? Number(block.timestamp) * 1000 : Date.now();

              const update: UpdateRecord = {
                id: `${log.transactionHash}-${log.index || index}`,
                updateId: Number(args.updateId),
                fundraiserId: Number(args.fundraiserId),
                author: (args.author as string).toLowerCase(),
                content: args.content as string,
                updateType: Number(args.updateType),
                timestamp,
                blockNumber: log.blockNumber || 0,
                txHash: log.transactionHash || '',
              };

              return update;
            } catch (err) {
              console.error('Error parsing update log:', err);
              return null;
            }
          })
        ).then(results => 
          results
            .filter((u): u is UpdateRecord => u !== null)
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      }

      // Fallback to Storage events if no updates found or Updates module unavailable
      if (parsedUpdates.length === 0) {
        console.log(`📝 Falling back to Storage events for updates`);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storageIface = new Interface(poliDaoStorageAbi as any);

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - blockRange);

        // Get all Storage update events
        const [titleLogs, descLogs, locLogs] = await Promise.all([
          provider.getLogs({
            address: STORAGE_ADDRESS as string,
            fromBlock: BigInt(fromBlock),
            toBlock: BigInt(latestBlock),
            topics: [storageIface.getEvent('FundraiserTitleUpdated')?.topicHash || null],
          }),
          provider.getLogs({
            address: STORAGE_ADDRESS as string,
            fromBlock: BigInt(fromBlock),
            toBlock: BigInt(latestBlock),
            topics: [storageIface.getEvent('FundraiserDescriptionUpdated')?.topicHash || null],
          }),
          provider.getLogs({
            address: STORAGE_ADDRESS as string,
            fromBlock: BigInt(fromBlock),
            toBlock: BigInt(latestBlock),
            topics: [storageIface.getEvent('FundraiserLocationUpdated')?.topicHash || null],
          }),
        ]);

        const parseStorageLog = async (
          log: typeof titleLogs[0], 
          eventName: string,
          formatContent: (args: any) => string // eslint-disable-line @typescript-eslint/no-explicit-any
        ): Promise<UpdateRecord | null> => {
          try {
            const parsed = storageIface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });

            if (!parsed) return null;

            const args = parsed.args;
            const fid = Number(args.fundraiserId || args[0]);
            
            // Filter by fundraiserId
            if (fid !== fundraiserId) return null;

            const block = await provider.getBlock(log.blockHash!);
            const timestamp = block ? Number(block.timestamp) * 1000 : Date.now();

            return {
              id: `${log.transactionHash}-${log.index || 0}`,
              updateId: 0, // Storage events don't have updateId
              fundraiserId: fid,
              author: ZERO_ADDR, // Storage events don't track author
              content: formatContent(args),
              updateType: 0,
              timestamp,
              blockNumber: log.blockNumber || 0,
              txHash: log.transactionHash || '',
            };
          } catch (err) {
            console.error(`Error parsing ${eventName}:`, err);
            return null;
          }
        };

        const storageUpdates = await Promise.all([
          ...titleLogs.map(log => 
            parseStorageLog(log, 'FundraiserTitleUpdated', args => 
              `📝 Zmieniono tytuł: ${args.newTitle || args[1] || ''}`
            )
          ),
          ...descLogs.map(log => 
            parseStorageLog(log, 'FundraiserDescriptionUpdated', args => 
              `📄 Zmieniono opis: ${args.newDescription || args[1] || ''}`
            )
          ),
          ...locLogs.map(log => 
            parseStorageLog(log, 'FundraiserLocationUpdated', args => 
              `📍 Zmieniono lokalizację: ${args.newLocation || args[1] || ''}`
            )
          ),
        ]);

        parsedUpdates = storageUpdates
          .filter((u): u is UpdateRecord => u !== null)
          .sort((a, b) => b.timestamp - a.timestamp);
      }

      setUpdates(parsedUpdates);
      setIsLoading(false);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching updates');
      console.error('❌ Error fetching updates:', error);
      setError(error);
      setIsLoading(false);
    }
  }, [fundraiserId, updatesResolved, enabled, blockRange]);

  // Initial fetch and polling
  useEffect(() => {
    fetchUpdates();

    if (pollInterval > 0) {
      const interval = setInterval(fetchUpdates, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchUpdates, pollInterval]);

  return {
    updates,
    isLoading,
    error,
    refetch: fetchUpdates,
  };
}
