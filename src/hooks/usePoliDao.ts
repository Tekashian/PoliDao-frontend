// src/hooks/usePoliDAO.ts
import { useReadContract, useReadContracts } from 'wagmi';
import { polidaoContractConfig } from '../blockchain/contracts';
import { sepolia } from '@reown/appkit/networks';

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

// Hook do pobierania wszystkich fundraiserów - NOWA WERSJA ENUMERACYJNA
// Wzorzec: fundraiserCounter -> generujemy ID sekwencyjnie (zakładamy 1..counter) -> batch fundraisers + creator + token
export function useGetAllFundraisers() {
  const { data: counterData, isLoading: counterLoading, error: counterError, refetch: refetchCounter } = useReadContract({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'fundraiserCounter',
    chainId: sepolia.id,
  });

  const total = Number(counterData ?? 0);
  // Przyjmujemy, że ID zaczynają się od 1 (jeżeli kontrakt używa 0-based można zmienić na 0..total-1)
  const ids: bigint[] = total > 0 ? Array.from({ length: total }, (_, i) => BigInt(i + 1)) : [];

  // Każdy fundraiser: 3 wywołania (fundraisers, fundraiserCreators, fundraiserTokens)
  const contracts = ids.flatMap((id) => ([
    {
      address: polidaoContractConfig.address,
      abi: polidaoContractConfig.abi,
      functionName: 'fundraisers',
      args: [id],
      chainId: sepolia.id,
    },
    {
      address: polidaoContractConfig.address,
      abi: polidaoContractConfig.abi,
      functionName: 'fundraiserCreators',
      args: [id],
      chainId: sepolia.id,
    },
    {
      address: polidaoContractConfig.address,
      abi: polidaoContractConfig.abi,
      functionName: 'fundraiserTokens',
      args: [id],
      chainId: sepolia.id,
    },
  ]));

  const { data: multiData, isLoading: multiLoading, error: multiError, refetch: refetchMulti } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  });

  const campaigns: Campaign[] = [];
  if (multiData && Array.isArray(multiData) && contracts.length > 0) {
    for (let i = 0; i < ids.length; i++) {
      const base = i * 3;
      const fundRes = multiData[base];
      const creatorRes = multiData[base + 1];
      const tokenRes = multiData[base + 2];

      if (fundRes?.error || creatorRes?.error || tokenRes?.error) continue;
      const packed = fundRes?.result as any | undefined; // struct IPoliDaoStructs.PackedFundraiserData
      if (!packed) continue;

      try {
        const campaign: Campaign = {
          id: packed.id ?? ids[i],
          creator: (creatorRes?.result as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
          token: (tokenRes?.result as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
          target: packed.goalAmount ?? BigInt(0),
          raised: packed.raisedAmount ?? BigInt(0),
          endTime: packed.endDate ?? BigInt(0),
          isFlexible: Boolean(packed.isFlexible),
          closureInitiated: false, // pole legacy – brak w nowym packu, do ewentualnego rozwinięcia
          campaignId: i,
        };
        campaigns.push(campaign);
      } catch {
        // pomijamy uszkodzony wpis
      }
    }
  }

  return {
    campaigns,
    campaignCount: campaigns.length,
    isLoading: counterLoading || multiLoading,
    error: counterError || multiError,
    refetchCampaigns: () => {
      refetchCounter();
      if (contracts.length > 0) refetchMulti();
    },
  };
}

// Hook do pobierania wszystkich propozycji – teraz używa getAllProposalIds + getProposal
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
      const p = res.result as any;
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
        // pomijamy uszkodzony wpis
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