// src/app/campaigns/[id]/page.tsx - INSPIROWANE DZIAŁAJĄCYM PROJEKTEM
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
  IconButton,
  useTheme,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Share,
  ArrowBack,
  ContentCopy,
  CheckCircle,
  VolunteerActivism,
} from "@mui/icons-material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Image from 'next/image';

// Reown AppKit hooks
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { Interface, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import { poliDaoRouterAbi } from '../../../blockchain/routerAbi';
import { ROUTER_ADDRESS } from '../../../blockchain/contracts';
import { poliDaoAnalyticsAbi } from '../../../blockchain/analyticsAbi';
import { poliDaoCoreAbi } from '../../../blockchain/coreAbi';
// NEW: fixed analytics address
import { ANALYTICS_ADDRESS } from '../../../blockchain/contracts';
// NEW: Storage ABI for resolving Updates and fallback events
import { poliDaoStorageAbi } from '../../../blockchain/storageAbi';

// usuwamy helper i typ progresu z contracts – progres tylko z Routera via wagmi
// import { fetchFundraiserProgress, type RouterFundraiserProgress } from '../../../blockchain/contracts';
import { sepolia } from 'viem/chains'; // <-- dodany import

// ERC20 ABI inline
const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  },
] as const;

// Contract configuration
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS as `0x${string}`; // usuwamy
const PLACEHOLDER_IMAGE = '/images/zbiorka.png';

interface FundraiserData {
  id: string;
  creator: `0x${string}`;
  token: `0x${string}`;
  target: bigint;
  raised: bigint;
  endTime: bigint;
  isFlexible: boolean;
  closureInitiated: boolean;
  reclaimDeadline: bigint;
  fundsWithdrawn: boolean;
  // pobrane z Core ABI: getFundraiserDetails
  title?: string;
  description?: string;
}

