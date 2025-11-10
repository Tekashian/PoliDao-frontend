// src/hooks/useGovernanceWebSocket.ts
// Real-time governance proposals using WebSocket with intelligent polling
import { useCallback, useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { getCoreContract } from '../blockchain/contracts';
import { poliDaoGovernanceAbi } from '../blockchain/governanceAbi';

export type Proposal = {
  id: bigint;
  question: string;
  yesVotes: bigint;
  noVotes: bigint;
  endTime: bigint;
  creator: `0x${string}`;
  proposalId?: number;
};

const toBigInt = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && value) return BigInt(value);
  return 0n;
};

// Parse proposal data from contract response
// Contract returns tuple arrays, not objects, so we need to handle both formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProposalData(id: bigint, proposalData: any, index: number): Proposal {
  // Proposal can be array [id, question, yesVotes, noVotes, endTime, creator] or object
  const p = Array.isArray(proposalData) ? {
    id: proposalData[0],
    question: proposalData[1],
    yesVotes: proposalData[2],
    noVotes: proposalData[3],
    endTime: proposalData[4],
    creator: proposalData[5],
  } : proposalData;

  return {
    id: toBigInt(p.id || id),
    question: String(p.question || ''),
    yesVotes: toBigInt(p.yesVotes),
    noVotes: toBigInt(p.noVotes),
    endTime: toBigInt(p.endTime),
    creator: (p.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    proposalId: index,
  };
}

export function useGovernanceWebSocket() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const providerRef = useRef<ethers.WebSocketProvider | ethers.JsonRpcProvider | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBlockRef = useRef<number>(0);

  // Load all proposals
  const loadAllProposals = useCallback(async (contract: ethers.Contract) => {
    try {
      setIsLoading(true);
      
      // Get all proposal IDs
      const proposalIds = await contract.getAllProposalIds();
      const ids: bigint[] = Array.isArray(proposalIds) ? proposalIds : [];
      
      setCount(ids.length);

      if (ids.length === 0) {
        setProposals([]);
        setIsLoading(false);
        return;
      }

      console.log(`📊 Loading ${ids.length} proposals via WebSocket...`);

      const batchSize = 10;
      const allProposals: Proposal[] = [];

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);

        const batchPromises = batch.map(async (id, batchIdx) => {
          try {
            const proposalData = await contract.getProposal(id);
            return parseProposalData(id, proposalData, i + batchIdx);
          } catch (err) {
            console.warn(`Failed to load proposal ${id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        const successfulResults = batchResults
          .filter((r): r is PromiseFulfilledResult<Proposal | null> => 
            r.status === 'fulfilled' && r.value !== null
          )
          .map(r => r.value as Proposal);

        allProposals.push(...successfulResults);
      }

      console.log(`✅ Loaded ${allProposals.length} proposals`);
      setProposals(allProposals);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  // Setup intelligent block polling
  const setupBlockPolling = useCallback((provider: ethers.WebSocketProvider | ethers.JsonRpcProvider, contract: ethers.Contract) => {
    console.log('👂 Setting up governance block polling...');

    const pollUpdates = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (currentBlock > lastBlockRef.current) {
          lastBlockRef.current = currentBlock;
          
          // Check for new proposals
          const newProposalIds = await contract.getAllProposalIds();
          const newIds: bigint[] = Array.isArray(newProposalIds) ? newProposalIds : [];
          
          if (newIds.length > count) {
            console.log(`🆕 New proposal detected! Total: ${newIds.length}`);
            // Load only new proposals
            const newProposals: Proposal[] = [];
            
            for (let i = count; i < newIds.length; i++) {
              try {
                const proposalData = await contract.getProposal(newIds[i]);
                const newProposal = parseProposalData(newIds[i], proposalData, i);
                newProposals.push(newProposal);
              } catch (err) {
                console.warn(`Failed to load new proposal ${newIds[i]}:`, err);
              }
            }
            
            if (newProposals.length > 0) {
              setProposals(prev => [...prev, ...newProposals]);
              setCount(newIds.length);
            }
          } else if (newIds.length === count && count > 0) {
            // Update vote counts for existing proposals (every 5th block to reduce load)
            if (currentBlock % 5 === 0) {
              const updatedProposals = await Promise.all(
                newIds.map(async (id, idx) => {
                  try {
                    const proposalData = await contract.getProposal(id);
                    return parseProposalData(id, proposalData, idx);
                  } catch {
                    return proposals[idx]; // Keep old data on error
                  }
                })
              );
              setProposals(updatedProposals.filter(Boolean));
            }
          }
        }
      } catch (err) {
        console.warn('Governance block polling error:', err);
      }
    };

    // Poll every 12 seconds (Ethereum block time)
    pollingIntervalRef.current = setInterval(pollUpdates, 12000);
    
    // Initial poll
    pollUpdates();
    
    console.log('✅ Governance block polling active (12s intervals)');
  }, [count, proposals]);

  // Initialize WebSocket or fallback to HTTP
  const initializeProvider = useCallback(async () => {
    try {
      const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
      
      // Try WebSocket first
      if (alchemyKey) {
        const wsUrl = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
        console.log('🔌 Connecting governance via WebSocket...');
        
        try {
          const wsProvider = new ethers.WebSocketProvider(wsUrl);
          await wsProvider.ready;
          provider = wsProvider;
          setIsConnected(true);
          console.log('✅ Governance WebSocket connected');
        } catch (wsErr) {
          console.warn('Governance WebSocket failed, falling back to HTTP:', wsErr);
          const httpUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
          provider = new ethers.JsonRpcProvider(httpUrl);
          setIsConnected(false);
        }
      } else {
        // Fallback to HTTP
        const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
        console.log('📡 Using HTTP provider for governance');
        provider = new ethers.JsonRpcProvider(rpcUrl);
        setIsConnected(false);
      }

      providerRef.current = provider;
      setError(null);

      // Get governance address from Core contract
      const coreContract = getCoreContract(provider);
      const governanceAddress = await coreContract.governanceModule();
      
      console.log(`📋 Governance contract address: ${governanceAddress}`);

      // Create governance contract with proper ABI
      const contract = new ethers.Contract(
        governanceAddress,
        poliDaoGovernanceAbi,
        provider
      );
      contractRef.current = contract;

      await loadAllProposals(contract);
      setupBlockPolling(provider, contract);

      return provider;
    } catch (err) {
      console.error('❌ Governance provider initialization failed:', err);
      setError(err as Error);
      setIsConnected(false);
      throw err;
    }
  }, [loadAllProposals, setupBlockPolling]);

  // Cleanup on unmount
  useEffect(() => {
    initializeProvider();

    return () => {
      console.log('🔌 Cleaning up governance provider...');
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      if (providerRef.current) {
        if ('destroy' in providerRef.current) {
          providerRef.current.destroy();
        }
      }
    };
  }, []); // Run once on mount

  const refresh = useCallback(async () => {
    if (contractRef.current) {
      await loadAllProposals(contractRef.current);
    }
  }, [loadAllProposals]);

  return {
    proposals,
    proposalCount: count,
    isLoading,
    isConnected,
    error,
    refetchProposals: refresh,
  };
}
