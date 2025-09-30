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
import { Interface, JsonRpcProvider } from 'ethers';
import { poliDaoRouterAbi } from '../../../blockchain/routerAbi';
import { ROUTER_ADDRESS } from '../../../blockchain/contracts';
import { poliDaoCoreAbi } from '../../../blockchain/coreAbi';
import { poliDaoAnalyticsAbi } from '../../../blockchain/analyticsAbi';

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

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  
  // Reown AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  const [campaignData, setCampaignData] = useState<FundraiserData | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [pendingDonationAmount, setPendingDonationAmount] = useState<bigint | null>(null); // <<< zapamiętana kwota do donate
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [donations, setDonations] = useState<DonationLog[]>([]);
  const [uniqueDonorsCount, setUniqueDonorsCount] = useState(0);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newUpdateText, setNewUpdateText] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  // NEW: donors list (aggregated per donor from Analytics)
  const [donors, setDonors] = useState<{ address: string; amount: number }[]>([]);
  const [donorsLimit] = useState(50);

  const campaignId = params.id as string;
  const idNum = Number(campaignId);
  const invalid = !campaignId || Number.isNaN(idNum) || idNum < 0;

  // Probe both id and id-1 to handle 1-based vs 0-based IDs using Router ABI
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

  const { data, isLoading, error: contractError } = useReadContracts({
    contracts: calls,
    query: { enabled: calls.length > 0 }
  });

  // Choose first valid response (creator != zero) and normalize
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

  // Dodatkowo pobierz progres z Routera dla realId (raised, donorsCount, timeLeft itp.)
  const selectedFundraiserId = parsed ? parsed.id : null;

  // ZAMIANA: zamiast wagmi useReadContract dla progresu używamy helpera z ethers
  // const [progress, setProgress] = useState<RouterFundraiserProgress | null>(null);
  // useEffect(() => { ...ethers JsonRpcProvider fetch... }, [selectedFundraiserId, lastRefreshTime])

  // Progres pobieramy WYŁĄCZNIE z Routera via wagmi
  const { data: progressTuple, refetch: refetchProgress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'getFundraiserProgress',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId)] : undefined,
    chainId: sepolia.id,
    query: { enabled: selectedFundraiserId !== null },
  });

  // Set up campaign data z Router.getFundraiserDetails + Router.getFundraiserProgress (tylko z Routera)
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
    // czekamy na progres z Routera – nie korzystamy z parsed.raisedAmount
    if (!progressTuple || !Array.isArray(progressTuple)) {
      setLoading(true);
      return;
    }

    const p = progressTuple as any[];
    const raised = (p[0] ?? 0n) as bigint;
    const goal = (p[1] ?? 0n) as bigint;
    const donors = (p[3] ?? 0n) as bigint;

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
    setUniqueDonorsCount(Number(donors));
    setError(null);
    setLoading(false);
    // nie wywołujemy tu setLastRefreshTime – robimy to, gdy progres się zmieni
  }, [invalid, isLoading, contractError, parsed, progressTuple]);

  // Aktualizuj znacznik odświeżenia, gdy przyjdzie nowy progres
  useEffect(() => {
    if (progressTuple) setLastRefreshTime(Date.now());
  }, [progressTuple]);

  // Check ownership
  useEffect(() => {
    if (!campaignData || !address) {
      setIsOwner(false);
      return;
    }
    setIsOwner(campaignData.creator.toLowerCase() === address.toLowerCase());
  }, [campaignData, address]);

  // >>> Odczyt metadanych tokena (symbol/decimals)
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

  // Stabilne klucze do dependencies
  const selectedIdKey = selectedFundraiserId ?? -1;
  const chainKey = useMemo(() => Number(chainId ?? 0), [chainId]);
  const decimalsKey = useMemo(() => Number(tokenDecimals ?? 6), [tokenDecimals]);

  // NEW: read Core address (the actual spender calling transferFrom)
  const { data: coreAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'coreContract',
    chainId: sepolia.id,
  });

  // NEW: discover Analytics module from Core, then read donors count and donors list
  const { data: analyticsAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'analyticsModule',
    chainId: sepolia.id,
    query: { enabled: !!coreAddress },
  });

  const { data: donorsCountData, refetch: refetchDonorsCount } = useReadContract({
    address: analyticsAddress as `0x${string}` | undefined,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonorsCount',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId)] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!analyticsAddress && selectedFundraiserId !== null },
  });

  const { data: donorsData, refetch: refetchDonors } = useReadContract({
    address: analyticsAddress as `0x${string}` | undefined,
    abi: poliDaoAnalyticsAbi,
    functionName: 'getDonors',
    args: selectedFundraiserId !== null ? [BigInt(selectedFundraiserId), 0n, BigInt(donorsLimit)] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!analyticsAddress && selectedFundraiserId !== null },
  });

  useEffect(() => {
    if (donorsCountData !== undefined) {
      setUniqueDonorsCount(Number(donorsCountData as bigint));
    }
  }, [donorsCountData]);

  useEffect(() => {
    if (!donorsData) return;
    const tuple = donorsData as unknown as { donors: string[]; amounts: bigint[]; total: bigint } | any;
    const addresses: string[] = tuple?.donors ?? tuple?.[0] ?? [];
    const amounts: bigint[] = tuple?.amounts ?? tuple?.[1] ?? [];
    const list = (addresses || []).map((addr, i) => ({
      address: addr,
      amount: Number(formatUnits((amounts?.[i] ?? 0n) as bigint, decimalsKey)),
    }));
    setDonors(list);
  }, [donorsData, decimalsKey]);

  // NEW: Robust fallback for unique donors count
  useEffect(() => {
    // Prefer Analytics.getDonorsCount -> already handled in separate effect
    if (donorsCountData !== undefined && donorsCountData !== null) return;

    // Fallback 1: try "total" from Analytics.getDonors()
    if (donorsData) {
      const tuple = donorsData as any;
      const totalFromTuple: bigint | undefined = (tuple?.total ?? tuple?.[2]) as bigint | undefined;
      if (typeof totalFromTuple === 'bigint') {
        setUniqueDonorsCount(Number(totalFromTuple));
        return;
      }
    }

    // Fallback 2: compute from donation history events
    if (donations.length > 0) {
      const uniq = new Set(donations.map(d => d.donor.toLowerCase()));
      setUniqueDonorsCount(uniq.size);
    }
  }, [donorsCountData, donorsData, donations]);

  // Historia wpłat z eventów Core (DonationMade) – poprawne źródło
  useEffect(() => {
    if (selectedIdKey < 0 || !coreAddress) return;

    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

    if (!rpcUrl) {
      console.warn('Brak RPC URL. Ustaw NEXT_PUBLIC_RPC_URL lub NEXT_PUBLIC_SEPOLIA_RPC_URL w .env');
      setDonations([]);
      return;
    }

    let disposed = false;

    const fetchDonationLogs = async () => {
      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const iface = new Interface(poliDaoCoreAbi as any);

        const ev = (iface as any).getEvent?.('DonationMade') ?? (iface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
        if (!ev) {
          if (!disposed) setDonations([]);
          return;
        }
        const topic = (iface as any).getEventTopic ? (iface as any).getEventTopic(ev) : (iface as any).getEventTopic?.('DonationMade');

        const startBlockEnv = process.env.NEXT_PUBLIC_CORE_START_BLOCK;
        const fromBlock = startBlockEnv ? BigInt(startBlockEnv) : 0n;

        // NEW: filter by indexed fundraiserId topic to avoid fetching unrelated logs
        const fundraiserTopic = '0x' + BigInt(selectedIdKey).toString(16).padStart(64, '0');

        const logs = await provider.getLogs({
          address: coreAddress as string,
          fromBlock,
          toBlock: 'latest',
          topics: [topic, fundraiserTopic],
        });

        const parsed = await Promise.all(
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

        const items = parsed.filter((x): x is DonationLog => !!x)
          .sort((a, b) => b.timestamp - a.timestamp);

        if (!disposed) setDonations(items);
      } catch (err) {
        console.warn('Błąd pobierania logów donacji (Core):', err);
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

  // Contract write hooks
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

  // Wait for transaction confirmations
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

  // Check user's token balance and allowance – dodaj chainId
  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: sepolia.id,
    query: { enabled: !!campaignData?.token && !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [
      address || ZERO_ADDR,
      (coreAddress as `0x${string}`) || ZERO_ADDR,
    ],
    chainId: sepolia.id,
    query: { enabled: !!campaignData?.token && !!address && !!coreAddress },
  });

  // Handle updates
  const handleAddUpdate = () => {
    const trimmed = newUpdateText.trim();
    if (!trimmed) return;
    setUpdates(prev => [{ content: trimmed, timestamp: Date.now() }, ...prev ]);
    setNewUpdateText('');
    setSnackbar({ open: true, message: 'Aktualność została dodana!', severity: 'success' });
  };

  // Enhanced donation flow – przez Router
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
    if (!coreAddress) {
      setSnackbar({ open: true, message: 'Nie udało się pobrać adresu Core. Spróbuj ponownie.', severity: 'error' });
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

      // CHANGED: approve Core (spender), not Router
      if (!allowance || amount > (allowance as bigint)) {
        setNeedsApproval(true);
        setSnackbar({ open: true, message: 'Najpierw zatwierdź wydatkowanie tokenów', severity: 'info' });
        await writeApproval({
          address: campaignData.token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [coreAddress as `0x${string}`, amount],
          chainId: sepolia.id,
        });
        return; // donate uruchomi się po isApprovalSuccess
      }

      // donate bezpośrednio (gdy allowance wystarczające)
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

  // Po udanym approve – automatycznie wykonaj donate z zapamiętaną kwotą
  useEffect(() => {
    const doDonateAfterApprove = async () => {
      if (!isApprovalSuccess) return;
      if (!campaignData || pendingDonationAmount === null) return;
      try {
        await refetchAllowance();
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
  }, [isApprovalSuccess, campaignData, pendingDonationAmount, refetchAllowance, writeContract]);

  // Po udanej wpłacie – odśwież progres + donors Analytics
  useEffect(() => {
    if (isDonationSuccess) {
      setSnackbar({ open: true, message: 'Wpłata została potwierdzona! Odświeżanie danych...', severity: 'success' });
      setTimeout(() => {
        setDonateOpen(false);
        setDonateAmount("");
        setNeedsApproval(false);
        refetchProgress(); // Router.getFundraiserProgress
        refetchDonorsCount?.(); // Analytics.getDonorsCount
        refetchDonors?.();      // Analytics.getDonors
      }, 1200);
    }
  }, [isDonationSuccess, refetchProgress, refetchDonorsCount, refetchDonors]);

  // Show loading state – only core read
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: '#16a34a', mb: 2 }} />
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
  const decimals = decimalsKey; // użyj stabilnego klucza
  const raised = Number(formatUnits(campaignData.raised, decimals));
  const target = Number(formatUnits(campaignData.target, decimals));
  const missing = (target - raised).toFixed(2);
  // Precyzyjny procent
  const progressPercent = campaignData.target > 0n 
    ? calcPercentPrecise(campaignData.raised, campaignData.target)
    : 0;
  // Minimalna widoczna szerokość paska (jeśli >0)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero with blur */}
      <div className="relative w-full h-[600px] -mt-56">
        <div className="absolute inset-0 -z-10">
          <Image
            src={PLACEHOLDER_IMAGE}
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
            <span style={{ color: '#16a34a', fontWeight: 500 }}>PoliDAO</span> / Kampanie / #{campaignData.id}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Ostatnie odświeżenie: {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}
            </Typography>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a' }} />
          </Box>
        </Box>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <div className="w-full relative rounded-md overflow-hidden shadow-sm h-[600px]">
              <Image
                src={PLACEHOLDER_IMAGE}
                alt={displayTitle}
                fill
                className="object-cover object-center w-full h-full"
                priority
              />
              <Chip
                label={isActive ? "AKTYWNA!" : "ZAKOŃCZONA"}
                sx={{ 
                  position: "absolute", top: 20, left: 20,
                  bgcolor: isActive ? '#16a34a' : '#dc2626',
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
                    className="w-full py-2 text-base font-medium text-white bg-[#68CC89] hover:bg-[#5FBF7A] rounded-md"
                  >
                    Dodaj
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#1F4E79]">Historia wpłat</h2>
                <p className="text-xs text-gray-500">Ostatnie odświeżenie: {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}</p>
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
                      <span className="text-sm text-gray-700">{d.address.slice(0, 6)}…{d.address.slice(-4)}</span>
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
                  <p className="text-lg font-medium text-green-600">
                    {raised.toLocaleString('pl-PL')} {displayTokenSymbol}
                  </p>
                </div>
                <p className="text-base font-normal text-gray-500 mb-2">
                  ({progressPercent.toFixed(2)}%) z {target.toLocaleString('pl-PL')} {displayTokenSymbol}
                </p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-600 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(barWidth, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Brakuje {missing} {displayTokenSymbol}
                </p>
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
                  className="w-full px-3 py-3 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
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
                    className="w-full py-3 text-lg font-semibold text-white bg-[#16a34a] hover:bg-[#15803d] rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
            <VolunteerActivism sx={{ color: '#16a34a' }} />
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
              To jest zbiórka z celem. Środki mogą zostać zwrócone jeśli cel nie zostanie osiągnięty.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDonateOpen(false)}>Anuluj</Button>
          <Button
            variant="contained"
            onClick={handleDonate}
            disabled={!donateAmount || Number(donateAmount) <= 0}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
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
            <Share sx={{ color: '#16a34a' }} />
            Udostępnij kampanię
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={typeof window !== 'undefined' ? window.location.href : ''}
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
}