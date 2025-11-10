// src/hooks/usePoliDAO.ts
import { useReadContract, useReadContracts } from 'wagmi';
import { polidaoContractConfig } from '../blockchain/contracts';
import { sepolia } from '@reown/appkit/networks';
import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { fetchPlatformStats, fetchUserStatus, fetchFundraiser, fetchFundraiserCount } from '@/blockchain/contracts';

// Interfejs dla kampanii zgodny z PoliDAO
export interface Campaign {
  id: bigint;
  creator: `0x${string}`;
  token: `0x${string}`;
  target: bigint;
  raised: bigint;
  endTime: bigint;
  isFlexible: boolean;
  closureInitiated: boolean;
  // Dodatkowe pola dla UI
  campaignId?: number; // Index w tablicy dla łatwiejszego wyświetlania
}

// Interfejs dla propozycji
export interface Proposal {
  id: bigint;
  question: string;
  yesVotes: bigint;
  noVotes: bigint;
  endTime: bigint;
  creator: `0x${string}`;
  // Dodatkowe pola dla UI
  proposalId?: number;
}

// Hook do pobierania wszystkich fundraiserów – teraz przez Router
export function useGetAllFundraisers() {
  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    const url =
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
      'https://rpc.sepolia.org';
    return new ethers.JsonRpcProvider(url);
  }, []);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignCount, setCampaignCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1) liczba kampanii z routera
        const totalBig = await fetchFundraiserCount(provider as ethers.Provider);
        const total = Number(totalBig);
        if (!mounted) return;
        setCampaignCount(total);

        if (total === 0) {
          if (mounted) setCampaigns([]);
          return;
        }

        // Przyjmujemy 1-based IDs: 1..total
        const ids = Array.from({ length: total }, (_, i) => i + 1);
        // Równoległe pobranie szczegółów
        const rows = await Promise.all(
          ids.map((id) => fetchFundraiser(provider as ethers.Provider, id))
        );

        if (!mounted) return;

        // Mapowanie do interfejsu Campaign używanego w UI
        const mapped: Campaign[] = rows.map((row, idx) => {
          const d = row.details;
          const p = row.progress;
          return {
            id: BigInt(idx + 1),
            creator: (d.creator as `0x${string}`),
            token: (d.token as `0x${string}`),
            target: d.goalAmount,
            raised: p.raised ?? d.raisedAmount,
            endTime: d.endDate,
            isFlexible: false, // Router nie zwraca tego pola
            closureInitiated: false, // brak w Routerze
            campaignId: idx,
          };
        });

        setCampaigns(mapped);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [provider]);

  return {
    campaigns,
    campaignCount,
    isLoading,
    error,
    refetchCampaigns: async () => {},
  };
}

export function useGetAllProposals() {
  const { data: proposalIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getAllProposalIds',
    chainId: sepolia.id,
  });

  const ids: bigint[] = Array.isArray(proposalIds) ? proposalIds : [];
  const proposalCalls = ids.flatMap((id) => ([{
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getProposal',
    args: [id],
    chainId: sepolia.id,
  }]));

  const { data: multiData, isLoading: multiLoading, error: multiError, refetch: refetchMulti } = useReadContracts({
    contracts: proposalCalls,
    query: { enabled: proposalCalls.length > 0 },
  });

  const proposals: Proposal[] = [];
  if (multiData && Array.isArray(multiData)) {
    for (let i = 0; i < ids.length; i++) {
      const res = multiData[i];
      if (res?.error || !res.result) continue;
      const p = res.result;
      try {
        const proposal: Proposal = {
          id: p.id ?? ids[i],
          question: p.question ?? '',
          yesVotes: p.yesVotes ?? BigInt(0),
          noVotes: p.noVotes ?? BigInt(0),
          endTime: p.endTime ?? BigInt(0),
          creator: (p.creator as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
          proposalId: i,
        };
        proposals.push(proposal);
      } catch {
      }
    }
  }

  return {
    proposals,
    proposalCount: proposals.length,
    isLoading: idsLoading || multiLoading,
    error: idsError || multiError,
    refetchProposals: () => {
      refetchIds();
      if (proposalCalls.length > 0) refetchMulti();
    },
  };
}

export function usePlatformStats(rpcUrl: string) {
  const provider = useMemo(() => new ethers.JsonRpcProvider(rpcUrl), [rpcUrl]);
  const [stats, setStats] = useState<{ totalFundraisers: bigint; totalDonations: bigint } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchPlatformStats(provider);
        if (mounted) setStats(s);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [provider]);

  return { loading, error, stats };
}

export function useUserStatus(rpcUrl: string, user?: string) {
  const provider = useMemo(() => new ethers.JsonRpcProvider(rpcUrl), [rpcUrl]);
  const [data, setData] = useState<ReturnType<typeof Object> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchUserStatus(provider, user);
        if (mounted) setData(s);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load user status');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [provider, user]);

  return { loading, error, data };
}