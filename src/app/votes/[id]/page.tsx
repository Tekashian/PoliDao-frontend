// src/app/votes/[id]/page.tsx
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
  Divider,
  Stack,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  useTheme,
  alpha,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  HowToVote,
  Share,
  AccessTime,
  Person,
  ArrowBack,
  Launch,
  ContentCopy,
  CheckCircle,
  Cancel,
  Group,
  Timeline,
  ThumbUp,
  ThumbDown,
  Poll,
  Verified,
  Schedule,
  TrendingUp,
  Info,
  AccountBalanceWallet,
  Public,
  Lock,
  Visibility,
} from "@mui/icons-material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useAccount } from "wagmi";

// Mock data dla przykładu głosowania z bogatymi szczegółami
const mockProposalData = {
  id: "456",
  question: "Czy miasto powinno zainwestować w nowy system transportu publicznego o wartości 150 mln PLN?",
  description: `
🚌 **KOMPLEKSOWA MODERNIZACJA TRANSPORTU PUBLICZNEGO**

**📋 ZAKRES PROJEKTU:**

🚌 **Nowe autobusy elektryczne (50 mln PLN)**
• Zakup 50 nowych autobusów elektrycznych marki Solaris
• Pełna zamiana floty diesla na elektryczną do 2027 roku
• Redukcja emisji CO2 o 40% rocznie (około 2500 ton CO2)
• Cichsza jazda - redukcja hałasu o 15 dB
• Klimatyzacja i WiFi w każdym autobusie
• Miejsca dla osób niepełnosprawnych zgodnie z najwyższymi standardami

🚊 **Rozszerzenie sieci tramwajowej (75 mln PLN)**
• Budowa linii T4: Dworzec Główny - Osiedle Słoneczne (8.5 km)
• Budowa linii T5: Centrum - Uniwersytet - Szpital (6.2 km)  
• Modernizacja linii T1 z wymianą torowiska (4.1 km)
• 12 nowych przystanków z windami i platformami dla niepełnosprawnych
• Inteligentne przystanki z real-time informacjami
• Skrócenie czasu dojazdu z dzielnic do centrum o średnio 25%

📱 **System cyfrowy i smart city (25 mln PLN)**
• Aplikacja mobilna "WarsawGO" z live tracking wszystkich pojazdów
• Płatności bezgotówkowe: karty, BLIK, Apple Pay, Google Pay
• Inteligentne przystanki z ekranami LED i prognozą pogody
• System zarządzania ruchem z priorytetem dla transportu publicznego
• Integracja z systemami bike-sharing i car-sharing

**💰 SZCZEGÓŁY FINANSOWE:**
• **Budżet całkowity:** 150 000 000 PLN
• **Finansowanie UE:** 45% (67.5 mln PLN)
• **Budżet miasta:** 35% (52.5 mln PLN)  
• **Kredyt EBI:** 20% (30 mln PLN)
• **Oszczędności roczne:** 8.5 mln PLN (mniej paliwa, konserwacji)

**📅 HARMONOGRAM REALIZACJI:**
• **2025 Q4:** Podpisanie umów, rozpoczęcie dostaw autobusów
• **2026 Q1-Q2:** Budowa infrastruktury tramwajowej
• **2026 Q3:** Uruchomienie aplikacji i systemu płatności
• **2027 Q1:** Pełne wdrożenie wszystkich elementów projektu

**🌱 KORZYŚCI ŚRODOWISKOWE:**
• Redukcja emisji CO2 o 60% w transporcie publicznym
• Poprawa jakości powietrza - 30% mniej smogu
• Zmniejszenie ruchu samochodowego o 15%
• Nasadzenia zieleni przy nowych przystankach (500 drzew)

**👥 KORZYŚCI SPOŁECZNE:**
• 40% szybszy transport publiczny
• Pełna dostępność dla osób niepełnosprawnych
• Nowe miejsca pracy: 150 etatów w transporcie
• Zwiększenie wartości nieruchomości przy nowych liniach o 12%

**❓ ALTERNATYWY W PRZYPADKU ODRZUCENIA:**
Jeśli propozycja zostanie odrzucona, środki zostaną przeznaczone na:
• Remonty dróg (60 mln PLN)
• Modernizację szkół (45 mln PLN)
• Programy mieszkaniowe (45 mln PLN)

**🗳️ TWÓJ GŁOS MA ZNACZENIE!**
Głosuj **TAK** jeśli chcesz nowoczesnego, ekologicznego transportu
Głosuj **NIE** jeśli uważasz, że pieniądze powinny być wydane inaczej
  `,
  creator: "0x742d35Cc6643C7532a5FbFb3d1a3c15c1b7D4c32",
  creatorName: "Urząd Miasta Warszawa",
  creatorVerified: true,
  yesVotes: "1247",
  noVotes: "528", 
  endTime: Math.floor(Date.now() / 1000) + 12 * 24 * 60 * 60, // 12 dni od teraz
  startTime: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60, // 3 dni temu
  category: "Transport i Infrastruktura",
  location: "Warszawa, Polska",
  quorum: "2000", // Minimum głosów potrzebnych
  votingPower: "1", // Siła głosu użytkownika
  hasUserVoted: false,
  userVote: null, // "yes" | "no" | null
  votingType: "Demokratyczne", // "Demokratyczne" | "Ważone tokeny" | "NFT holders"
  visibility: "Publiczne",
  budget: "150000000", // 150 mln PLN
  timeline: [
    {
      date: "2025-07-08",
      time: "14:30",
      title: "Konsultacje społeczne zakończone",
      content: "Zakończyliśmy 2-tygodniowe konsultacje społeczne. Wzięło w nich udział ponad 5000 mieszkańców. 78% uczestników popiera modernizację transportu.",
      votes: { yes: 1247, no: 528 },
      type: "update"
    },
    {
      date: "2025-07-07",
      time: "09:15", 
      title: "Ekspertyza techniczna gotowa",
      content: "Otrzymaliśmy pozytywną ekspertyzę techniczną od firmy McKinsey & Company. Projekt jest wykonalny i przyniesie założone korzyści.",
      votes: { yes: 1105, no: 445 },
      type: "milestone"
    },
    {
      date: "2025-07-06",
      time: "16:45",
      title: "Poparcie Komisji Europejskiej",
      content: "Komisja Europejska oficjalnie potwierdziła finansowanie 45% kosztów projektu ze środków funduszu spójności.",
      votes: { yes: 892, no: 323 },
      type: "news"
    },
    {
      date: "2025-07-05", 
      time: "11:00",
      title: "Głosowanie rozpoczęte!",
      content: "Oficjalnie rozpoczęliśmy demokratyczne głosowanie. Każdy mieszkaniec może oddać swój głos do 20 lipca 2025 r.",
      votes: { yes: 234, no: 89 },
      type: "start"
    },
  ],
  votersList: [
    { 
      address: "0xE95c4c2B3aD8F7f72E47e7d12F05a4dd0a3f8e6d", 
      vote: "YES", 
      timestamp: Date.now() - 15 * 60 * 1000, // 15 min temu
      isAnonymous: false,
      votingPower: 1,
      district: "Śródmieście"
    },
    { 
      address: "0x3a5F8B192C4e8c9D7f2E1b5A4d3F8E9C2A1B6D4e", 
      vote: "NO", 
      timestamp: Date.now() - 32 * 60 * 1000, // 32 min temu
      isAnonymous: true,
      votingPower: 1,
      district: "Wola"
    },
    { 
      address: "0x8D4F9e2A1C7B5F3E6A9C8D2F1E4B7A5C9E2D8F1A", 
      vote: "YES", 
      timestamp: Date.now() - 48 * 60 * 1000, // 48 min temu
      isAnonymous: false,
      votingPower: 1,
      district: "Praga-Północ"
    },
    { 
      address: "0x1F4B8e9D2A5C7E3F9A8D1C4E6B2F8A9C5E7D3F1B", 
      vote: "YES", 
      timestamp: Date.now() - 67 * 60 * 1000, // 67 min temu
      isAnonymous: false,
      votingPower: 1,
      district: "Mokotów"
    },
    { 
      address: "0x9C2E5F8A1D4B7E3C9F2A8D1E5B4F7C9A2E8D5F1C", 
      vote: "NO", 
      timestamp: Date.now() - 89 * 60 * 1000, // 89 min temu
      isAnonymous: false,
      votingPower: 1,
      district: "Ochota"
    },
  ],
  statistics: {
    totalPossibleVoters: 8500,
    participationRate: 20.9, // %
    averageVoteTime: "2.3", // minuty
    peakVotingHour: "18:00-19:00",
    mobileVotes: 65, // %
    desktopVotes: 35, // %
    topDistricts: [
      { name: "Śródmieście", votes: 342, percentage: 19.3 },
      { name: "Mokotów", votes: 298, percentage: 16.8 },
      { name: "Wola", votes: 245, percentage: 13.8 },
    ]
  },
  relatedDocuments: [
    {
      title: "Pełna dokumentacja techniczna",
      url: "#",
      type: "PDF",
      size: "24.5 MB",
      pages: 184
    },
    {
      title: "Analiza ekonomiczna McKinsey",
      url: "#", 
      type: "PDF",
      size: "8.2 MB",
      pages: 67
    },
    {
      title: "Raport z konsultacji społecznych",
      url: "#",
      type: "PDF", 
      size: "12.1 MB",
      pages: 89
    }
  ]
};

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { isConnected, address } = useAccount();
  
  const [proposal, setProposal] = useState(mockProposalData);
  const [voteOpen, setVoteOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Obliczenia
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;
  const timeLeft = proposal.endTime - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (24 * 60 * 60)) / 3600));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % 3600) / 60));
  const isActive = timeLeft > 0;
  const quorumReached = totalVotes >= Number(proposal.quorum);
  const timeElapsed = Math.floor(Date.now() / 1000) - proposal.startTime;
  const totalDuration = proposal.endTime - proposal.startTime;
  const progressPercentage = Math.min((timeElapsed / totalDuration) * 100, 100);

  useEffect(() => {
    // W prawdziwej aplikacji tutaj pobierałbyś dane z kontraktu
    console.log("Loading proposal with ID:", params.id);
  }, [params.id]);

  const handleVote = async (support: boolean) => {
    if (!isConnected) {
      alert("Najpierw połącz portfel!");
      return;
    }
    
    setLoading(true);
    try {
      // Tutaj wywołałbyś funkcję vote z kontraktu
      console.log(`Voting ${support ? 'YES' : 'NO'} on proposal ${proposal.id}`);
      
      // Symulacja
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVoteOpen(false);
      alert(`Głos ${support ? 'TAK' : 'NIE'} został pomyślnie oddany!`);
      
      // Aktualizuj stan głosowania
      setProposal(prev => ({
        ...prev,
        hasUserVoted: true,
        userVote: support ? "yes" : "no",
        yesVotes: support ? String(Number(prev.yesVotes) + 1) : prev.yesVotes,
        noVotes: !support ? String(Number(prev.noVotes) + 1) : prev.noVotes,
      }));
      
    } catch (error) {
      console.error("Vote failed:", error);
      alert("Wystąpił błąd podczas głosowania");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} dni temu`;
    if (hours > 0) return `${hours}h temu`;
    return `${minutes}min temu`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "milestone": return <CheckCircle color="success" />;
      case "news": return <Info color="info" />;
      case "update": return <Timeline color="primary" />;
      case "start": return <PlayArrow color="secondary" />;
      default: return <Timeline />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "milestone": return "success";
      case "news": return "info"; 
      case "update": return "primary";
      case "start": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        {/* Breadcrumb & Back Button */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ bgcolor: "white", boxShadow: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Głosowania / {proposal.category} / #{proposal.id}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Lewa kolumna - Główne informacje */}
          <Grid item xs={12} md={8}>
            {/* Header propozycji */}
            <Card sx={{ mb: 3, overflow: "hidden" }}>
              <Box
                sx={{
                  height: 400,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.secondary.main, 0.7)})`,
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 50%),
                    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                  `,
                  display: "flex",
                  alignItems: "flex-end",
                  position: "relative",
                }}
              >
                {/* Overlay z informacjami */}
                <Box sx={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    icon={<HowToVote />}
                    label={proposal.category}
                    color="primary"
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.95)", color: "primary.main", fontWeight: 600 }}
                  />
                  <Chip
                    icon={<Public />}
                    label={proposal.visibility}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.95)", color: "text.primary" }}
                  />
                  <Chip
                    icon={<AccountBalanceWallet />}
                    label={proposal.votingType}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.95)", color: "text.primary" }}
                  />
                </Box>
                
                <Box sx={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={() => setShareOpen(true)}
                    sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "rgba(255,255,255,1)" } }}
                  >
                    <Share />
                  </IconButton>
                </Box>

                {/* Status i postęp czasowy */}
                <Box sx={{ position: "absolute", top: 80, left: 20, right: 20 }}>
                  <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.95)", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Postęp głosowania
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {daysLeft}d {hoursLeft}h {minutesLeft}m pozostało
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[300], 0.3),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background: isActive 
                            ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`
                            : theme.palette.grey[400],
                        },
                      }}
                    />
                  </Paper>
                </Box>

                {/* Tytuł na dole */}
                <Box
                  sx={{
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    color: "white",
                    p: 4,
                    width: "100%",
                  }}
                >
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
                    {proposal.question}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {proposal.creatorVerified ? <Verified color="info" /> : <Person />}
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {proposal.creatorName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTime />
                      <Typography variant="body1">
                        {proposal.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrendingUp />
                      <Typography variant="body1">
                        Budżet: {Number(proposal.budget).toLocaleString()} PLN
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Status i wyniki głosowania */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Wyniki głosowania
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={isActive ? <Schedule /> : <CheckCircle />}
                      label={isActive ? "Aktywne" : "Zakończone"}
                      color={isActive ? "success" : "default"}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      icon={<Group />}
                      label={`${totalVotes}/${proposal.quorum} głosów`}
                      color={quorumReached ? "success" : "warning"}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                {/* Alert o kworum */}
                {!quorumReached && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <strong>Wymagane kworum:</strong> Do ważności głosowania potrzeba minimum {Number(proposal.quorum).toLocaleString()} głosów. 
                    Brakuje jeszcze {(Number(proposal.quorum) - totalVotes).toLocaleString()} głosów.
                  </Alert>
                )}

                {proposal.hasUserVoted && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <strong>Twój głos został oddany:</strong> Głosowałeś {proposal.userVote === "yes" ? "TAK" : "NIE"}. 
                    Dziękujemy za uczestnictwo w demokratycznym procesie!
                  </Alert>
                )}

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      bgcolor: alpha(theme.palette.success.main, 0.08), 
                      border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      borderRadius: 3,
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
                          <ThumbUp />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
                            GŁOSY ZA
                          </Typography>
                          <Typography variant="body2" color="success.dark">
                            Popieram propozycję
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: "success.main", mb: 1 }}>
                        {Number(proposal.yesVotes).toLocaleString()}
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                        {yesPercentage.toFixed(1)}% wszystkich głosów
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      bgcolor: alpha(theme.palette.error.main, 0.08), 
                      border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      borderRadius: 3,
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: "error.main", width: 48, height: 48 }}>
                          <ThumbDown />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" color="error.main" sx={{ fontWeight: 700 }}>
                            GŁOSY PRZECIW
                          </Typography>
                          <Typography variant="body2" color="error.dark">
                            Nie popieram propozycji
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: "error.main", mb: 1 }}>
                        {Number(proposal.noVotes).toLocaleString()}
                      </Typography>
                      <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                        {noPercentage.toFixed(1)}% wszystkich głosów
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Wizualny progress bar */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      TAK: {yesPercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                      NIE: {noPercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={yesPercentage}
                    sx={{
                      height: 16,
                      borderRadius: 8,
                      bgcolor: alpha(theme.palette.error.main, 0.3),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 8,
                        bgcolor: theme.palette.success.main,
                      },
                    }}
                  />
                </Box>
                
                {/* Statystyki szczegółowe */}
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                        {totalVotes.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Łącznie głosów
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "secondary.main" }}>
                        {proposal.statistics.participationRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Frekwencja
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "info.main" }}>
                        {proposal.statistics.averageVoteTime}min
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Śr. czas głosowania
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "warning.main" }}>
                        {proposal.statistics.mobileVotes}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Głosy mobilne
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Opis propozycji */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Szczegółowy opis propozycji
                </Typography>
                
                <Box sx={{ position: "relative" }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: "pre-line", 
                      lineHeight: 1.8,
                      maxHeight: showFullDescription ? "none" : "400px",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease",
                    }}
                  >
                    {proposal.description}
                  </Typography>
                  
                  {!showFullDescription && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 100,
                        background: `linear-gradient(transparent, ${theme.palette.background.paper})`,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        pb: 2,
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => setShowFullDescription(true)}
                        sx={{ backdropFilter: "blur(10px)" }}
                      >
                        Pokaż pełny opis
                      </Button>
                    </Box>
                  )}
                  
                  {showFullDescription && (
                    <Box sx={{ textAlign: "center", mt: 3 }}>
                      <Button
                        variant="text"
                        onClick={() => setShowFullDescription(false)}
                      >
                        Zwiń opis
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Dokumenty powiązane */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Dokumenty i materiały
                </Typography>
                
                <Grid container spacing={2}>
                  {proposal.relatedDocuments.map((doc, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper 
                        sx={{ 
                          p: 3, 
                          border: 1, 
                          borderColor: "divider",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "primary.main",
                            transform: "translateY(-2px)",
                            boxShadow: 2,
                          }
                        }}
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            📄
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                              {doc.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doc.type} • {doc.size} • {doc.pages} stron
                            </Typography>
                          </Box>
                          <Launch color="action" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Timeline wydarzeń */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                  <Timeline />
                  Historia głosowania
                </Typography>
                
                <Box sx={{ position: "relative" }}>
                  {/* Linia czasowa */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 24,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      bgcolor: "divider",
                    }}
                  />
                  
                  {proposal.timeline.map((event, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 3, mb: 4, position: "relative" }}>
                      {/* Ikona wydarzenia */}
                      <Avatar
                        sx={{
                          bgcolor: `${getTypeColor(event.type)}.main`,
                          color: "white",
                          width: 48,
                          height: 48,
                          zIndex: 1,
                        }}
                      >
                        {getTypeIcon(event.type)}
                      </Avatar>
                      
                      {/* Treść wydarzenia */}
                      <Paper 
                        sx={{ 
                          flex: 1, 
                          p: 3,
                          border: 1,
                          borderColor: `${getTypeColor(event.type)}.light`,
                          bgcolor: alpha(theme.palette[getTypeColor(event.type) as keyof typeof theme.palette].main, 0.02),
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {event.title}
                          </Typography>
                          <Chip
                            label={`${event.date} ${event.time}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: "monospace" }}
                          />
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {event.content}
                        </Typography>
                        
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                          <Chip 
                            icon={<ThumbUp />}
                            label={`TAK: ${event.votes.yes.toLocaleString()}`}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                          <Chip 
                            icon={<ThumbDown />}
                            label={`NIE: ${event.votes.no.toLocaleString()}`}
                            color="error"
                            variant="outlined"
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            Łącznie: {(event.votes.yes + event.votes.no).toLocaleString()} głosów
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Prawa kolumna - Akcje i statystyki */}
          <Grid item xs={12} md={4}>
            {/* Karta głosowania */}
            <Card sx={{ mb: 3, position: "sticky", top: 100 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}>
                  🗳️ Oddaj głos
                </Typography>
                
                {proposal.hasUserVoted ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Już głosowałeś: {proposal.userVote === "yes" ? "TAK ✅" : "NIE ❌"}
                    </Typography>
                    <Typography variant="body2">
                      Twój głos został zapisany na blockchain
                    </Typography>
                  </Alert>
                ) : isActive ? (
                  <Stack spacing={3}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => {
                        setSelectedVote(true);
                        setVoteOpen(true);
                      }}
                      disabled={!isConnected}
                      startIcon={<ThumbUp />}
                      sx={{
                        py: 2,
                        background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        borderRadius: 3,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.3)}`,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 12px 32px ${alpha(theme.palette.success.main, 0.4)}`,
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isConnected ? "GŁOSUJ TAK" : "POŁĄCZ PORTFEL"}
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => {
                        setSelectedVote(false);
                        setVoteOpen(true);
                      }}
                      disabled={!isConnected}
                      startIcon={<ThumbDown />}
                      sx={{
                        py: 2,
                        background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        borderRadius: 3,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.3)}`,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 12px 32px ${alpha(theme.palette.error.main, 0.4)}`,
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isConnected ? "GŁOSUJ NIE" : "POŁĄCZ PORTFEL"}
                    </Button>
                    
                    {!isConnected && (
                      <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                        <strong>Wymagane połączenie portfela</strong><br />
                        Połącz portfel, aby móc uczestniczyć w głosowaniu
                      </Alert>
                    )}
                    
                    <Box sx={{ textAlign: "center", pt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Siła Twojego głosu: <strong>{proposal.votingPower}</strong>
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ textAlign: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Głosowanie zakończone
                    </Typography>
                    <Typography variant="body2">
                      Dziękujemy za udział w demokratycznym procesie
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Informacje o twórcy */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Autor propozycji
                </Typography>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={proposal.creatorVerified ? <Verified color="primary" /> : null}
                  >
                    <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: "1.5rem" }}>
                      {proposal.creatorName.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {proposal.creatorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                      {formatAddress(proposal.creator)}
                    </Typography>
                    {proposal.creatorVerified && (
                      <Chip 
                        icon={<Verified />}
                        label="Zweryfikowany"
                        color="primary"
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Launch />}
                    onClick={() => window.open(`https://etherscan.io/address/${proposal.creator}`, "_blank")}
                  >
                    Zobacz na Etherscan
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    fullWidth
                    startIcon={<Visibility />}
                  >
                    Historia propozycji
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Statystyki zaawansowane */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Statystyki szczegółowe
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Szczyt głosowania
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {proposal.statistics.peakVotingHour}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Podział platform
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">📱 Mobile: {proposal.statistics.mobileVotes}%</Typography>
                      <Typography variant="body2">💻 Desktop: {proposal.statistics.desktopVotes}%</Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Najbardziej aktywne dzielnice
                    </Typography>
                    {proposal.statistics.topDistricts.map((district, index) => (
                      <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">
                          {index + 1}. {district.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {district.votes} ({district.percentage}%)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Ostatni głosujący */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Group />
                  Ostatnie głosy ({proposal.votersList.length})
                </Typography>
                
                <List sx={{ p: 0 }}>
                  {proposal.votersList.map((voter, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1.5, borderBottom: index < proposal.votersList.length - 1 ? 1 : 0, borderColor: "divider" }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: voter.vote === "YES" ? "success.main" : "error.main",
                            width: 36,
                            height: 36,
                          }}
                        >
                          {voter.vote === "YES" ? <ThumbUp /> : <ThumbDown />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                              {voter.isAnonymous ? "🔒 Anonimowy" : formatAddress(voter.address)}
                            </Typography>
                            <Chip
                              label={voter.vote}
                              color={voter.vote === "YES" ? "success" : "error"}
                              size="small"
                              sx={{ fontWeight: 600, minWidth: 50 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {voter.district}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(voter.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ textAlign: "center", pt: 2 }}>
                  <Button variant="outlined" size="small" fullWidth>
                    Zobacz wszystkich głosujących
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Dialog głosowania */}
      <Dialog open={voteOpen} onClose={() => setVoteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Potwierdź głos {selectedVote ? "TAK ✅" : "NIE ❌"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Alert severity={selectedVote ? "success" : "error"} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Głosujesz {selectedVote ? "ZA" : "PRZECIW"} propozycji:
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, bgcolor: "grey.50", mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              {proposal.question}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Autor: {proposal.creatorName}
            </Typography>
          </Paper>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Ważne:</strong> Głos zostanie zapisany na blockchain i nie będzie można go zmienić. 
              Upewnij się, że to jest Twoja ostateczna decyzja.
            </Typography>
          </Alert>
          
          <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Szczegóły transakcji:</strong><br />
              • Siła głosu: {proposal.votingPower}<br />
              • Typ głosowania: {proposal.votingType}<br />
              • Koszt transakcji: ~0.001 ETH (gas)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setVoteOpen(false)} variant="outlined" size="large">
            Anuluj
          </Button>
          <Button
            variant="contained"
            color={selectedVote ? "success" : "error"}
            onClick={() => handleVote(selectedVote!)}
            disabled={loading}
            startIcon={loading ? <Schedule /> : (selectedVote ? <ThumbUp /> : <ThumbDown />)}
            size="large"
            sx={{ minWidth: 140 }}
          >
            {loading ? "Głosuję..." : `Głosuj ${selectedVote ? "TAK" : "NIE"}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog udostępniania */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📤 Udostępnij głosowanie</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Podziel się tym głosowaniem ze znajomymi:
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              value={typeof window !== 'undefined' ? window.location.href : ''}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ fontFamily: "monospace" }}
            />
            <IconButton 
              onClick={handleShare} 
              color={copiedLink ? "success" : "primary"}
              sx={{ flexShrink: 0 }}
            >
              {copiedLink ? <CheckCircle /> : <ContentCopy />}
            </IconButton>
          </Box>
          
          {copiedLink && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Link został skopiowany do schowka!
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Zachęć innych do udziału w demokratycznym procesie decyzyjnym. 
            Każdy głos ma znaczenie!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)} variant="contained">
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </div>
  );
}