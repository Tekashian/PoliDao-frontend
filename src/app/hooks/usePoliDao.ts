import { useAccount, useReadContracts } from 'wagmi';
import { polidaoContractConfig } from '../blockchain/contracts';
import { sepolia } from '@reown/appkit/networks';

export interface Campaign {
  id: number;
  creator: `0x${string}`;
  token: `0x${string}`;
  target: bigint;
  raised: bigint;
  endTime: bigint;
  isFlexible: boolean;
  closureInitiated: boolean;
}

export function useGetAllCampaigns() {
  const { address } = useAccount();

  const fundraiserIds = useReadContracts({
    contracts: [
      {
        address: polidaoContractConfig.address,
        abi: polidaoContractConfig.abi,
        functionName: 'getAllFundraiserIds',
        chainId: sepolia.id,
      },
    ],
  });

  const ids = fundraiserIds.data?.[0]?.result as bigint[] | undefined;

  const fundraiserCalls = ids?.map((id) => ({
    address: polidaoContractConfig.address,
    abi: polidaoContractConfig.abi,
    functionName: 'getFundraiserSummary',
    args: [id],
    chainId: sepolia.id,
  })) ?? [];

  const { data: campaignData, isLoading, error, refetch } = useReadContracts({
    contracts: fundraiserCalls,
  });

  const campaigns = campaignData?.map((res, idx) => {
    const [id, creator, token, target, raised, endTime, isFlexible, closureInitiated] = res.result as any[];
    return {
      id: Number(id),
      creator,
      token,
      target,
      raised,
      endTime,
      isFlexible,
      closureInitiated,
    } as Campaign;
  });

  return {
    campaigns,
    isLoading,
    error,
    refetchCampaigns: refetch,
  };
}
