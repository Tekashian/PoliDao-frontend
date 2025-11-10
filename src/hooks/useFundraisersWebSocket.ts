// src/hooks/useFundraisersWebSocket.ts
// Real-time fundraiser updates using WebSocket with intelligent polling
import { useCallback, useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { getCoreAddress } from '@/blockchain/contracts';
import { poliDaoCoreAbi } from '@/blockchain/coreAbi';

export type ModularFundraiser = {
  id: bigint;
  title: string;
  description: string;
  location: string;
  endDate: bigint;
  fundraiserType: number;
  status: number;
  token: `0x${string}`;
  goalAmount: bigint;
  raisedAmount: bigint;
  creator: `0x${string}`;
  extensionCount: bigint;
  isSuspended: boolean;
  suspensionReason: string;
  donorsCount: bigint;
  percentage: bigint;
  timeLeft: bigint;
  refundDeadline: bigint;
  suspensionTime: bigint;
  isFlexible: boolean;
};

const toBigInt = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && value) return BigInt(value);
  return 0n;
};

// Parse fundraiser data from contract response
// Contract returns tuple arrays, not objects, so we need to handle both formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFundraiserData(id: bigint, details: any, progress: any): ModularFundraiser {
  // Details can be array [title, description, location, ...] or object
  const d = Array.isArray(details) ? {
    title: details[0],
    description: details[1],
    location: details[2],
    endDate: details[3],
    fundraiserType: details[4],
    status: details[5],
    token: details[6],
    goalAmount: details[7],
    raisedAmount: details[8],
    creator: details[9],
    extensionCount: details[10],
    isSuspended: details[11],
    suspensionReason: details[12],
  } : details;

  // Progress can be array [raised, goal, percentage, ...] or object
  const p = Array.isArray(progress) ? {
    raised: progress[0],
    goal: progress[1],
    percentage: progress[2],
    donorsCount: progress[3],
    timeLeft: progress[4],
    refundDeadline: progress[5],
    isSuspended: progress[6],
    suspensionTime: progress[7],
  } : progress;

  return {
    id,
    title: String(d.title || ''),
    description: String(d.description || ''),
    location: String(d.location || ''),
    endDate: toBigInt(d.endDate),
    fundraiserType: Number(d.fundraiserType || 0),
    status: Number(d.status || 0),
    token: (d.token || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    goalAmount: toBigInt(d.goalAmount),
    raisedAmount: toBigInt(p.raised || d.raisedAmount),
    creator: (d.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    extensionCount: toBigInt(d.extensionCount),
    isSuspended: Boolean(d.isSuspended),
    suspensionReason: String(d.suspensionReason || ''),
    donorsCount: toBigInt(p.donorsCount),
    percentage: toBigInt(p.percentage),
    timeLeft: toBigInt(p.timeLeft),
    refundDeadline: toBigInt(p.refundDeadline),
    suspensionTime: toBigInt(p.suspensionTime),
    isFlexible: Number(d.fundraiserType) === 1,
  };
}

export function useFundraisersWebSocket() {
  const [fundraisers, setFundraisers] = useState<ModularFundraiser[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const providerRef = useRef<ethers.WebSocketProvider | ethers.JsonRpcProvider | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBlockRef = useRef<number>(0);
  const countRef = useRef<number>(0);

  // Initialize and cleanup - all logic inside to avoid dependency issues
  useEffect(() => {
    let mounted = true;
    try {
      setIsLoading(true);
      
      const totalCount = await contract.getFundraiserCount();
      const total = Number(totalCount);
      setCount(total);
      countRef.current = total;

      if (total === 0) {
        setFundraisers([]);
        setIsLoading(false);
        return;
      }

      console.log(`📊 Loading ${total} fundraisers via WebSocket...`);

      const batchSize = 10;
      const allFundraisers: ModularFundraiser[] = [];

      for (let i = 1; i <= total; i += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, total - i + 1) },
          (_, idx) => i + idx
        );

        const batchPromises = batch.map(async (id) => {
          try {
            const [details, progress] = await Promise.all([
              contract.getFundraiserDetails(id),
              contract.getFundraiserProgress(id),
            ]);
            return parseFundraiserData(BigInt(id), details, progress);
          } catch (err) {
            console.warn(`Failed to load fundraiser ${id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        const successfulResults = batchResults
          .filter((r): r is PromiseFulfilledResult<ModularFundraiser | null> => 
            r.status === 'fulfilled' && r.value !== null
          )
          .map(r => r.value as ModularFundraiser);

        allFundraisers.push(...successfulResults);
      }

      console.log(`✅ Loaded ${allFundraisers.length} fundraisers`);
      setFundraisers(allFundraisers);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load fundraisers:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  // Setup intelligent block polling
  const setupBlockPolling = useCallback((provider: ethers.WebSocketProvider | ethers.JsonRpcProvider, contract: ethers.Contract) => {
    console.log('👂 Setting up block polling for updates...');

    // Poll every new block
    const pollUpdates = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (currentBlock > lastBlockRef.current) {
          lastBlockRef.current = currentBlock;
          
          // Check for new fundraisers
          const newCount = await contract.getFundraiserCount();
          const newTotal = Number(newCount);
          
          if (newTotal > countRef.current) {
            console.log(`🆕 New fundraiser detected! Total: ${newTotal}`);
            // Load only new fundraisers
            const newFundraisers: ModularFundraiser[] = [];
            for (let i = countRef.current + 1; i <= newTotal; i++) {
              try {
                const [details, progress] = await Promise.all([
                  contract.getFundraiserDetails(i),
                  contract.getFundraiserProgress(i),
                ]);
                const newFundraiser = parseFundraiserData(BigInt(i), details, progress);
                newFundraisers.push(newFundraiser);
              } catch (err) {
                console.warn(`Failed to load new fundraiser ${i}:`, err);
              }
            }
            
            if (newFundraisers.length > 0) {
              setFundraisers(prev => [...prev, ...newFundraisers]);
              setCount(newTotal);
              countRef.current = newTotal;
            }
          }
        }
      } catch (err) {
        console.warn('Block polling error:', err);
      }
    };

    // Poll every 12 seconds (Ethereum block time)
    pollingIntervalRef.current = setInterval(pollUpdates, 12000);
    
    // Initial poll
    pollUpdates();
    
    console.log('✅ Block polling active (12s intervals)');
  }, []); // Empty dependencies - uses refs and setState

  // Initialize WebSocket or fallback to HTTP
  const initializeProvider = useCallback(async () => {
    try {
      const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
      
      // Try WebSocket first
      if (alchemyKey) {
        const wsUrl = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
        console.log('🔌 Connecting via WebSocket...');
        
        try {
          const wsProvider = new ethers.WebSocketProvider(wsUrl);
          await wsProvider.ready;
          provider = wsProvider;
          setIsConnected(true);
          console.log('✅ WebSocket connected');
        } catch (wsErr) {
          console.warn('WebSocket failed, falling back to HTTP:', wsErr);
          const httpUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
          provider = new ethers.JsonRpcProvider(httpUrl);
          setIsConnected(false);
        }
      } else {
        // Fallback to HTTP
        const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
        console.log('� Using HTTP provider');
        provider = new ethers.JsonRpcProvider(rpcUrl);
        setIsConnected(false);
      }

      providerRef.current = provider;
      setError(null);

      // Get Core contract address and create contract instance
      const coreAddress = await getCoreAddress(provider);
      const contract = new ethers.Contract(coreAddress, poliDaoCoreAbi, provider);
      contractRef.current = contract;

      await loadAllFundraisers(contract);
      setupBlockPolling(provider, contract);

      return provider;
    } catch (err) {
      console.error('❌ Provider initialization failed:', err);
      setError(err as Error);
      setIsConnected(false);
      throw err;
    }
  }, [loadAllFundraisers, setupBlockPolling]);

  // Cleanup on unmount
  useEffect(() => {
    let mounted = true;
    
    const initializeProvider = async () => {
      try {
        const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
        let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
        
        // Try WebSocket first
        if (alchemyKey) {
          const wsUrl = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
          console.log('🔌 Connecting via WebSocket...');
          
          try {
            const wsProvider = new ethers.WebSocketProvider(wsUrl);
            await wsProvider.ready;
            provider = wsProvider;
            if (mounted) {
              setIsConnected(true);
              console.log('✅ WebSocket connected');
            }
          } catch (wsErr) {
            console.warn('WebSocket failed, falling back to HTTP:', wsErr);
            const httpUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
            provider = new ethers.JsonRpcProvider(httpUrl);
            if (mounted) setIsConnected(false);
          }
        } else {
          // Fallback to HTTP
          const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
          console.log('📡 Using HTTP provider');
          provider = new ethers.JsonRpcProvider(rpcUrl);
          if (mounted) setIsConnected(false);
        }

        if (!mounted) {
          if ('destroy' in provider) provider.destroy();
          return;
        }

        providerRef.current = provider;
        setError(null);

        // Get Core contract address and create contract instance
        const coreAddress = await getCoreAddress(provider);
        const contract = new ethers.Contract(coreAddress, poliDaoCoreAbi, provider);
        contractRef.current = contract;

        if (!mounted) {
          if ('destroy' in provider) provider.destroy();
          return;
        }

        await loadAllFundraisers(contract);
        setupBlockPolling(provider, contract);
      } catch (err) {
        console.error('❌ Provider initialization failed:', err);
        if (mounted) {
          setError(err as Error);
          setIsConnected(false);
        }
      }
    };
    
    initializeProvider();

    return () => {
      mounted = false;
      console.log('🔌 Cleaning up provider...');
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      if (providerRef.current) {
        if ('destroy' in providerRef.current) {
          providerRef.current.destroy();
        }
        providerRef.current = null;
      }
    };
  }, []); // Empty dependencies - run only once on mount

  const refresh = useCallback(async () => {
    if (contractRef.current) {
      await loadAllFundraisers(contractRef.current);
    }
  }, [loadAllFundraisers]);

  return {
    fundraisers,
    count,
    isLoading,
    isConnected,
    error,
    refresh,
  };
}
