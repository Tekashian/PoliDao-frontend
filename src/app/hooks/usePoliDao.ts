// src/hooks/useCrowdfund.ts
import { useReadContract } from 'wagmi';
import { polidaoContractConfig } from '../blockchain/contracts'; // teraz używamy PoliDao
import { sepolia } from '@reown/appkit/networks';              // sieć Sepolia

// Typ pojedynczej kampanii, zgodny ze strukturą z ABI PoliDao
export interface Campaign {
  creator: `0x${string}`;         // adres twórcy kampanii
  acceptedToken: `0x${string}`;   // adres tokena (USDC)
  targetAmount: bigint;           // docelowa kwota w najmniejszych jednostkach tokena
  raisedAmount: bigint;           // dotychczas zebrana kwota
  totalEverRaised: bigint;        // całościowa kwota (jeśli np. były zwroty)
  dataCID: string;                // CID metadanych na IPFS
  endTime: bigint;                // timestamp zakończenia kampanii
  status: number;                 // status kampanii (enum)
  creationTimestamp: bigint;      // timestamp utworzenia
  reclaimDeadline: bigint;        // deadline na zwrot środków po nieudanej kampanii
  campaignType: number;           // typ kampanii (enum)
  campaignId?: number;            // lokalne ID przypisane na podstawie indeksu w tablicy
}

export function useGetAllCampaigns() {
  const {
    data: allCampaignsData,
    isLoading,
    error,
    refetch
  } = useReadContract({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getAllCampaigns',
    chainId: sepolia.id,
  });

  // Dodajemy campaignId na podstawie pozycji w zwróconej tablicy
  const campaignsWithIds = allCampaignsData?.map((campaign, index) => ({
    ...campaign,
    campaignId: index,
  })) as Campaign[] | undefined;

  return {
    campaigns: campaignsWithIds,
    isLoading,
    error,
    refetchCampaigns: refetch,
  };
}
