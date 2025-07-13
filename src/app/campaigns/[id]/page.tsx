// src/app/campaigns/[id]/page.tsx - KOMPLETNA NAPRAWIONA WERSJA
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Favorite,
  Share,
  AccessTime,
  Person,
  AccountBalanceWallet,
  ArrowBack,
  Launch,
  ContentCopy,
  CheckCircle,
  Cancel,
  Group,
  Warning,
  LocalHospital,
  VolunteerActivism,
  TrendingUp,
  Schedule,
  Visibility,
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

interface TransactionState {
  hash?: string;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: string;
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
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isConfirming: false,
    isSuccess: false
  });

  const campaignId = params.id as string;

  // ✅ NOWE: Sprawdź dostępne kampanie używając getAllFundraiserIds
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
      staleTime: 30000,
    },
  });

  // ✅ NOWE: Sprawdź czy ID kampanii istnieje w liście
  const isValidCampaignId = campaignId && !isNaN(Number(campaignId)) && Number(campaignId) >= 0;
  const campaignExists = allFundraiserIds && isValidCampaignId && 
    allFundraiserIds.some((id: bigint) => Number(id) === Number(campaignId));

  console.log("=== DEBUG CAMPAIGN PAGE v2 ===");
  console.log("Campaign ID:", campaignId);
  console.log("Is valid ID:", isValidCampaignId);
  console.log("All fundraiser IDs:", allFundraiserIds?.map(id => Number(id)));
  console.log("Campaign exists:", campaignExists);
  console.log("Contract Address:", CONTRACT_ADDRESS);

  // ✅ GŁÓWNA FUNKCJA - getFundraiser z walidacją
  const {
    data: fundraiserData,
    error: fundraiserError,
    isLoading: fundraiserLoading,
    refetch: refetchFundraiser,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiser",
    args: [BigInt(campaignId || 0)],
    query: {
      enabled: !!CONTRACT_ADDRESS && campaignExists, // ✅ Tylko gdy kampania istnieje
      refetchInterval: 10000,
      retry: 3,
      staleTime: 5000,
    },
  });

  // ✅ DODATKOWE DANE - getFundraiserSummary
  const {
    data: fundraiserSummary,
    refetch: refetchSummary,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiserSummary",
    args: [BigInt(campaignId || 0)],
    query: {
      enabled: !!CONTRACT_ADDRESS && campaignExists,
      refetchInterval: 30000,
      retry: 2,
    },
  });

  // ✅ INNE FUNKCJE z walidacją
  const {
    data: donorsCount,
    refetch: refetchDonorsCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getDonorsCount",
    args: [BigInt(campaignId || 0)],
    query: {
      enabled: !!CONTRACT_ADDRESS && campaignExists,
      refetchInterval: 10000,
    },
  });

  const {
    data: timeLeft,
    refetch: refetchTimeLeft,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "timeLeftOnFundraiser",
    args: [BigInt(campaignId || 0)],
    query: {
      enabled: !!CONTRACT_ADDRESS && campaignExists,
      refetchInterval: 60000,
    },
  });

  const {
    data: userDonation,
    refetch: refetchUserDonation,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "donationOf",
    args: [BigInt(campaignId || 0), address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!CONTRACT_ADDRESS && campaignExists && !!address,
      refetchInterval: 10000,
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
    },
  });

  // ✅ OBSŁUGA BŁĘDÓW - sprawdzenie czy kampania istnieje
  useEffect(() => {
    // Jeśli nie ma campaign ID
    if (!isValidCampaignId) {
      setError("Nieprawidłowy ID kampanii");
      setLoading(false);
      return;
    }

    // Jeśli ładowanie IDs zakończone i kampania nie istnieje
    if (!idsLoading && allFundraiserIds !== undefined) {
      if (!campaignExists) {
        const availableIds = allFundraiserIds.map((id: bigint) => Number(id)).join(', ');
        setError(`Kampania #${campaignId} nie istnieje. Dostępne kampanie: [${availableIds}]`);
        setLoading(false);
        return;
      }
    }

    // Jeśli są błędy kontraktu
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

  // ✅ SETUP FUNDRAISER DATA - używając dostępnych funkcji
  useEffect(() => {
    if (fundraiserData && Array.isArray(fundraiserData) && fundraiserData.length >= 10) {
      console.log("Setting up campaign data from fundraiserData:", fundraiserData);
      
      // getFundraiser zwraca:
      // [id, creator, token, target, raised, endTime, isFlexible, closureInitiated, reclaimDeadline, fundsWithdrawn]
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

  // Manual refresh function
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        refetchFundraiser(),
        refetchSummary(),
        refetchDonorsCount(),
        refetchTimeLeft(),
        refetchUserDonation(),
        refetchUserBalance(),
        refetchAllowance(),
      ]);
      
      setSnackbar({
        open: true,
        message: 'Dane zostały odświeżone!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbar({
        open: true,
        message: 'Błąd podczas odświeżania danych',
        severity: 'error'
      });
    }
  }, [
    refetchFundraiser, refetchSummary, refetchDonorsCount, 
    refetchTimeLeft, refetchUserDonation,
    refetchUserBalance, refetchAllowance
  ]);

  // Helper functions
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTokenAmount = (amount: bigint, decimals: number = 6) => {
    return Number(formatUnits(amount, decimals)).toLocaleString("pl-PL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Enhanced donation flow
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
        
        setTransactionState({ isConfirming: true, isSuccess: false });
        
        await writeApproval({
          address: campaignData.token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, amount],
        });
        
        return;
      }

      // If approval is sufficient, proceed with donation
      setTransactionState({ isConfirming: true, isSuccess: false });
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: "donate",
        args: [BigInt(campaignId), amount],
      });

    } catch (error: any) {
      console.error("Transaction failed:", error);
      setTransactionState({ isConfirming: false, isSuccess: false, error: error.message });
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {idsLoading ? "Sprawdzanie dostępnych kampanii..." : "Pobieranie danych..."}
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
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              ID kampanii: {campaignId} | Kontrakt: {CONTRACT_ADDRESS?.slice(0, 10)}...
            </Typography>
            {allFundraiserIds && allFundraiserIds.length > 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Dostępne kampanie: {allFundraiserIds.map((id: bigint) => Number(id)).join(', ')}
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button onClick={() => router.push('/')}>
                Wróć na stronę główną
              </Button>
              <Button onClick={refreshAllData} variant="outlined">
                Spróbuj ponownie
              </Button>
              {allFundraiserIds && allFundraiserIds.length > 0 && (
                <Button 
                  onClick={() => router.push(`/campaigns/${Number(allFundraiserIds[0])}`)}
                  variant="contained"
                >
                  Zobacz kampanię #{Number(allFundraiserIds[0])}
                </Button>
              )}
            </Box>
          </Alert>
        </Container>
        <Footer />
      </div>
    );
  }

  // Calculations and display data
  const displayTokenSymbol = tokenSymbol || 'USDC';
  const decimals = tokenDecimals || 6;
  const targetAmount = Number(formatUnits(campaignData.target, decimals));
  const raisedAmount = Number(formatUnits(campaignData.raised, decimals));
  const progressPercentage = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const timeLeftSeconds = timeLeft ? Number(timeLeft) : 0;
  const daysLeft = Math.max(0, Math.floor(timeLeftSeconds / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeftSeconds % (24 * 60 * 60)) / 3600));
  const isActive = timeLeftSeconds > 0 && !campaignData.closureInitiated;
  const amountLeft = Math.max(0, targetAmount - raisedAmount);
  const isCreator = address?.toLowerCase() === campaignData.creator.toLowerCase();
  const hasUserDonated = userDonation && userDonation > 0n;
  const userBalanceFormatted = userBalance ? Number(formatUnits(userBalance, decimals)) : 0;

  let displayTitle = `Kampania Blockchain #${campaignData.id}`;
  let displayDescription = "Decentralizowana zbiórka na platformie PoliDAO";
  let displayCategory = "Blockchain Campaign";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton 
            onClick={() => router.push('/')} 
            sx={{ 
              bgcolor: "white", 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 500 }}>PoliDAO</span> / Kampanie / #{campaignData.id}
          </Typography>
          
          {/* Refresh button */}
          <IconButton 
            onClick={refreshAllData}
            disabled={loading}
            sx={{ 
              bgcolor: "white", 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              ml: 'auto',
              '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
            }}
            title="Odśwież dane"
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Success indicator */}
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>✅ Kampania załadowana pomyślnie!</strong> 
            ID: {campaignId} | 
            Kontrakt: {CONTRACT_ADDRESS?.slice(0, 10)}... | 
            Typ: {campaignData.isFlexible ? 'Elastyczna' : 'Z celem'}
          </Typography>
        </Alert>
      </Container>

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Image Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <Box sx={{ position: 'relative', height: 400 }}>
                <Image
                  src={PLACEHOLDER_IMAGE}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Floating Status Badge */}
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
              </Box>
            </div>

            {/* Campaign Description */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#111827' }}>
                {displayTitle}
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.7, 
                  color: '#374151',
                  fontSize: '1.1rem',
                  mb: 4
                }}
              >
                {displayDescription}
              </Typography>
              
              {/* Campaign Details */}
              <Box sx={{ p: 4, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#166534' }}>
                  📋 Szczegóły kampanii
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Typ kampanii:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {campaignData.isFlexible ? "🌊 Elastyczna" : "🎯 Z celem"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Token płatności:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {displayTokenSymbol}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Twórca:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {formatAddress(campaignData.creator)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Data zakończenia:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {new Date(Number(campaignData.endTime) * 1000).toLocaleDateString("pl-PL")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </div>
          </div>

          {/* Prawa kolumna - Progress Card */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
              {/* Amount Display */}
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: "#16a34a",
                  mb: 1,
                  fontSize: '2.5rem'
                }}
              >
                {formatTokenAmount(campaignData.raised, decimals)} {displayTokenSymbol}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                zebrano z {formatTokenAmount(campaignData.target, decimals)} {displayTokenSymbol}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                ({Math.round(progressPercentage)}%)
              </Typography>
              
              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={Math.min(progressPercentage, 100)}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  mb: 4,
                  bgcolor: '#f3f4f6',
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 8,
                    bgcolor: '#16a34a',
                  },
                }}
              />

              {/* Stats */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Wsparło
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                    {donorsCount ? Number(donorsCount) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    osób
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pozostało
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                    {daysLeft}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    dni
                  </Typography>
                </Box>
              </Box>

              {/* Donate Button */}
              {!isConnected ? (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="body1" sx={{ mb: 3, color: '#6b7280' }}>
                    Połącz portfel aby wesprzeć
                  </Typography>
                  <appkit-button />
                </Box>
              ) : isActive && !campaignData.closureInitiated ? (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => setDonateOpen(true)}
                  disabled={isDonating || isDonationConfirming || isApproving || isApprovalConfirming}
                  sx={{
                    py: 3,
                    bgcolor: '#16a34a',
                    '&:hover': { bgcolor: '#15803d' },
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    textTransform: 'none',
                    borderRadius: 3,
                    mb: 3
                  }}
                >
                  {isDonating || isDonationConfirming ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Przetwarzanie...
                    </Box>
                  ) : isApproving || isApprovalConfirming ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      Zatwierdzanie...
                    </Box>
                  ) : (
                    "❤️ Wesprzyj"
                  )}
                </Button>
              ) : null}

              {/* User donation info */}
              {hasUserDonated && (
                <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ✅ Twoja wpłata: {formatTokenAmount(userDonation || 0n, decimals)} {displayTokenSymbol}
                  </Typography>
                </Alert>
              )}

              {/* Share button */}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Share />}
                onClick={() => setShareOpen(true)}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  py: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#16a34a',
                    color: '#16a34a'
                  }
                }}
              >
                📧 Udostępnij kampanię
              </Button>
            </div>

            {/* Available Campaigns Navigation */}
            {allFundraiserIds && allFundraiserIds.length > 1 && (
              <div className="bg-blue-50/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-200 p-6">
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1565c0' }}>
                  🗂️ Inne kampanie
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {allFundraiserIds.slice(0, 10).map((id: bigint) => {
                    const campaignNum = Number(id);
                    const isCurrent = campaignNum === Number(campaignId);
                    return (
                      <Button
                        key={campaignNum}
                        size="small"
                        variant={isCurrent ? "contained" : "outlined"}
                        onClick={() => !isCurrent && router.push(`/campaigns/${campaignNum}`)}
                        disabled={isCurrent}
                        sx={{
                          minWidth: '50px',
                          bgcolor: isCurrent ? '#1565c0' : 'transparent',
                          borderColor: '#1565c0',
                          color: isCurrent ? 'white' : '#1565c0',
                          '&:hover': {
                            bgcolor: isCurrent ? '#1565c0' : alpha('#1565c0', 0.1)
                          }
                        }}
                      >
                        #{campaignNum}
                      </Button>
                    );
                  })}
                  {allFundraiserIds.length > 10 && (
                    <Typography variant="caption" sx={{ color: '#6b7280', alignSelf: 'center', ml: 1 }}>
                      +{allFundraiserIds.length - 10} więcej
                    </Typography>
                  )}
                </Box>
              </div>
            )}

            {/* User Balance Info */}
            {isConnected && userBalance !== undefined && (
              <div className="bg-green-50/80 backdrop-blur-lg rounded-3xl shadow-xl border border-green-200 p-6">
                <Alert severity="info" sx={{ borderRadius: 2, bgcolor: 'transparent', border: 'none', p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#16a34a' }}>
                    💰 Twoje saldo
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                    {userBalanceFormatted.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} {displayTokenSymbol}
                  </Typography>
                </Alert>
              </div>
            )}

            {/* Technical Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#111827', display: "flex", alignItems: "center", gap: 1 }}>
                🔗 Szczegóły techniczne
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                  Token płatności:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: '0.8rem', wordBreak: "break-all", color: '#374151', bgcolor: '#f9fafb', p: 1, borderRadius: 1 }}>
                  {campaignData.token}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                  Adres kontraktu:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: '0.8rem', wordBreak: "break-all", color: '#374151', bgcolor: '#f9fafb', p: 1, borderRadius: 1 }}>
                  {CONTRACT_ADDRESS}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                  Status wypłaty:
                </Typography>
                <Typography variant="body1" sx={{ color: '#374151' }}>
                  {campaignData.fundsWithdrawn ? "✅ Wypłacone" : "⏳ Oczekuje"}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Launch />}
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`, "_blank")}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#16a34a',
                    color: '#16a34a'
                  }
                }}
              >
                Zobacz kontrakt na Etherscan
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* Donation Dialog */}
      <Dialog 
        open={donateOpen} 
        onClose={() => setDonateOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #16a34a'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, bgcolor: '#f0fdf4' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolunteerActivism sx={{ color: '#16a34a' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              💚 Wesprzyj kampanię #{campaignData.id}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
              {displayCategory}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Wpłacasz środki w {displayTokenSymbol} • Kampania #{campaignData.id}
            </Typography>
            {userBalance !== undefined && (
              <Typography variant="body2" color="text.secondary">
                💰 Dostępne: {userBalanceFormatted.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} {displayTokenSymbol}
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
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#16a34a',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#16a34a',
              },
            }}
            inputProps={{ 
              min: 0.01, 
              step: 0.01,
              max: userBalanceFormatted || undefined,
            }}
            error={donateAmount && userBalanceFormatted && Number(donateAmount) > userBalanceFormatted}
            helperText={
              donateAmount && userBalanceFormatted && Number(donateAmount) > userBalanceFormatted
                ? "Kwota przekracza dostępne środki"
                : ""
            }
          />

          {/* Quick donation amounts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#6b7280', fontWeight: 600 }}>
              Szybka wpłata:
            </Typography>
            <Grid container spacing={1}>
              {[10, 50, 100, 500].map((amount) => (
                <Grid item xs={6} key={amount}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => setDonateAmount(amount.toString())}
                    sx={{
                      borderColor: '#16a34a',
                      color: '#16a34a',
                      '&:hover': {
                        borderColor: '#15803d',
                        bgcolor: '#f0fdf4'
                      },
                      fontSize: '0.875rem',
                      py: 1,
                      fontWeight: 600
                    }}
                  >
                    {amount} {displayTokenSymbol}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {needsApproval && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Musisz najpierw zatwierdzić wydatkowanie tokenów {displayTokenSymbol}.
              </Typography>
            </Alert>
          )}
          
          {!campaignData.isFlexible && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                To jest zbiórka z celem. Środki zostaną zwrócone jeśli cel nie zostanie osiągnięty.
              </Typography>
            </Alert>
          )}

        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, bgcolor: '#f9fafb' }}>
          <Button 
            onClick={() => {
              setDonateOpen(false);
              setNeedsApproval(false);
              setDonateAmount("");
            }}
            sx={{ color: '#6b7280' }}
            disabled={isDonating || isDonationConfirming || isApproving || isApprovalConfirming}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleDonate}
            disabled={
              !donateAmount || 
              (isDonating || isDonationConfirming || isApproving || isApprovalConfirming) || 
              Number(donateAmount) <= 0 ||
              (userBalanceFormatted && Number(donateAmount) > userBalanceFormatted)
            }
            sx={{
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' },
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            {isApproving || isApprovalConfirming ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Zatwierdzanie...
              </Box>
            ) : isDonating || isDonationConfirming ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Wpłacanie...
              </Box>
            ) : (
              `❤️ Wpłać ${donateAmount} ${displayTokenSymbol}`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog 
        open={shareOpen} 
        onClose={() => setShareOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Share sx={{ color: '#16a34a' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              🔗 Udostępnij kampanię
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Pomóż rozpowszechnić tę kampanię udostępniając link:
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={typeof window !== 'undefined' ? window.location.href : ''}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb'
                }
              }}
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
              sx={{ 
                bgcolor: copiedLink ? '#dcfce7' : '#f0fdf4',
                '&:hover': { bgcolor: copiedLink ? '#bbf7d0' : '#dcfce7' },
                border: '1px solid #16a34a'
              }}
            >
              {copiedLink ? <CheckCircle /> : <ContentCopy />}
            </IconButton>
          </Box>
          
          {copiedLink && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              ✅ Link został skopiowany do schowka!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setShareOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' }
            }}
          >
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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