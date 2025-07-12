"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

// Reown AppKit hooks
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";

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
] as const;

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS as `0x${string}`;

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

  const campaignId = params.id as string;

  // Contract read hooks
  const {
    data: fundraiserData,
    error: fundraiserError,
    isLoading: fundraiserLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiser",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  // Get fundraiser title/description
  const {
    data: fundraiserTitle,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiserTitle",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: fundraiserDescription,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiserDescription",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: fundraiserCategory,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getFundraiserCategory",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: donorsCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getDonorsCount",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: donorsList,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "getDonors",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: timeLeft,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "timeLeftOnFundraiser",
    args: [BigInt(campaignId)],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!CONTRACT_ADDRESS,
    },
  });

  const {
    data: userDonation,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: POLIDAO_ABI,
    functionName: "donationOf",
    args: [BigInt(campaignId), address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!campaignId && !isNaN(Number(campaignId)) && !!address && !!CONTRACT_ADDRESS,
    },
  });

  // Contract write hooks
  const { writeContract, isPending: isDonating, error: donateError } = useWriteContract();
  const { writeContract: writeApproval, isPending: isApproving } = useWriteContract();

  // Check user's token balance and allowance
  const {
    data: userBalance,
  } = useReadContract({
    address: campaignData?.token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!campaignData?.token && !!address,
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

  useEffect(() => {
    if (fundraiserData) {
      const [id, creator, token, target, raised, endTime, isFlexible, closureInitiated, reclaimDeadline, fundsWithdrawn] = fundraiserData;
      
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
    }
  }, [fundraiserData, campaignId]);

  useEffect(() => {
    if (fundraiserError) {
      setError("Nie udało się załadować danych kampanii. Sprawdź czy ID kampanii jest poprawne.");
      setLoading(false);
    }
  }, [fundraiserError]);

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

  // Event handlers
  const handleDonate = async () => {
    if (!isConnected || !campaignData) {
      alert("Najpierw połącz portfel!");
      return;
    }

    if (!donateAmount || isNaN(Number(donateAmount)) || Number(donateAmount) <= 0) {
      alert("Wprowadź poprawną kwotę!");
      return;
    }

    try {
      const amount = parseUnits(donateAmount, 6);
      
      if (userBalance && amount > userBalance) {
        alert("Niewystarczający balans tokenów!");
        return;
      }

      if (allowance && amount > allowance) {
        setNeedsApproval(true);
        return;
      }

      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: "donate",
        args: [BigInt(campaignId), amount],
      });

      setDonateOpen(false);
      setDonateAmount("");
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Wystąpił błąd podczas wpłaty");
    }
  };

  const handleApprove = async () => {
    if (!campaignData || !donateAmount) return;

    try {
      const amount = parseUnits(donateAmount, 6);

      await writeApproval({
        address: campaignData.token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
      });

      setTimeout(() => {
        refetchAllowance();
        setNeedsApproval(false);
      }, 3000);
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Wystąpił błąd podczas zatwierdzania");
    }
  };

  const handleRefund = async () => {
    if (!isConnected || !campaignData) {
      alert("Najpierw połącz portfel!");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: "refund",
        args: [BigInt(campaignId)],
      });
    } catch (error) {
      console.error("Refund failed:", error);
      alert("Wystąpił błąd podczas zwrotu środków");
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !campaignData) {
      alert("Najpierw połącz portfel!");
      return;
    }

    if (address?.toLowerCase() !== campaignData.creator.toLowerCase()) {
      alert("Tylko twórca kampanii może wypłacić środki!");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: POLIDAO_ABI,
        functionName: "withdraw",
        args: [BigInt(campaignId)],
      });
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Wystąpił błąd podczas wypłaty środków");
    }
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <CircularProgress size={60} sx={{ color: '#16a34a' }} />
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
            <Button onClick={() => router.back()} sx={{ mt: 2 }}>
              Wróć
            </Button>
          </Alert>
        </Container>
        <Footer />
      </div>
    );
  }

  // Calculations and display data
  const displayTokenSymbol = tokenSymbol || 'USDC';
  const targetAmount = Number(formatUnits(campaignData.target, 6));
  const raisedAmount = Number(formatUnits(campaignData.raised, 6));
  const progressPercentage = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const timeLeftSeconds = timeLeft ? Number(timeLeft) : 0;
  const daysLeft = Math.max(0, Math.floor(timeLeftSeconds / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeftSeconds % (24 * 60 * 60)) / 3600));
  const isActive = timeLeftSeconds > 0 && !campaignData.closureInitiated;
  const amountLeft = Math.max(0, targetAmount - raisedAmount);
  const isCreator = address?.toLowerCase() === campaignData.creator.toLowerCase();
  const hasUserDonated = userDonation && userDonation > 0n;
  const userBalanceFormatted = userBalance ? Number(formatUnits(userBalance, 6)) : 0;

  // Display data from blockchain or fallbacks
  const displayTitle = fundraiserTitle || `Kampania Blockchain #${campaignData.id}`;
  const displayDescription = fundraiserDescription || "Decentralizowana zbiórka na platformie PoliDAO";
  const displayCategory = fundraiserCategory || "Blockchain Campaign";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton 
            onClick={() => router.back()} 
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
        </Box>
      </Container>

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Video/Image Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <Box
                sx={{
                  height: 400,
                  background: `linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {/* Play Button */}
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    '&:hover': {
                      bgcolor: "white",
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: '25px solid #16a34a',
                      borderTop: '15px solid transparent',
                      borderBottom: '15px solid transparent',
                      ml: '5px'
                    }}
                  />
                </Box>

                {/* Floating Status Badge */}
                <Chip
                  label="PILNE!"
                  sx={{ 
                    position: "absolute",
                    top: 20,
                    left: 20,
                    bgcolor: '#dc2626',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1
                  }}
                />
              </Box>
            </div>

            {/* Campaign Description */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#111827' }}>
                O tej kampanii
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
                {displayDescription || `To jest decentralizowana kampania crowdfundingowa uruchomiona na platformie PoliDAO 
                (#${campaignData.id}). Wszystkie transakcje są transparentne i zapisane w blockchain, co gwarantuje 
                pełną przejrzystość procesu zbierania funduszy.`}
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
                Kampania wykorzystuje smart contract do automatycznego zarządzania funduszami, 
                co eliminuje potrzebę zaufania do pośredników. Każda wpłata jest natychmiast 
                widoczna na blockchain, a zasady wypłaty są automatycznie egzekwowane przez kod.
              </Typography>

              {/* Campaign Details */}
              <Box sx={{ p: 4, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#166534' }}>
                  📋 Szczegóły zbiórki
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Cel zbiórki:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {displayCategory}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Typ kampanii:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {campaignData.isFlexible ? "Elastyczna - środki dostępne zawsze" : "Z celem - środki tylko po osiągnięciu"}
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
                      Data zakończenia:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151' }}>
                      {new Date(Number(campaignData.endTime) * 1000).toLocaleDateString("pl-PL")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Alert 
                severity="info" 
                sx={{ 
                  mt: 4,
                  borderRadius: 2,
                  bgcolor: '#f0f9ff',
                  border: '1px solid #0ea5e9'
                }}
              >
                <Typography variant="body1">
                  <strong>Blockchain gwarantuje transparentność:</strong> Każda transakcja jest 
                  publiczna i niemożliwa do sfałszowania. Możesz śledzić wszystkie wpłaty w czasie rzeczywistym.
                </Typography>
              </Alert>
            </div>

            {/* Status Alerts */}
            {!campaignData.isFlexible && (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 3,
                  bgcolor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  '& .MuiAlert-icon': { color: '#16a34a' }
                }}
              >
                <Typography variant="body1">
                  <strong>Zbiórka z celem:</strong> Środki zostaną przekazane tylko gdy osiągniemy pełny cel. 
                  W przeciwnym przypadku wszystkie wpłaty zostaną automatycznie zwrócone.
                </Typography>
              </Alert>
            )}

            {campaignData.closureInitiated && (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                <Typography variant="body1">
                  <strong>Kampania jest zamykana.</strong> Darczyńcy mają czas do {" "}
                  {new Date(Number(campaignData.reclaimDeadline) * 1000).toLocaleDateString("pl-PL")} 
                  {" "} na odzyskanie środków.
                </Typography>
              </Alert>
            )}
          </div>

          {/* Prawa kolumna - Sidebar with all panels */}
          <div className="space-y-6">
            
            {/* Progress Card - Główny panel wsparcia */}
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
                {formatTokenAmount(campaignData.raised)} {displayTokenSymbol}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                zebrano z {formatTokenAmount(campaignData.target)} {displayTokenSymbol}
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

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Brakuje {formatTokenAmount(BigInt(Math.max(0, amountLeft) * 1000000), 6)} {displayTokenSymbol}
              </Typography>
              
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
                  ❤️ Wesprzyj
                </Button>
              ) : null}

              {/* Stats */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Wsparło
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                    {donorsCount ? Number(donorsCount).toLocaleString('pl-PL') : 0}
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

              {/* Share buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
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
                  📧 Udostępnij
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Favorite />}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    py: 2,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#dc2626',
                      color: '#dc2626'
                    }
                  }}
                >
                  💖 Polub
                </Button>
              </Box>

              {/* Creator actions */}
              {isCreator && !campaignData.fundsWithdrawn && isConnected && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleWithdraw}
                  startIcon={<AccountBalanceWallet />}
                  disabled={!((campaignData.isFlexible || progressPercentage >= 100) && !isActive)}
                  sx={{ 
                    fontWeight: 600, 
                    py: 2,
                    mb: 2,
                    bgcolor: '#059669',
                    '&:hover': { bgcolor: '#047857' }
                  }}
                >
                  Wypłać środki
                </Button>
              )}

              {/* Refund button */}
              {hasUserDonated && !campaignData.isFlexible && progressPercentage < 100 && !isActive && isConnected && (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleRefund}
                  startIcon={<Cancel />}
                  sx={{ fontWeight: 600, py: 2, mb: 2 }}
                >
                  Zwróć środki
                </Button>
              )}

              {/* User donation info */}
              {hasUserDonated && (
                <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ✅ Twoja wpłata: {formatTokenAmount(userDonation || 0n)} {displayTokenSymbol}
                  </Typography>
                </Alert>
              )}

              {/* Alternative Donation Options */}
              <Box sx={{ pt: 4, borderTop: '1px solid #e5e7eb' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
                  💳 Inne sposoby wpłaty
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 2,
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    fontWeight: 600,
                    mb: 2,
                    '&:hover': {
                      borderColor: '#15803d',
                      bgcolor: '#f0fdf4'
                    }
                  }}
                >
                  📱 SMS: POMOC na 72051
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 2,
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: '#16a34a',
                      color: '#16a34a'
                    }
                  }}
                >
                  📄 Przekaż 1,5% podatku
                </Button>
              </Box>
            </div>

            {/* Organization Info Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#111827' }}>
                👤 Organizator zbiórki
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: "#16a34a",
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}
                >
                  {campaignData.creator.slice(2, 4).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                    Fundacja Siepomaga
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                    {formatAddress(campaignData.creator)}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Launch />}
                onClick={() => window.open(`https://etherscan.io/address/${campaignData.creator}`, "_blank")}
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
                Zobacz na Etherscan
              </Button>
            </div>

            {/* User Balance Info */}
            {isConnected && userBalance !== undefined && (
              <div className="bg-blue-50/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-200 p-6">
                <Alert severity="info" sx={{ borderRadius: 2, bgcolor: 'transparent', border: 'none', p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1565c0' }}>
                    💰 Twoje saldo
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                    {userBalanceFormatted.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} {displayTokenSymbol}
                  </Typography>
                </Alert>
              </div>
            )}

            {/* Recent Donors */}
            {donorsList && donorsList.length > 0 && (
              <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#111827', display: "flex", alignItems: "center", gap: 1 }}>
                  <Group sx={{ color: '#16a34a' }} />
                  Ostatnie wpłaty
                </Typography>
                
                <List sx={{ p: 0 }}>
                  {donorsList.slice(0, 5).map((donor, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 2 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: '#16a34a',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {(donor as string).slice(2, 4).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#111827' }}>
                            {formatAddress(donor as string)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {index === 0 ? 'przed chwilą' : `${index + 1}h temu`}
                          </Typography>
                        }
                      />
                      <Chip
                        label="❤️"
                        size="small"
                        sx={{
                          bgcolor: '#fecaca',
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {donorsList.length > 5 && (
                  <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                    <Typography variant="body2" color="text.secondary">
                      i {donorsList.length - 5} kolejnych osób
                    </Typography>
                  </Box>
                )}
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
                  Sieć blockchain:
                </Typography>
                <Typography variant="body1" sx={{ color: '#374151' }}>
                  Chain ID: {chainId || 'Nie połączono'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                  Status wypłaty:
                </Typography>
                <Typography variant="body1" sx={{ color: '#374151' }}>
                  {campaignData.fundsWithdrawn ? "✅ Wypłacone" : "⏳ Oczekuje"}
                </Typography>
              </Box>
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
              💚 Wesprzyj: {displayTitle.length > 40 ? displayTitle.slice(0, 40) + '...' : displayTitle}
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
              <Button
                variant="outlined"
                size="small"
                onClick={handleApprove}
                disabled={isApproving}
                sx={{
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': { borderColor: '#d97706' }
                }}
              >
                {isApproving ? "Zatwierdzanie..." : `Zatwierdź ${donateAmount} ${displayTokenSymbol}`}
              </Button>
            </Alert>
          )}
          
          {!campaignData.isFlexible && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                To jest zbiórka z celem. Środki zostaną zwrócone jeśli cel nie zostanie osiągnięty.
              </Typography>
            </Alert>
          )}

          {donateError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                Błąd podczas wpłaty: {donateError.message}
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
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={needsApproval ? handleApprove : handleDonate}
            disabled={
              !donateAmount || 
              (isDonating || isApproving) || 
              Number(donateAmount) <= 0 ||
              (userBalanceFormatted && Number(donateAmount) > userBalanceFormatted)
            }
            sx={{
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            {isApproving ? "⏳ Zatwierdzanie..." : 
             isDonating ? "⏳ Przetwarzanie..." : 
             needsApproval ? `✅ Zatwierdź ${displayTokenSymbol}` :
             `❤️ Wpłać ${donateAmount} ${displayTokenSymbol}`}
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
              onClick={handleShare} 
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

      <Footer />
    </div>
  );
}