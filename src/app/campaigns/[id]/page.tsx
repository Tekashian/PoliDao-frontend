// src/app/campaigns/[id]/page.tsx - INSPIROWANE DZIAŁAJĄCYM PROJEKTEM
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Avatar,
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  alpha,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Share,
  ArrowBack,
  Launch,
  ContentCopy,
  CheckCircle,
  VolunteerActivism,
  Refresh,
} from "@mui/icons-material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Image from 'next/image';

// Reown AppKit hooks
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { BrowserProvider, Contract } from 'ethers';

// Contract ABIs
import { POLIDAO_ABI } from "../../../blockchain/poliDaoAbi";

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
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS as `0x${string}`;
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
  const [donations, setDonations] = useState<DonationLog[]>([]);
  const [uniqueDonorsCount, setUniqueDonorsCount] = useState(0);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [newUpdateText, setNewUpdateText] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  const campaignId = params.id as string;
  const idNum = Number(campaignId);

  // ✅ INSPIROWANE: Sprawdź dostępne kampanie używając getAllFundraiserIds
  const {
    data: allFundraiserIds,
    isLoading: idsLoading,
    error: idsError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getAllFundraiserIds",
    query: {
      enabled: !!CONTRACT_ADDRESS,
      staleTime: 0, // ✅ Zawsze świeże dane
      refetchInterval: 10000,
    },
  });

  // ✅ INSPIROWANE: Sprawdź czy ID kampanii istnieje w liście
  const isValidCampaignId = campaignId && !isNaN(Number(campaignId)) && Number(campaignId) >= 0;
  const campaignExists = allFundraiserIds && isValidCampaignId && 
    allFundraiserIds.some((id: bigint) => Number(id) === Number(campaignId));

  // ✅ INSPIROWANE: GŁÓWNA FUNKCJA - getFundraiser z agresywnym odświeżaniem
  const {
    data: fundraiserData,
    error: fundraiserError,
    isLoading: fundraiserLoading,
    refetch: refetchFundraiser,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiser",
    args: [BigInt(idNum)],
    query: {
      enabled: !!CONTRACT_ADDRESS && !!campaignId && !isNaN(idNum),
      refetchInterval: 5000, // ✅ Co 5 sekund - jak w działającym projekcie
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0, // ✅ Zawsze pobieraj świeże dane
      retry: 3,
    },
  });

  // ✅ INSPIROWANE: Liczba darczyńców z częstym odświeżaniem
  const {
    data: donorsCount,
    refetch: refetchDonorsCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getDonorsCount",
    args: [BigInt(idNum)],
    query: {
      enabled: !!CONTRACT_ADDRESS && !!campaignId && !isNaN(idNum),
      refetchInterval: 5000, // ✅ Co 5 sekund
      staleTime: 0,
    },
  });

  const {
    data: timeLeft,
    refetch: refetchTimeLeft,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "timeLeftOnFundraiser",
    args: [BigInt(idNum)],
    query: {
      enabled: !!CONTRACT_ADDRESS && !!campaignId && !isNaN(idNum),
      refetchInterval: 30000, // Co 30 sekund dla czasu
      staleTime: 0,
    },
  });

  const {
    data: userDonation,
    refetch: refetchUserDonation,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "donationOf",
    args: [BigInt(idNum), address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!CONTRACT_ADDRESS && !!campaignId && !isNaN(idNum) && !!address,
      refetchInterval: 5000, // ✅ Co 5 sekund
      staleTime: 0,
    },
  });

  // Contract write hooks
  const { 
    writeContract, 
    isPending: isDonating, 
    error: donateError,
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

  // Check user's token balance and allowance
  const {
    data: userBalance,
    refetch: refetchUserBalance,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!campaignData?.token && !!address,
      refetchInterval: 15000,
      staleTime: 0,
    },
  });

  const {
    data: allowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [
      address || "0x0000000000000000000000000000000000000000",
      CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
    ],
    query: {
      enabled: !!campaignData?.token && !!address && !!CONTRACT_ADDRESS,
      refetchInterval: 15000,
      staleTime: 0,
    },
  });

  const {
    data: tokenSymbol,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: {
      enabled: !!campaignData?.token,
      staleTime: 30000, // Symbol nie zmienia się często
    },
  });

  const {
    data: tokenDecimals,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: !!campaignData?.token,
      staleTime: 30000, // Decimals nie zmienia się często
    },
  });

  // ✅ INSPIROWANE: Debug listener dla zmian danych
  useEffect(() => {
    if (fundraiserData) {
      console.log("🔄 Dane kampanii odświeżone:", new Date().toLocaleTimeString());
      setLastRefreshTime(Date.now());
    }
  }, [fundraiserData]);

  // ✅ INSPIROWANE: Obsługa błędów
  useEffect(() => {
    if (!isValidCampaignId) {
      setError("Nieprawidłowy ID kampanii");
      setLoading(false);
      return;
    }

    if (!idsLoading && allFundraiserIds !== undefined) {
      if (!campaignExists) {
        const availableIds = allFundraiserIds.map((id: bigint) => Number(id)).join(', ');
        setError(`Kampania #${campaignId} nie istnieje. Dostępne kampanie: [${availableIds}]`);
        setLoading(false);
        return;
      }
    }

    if (idsError) {
      setError(`Błąd połączenia z kontraktem: ${idsError.message}`);
      setLoading(false);
      return;
    }

    if (fundraiserError) {
      setError(`Błąd pobierania danych kampanii: ${fundraiserError.message}`);
      setLoading(false);
      return;
    }
  }, [isValidCampaignId, campaignId, idsLoading, allFundraiserIds, campaignExists, idsError, fundraiserError]);

  // ✅ INSPIROWANE: Setup fundraiser data - używając dostępnych funkcji
  useEffect(() => {
    if (fundraiserData && Array.isArray(fundraiserData) && fundraiserData.length >= 10) {
      console.log("Setting up campaign data from fundraiserData:", fundraiserData);
      
      const [
        id, 
        creator, 
        token, 
        target, 
        raised, 
        endTime, 
        isFlexible, 
        closureInitiated, 
        reclaimDeadline, 
        fundsWithdrawn
      ] = fundraiserData;
      
      setCampaignData({
        id: campaignId,
        creator: creator as `0x${string}`,
        token: token as `0x${string}`,
        target: target as bigint,
        raised: raised as bigint,
        endTime: endTime as bigint,
        isFlexible: isFlexible as boolean,
        closureInitiated: closureInitiated as boolean,
        reclaimDeadline: reclaimDeadline as bigint,
        fundsWithdrawn: fundsWithdrawn as boolean,
      });
      
      setLoading(false);
      setError(null);
    }
  }, [fundraiserData, campaignId]);

  // Check ownership
  useEffect(() => {
    if (!campaignData || !address) {
      setIsOwner(false);
      return;
    }
    setIsOwner(campaignData.creator.toLowerCase() === address.toLowerCase());
  }, [campaignData, address]);

  // ✅ INSPIROWANE: Fetch donation logs - jak w działającym projekcie
  useEffect(() => {
    if (!campaignData) return;
    if (typeof window === 'undefined') return;

    const fetchDonationLogs = async () => {
      try {
        const ethersProvider = new BrowserProvider(
          (window as any).ethereum,
          chainId || 1
        );
        const contract = new Contract(
          CONTRACT_ADDRESS,
          POLIDAO_ABI,
          ethersProvider
        );
        
        // ✅ Używaj prawidłowej nazwy eventu z ABI: "DonationMade"
        const filter = contract.filters.DonationMade?.(BigInt(idNum), null);
        if (!filter) {
          console.log("No DonationMade filter found");
          return;
        }

        const rawLogs = await contract.queryFilter(filter);
        console.log("Raw donation logs:", rawLogs);
        
        const parsed: DonationLog[] = rawLogs.map((log: any) => {
          const { donor, amount } = log.args || {};
          const decimals = tokenDecimals || 6;
          
          return {
            donor: donor?.toLowerCase() || '',
            amount: Number(amount || 0) / Math.pow(10, decimals),
            timestamp: Date.now(), // Fallback timestamp
            txHash: log.transactionHash || ''
          };
        });
        
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setDonations(parsed);
        setUniqueDonorsCount(new Set(parsed.map(d => d.donor)).size);
        
        console.log("Parsed donations:", parsed);
      } catch (err) {
        console.error('Error fetching donation logs:', err);
        setDonations([]);
        setUniqueDonorsCount(0);
      }
    };

    fetchDonationLogs();
    // ✅ INSPIROWANE: Odświeżaj logi co 15 sekund
    const interval = setInterval(fetchDonationLogs, 15000);
    return () => clearInterval(interval);
  }, [campaignData, chainId, tokenDecimals, idNum]);

  // ✅ INSPIROWANE: Auto-refresh po udanych transakcjach
  useEffect(() => {
    if (isDonationSuccess) {
      setSnackbar({
        open: true,
        message: 'Wpłata została potwierdzona! Odświeżanie danych...',
        severity: 'success'
      });
      
      // Natychmiastowe odświeżenie po transakcji
      setTimeout(() => {
        refetchFundraiser();
        refetchDonorsCount();
        refetchUserDonation();
        setDonateOpen(false);
        setDonateAmount("");
        setNeedsApproval(false);
      }, 2000);
    }
  }, [isDonationSuccess, refetchFundraiser, refetchDonorsCount, refetchUserDonation]);

  useEffect(() => {
    if (isApprovalSuccess) {
      setSnackbar({
        open: true,
        message: 'Zatwierdzenie zostało potwierdzone!',
        severity: 'success'
      });
      setTimeout(() => {
        refetchAllowance();
        setNeedsApproval(false);
      }, 2000);
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Helper functions
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // ✅ INSPIROWANE: formatTokenAmount jak w działającym projekcie
  const formatTokenAmount = (amount: bigint, decimals: number = 6) => {
    const asString = formatUnits(amount, decimals);
    const asNumber = Number(asString);
    return asNumber.toFixed(2);
  };

  // Handle updates
  const handleAddUpdate = () => {
    const trimmed = newUpdateText.trim();
    if (!trimmed) return;
    setUpdates(prev => [{ content: trimmed, timestamp: Date.now() }, ...prev]);
    setNewUpdateText('');
    
    setSnackbar({
      open: true,
      message: 'Aktualność została dodana!',
      severity: 'success'
    });
  };

  // ✅ INSPIROWANE: Enhanced donation flow
  const handleDonate = async () => {
    if (!isConnected || !campaignData) {
      setSnackbar({
        open: true,
        message: 'Najpierw połącz portfel!',
        severity: 'error'
      });
      return;
    }

    if (!donateAmount || isNaN(Number(donateAmount)) || Number(donateAmount) <= 0) {
      setSnackbar({
        open: true,
        message: 'Wprowadź poprawną kwotę!',
        severity: 'error'
      });
      return;
    }

    try {
      const decimals = tokenDecimals || 6;
      const amount = parseUnits(donateAmount, decimals);
      
      if (userBalance && amount > userBalance) {
        setSnackbar({
          open: true,
          message: 'Niewystarczający balans tokenów!',
          severity: 'error'
        });
        return;
      }

      // Check if approval is needed
      if (!allowance || amount > allowance) {
        setNeedsApproval(true);
        setSnackbar({
          open: true,
          message: 'Najpierw zatwierdź wydatkowanie tokenów',
          severity: 'info'
        });
        
        await writeApproval({
          address: campaignData.token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, amount],
        });
        
        return;
      }

      // If approval is sufficient, proceed with donation
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: "donate",
        args: [BigInt(idNum), amount],
      });

    } catch (error: any) {
      console.error("Transaction failed:", error);
      setSnackbar({
        open: true,
        message: `Wystąpił błąd: ${error.message || 'Nieznany błąd'}`,
        severity: 'error'
      });
    }
  };

  // Show loading state
  if (loading || idsLoading || fundraiserLoading) {
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
            {allFundraiserIds && allFundraiserIds.length > 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Dostępne kampanie: {allFundraiserIds.map((id: bigint) => Number(id)).join(', ')}
              </Typography>
            )}
          </Alert>
        </Container>
        <Footer />
      </div>
    );
  }

  // ✅ INSPIROWANE: Calculations and display data - jak w działającym projekcie
  const displayTokenSymbol = tokenSymbol || 'USDC';
  const decimals = tokenDecimals || 6;
  const raised = Number(formatUnits(campaignData.raised, decimals));
  const target = Number(formatUnits(campaignData.target, decimals));
  const missing = (target - raised).toFixed(2);
  const progressPercent = campaignData.target > 0n 
    ? Number((campaignData.raised * 10000n) / campaignData.target) / 100 
    : 0;
  
  const timeLeftSeconds = timeLeft ? Number(timeLeft) : 0;
  const daysLeft = Math.max(0, Math.floor(timeLeftSeconds / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeftSeconds % (24 * 60 * 60)) / 3600));
  const isActive = timeLeftSeconds > 0 && !campaignData.closureInitiated;
  const isCreator = address?.toLowerCase() === campaignData.creator.toLowerCase();
  const hasUserDonated = userDonation && userDonation > 0n;
  const userBalanceFormatted = userBalance ? Number(formatUnits(userBalance, decimals)) : 0;

  let displayTitle = `Kampania Blockchain #${campaignData.id}`;
  let displayDescription = "Decentralizowana zbiórka na platformie PoliDAO";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* ✅ INSPIROWANE: Hero section z blur background jak w działającym projekcie */}
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
        {/* ✅ INSPIROWANE: Breadcrumb Navigation */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton 
            onClick={() => router.push('/')} 
            sx={{ 
              bgcolor: "white", 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            <span style={{ color: '#16a34a', fontWeight: 500 }}>PoliDAO</span> / Kampanie / #{campaignData.id}
          </Typography>
          
          {/* ✅ INSPIROWANE: Real-time refresh indicator */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Ostatnie odświeżenie: {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}
            </Typography>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#16a34a',
                animation: 'pulse 2s infinite'
              }}
            />
          </Box>
        </Box>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ✅ INSPIROWANE: LEWA KOLUMNA - mobile/tablet */}
          <div className="space-y-6">

            {/* Obraz kampanii */}
            <div className="w-full relative rounded-md overflow-hidden shadow-sm h-[600px]">
              <Image
                src={PLACEHOLDER_IMAGE}
                alt={displayTitle}
                fill
                className="object-cover object-center w-full h-full"
                priority
              />
              {/* ✅ INSPIROWANE: Floating Status Badge */}
              <Chip
                label={isActive ? "AKTYWNA!" : "ZAKOŃCZONA"}
                sx={{ 
                  position: "absolute",
                  top: 20,
                  left: 20,
                  bgcolor: isActive ? '#16a34a' : '#dc2626',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2,
                  py: 1,
                  zIndex: 10
                }}
              />
            </div>

            {/* ✅ INSPIROWANE: Opis kampanii */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1F4E79]">
                  Opis kampanii
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-700">{displayDescription}</p>
                
                {/* ✅ INSPIROWANE: Campaign Details */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500">
                    Twórca: {formatAddress(campaignData.creator)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Token: {displayTokenSymbol}
                  </p>
                  <p className="text-xs text-gray-500">
                    Typ: {campaignData.isFlexible ? "🌊 Elastyczna" : "🎯 Z celem"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Data zakończenia: {new Date(Number(campaignData.endTime) * 1000).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ INSPIROWANE: Aktualności */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1F4E79]">
                  Aktualności
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Najnowsze informacje
                </p>
              </div>
              <div className="px-6 py-4 max-h-[300px] overflow-auto space-y-4">
                {updates.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Brak aktualności. {isOwner && "Dodaj pierwszą aktualność poniżej."}
                  </p>
                )}
                {updates.map((u, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-md p-3 border border-gray-100"
                  >
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

            {/* ✅ INSPIROWANE: Historia wpłat */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#1F4E79]">
                  Historia wpłat
                </h2>
                <p className="text-xs text-gray-500">
                  Ostatnie odświeżenie: {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}
                </p>
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
                        <a
                          href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Etherscan
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ✅ INSPIROWANE: PRAWA KOLUMNA - desktop donation panel */}
          <div className="space-y-6 lg:sticky lg:top-[175px]">

            {/* ✅ INSPIROWANE: Desktop donate panel */}
            <div className="bg-white rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4">
                <h1 className="text-2xl font-semibold text-[#1F4E79]">
                  {displayTitle}
                </h1>
              </div>
              
              {/* ✅ INSPIROWANE: Progress section z dynamicznymi danymi */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-medium text-green-600">
                    {raised.toLocaleString('pl-PL')} {displayTokenSymbol}
                  </p>
                  {fundraiserLoading && (
                    <div className="flex items-center gap-1">
                      <CircularProgress size={12} />
                      <span className="text-xs text-gray-500">Odświeżanie...</span>
                    </div>
                  )}
                </div>
                
                <p className="text-base font-normal text-gray-500 mb-2">
                  ({progressPercent.toFixed(2)}%) z {target.toLocaleString('pl-PL')} {displayTokenSymbol}
                </p>
                
                {/* ✅ INSPIROWANE: Animated progress bar */}
                <div className="mt-2 w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-600 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Brakuje {missing} {displayTokenSymbol}
                </p>
              </div>
              
              {/* ✅ INSPIROWANE: Stats section */}
              <div className="px-6 py-3 bg-gray-50 border-y border-gray-100">
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {donorsCount ? Number(donorsCount) : 0}
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

              {/* ✅ INSPIROWANE: Donation input */}
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
                    💰 Dostępne: {userBalanceFormatted.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} {displayTokenSymbol}
                  </p>
                )}
              </div>

              {/* ✅ INSPIROWANE: Donation button */}
              <div className="px-6 py-4">
                {!isConnected ? (
                  <div className="text-center">
                    <p className="mb-3 text-gray-600">Połącz portfel aby wesprzeć</p>
                    <appkit-button />
                  </div>
                ) : isActive && !campaignData.closureInitiated ? (
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
                    <p className="text-gray-500">
                      {!isActive ? "Kampania zakończona" : "Kampania jest zamykana"}
                    </p>
                  </div>
                )}
                
                {/* ✅ INSPIROWANE: User donation info */}
                {hasUserDonated && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      ✅ Twoja wpłata: {formatTokenAmount(userDonation || 0n, decimals)} {displayTokenSymbol}
                    </p>
                  </div>
                )}

                <p className="mt-2 text-center text-xs text-gray-500">
                  Wsparło {uniqueDonorsCount.toLocaleString('pl-PL')} osób
                </p>
              </div>

              {/* ✅ INSPIROWANE: Action buttons jak w działającym projekcie */}
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

              {/* ✅ INSPIROWANE: Quick info sections */}
              <div className="border-t border-gray-100">
                <div className="px-6 py-2 text-xs text-gray-500 space-y-1">
                  <p><strong>Typ kampanii:</strong> {campaignData.isFlexible ? "Elastyczna" : "Z celem"}</p>
                  <p><strong>Status wypłaty:</strong> {campaignData.fundsWithdrawn ? "Wypłacone" : "Oczekuje"}</p>
                  <p><strong>Ostatnie odświeżenie:</strong> {new Date(lastRefreshTime).toLocaleTimeString('pl-PL')}</p>
                </div>
              </div>
            </div>

            {/* ✅ INSPIROWANE: Available Campaigns Navigation */}
            {allFundraiserIds && allFundraiserIds.length > 1 && (
              <div className="bg-blue-50 rounded-md shadow-sm border border-blue-200 p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">
                  🗂️ Inne kampanie
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allFundraiserIds.slice(0, 8).map((id: bigint) => {
                    const campaignNum = Number(id);
                    const isCurrent = campaignNum === Number(campaignId);
                    return (
                      <button
                        key={campaignNum}
                        onClick={() => !isCurrent && router.push(`/campaigns/${campaignNum}`)}
                        disabled={isCurrent}
                        className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                          isCurrent 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        #{campaignNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ INSPIROWANE: Donation Dialog - prosty jak w działającym projekcie */}
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
            {userBalance !== undefined && (
              <Typography variant="body2" color="text.secondary">
                💰 Dostępne: {userBalanceFormatted.toLocaleString('pl-PL')} {displayTokenSymbol}
              </Typography>
            )}
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

          {/* Quick amounts */}
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
              To jest zbiórka z celem. Środki zostaną zwrócone jeśli cel nie zostanie osiągnięty.
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
                  setSnackbar({
                    open: true,
                    message: 'Link został skopiowany!',
                    severity: 'success'
                  });
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

      {/* Snackbar for notifications */}
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