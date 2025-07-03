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

// Hook do pobierania wszystkich fundraiserów - NAPRAWIONY
export function useGetAllFundraisers() {
  // Najpierw pobierz wszystkie ID fundraiserów
  const { data: fundraiserIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getAllFundraiserIds',
    chainId: sepolia.id,
  });

  console.log('🔍 Fundraiser IDs from contract:', fundraiserIds);

  // Sprawdź czy mamy prawidłowe ID
  const validIds = Array.isArray(fundraiserIds) ? fundraiserIds : [];

  // Przygotuj kontrakty dla wszystkich fundraiserów - tylko gdy mamy ID
  const fundraiserCalls = validIds.length > 0 ? validIds.map((id: bigint) => ({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getFundraiserSummary',
    args: [id],
    chainId: sepolia.id,
  })) : [];

  console.log('🔍 Prepared calls:', fundraiserCalls.length);

  // Pobierz szczegóły wszystkich fundraiserów jednocześnie używając useReadContracts
  const { data: contractsData, isLoading: dataLoading, error: dataError, refetch: refetchData } = useReadContracts({
    contracts: fundraiserCalls,
    query: {
      enabled: fundraiserCalls.length > 0, // Tylko gdy mamy wywołania do wykonania
    },
  });

  console.log('🔍 Contracts data:', contractsData);

  // Przetwórz dane na format Campaign
  const campaigns: Campaign[] = contractsData && Array.isArray(contractsData) ? contractsData.map((res, idx) => {
    if (!res || !res.result || res.error) {
      console.error(`❌ Error fetching fundraiser ${validIds[idx]}:`, res?.error);
      return null;
    }

    try {
      // getFundraiserSummary zwraca strukturę FundraiserSummary
      const summary = res.result;
      
      console.log(`🔍 Processing summary for ID ${validIds[idx]}:`, summary);

      // Sprawdź czy to struktura (object) z polami
      if (summary && typeof summary === 'object' && 'id' in summary) {
        console.log('✅ Processing as struct object');
        return {
          id: summary.id,
          creator: summary.creator as `0x${string}`,
          token: summary.token as `0x${string}`,
          target: summary.target,
          raised: summary.raised,
          endTime: summary.endTime,
          isFlexible: summary.isFlexible,
          closureInitiated: summary.closureInitiated,
          campaignId: idx,
        } as Campaign;
      }

      // Jeśli zwraca tuple (array) - fallback
      if (Array.isArray(summary) && summary.length >= 8) {
        console.log('✅ Processing as tuple array');
        const [id, creator, token, target, raised, endTime, isFlexible, closureInitiated] = summary;
        return {
          id,
          creator: creator as `0x${string}`,
          token: token as `0x${string}`,
          target,
          raised,
          endTime,
          isFlexible,
          closureInitiated,
          campaignId: idx,
        } as Campaign;
      }

      console.error(`❌ Unexpected summary format for fundraiser ${validIds[idx]}:`, summary);
      return null;
    } catch (error) {
      console.error(`❌ Error processing fundraiser ${validIds[idx]}:`, error);
      return null;
    }
  }).filter((campaign): campaign is Campaign => campaign !== null) : [];

  console.log('📊 Final processed campaigns:', campaigns);

  return {
    campaigns,
    isLoading: idsLoading || dataLoading,
    error: idsError || dataError,
    refetchCampaigns: () => {
      console.log('🔄 Refetching campaigns...');
      refetchIds();
      if (fundraiserCalls.length > 0) {
        refetchData();
      }
    },
    campaignCount: campaigns.length,
  };
}

// Hook do pobierania wszystkich propozycji - NAPRAWIONY
export function useGetAllProposals() {
  // Pobierz wszystkie ID propozycji
  const { data: proposalIds, isLoading: idsLoading, error: idsError, refetch: refetchIds } = useReadContract({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getAllProposalIds',
    chainId: sepolia.id,
  });

  console.log('🔍 Proposal IDs from contract:', proposalIds);

  const validIds = Array.isArray(proposalIds) ? proposalIds : [];

  // Przygotuj kontrakty dla wszystkich propozycji - tylko gdy mamy ID
  const proposalCalls = validIds.length > 0 ? validIds.map((id: bigint) => ({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getProposalSummary',
    args: [id],
    chainId: sepolia.id,
  })) : [];

  console.log('🔍 Prepared proposal calls:', proposalCalls.length);

  // Pobierz szczegóły wszystkich propozycji jednocześnie używając useReadContracts
  const { data: contractsData, isLoading: dataLoading, error: dataError, refetch: refetchData } = useReadContracts({
    contracts: proposalCalls,
    query: {
      enabled: proposalCalls.length > 0, // Tylko gdy mamy wywołania do wykonania
    },
  });

  console.log('🔍 Proposal contracts data:', contractsData);

  // Przetwórz dane na format Proposal
  const proposals: Proposal[] = contractsData && Array.isArray(contractsData) ? contractsData.map((res, idx) => {
    if (!res || !res.result || res.error) {
      console.error(`❌ Error fetching proposal ${validIds[idx]}:`, res?.error);
      return null;
    }

    try {
      // getProposalSummary zwraca strukturę ProposalSummary
      const summary = res.result;
      
      console.log(`🔍 Processing proposal summary for ID ${validIds[idx]}:`, summary);

      // Sprawdź czy to struktura (object) z polami
      if (summary && typeof summary === 'object' && 'id' in summary) {
        console.log('✅ Processing proposal as struct object');
        return {
          id: summary.id,
          question: summary.question,
          yesVotes: summary.yesVotes,
          noVotes: summary.noVotes,
          endTime: summary.endTime,
          creator: summary.creator as `0x${string}`,
          proposalId: idx,
        } as Proposal;
      }

      // Jeśli zwraca tuple (array) - fallback
      if (Array.isArray(summary) && summary.length >= 6) {
        console.log('✅ Processing proposal as tuple array');
        const [id, question, yesVotes, noVotes, endTime, creator] = summary;
        return {
          id,
          question,
          yesVotes,
          noVotes,
          endTime,
          creator: creator as `0x${string}`,
          proposalId: idx,
        } as Proposal;
      }

      console.error(`❌ Unexpected proposal summary format for proposal ${validIds[idx]}:`, summary);
      return null;
    } catch (error) {
      console.error(`❌ Error processing proposal ${validIds[idx]}:`, error);
      return null;
    }
  }).filter((proposal): proposal is Proposal => proposal !== null) : [];

  console.log('🗳️ Final processed proposals:', proposals);

  return {
    proposals,
    isLoading: idsLoading || dataLoading,
    error: idsError || dataError,
    refetchProposals: () => {
      console.log('🔄 Refetching proposals...');
      refetchIds();
      if (proposalCalls.length > 0) {
        refetchData();
      }
    },
    proposalCount: proposals.length,
  };
}