interface DonationLog {
  donor: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

interface Update {
  content: string;
  timestamp: number;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// NEW: key for Media module to probe initialImages via Core.staticCallModule
const MEDIA_KEY = keccak256(toUtf8Bytes('MEDIA')) as `0x${string}`;

// NEW: key for Updates routing via Router
const UPDATES_KEY = keccak256(toUtf8Bytes('UPDATES')) as `0x${string}`;

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  
  // Reown AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  // WSZYSTKIE useState muszą być na górze - stała kolejność
  const [campaignData, setCampaignData] = useState<FundraiserData | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [pendingDonationAmount, setPendingDonationAmount] = useState<bigint | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [donations, setDonations] = useState<DonationLog[]>([]);
  const [uniqueDonorsCount, setUniqueDonorsCount] = useState(0);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newUpdateText, setNewUpdateText] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [donors, setDonors] = useState<{ address: string; amount: number }[]>([]);
  const [donorsLimit] = useState(50);
  const [campaignImage, setCampaignImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // WSZYSTKIE stałe i zmienne pochodne
  const campaignId = params.id as string;
  const idNum = Number(campaignId);
  const invalid = !campaignId || Number.isNaN(idNum) || idNum < 0;

  // WSZYSTKIE useMemo muszą być w stałej kolejności
  const calls = useMemo(() => {
    if (invalid) return [];
    const primary = {
      address: ROUTER_ADDRESS,
      abi: poliDaoRouterAbi,
      functionName: 'getFundraiserDetails',
      args: [BigInt(idNum)],
      chainId: sepolia.id,
    } as const;
    const alt = idNum > 0 ? {
      address: ROUTER_ADDRESS,
      abi: poliDaoRouterAbi,
      functionName: 'getFundraiserDetails',
      args: [BigInt(idNum - 1)],
      chainId: sepolia.id,
    } as const : null;
    return alt ? [primary, alt] : [primary];
  }, [idNum, invalid]);

  // PRZENIESIONE: useReadContracts PRZED useMemo który używa data
  const { data, isLoading, error: contractError } = useReadContracts({
    contracts: calls,
    query: { enabled: calls.length > 0 }
  });

  // TERAZ możemy bezpiecznie użyć data w useMemo
  const parsed = useMemo(() => {
    if (!data || !Array.isArray(data)) return null;
    for (let i = 0; i < data.length; i++) {
      const res = data[i];
      if (!res || res.error || !res.result) continue;
      const raw: any = res.result;
      const creator = (raw.creator ?? raw[9] ?? ZERO_ADDR) as string;
      if (creator && creator.toLowerCase() !== ZERO_ADDR) {
        const endDate = (raw.endDate ?? raw[3] ?? 0n) as bigint;
        const fundraiserType = Number(raw.fundraiserType ?? raw[4] ?? 0);
        const token = (raw.token ?? raw[6] ?? ZERO_ADDR) as `0x${string}`;
        const goalAmount = (raw.goalAmount ?? raw[7] ?? 0n) as bigint;
        const raisedAmount = (raw.raisedAmount ?? raw[8] ?? 0n) as bigint;
        const status = Number(raw.status ?? raw[5] ?? 0);
        const title = (raw.title ?? raw[0] ?? '') as string;
        const description = (raw.description ?? raw[1] ?? '') as string;
        const realId = i === 0 ? idNum : Math.max(idNum - 1, 0);
        return {
          id: realId,
          creator: creator as `0x${string}`,
          token,
          goalAmount,
          raisedAmount,
          endDate,
          isFlexible: goalAmount === 0n || fundraiserType === 1,
          status,
          title,
          description,
        };
      }
    }
    return null;
  }, [data, idNum]);

  // Choose first valid response (creator != zero) and normalize
  const selectedFundraiserId = parsed ? parsed.id : null;
  const selectedIdKey = selectedFundraiserId ?? -1;

  // PRZENIEŚ chainKey i decimalsKey TUTAJ - przed wszystkimi useReadContract
  const chainKey = useMemo(() => Number(chainId ?? 0), [chainId]);

  // Progres pobieramy WYŁĄCZNIE z Routera via wagmi
  const { 
    data: progressTuple, 
    error: progressError,
    isLoading: isProgressLoading,
    refetch: refetchProgress 
  } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'getFundraiserProgress',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId)] : undefined,
    chainId: sepolia.id,
    query: { enabled: selectedFundraiserId !== null },
  });

  const {
    data: tokenSymbol,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "symbol",
    chainId: sepolia.id,
    query: { enabled: !!campaignData?.token },
  });

  const {
    data: tokenDecimals,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: sepolia.id,
    query: { enabled: !!campaignData?.token },
  });

  // TERAZ decimalsKey może być zdefiniowany TUTAJ
  const decimalsKey = useMemo(() => Number(tokenDecimals ?? 6), [tokenDecimals]);
  
  // Etherscan base (Sepolia)
  const ETHERSCAN_BASE = 'https://sepolia.etherscan.io';

  const { data: coreAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'coreContract',
    chainId: sepolia.id,
  });

  const { data: coreSpender } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'spenderAddress',
    chainId: sepolia.id,
    query: { enabled: !!coreAddress },
  });

  const { data: analyticsAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'analyticsModule',
    chainId: sepolia.id,
    query: { enabled: !!coreAddress },
  });

  const { data: storageAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'storageContract',
    chainId: sepolia.id,
    query: { enabled: !!coreAddress },
  });

  const { data: updatesModuleAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'updatesModule',
    chainId: sepolia.id,
    query: { enabled: !!coreAddress },
  });

  const { data: updatesAddrFromStorage } = useReadContract({
    address: storageAddress as `0x${string}` | undefined,
    abi: poliDaoStorageAbi,
    functionName: 'modules',
    args: [UPDATES_KEY],
    chainId: sepolia.id,
    query: { enabled: !!storageAddress },
  });

  // WSZYSTKIE useMemo dla derived values
  const analyticsResolved = useMemo(() => {
    const zero = ZERO_ADDR.toLowerCase();
    const fixed = (ANALYTICS_ADDRESS as string | undefined)?.toLowerCase?.();
    const fromCore = (analyticsAddress as string | undefined)?.toLowerCase?.();
    if (fixed && fixed !== zero) return ANALYTICS_ADDRESS as `0x${string}`;
    if (fromCore && fromCore !== zero) return analyticsAddress as `0x${string}`;
    return undefined;
  }, [analyticsAddress]);

  const updatesResolved = useMemo(() => {
    const zero = ZERO_ADDR.toLowerCase();
    const fromStorage = (updatesAddrFromStorage as string | undefined)?.toLowerCase?.();
    const fromCore = (updatesModuleAddress as string | undefined)?.toLowerCase?.();
    const chosen =
      fromStorage && fromStorage !== zero ? (updatesAddrFromStorage as `0x${string}`) :
      fromCore && fromCore !== zero ? (updatesModuleAddress as `0x${string}`) :
      undefined;
    return chosen;
  }, [updatesAddrFromStorage, updatesModuleAddress]);

  // Pozostałe useReadContract calls
  const { data: donorsCountData, refetch: refetchDonorsCount } = useReadContract({
    address: analyticsResolved,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonorsCount',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId)] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!analyticsResolved && selectedFundraiserId !== null },
  });

  const { data: donorsData, refetch: refetchDonors } = useReadContract({
    address: analyticsResolved,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonors',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId), 0n, BigInt(donorsLimit)] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!analyticsResolved && selectedFundraiserId !== null },
  });

  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: sepolia.id,
    query: { enabled: !!campaignData?.token && !!address },
  });

  // useWriteContract hooks
  const { 
    writeContract, 
    isPending: isDonating, 
    data: donateHash 
  } = useWriteContract();
  
  const { 
    writeContract: writeApproval, 
    isPending: isApproving,
    data: approvalHash 
  } = useWriteContract();

  const {
	writeContract: writeUpdate,
	isPending: isPostingUpdate,
	data: updateHash
  } = useWriteContract();

  // useWaitForTransactionReceipt hooks
  const { 
    isLoading: isDonationConfirming, 
    isSuccess: isDonationSuccess 
  } = useWaitForTransactionReceipt({
    hash: donateHash,
  });

  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalSuccess 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const {
    isLoading: isUpdateConfirming,
    isSuccess: isUpdateSuccess
  } = useWaitForTransactionReceipt({
    hash: updateHash,
  });

  // Memoized values dla spender logic
  const spenderCandidates = React.useMemo(() => {
    const list: string[] = [];
    if (coreSpender && String(coreSpender).toLowerCase() !== ZERO_ADDR.toLowerCase()) list.push(String(coreSpender));
    if (coreAddress && String(coreAddress).toLowerCase() !== ZERO_ADDR.toLowerCase()) list.push(String(coreAddress));
    return Array.from(new Set(list.map(x => x.toLowerCase()))) as `0x${string}`[];
  }, [coreSpender, coreAddress]);

  const allowanceCalls = React.useMemo(() => {
    if (!campaignData?.token || !address || spenderCandidates.length === 0) return [];
    return spenderCandidates.map((sp) => ({
      address: campaignData.token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance' as const,
      args: [address as `0x${string}`, sp],
      chainId: sepolia.id,
    }));
  }, [campaignData?.token, address, spenderCandidates]);

  const { data: allowancesMulti, refetch: refetchAllowancesMulti } = useReadContracts({
    contracts: allowanceCalls,
    query: { enabled: allowanceCalls.length > 0 },
  });

  const allowanceBySpender = React.useMemo(() => {
    const map = new Map<string, bigint>();
    if (!allowancesMulti) return map;
    spenderCandidates.forEach((sp, i) => {
      const val = (allowancesMulti[i] as any)?.result as bigint | undefined;
      map.set(sp.toLowerCase(), typeof val === 'bigint' ? val : 0n);
    });
    return map;
  }, [allowancesMulti, spenderCandidates]);

  const bestSpenderWithAllowance = React.useCallback((minAmount: bigint) => {
    for (const sp of spenderCandidates) {
      const a = allowanceBySpender.get(sp.toLowerCase()) ?? 0n;
      if (a >= minAmount) return sp;
    }
    return null as `0x${string}` | null;
  }, [spenderCandidates, allowanceBySpender]);

  const firstSpenderToApprove = React.useMemo(() => {
    return (spenderCandidates[0] ?? null) as `0x${string}` | null;
  }, [spenderCandidates]);

  // KPIs calculation - MUSI być przed early returns
  const { avgDonation, maxDonation, series14 } = useMemo(() => {
    const total = donations.reduce((s, d) => s + (d.amount || 0), 0);
    const count = donations.length;
    const avg = count > 0 ? total / count : 0;
    const max = donations.reduce((m, d) => Math.max(m, d.amount || 0), 0);
    const days = 14;
    const oneDay = 24 * 60 * 60 * 1000;
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const buckets = new Array(days).fill(0);
    for (const d of donations) {
      const dt0 = new Date(d.timestamp); dt0.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today0.getTime() - dt0.getTime()) / oneDay);
      if (diffDays >= 0 && diffDays < days) {
        const idx = days - 1 - diffDays;
        buckets[idx] += d.amount || 0;
      }
    }
    return { avgDonation: avg, maxDonation: max, series14: buckets };
  }, [donations]);

  // WSZYSTKIE useEffect w stałej kolejności - bez warunków na początku
  
  // 1. Set up campaign data
  useEffect(() => {
    if (invalid) {
      setError("Nieprawidłowy ID kampanii");
      setLoading(false);
      return;
    }
    if (isLoading) {
      setLoading(true);
      return;
    }
    if (contractError) {
      setError(`Błąd pobierania danych kampanii: ${contractError.message}`);
      setLoading(false);
      return;
    }
    if (!parsed) {
      setError("Nie udało się znaleźć zbiórki dla podanego ID");
      setLoading(false);
      return;
    }

    if (progressError) {
      console.warn('getFundraiserProgress failed:', progressError);
    }

    const p = progressTuple ? parseProgressTuple(progressTuple as any) : null;
    const raised = (p?.raised ?? parsed.raisedAmount ?? 0n) as bigint;
    const goal = (p?.goal ?? parsed.goalAmount ?? 0n) as bigint;
    const donorsCount = (p?.donorsCount ?? 0n) as bigint;

    setCampaignData({
      id: parsed.id.toString(),
      creator: parsed.creator,
      token: parsed.token,
      target: goal,
      raised,
      endTime: parsed.endDate,
      isFlexible: parsed.isFlexible,
      closureInitiated: false,
      reclaimDeadline: 0n,
      fundsWithdrawn: parsed.status === 2,
      title: parsed.title,
      description: parsed.description,
    });
    setUniqueDonorsCount(Number(donorsCount));
    setError(null);
    setLoading(false);
  }, [invalid, isLoading, contractError, parsed, progressTuple, progressError]);

  // 2. Update refresh time
  useEffect(() => {
    if (progressTuple) setLastRefreshTime(Date.now());
  }, [progressTuple]);

  // 3. Check ownership
  useEffect(() => {
    if (!campaignData || !address) {
      setIsOwner(false);
      return;
    }
    setIsOwner(campaignData.creator.toLowerCase() === address.toLowerCase());
  }, [campaignData, address]);

  // 4. Unified unique donors count
  useEffect(() => {
    let nextCount: number | undefined;

    if (typeof donorsCountData === 'bigint' && donorsCountData > 0n) {
      nextCount = Number(donorsCountData);
    } else {
      if (donorsData) {
        const tuple = donorsData as any;
        const totalFromTuple = tuple?.total ?? tuple?.[2];
        if (typeof totalFromTuple === 'bigint' && totalFromTuple > 0n) {
          nextCount = Number(totalFromTuple);
        }
      }
      if (nextCount === undefined && Array.isArray(donors) && donors.length > 0) {
        const uniq = new Set(donors.map(d => d.address.toLowerCase()));
        nextCount = uniq.size;
      }
      if (nextCount === undefined && Array.isArray(donations) && donations.length > 0) {
        const uniq = new Set(donations.map(d => d.donor.toLowerCase()));
        nextCount = uniq.size;
      }
      if (nextCount === undefined && typeof donorsCountData === 'bigint') {
        nextCount = Number(donorsCountData);
      }
    }

    if (typeof nextCount === 'number') {
      setUniqueDonorsCount(nextCount);
    }
  }, [donorsCountData, donorsData, donors, donations]);

  // 5. Fallback donors list
  useEffect(() => {
    if (!donations || donations.length === 0) return;
    if (Array.isArray(donors) && donors.length > 0) return;
    const totals = new Map<string, number>();
    for (const d of donations) {
      const key = d.donor.toLowerCase();
      totals.set(key, (totals.get(key) ?? 0) + d.amount);
    }
    const aggregated = Array.from(totals.entries())
      .map(([address, amount]) => ({ address, amount }))
      .sort((a, b) => b.amount - a.amount);
    setDonors(aggregated);
  }, [donations, donors.length]);

  // 6. Fetch donation logs
  useEffect(() => {
    if (selectedIdKey < 0) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      console.warn('Brak RPC URL');
      setDonations([]);
      return;
    }

    let disposed = false;

    const fetchDonationLogs = async () => {
      try {
        const provider = new JsonRpcProvider(rpcUrl);

        const fundraiserTopic = '0x' + BigInt(selectedIdKey).toString(16).padStart(64, '0');

        const parseLogs = async (logs: any[], iface: Interface) => {
          const items = await Promise.all(
            logs.map(async (log) => {
              try {
                const decoded = iface.parseLog(log as any);
                const args = decoded.args as any;

                const fundraiserId = (args?.fundraiserId ?? args?.id ?? args?.[0] ?? null) as bigint | null;
                if (fundraiserId === null || Number(fundraiserId) !== Number(selectedIdKey)) return null;

                const donor = (args?.donor ?? args?.[1] ?? ZERO_ADDR) as string;
                const amountRaw = (args?.amount ?? args?.[3] ?? 0n) as bigint;

                const block = await provider.getBlock(log.blockHash!);
                const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();

                return {
                  donor: donor?.toLowerCase?.() || ZERO_ADDR,
                  amount: Number(formatUnits(amountRaw, decimalsKey)),
                  timestamp: tsMs,
                  txHash: log.transactionHash || '',
                } as DonationLog;
              } catch {
                return null;
              }
            })
          );

          return items.filter((x): x is DonationLog => !!x).sort((a, b) => b.timestamp - a.timestamp);
        };

        // 1) Try Core logs
        let items: DonationLog[] = [];
        if (coreAddress) {
          const coreIface = new Interface(poliDaoCoreAbi as any);
          const coreEv = (coreIface as any).getEvent?.('DonationMade') ?? (coreIface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
          const coreTopic = (coreIface as any).getEventTopic ? (coreIface as any).getEventTopic(coreEv) : (coreIface as any).getEventTopic?.('DonationMade');

          const coreStart = process.env.NEXT_PUBLIC_CORE_START_BLOCK;
          const fromBlockCore = coreStart ? BigInt(coreStart) : 0n;

          const logsCore = await provider.getLogs({
            address: coreAddress as string,
            fromBlock: fromBlockCore,
            toBlock: 'latest',
            topics: [coreTopic, fundraiserTopic],
          });

          if (logsCore.length > 0) {
            items = await parseLogs(logsCore, coreIface);
          }
        }

        // 2) Fallback to Router logs if Core empty
        if (!items.length) {
          const routerIface = new Interface(poliDaoRouterAbi as any);
          const routerEv = (routerIface as any).getEvent?.('DonationMade') ?? (routerIface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
          const routerTopic = (routerIface as any).getEventTopic ? (routerIface as any).getEventTopic(routerEv) : (routerIface as any).getEventTopic?.('DonationMade');

          const routerStart = process.env.NEXT_PUBLIC_ROUTER_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK;
          const fromBlockRouter = routerStart ? BigInt(routerStart) : 0n;

          const logsRouter = await provider.getLogs({
            address: ROUTER_ADDRESS as string,
            fromBlock: fromBlockRouter,
            toBlock: 'latest',
            topics: [routerTopic, fundraiserTopic],
          });

          if (logsRouter.length > 0) {
            items = await parseLogs(logsRouter, routerIface);
          }
        }

        if (!disposed) setDonations(items);
      } catch (err) {
        console.warn('Błąd pobierania logów donacji:', err);
        if (!disposed) setDonations([]);
      }
    };

    fetchDonationLogs();
    const interval = setInterval(fetchDonationLogs, 15000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [selectedIdKey, chainKey, decimalsKey, coreAddress]);

  // 8. Fetch updates
  useEffect(() => {
    if (selectedIdKey < 0) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      console.warn('Brak RPC URL');
      return;
    }

    let disposed = false;

    const fetchUpdates = async () => {
      try {
        const provider = new JsonRpcProvider(rpcUrl);

        // 1) Try Updates module (resolved via Storage, fallback Core)
        let entriesFromUpdates: Update[] = [];
        if (updatesResolved) {
          const uiface = new Interface([
            'event UpdatePosted(uint256 indexed updateId, uint256 indexed fundraiserId, address indexed author, string content, uint8 updateType)'
          ] as any);
          const ev = (uiface as any).getEvent?.('UpdatePosted') ?? (uiface.fragments.find((f: any) => f.type === 'event' && f.name === 'UpdatePosted'));
          if (ev) {
            const topic0 = (uiface as any).getEventTopic ? (uiface as any).getEventTopic(ev) : (uiface as any).getEventTopic?.('UpdatePosted');

            // Simplify topics: only signature; filter by fundraiserId after decoding
            const logs = await provider.getLogs({
              address: updatesResolved as string,
              fromBlock: (process.env.NEXT_PUBLIC_UPDATES_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK) ? BigInt(process.env.NEXT_PUBLIC_UPDATES_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK!) : 0n,
              toBlock: 'latest',
              topics: [topic0],
            });

            const parsed = await Promise.all(
              logs.map(async (log) => {
                try {
                  const decoded = uiface.parseLog(log as any);
                  const args = decoded.args as any;
                  const fid = Number(args?.fundraiserId ?? args?.[1] ?? -1);
                  if (fid !== Number(selectedIdKey)) return null;
                  const block = await provider.getBlock(log.blockHash!);
                  const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
                  const content = String(args?.content ?? '');
                  return { content, timestamp: tsMs } as Update;
                } catch {
                  return null;
                }
              })
            );
            entriesFromUpdates = parsed.filter((x): x is Update => !!x).sort((a, b) => b.timestamp - a.timestamp);
          }
        }

        // 2) Fallback to Storage events if no UpdatePosted found
        if (entriesFromUpdates.length === 0 && storageAddress) {
          const sIface = new Interface(poliDaoStorageAbi as any);

          const evTitle = (sIface as any).getEvent?.('FundraiserTitleUpdated') ?? (sIface.fragments.find((f: any) => f.type === 'event' && f.name === 'FundraiserTitleUpdated'));
          const evDesc  = (sIface as any).getEvent?.('FundraiserDescriptionUpdated') ?? (sIface.fragments.find((f: any) => f.type === 'event' && f.name === 'FundraiserDescriptionUpdated'));
          const evLoc   = (sIface as any).getEvent?.('FundraiserLocationUpdated') ?? (sIface.fragments.find((f: any) => f.type === 'event' && f.name === 'FundraiserLocationUpdated'));

          const topicTitle = (sIface as any).getEventTopic ? (sIface as any).getEventTopic(evTitle) : (sIface as any).getEventTopic?.('FundraiserTitleUpdated');
          const topicDesc  = (sIface as any).getEventTopic ? (sIface as any).getEventTopic(evDesc)  : (sIface as any).getEventTopic?.('FundraiserDescriptionUpdated');
          const topicLoc   = (sIface as any).getEventTopic ? (sIface as any).getEventTopic(evLoc)   : (sIface as any).getEventTopic?.('FundraiserLocationUpdated');

          // Simplify topics: only signature; filter by fundraiserId after decode
          const [logsTitle, logsDesc, logsLoc] = await Promise.all([
            provider.getLogs({
              address: storageAddress as string,
              fromBlock: (process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK) ? BigInt(process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK!) : 0n,
              toBlock: 'latest',
              topics: [topicTitle],
            }),
            provider.getLogs({
              address: storageAddress as string,
              fromBlock: (process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK) ? BigInt(process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK!) : 0n,
              toBlock: 'latest',
              topics: [topicDesc],
            }),
            provider.getLogs({
              address: storageAddress as string,
              fromBlock: (process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK) ? BigInt(process.env.NEXT_PUBLIC_STORAGE_START_BLOCK || process.env.NEXT_PUBLIC_CORE_START_BLOCK!) : 0n,
              toBlock: 'latest',
              topics: [topicLoc],
            }),
          ]);

          const parseSet = async (logs: any[], kind: 'title' | 'description' | 'location'): Promise<Update[]> => {
            const mapped = await Promise.all(
              logs.map(async (log) => {
                try {
                  const decoded = sIface.parseLog(log as any);
                  const args = decoded.args as any;
                  const fid = Number(args?.fundraiserId ?? args?.[0] ?? -1);
                  if (fid !== Number(selectedIdKey)) return null;
                  const block = await provider.getBlock(log.blockHash!);
                  const tsMs = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
                  let content = '';
                  if (kind === 'title') content = `Zmieniono tytuł: ${String(args?.newTitle ?? '')}`;
                  if (kind === 'description') content = `Zmieniono opis: ${String(args?.newDescription ?? '')}`;
                  if (kind === 'location') content = `Zmieniono lokalizację: ${String(args?.newLocation ?? '')}`;
                  return { content, timestamp: tsMs } as Update;
                } catch {
                  return null;
                }
              })
            );
            return mapped.filter((x): x is Update => !!x);
          };

          const [tE, dE, lE] = await Promise.all([
            parseSet(logsTitle, 'title'),
            parseSet(logsDesc, 'description'),
            parseSet(logsLoc, 'location'),
          ]);

          entriesFromUpdates = [...tE, ...dE, ...lE].sort((a, b) => b.timestamp - a.timestamp);
        }

        if (!disposed) setUpdates(entriesFromUpdates);
      } catch (err) {
        console.warn('Błąd pobierania aktualności (Updates/Storage):', err);
        if (!disposed) setUpdates((prev) => prev);
      }
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 20000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [selectedIdKey, updatesResolved, storageAddress, chainKey]);

  // 9. Auto-donate after approve
  useEffect(() => {
    const doDonateAfterApprove = async () => {
      if (!isApprovalSuccess) return;
      if (!campaignData || pendingDonationAmount === null) return;
      try {
        await refetchAllowancesMulti?.();
        await writeContract({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: "donate",
          args: [BigInt(campaignData.id), pendingDonationAmount],
          chainId: sepolia.id,
        });
        setNeedsApproval(false);
      } catch (err: any) {
        console.error('Donate after approve failed:', err);
        setSnackbar({ open: true, message: `Donate nie powiódł się: ${err?.message || 'nieznany błąd'}`, severity: 'error' });
      } finally {
        setPendingDonationAmount(null);
      }
    };
    doDonateAfterApprove();
  }, [isApprovalSuccess, campaignData, pendingDonationAmount, refetchAllowancesMulti, writeContract]);

  // 10. Refresh after donation
  useEffect(() => {
    if (isDonationSuccess) {
      setSnackbar({ open: true, message: 'Wpłata została potwierdzona! Odświeżanie danych...', severity: 'success' });
      setTimeout(() => {
        setDonateOpen(false);
        setDonateAmount("");
        setNeedsApproval(false);
        refetchProgress();
        refetchDonorsCount?.();
        refetchDonors?.();
      }, 1200);
    }
  }, [isDonationSuccess, refetchProgress, refetchDonorsCount, refetchDonors]);

  // 11. Fetch campaign image - ZAWSZE wywoływany
  useEffect(() => {
    if (!campaignId) return;
    
    const fetchCampaignImage = async () => {
      try {
        setImageLoading(true);
        const response = await fetch(`/api/campaigns/${campaignId}/images`);
        
        if (response.ok) {
          const data = await response.json();
          setCampaignImage(data.imageUrl);
        } else {
          console.warn('No image found for campaign:', campaignId);
          setCampaignImage(null);
        }
      } catch (error) {
        console.error('Error fetching campaign image:', error);
        setCampaignImage(null);
      } finally {
        setImageLoading(false);
      }
    };

    fetchCampaignImage();
  }, [campaignId]);

  // Handler functions
  const handleAddUpdate = async () => {
    const trimmed = newUpdateText.trim();
    if (!trimmed) return;
    if (!isConnected) {
      setSnackbar({ open: true, message: 'Najpierw połącz portfel!', severity: 'error' });
      return;
    }
    if (!isOwner) {
      setSnackbar({ open: true, message: 'Tylko twórca kampanii może dodawać aktualności.', severity: 'error' });
      return;
    }
    if (chainId !== sepolia.id) {
      setSnackbar({ open: true, message: 'Przełącz sieć na Sepolia.', severity: 'error' });
      return;
    }
    try {
      // Optimistic UI
      setUpdates(prev => [{ content: trimmed, timestamp: Date.now() }, ...prev ]);
      setNewUpdateText('');
      setSnackbar({ open: true, message: 'Wysyłanie aktualności...', severity: 'info' });

      // Encode Updates.postUpdate(uint256,address,string)
      const uiface = new Interface(['function postUpdate(uint256,address,string)']);
      const calldata = uiface.encodeFunctionData('postUpdate', [
        BigInt(campaignData!.id),
        address as `0x${string}`,
        trimmed
      ]) as `0x${string}`;

      await writeUpdate({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'routeModule',
        args: [UPDATES_KEY, calldata],
        chainId: sepolia.id,
      });
    } catch (err: any) {
      setSnackbar({ open: true, message: `Błąd zapisu aktualności: ${err?.message || 'nieznany błąd'}`, severity: 'error' });
    }
  };

  const handleDonate = async () => {
    if (!isConnected || !campaignData) {
      setSnackbar({ open: true, message: 'Najpierw połącz portfel!', severity: 'error' });
      return;
    }
    if (chainId !== sepolia.id) {
      setSnackbar({ open: true, message: 'Przełącz sieć na Sepolia i spróbuj ponownie.', severity: 'error' });
      return;
    }
    if (!donateAmount || isNaN(Number(donateAmount)) || Number(donateAmount) <= 0) {
      setSnackbar({ open: true, message: 'Wprowadź poprawną kwotę!', severity: 'error' });
      return;
    }
    if (!campaignData.id) {
      setSnackbar({ open: true, message: 'Brak ID zbiórki.', severity: 'error' });
      return;
    }
    if (!campaignData.token) {
      setSnackbar({ open: true, message: 'Brak adresu tokena zbiórki.', severity: 'error' });
      return;
    }
    if (!firstSpenderToApprove && spenderCandidates.length === 0) {
      setSnackbar({ open: true, message: 'Nie udało się wyznaczyć adresu spendera (Core).', severity: 'error' });
      return;
    }

    try {
      const decimals = Number(tokenDecimals ?? 6);
      const amount = parseUnits(donateAmount, decimals as any);
      setPendingDonationAmount(amount);

      if (userBalance && amount > (userBalance as bigint)) {
        setSnackbar({ open: true, message: 'Niewystarczający balans tokenów!', severity: 'error' });
        return;
      }

      const readySpender = bestSpenderWithAllowance(amount);

      if (!readySpender) {
        setNeedsApproval(true);
        setSnackbar({ open: true, message: 'Najpierw zatwierdź wydatkowanie tokenów', severity: 'info' });
        await writeApproval({
          address: campaignData.token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [firstSpenderToApprove as `0x${string}`, amount],
          chainId: sepolia.id,
        });
        return; // Donate will run after approval confirmation
      }

      await writeContract({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: "donate",
        args: [BigInt(campaignData.id), amount],
        chainId: sepolia.id,
      });
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setSnackbar({ open: true, message: `Wystąpił błąd: ${error.message || 'Nieznany błąd'}`, severity: 'error' });
    }
  };

  // Show loading state – only core read
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: '#10b981', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Ładowanie kampanii #{campaignId}...
              </Typography>
            </Box>
          </Box>
        </Container>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !campaignData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
          <Alert severity="error" sx={{ mt: 4 }}>
            <Typography variant="h6">Błąd ładowania kampanii</Typography>
            <Typography>{error || "Nie udało się załadować danych kampanii"}</Typography>
          </Alert>
        </Container>
        <Footer />
      </div>
    );
  }

  // Helper: precyzyjne liczenie procentu (do 6 miejsc po przecinku)
  function calcPercentPrecise(raised: bigint, target: bigint) {
    if (!target || target === 0n) return 0;
    const percentMicro = (raised * 100_000_000n) / target; // (raised/target)*100 * 1e6
    return Number(percentMicro) / 1_000_000;
  }

  // Sparkline (inline SVG) for last N points
  function Sparkline({ data }: { data: number[] }) {
    const w = 300, h = 40, pad = 2;
    const n = data.length;
    if (n === 0) return <svg width="100%" height={h} />;
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 1);
    const dx = (w - pad * 2) / Math.max(n - 1, 1);
    const scaleY = (v: number) => {
      if (max === min) return h - pad;
      return h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    };
    const pts = data.map((v, i) => `${pad + i * dx},${scaleY(v)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={pts} />
      </svg>
    );
  }

  // Parser krotki zwracanej przez Router.getFundraiserProgress
  function parseProgressTuple(p: any) {
    // Oczekiwany porządek: [raised, goal, percentage, donorsCount, timeLeft, refundDeadline, isSuspended, suspensionTime]
    if (!p) {
      return {
        raised: 0n,
        goal: 0n,
        percentage: 0n,
        donorsCount: 0n,
        timeLeft: 0n,
        refundDeadline: 0n,
        isSuspended: false,
        suspensionTime: 0n,
      };
    }
    if (Array.isArray(p)) {
      return {
        raised: (p[0] ?? 0n) as bigint,
        goal: (p[1] ?? 0n) as bigint,
        percentage: (p[2] ?? 0n) as bigint,
        donorsCount: (p[3] ?? 0n) as bigint,
        timeLeft: (p[4] ?? 0n) as bigint,
        refundDeadline: (p[5] ?? 0n) as bigint,
        isSuspended: Boolean(p[6] ?? false),
        suspensionTime: (p[7] ?? 0n) as bigint,
      };
    }
    // fallback: próba po nazwach
    return {
      raised: (p.raised ?? 0n) as bigint,
      goal: (p.goal ?? 0n) as bigint,
      percentage: (p.percentage ?? 0n) as bigint,
      donorsCount: (p.donorsCount ?? 0n) as bigint,
      timeLeft: (p.timeLeft ?? 0n) as bigint,
      refundDeadline: (p.refundDeadline ?? 0n) as bigint,
      isSuspended: Boolean(p.isSuspended ?? false),
      suspensionTime: (p.suspensionTime ?? 0n) as bigint,
    };
  }

  // Calculations and display data
  const displayTokenSymbol = tokenSymbol || 'USDC';
  const decimals = decimalsKey;
  const raised = Number(formatUnits(campaignData.raised, decimals));
  const target = Number(formatUnits(campaignData.target, decimals));
  const missing = (target - raised).toFixed(2);
  const progressPercent = campaignData.target > 0n 
    ? calcPercentPrecise(campaignData.raised, campaignData.target)
    : 0;
  const barWidth = progressPercent > 0 ? Math.max(progressPercent, 0.1) : 0;

  // Compute time left locally using endTime
  const nowSec = Math.floor(Date.now() / 1000);
  const timeLeftSeconds = Math.max(0, Number(campaignData.endTime) - nowSec);
  const daysLeft = Math.max(0, Math.floor(timeLeftSeconds / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeftSeconds % (24 * 60 * 60)) / 3600));
  const isActive = timeLeftSeconds > 0 && !campaignData.closureInitiated;

  // tytuł/opis z unified storage (Core), fallback do wartości domyślnych
  const displayTitle = campaignData.title && campaignData.title.trim().length > 0
    ? campaignData.title
    : `Kampania Blockchain #${campaignData.id}`;
  const displayDescription = campaignData.description && campaignData.description.trim().length > 0
    ? campaignData.description
    : "Decentralizowana zbiórka na platformie PoliDAO";

  const displayImage = campaignImage || PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero with blur */}
      <div className="relative w-full h-[600px] -mt-56">
        <div className="absolute inset-0 -z-10">
          <Image
            src={displayImage}
            alt="Tło rozmyte kampanii"
            fill
            className="object-cover object-top w-full h-full blur-lg scale-110"
            priority
          />
          <div className="absolute inset-0 bg-black opacity-20" />
        </div>
      </div>

      <main className="container mx-auto p-6 -mt-[350px] relative z-10">
        {/* Breadcrumb */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton 
            onClick={() => router.push('/')} 
            sx={{ bgcolor: "white", boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            <span style={{ color: '#10b981', fontWeight: 500 }}>PoliDAO</span> / Kampanie / #{campaignData.id}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Ostatnie odświeżenie: {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}
            </Typography>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
          </Box>
        </Box>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <div className="w-full relative rounded-md overflow-hidden shadow-sm h-[600px]">
              {imageLoading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Ładowanie zdjęcia...</span>
                </div>
              ) : (
                <Image
                  src={displayImage}
                  alt={displayTitle}
                  fill
                  className="object-cover object-center w-full h-full"
                  priority
                />
              )}
              <Chip
                label={isActive ? "AKTYWNA!" : "ZAKOŃCZONA"}
                sx={{ 
                  position: "absolute", top: 20, left: 20,
                  bgcolor: isActive ? '#10b981' : '#dc2626',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', px: 2, py: 1, zIndex: 10
                }}
              />
            </div>

            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1F4E79]">Opis kampanii</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700">{displayDescription}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500">Twórca: {`${campaignData.creator.slice(0,6)}...${campaignData.creator.slice(-4)}`}</p>
                  <p className="text-xs text-gray-500">Token: {displayTokenSymbol}</p>
                  <p className="text-xs text-gray-500">Typ: {campaignData.isFlexible ? "🌊 Elastyczna" : "🎯 Z celem"}</p>
                  <p className="text-xs text-gray-500">Data zakończenia: {new Date(Number(campaignData.endTime) * 1000).toLocaleDateString("pl-PL")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1F4E79]">Aktualności</h2>
                <p className="mt-1 text-xs text-gray-500">Najnowsze informacje</p>
              </div>
              <div className="px-6 py-4 max-h-[300px] overflow-auto space-y-4">
                {updates.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Brak aktualności. {isOwner && "Dodaj pierwszą aktualność poniżej."}
                  </p>
                )}
                {updates.map((u, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <p className="text-xs text-gray-700">{u.content}</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {new Date(u.timestamp).toLocaleString('pl-PL')}
                    </p>
                  </div>
                ))}
              </div>
              {isOwner && (
                <div className="border-t border-gray-100 px-6 py-4 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Nowa aktualność..."
                    value={newUpdateText}
                    onChange={e => setNewUpdateText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                  />
                  <button
                    onClick={handleAddUpdate}
                    disabled={isPostingUpdate || isUpdateConfirming}
                    className="w-full py-2 text-base font-medium text-white bg-[#10b981] hover:bg-[#10b981] rounded-md transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_18px_rgba(16,185,129,0.45)] disabled:opacity-50"
                  >
                    {isPostingUpdate || isUpdateConfirming ? 'Zapisywanie...' : 'Dodaj'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#1F4E79]">Historia wpłat</h2>
                <p className="text-xs text-gray-500">Ostatnie wpłaty mogą być opóźnione w czasie</p>
              </div>
              {donations.length === 0 && (
                <p className="px-6 py-4 text-xs text-gray-400">Brak wpłat.</p>
              )}
              {donations.length > 0 && (
                <ul className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
                  {donations.map((d, idx) => (
                    <li key={idx} className="flex justify-between px-6 py-3">
                      <div>
                        <p className="text-sm text-gray-700">
                          {d.donor.slice(0, 6)}…{d.donor.slice(-4)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(d.timestamp).toLocaleString('pl-PL')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <p className="text-sm font-medium text-green-600">
                          {d.amount.toFixed(2)} {displayTokenSymbol}
                        </p>
                        {d.txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline"
                          >
                            Etherscan
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* NEW: Lista donatorów (z Analytics.getDonors) */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#1F4E79]">Lista donatorów</h2>
                <p className="text-xs text-gray-500">Łącznie: {uniqueDonorsCount.toLocaleString('pl-PL')}</p>
              </div>
              {donors.length === 0 ? (
                <p className="px-6 py-4 text-xs text-gray-400">Brak donatorów do wyświetlenia.</p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
                  {donors.map((d, idx) => (
                    <li key={idx} className="flex justify-between px-6 py-3">
                      <a
                        href={`${ETHERSCAN_BASE}/address/${d.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                        title={d.address}
                      >
                        {d.address.slice(0, 6)}…{d.address.slice(-4)}
                      </a>
                      <span className="text-sm font-medium text-gray-900">{d.amount.toFixed(2)} {displayTokenSymbol}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:sticky lg:top-[175px]">
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4">
                <h1 className="text-2xl font-semibold text-[#1F4E79]">{displayTitle}</h1>
              </div>

              <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-medium text-[#10b981]">
                    {raised.toLocaleString('pl-PL')} {displayTokenSymbol}
                  </p>
                </div>
                {campaignData.isFlexible ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-center">
                        <p className="text-lg font-bold text-gray-800">{uniqueDonorsCount.toLocaleString('pl-PL')}</p>
                        <p className="text-[11px] text-gray-500">Wsparło osób</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {avgDonation.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-gray-500">Śr. wpłata</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {maxDonation.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-gray-500">Największa</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Aktywność (ostatnie 14 dni)</p>
                      <Sparkline data={series14} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-base font-normal text-gray-500 mb-2">
                      ({progressPercent.toFixed(2)}%) z {target.toLocaleString('pl-PL')} {displayTokenSymbol}
                    </p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-[#10b981] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Brakuje {missing} {displayTokenSymbol}
                    </p>
                  </>
                )}
              </div>

              <div className="px-6 py-3 bg-gray-50 border-y border-gray-100">
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {uniqueDonorsCount}
                    </p>
                    <p className="text-xs text-gray-500">Wsparło osób</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {daysLeft}
                    </p>
                    <p className="text-xs text-gray-500">Dni pozostało</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {hoursLeft}h
                    </p>
                    <p className="text-xs text-gray-500">Godzin</p>
                  </div>
                </div>
              </div>

              <div className="px-6 mb-4 mt-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Kwota w ${displayTokenSymbol}`}
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                />
                {userBalance !== undefined && (
                  <p className="mt-1 text-xs text-gray-500">
                    💰 Dostępne: {(userBalance ? Number(formatUnits(userBalance as any, decimals)) : 0).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} {displayTokenSymbol}
                  </p>
                )}
              </div>

              <div className="px-6 py-4">
                {!isConnected ? (
                  <div className="text-center">
                    <p className="mb-3 text-gray-600">Połącz portfel aby wesprzeć</p>
                    <appkit-button />
                  </div>
                ) : isActive ? (
                  <button
                    onClick={() => setDonateOpen(true)}
                    disabled={isDonating || isDonationConfirming || isApproving || isApprovalConfirming}
                    className="w-full py-3 text-lg font-semibold text-white bg-[#10b981] hover:bg-[#10b981] rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                  >
                    {isDonating || isDonationConfirming ? (
                      <div className="flex items-center justify-center gap-2">
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                        Przetwarzanie...
                      </div>
                    ) : isApproving || isApprovalConfirming ? (
                      <div className="flex items-center justify-center gap-2">
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                        Zatwierdzanie...
                      </div>
                    ) : (
                      "❤️ Wesprzyj teraz"
                    )}
                  </button>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Kampania zakończona</p>
                  </div>
                )}

                <p className="mt-2 text-center text-xs text-gray-500">
                  Wsparło {uniqueDonorsCount.toLocaleString('pl-PL')} osób
                </p>
              </div>

              <div className="px-6 py-3 flex justify-between border-t border-gray-100">
                <button className="flex flex-col items-center text-blue-500 hover:text-blue-700 transition-colors">
                  <span className="text-xl mb-1">🐷</span>
                  <span className="text-xs">Skarbonka</span>
                </button>
                <button className="flex flex-col items-center text-blue-500 hover:text-blue-700 transition-colors">
                  <span className="text-xl mb-1">📣</span>
                  <span className="text-xs">Promuj</span>
                </button>
                <button 
                  onClick={() => setShareOpen(true)}
                  className="flex flex-col items-center text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <span className="text-xl mb-1">📤</span>
                  <span className="text-xs">Udostępnij</span>
                </button>
              </div>

              <div className="border-t border-gray-100">
                <div className="px-6 py-2 text-xs text-gray-500 space-y-1">
                  <p><strong>Typ kampanii:</strong> {campaignData.isFlexible ? "Elastyczna" : "Z celem"}</p>
                  <p><strong>Status wypłaty:</strong> {campaignData.fundsWithdrawn ? "Wypłacone" : "Oczekuje"}</p>
                  <p><strong>Ostatnie odświeżenie:</strong> {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Donation Dialog */}
      <Dialog 
        open={donateOpen} 
        onClose={() => setDonateOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolunteerActivism sx={{ color: '#10b981' }} />
            Wesprzyj kampanię #{campaignData.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Wpłacasz środki w {displayTokenSymbol}
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label={`Kwota (${displayTokenSymbol})`}
            type="number"
            value={donateAmount}
            onChange={(e) => {
              setDonateAmount(e.target.value);
              setNeedsApproval(false);
            }}
            sx={{ mb: 2 }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Szybka wpłata:</Typography>
            <Grid container spacing={1}>
              {[10, 50, 100, 500].map((amount) => (
                <Grid item xs={6} key={amount}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => setDonateAmount(amount.toString())}
                  >
                    {amount} {displayTokenSymbol}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {needsApproval && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Musisz najpierw zatwierdzić wydatkowanie tokenów {displayTokenSymbol}.
                       </Alert>
          )}
          
          {!campaignData.isFlexible && (
            <Alert severity="info" sx={{ mb: 2 }}>
              To jest zbiórka z celem. Środki mogą być zwrócone jeśli cel nie zostanie osiągnięty.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDonateOpen(false)}>Anuluj</Button>
          <Button
            variant="contained"
            onClick={handleDonate}
            disabled={!donateAmount || Number(donateAmount) <= 0}
            sx={{ 
              bgcolor: '#10b981', 
              '&:hover': { bgcolor: '#10b981', transform: 'scale(1.03)', boxShadow: '0 0 18px rgba(16,185,129,0.45)' },
              transition: 'all .2s ease',
            }}
          >
            {isApproving || isApprovalConfirming ? 'Zatwierdzanie...' : 
             isDonating || isDonationConfirming ? 'Wpłacanie...' : 
             `Wpłać ${donateAmount} ${displayTokenSymbol}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Share sx={{ color: '#10b981' }} />
            Udostępnij kampanię
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth              value={typeof window !== 'undefined' ? window.location.href : ''}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <IconButton 
 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  setSnackbar({ open: true, message: 'Link został skopiowany!', severity: 'success' });
                }
              }} 
              color={copiedLink ? "success" : "primary"}
            >
              {copiedLink ? <CheckCircle /> : <ContentCopy />}
            </IconButton>
          </Box>
          
          {copiedLink && (
            <Alert severity="success">
              ✅ Link został skopiowany do schowka!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)} variant="contained">
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </div>
  );
} // end of CampaignPage