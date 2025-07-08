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
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Favorite,
  Share,
  AccessTime,
  Person,
  AccountBalanceWallet,
  TrendingUp,
  Flag,
  ArrowBack,
  Launch,
  ContentCopy,
  CheckCircle,
  Cancel,
  Info,
  Group,
  Timeline,
} from "@mui/icons-material";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useAccount } from "wagmi";

// Mock data dla przykładu - w prawdziwej aplikacji pobierałbyś to z kontraktu
const mockCampaignData = {
  id: "123",
  title: "Rewitalizacja parku w centrum miasta",
  description: `
Nasz lokalny park w centrum miasta wymaga pilnej rewitalizacji. 
Infrastruktura została zniszczona przez lata zaniedbań, a dzieci i rodziny nie mają bezpiecznego miejsca do spędzania czasu na świeżym powietrzu.

Planujemy:
• Remont placu zabaw z nowoczesnymi, bezpiecznymi urządzeniami
• Renowację ścieżek spacerowych i miejsc do siedzenia  
• Nasadzenie nowych drzew i krzewów
• Instalację nowego oświetlenia LED
• Utworzenie strefy fitness na powietrzu

Każda złotówka zostanie przeznaczona na te konkretne cele. Regularnie będziemy publikować raporty z postępów prac.

Razem możemy stworzyć przestrzeń, z której będą korzystać pokolenia!
  `,
  image: "/images/park-rewitalizacja.jpg", // Przykładowe zdjęcie
  creator: "0x1234567890123456789012345678901234567890",
  creatorName: "Stowarzyszenie Zielone Miasto",
  target: "50000000000", // 50,000 USDC (6 decimals)
  raised: "32500000000", // 32,500 USDC
  token: "0xa0b86a33e6441caacfd336e3b3c5a8e52d4b8b5c", // Mock USDC address
  endTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 dni od teraz
  isFlexible: false,
  donorsCount: 127,
  lastDonation: Date.now() - 2 * 60 * 60 * 1000, // 2 godziny temu
  category: "Środowisko",
  location: "Warszawa, Śródmieście",
  updates: [
    {
      date: "2025-07-07",
      title: "Otrzymaliśmy zgodę na prace!",
      content: "Magistrat wydał pozwolenie na rozpoczęcie prac rewitalizacyjnych. Planowane rozpoczęcie: 15 lipca.",
      amount: "5000000000", // 5,000 USDC
    },
    {
      date: "2025-07-05", 
      title: "Przekroczyliśmy 30,000 zł!",
      content: "Dziękujemy wszystkim darczyńcom za wsparcie. Jesteśmy już o krok bliżej realizacji marzeń!",
      amount: "30000000000",
    },
  ],
  topDonors: [
    { address: "0xabc123...", amount: "2500000000", isAnonymous: false },
    { address: "0xdef456...", amount: "2000000000", isAnonymous: true },
    { address: "0x789ghi...", amount: "1500000000", isAnonymous: false },
  ],
};

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { isConnected, address } = useAccount();
  
  const [campaign, setCampaign] = useState(mockCampaignData);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Obliczenia
  const targetAmount = Number(campaign.target) / 1000000; // USDC ma 6 decimals
  const raisedAmount = Number(campaign.raised) / 1000000;
  const progressPercentage = (raisedAmount / targetAmount) * 100;
  const timeLeft = campaign.endTime - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (24 * 60 * 60)) / 3600));
  const isActive = timeLeft > 0;
  const amountLeft = targetAmount - raisedAmount;

  useEffect(() => {
    // W prawdziwej aplikacji tutaj pobierałbyś dane z kontraktu
    // na podstawie params.id
    console.log("Loading campaign with ID:", params.id);
  }, [params.id]);

  const handleDonate = async () => {
    if (!isConnected) {
      alert("Najpierw połącz portfel!");
      return;
    }
    
    setLoading(true);
    try {
      // Tutaj wywołałbyś funkcję donate z kontraktu
      console.log(`Donating ${donateAmount} USDC to campaign ${campaign.id}`);
      
      // Symulacja
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDonateOpen(false);
      setDonateAmount("");
      alert("Wpłata została pomyślnie wykonana!");
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Wystąpił błąd podczas wpłaty");
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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Breadcrumb & Back Button */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ bgcolor: "white", boxShadow: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Kampanie / Zbiórki / #{campaign.id}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Lewa kolumna - Główne informacje */}
          <Grid item xs={12} md={8}>
            {/* Zdjęcie główne */}
            <Card sx={{ mb: 3, overflow: "hidden" }}>
              <Box
                sx={{
                  height: 400,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.6)}), url('/images/zbiorka.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "flex-end",
                  position: "relative",
                }}
              >
                {/* Overlay z kategoriami */}
                <Box sx={{ position: "absolute", top: 16, left: 16 }}>
                  <Chip
                    label={campaign.category}
                    color="primary"
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "primary.main" }}
                  />
                </Box>
                
                <Box sx={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={() => setShareOpen(true)}
                    sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
                  >
                    <Share />
                  </IconButton>
                  <IconButton sx={{ bgcolor: "rgba(255,255,255,0.9)" }}>
                    <Flag />
                  </IconButton>
                </Box>

                {/* Tytuł na zdjęciu */}
                <Box
                  sx={{
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    color: "white",
                    p: 3,
                    width: "100%",
                  }}
                >
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                    {campaign.title}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Person fontSize="small" />
                      {campaign.creatorName}
                    </Typography>
                    <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTime fontSize="small" />
                      {campaign.location}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Status i postęp */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Postęp zbiórki
                  </Typography>
                  <Chip
                    icon={isActive ? <AccessTime /> : <CheckCircle />}
                    label={isActive ? `${daysLeft} dni, ${hoursLeft}h` : "Zakończona"}
                    color={isActive ? "success" : "default"}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {raisedAmount.toLocaleString()} USDC
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      cel: {targetAmount.toLocaleString()} USDC
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(progressPercentage, 100)}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      mb: 2,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 6,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      },
                    }}
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {Math.round(progressPercentage)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          osiągnięte
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {campaign.donorsCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          darczyńców
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {Math.max(0, amountLeft).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          pozostało
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {!campaign.isFlexible && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Zbiórka z celem:</strong> Środki zostaną przekazane tylko gdy osiągniemy cel {targetAmount.toLocaleString()} USDC. 
                    W przeciwnym razie wszystkie wpłaty zostaną zwrócone.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Opis kampanii */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  O tej kampanii
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                  {campaign.description}
                </Typography>
              </CardContent>
            </Card>

            {/* Aktualizacje */}
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Timeline />
                  Aktualizacje kampanii
                </Typography>
                
                {campaign.updates.map((update, index) => (
                  <Box key={index} sx={{ mb: index < campaign.updates.length - 1 ? 3 : 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {update.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(update.date)}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {update.content}
                    </Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                      Zebrano: {(Number(update.amount) / 1000000).toLocaleString()} USDC
                    </Typography>
                    {index < campaign.updates.length - 1 && <Divider sx={{ mt: 3 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Prawa kolumna - Akcje i statystyki */}
          <Grid item xs={12} md={4}>
            {/* Karta wpłaty */}
            <Card sx={{ mb: 3, position: "sticky", top: 100 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Wesprzyj kampanię
                </Typography>
                
                {isActive ? (
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => setDonateOpen(true)}
                      disabled={!isConnected}
                      startIcon={<Favorite />}
                      sx={{
                        py: 1.5,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        fontWeight: 600,
                        fontSize: "1.1rem",
                      }}
                    >
                      {isConnected ? "Wpłać środki" : "Połącz portfel"}
                    </Button>
                    
                    {!isConnected && (
                      <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                        Połącz portfel, aby móc wpłacić środki
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    Kampania została zakończona
                  </Alert>
                )}
                
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                    Ostatnia wpłata: {new Date(campaign.lastDonation).toLocaleString("pl-PL")}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Informacje o twórcy */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Twórca kampanii
                </Typography>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
                    {campaign.creatorName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {campaign.creatorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                      {formatAddress(campaign.creator)}
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<Launch />}
                  onClick={() => window.open(`https://etherscan.io/address/${campaign.creator}`, "_blank")}
                >
                  Zobacz na Etherscan
                </Button>
              </CardContent>
            </Card>

            {/* Top darczyńcy */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Group />
                  Najlepsi darczyńcy
                </Typography>
                
                <List sx={{ p: 0 }}>
                  {campaign.topDonors.map((donor, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? "gold" : index === 1 ? "silver" : "#cd7f32", width: 32, height: 32 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "white" }}>
                            {index + 1}
                          </Typography>
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {donor.isAnonymous ? "Anonimowy darczyńca" : formatAddress(donor.address)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                            {(Number(donor.amount) / 1000000).toLocaleString()} USDC
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Dialog wpłaty */}
      <Dialog open={donateOpen} onClose={() => setDonateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Wpłać środki na kampanię</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {campaign.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Wpłacasz środki w USDC na adres kontraktu
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="Kwota (USDC)"
            type="number"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ min: 1, step: 0.01 }}
          />
          
          {!campaign.isFlexible && (
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
            disabled={!donateAmount || loading}
          >
            {loading ? "Przetwarzanie..." : `Wpłać ${donateAmount} USDC`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog udostępniania */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Udostępnij kampanię</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Udostępnij link do tej kampanii swoim znajomym:
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={window.location.href}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <IconButton onClick={handleShare} color={copiedLink ? "success" : "primary"}>
              {copiedLink ? <CheckCircle /> : <ContentCopy />}
            </IconButton>
          </Box>
          
          {copiedLink && (
            <Alert severity="success">Link został skopiowany do schowka!</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </div>
  );
}