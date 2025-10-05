// src/app/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  IconButton, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  Stack,
  Container,
  useTheme,
  alpha,
  Paper,
  LinearProgress,
  MobileStepper,
  useMediaQuery
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  HowToVote, 
  TrendingUp,
  AccessTime,
  Person,
  CheckCircle,
  Cancel,
  VisibilityOutlined
} from '@mui/icons-material';
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero3D from "../components/Hero3D";
import VoteCardPage from "../components/VoteCardPage";
import CampaignCard from "../components/CampaignCard";
import { useAccount } from 'wagmi';
import { useGetAllProposals, type Proposal } from '../hooks/usePoliDao';
import { useFundraisersModular, type ModularFundraiser } from '../hooks/useFundraisersModular';
// NEW: governance reads
import { useReadContract, useReadContracts } from 'wagmi';
import { ROUTER_ADDRESS } from '../blockchain/contracts';
import { poliDaoRouterAbi } from '../blockchain/routerAbi';
import { poliDaoCoreAbi } from '../blockchain/coreAbi';
import poliDaoGovernanceAbi from '../blockchain/governanceAbi';

// NEW: Swiper imports (minimal)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'; // + navigation CSS

// Material-UI Proposal Card z nawigacją - ZAKTUALIZOWANE
function MUIProposalCard({ proposal }: { proposal: Proposal }) {
  const theme = useTheme();
  const router = useRouter();
  
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;
  
  const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (24 * 60 * 60)) / 3600));
  
  const isActive = timeLeft > 0;

  // ✅ ZMIENIONE: Nawigacja do /votes/[id]
  const handleCardClick = () => {
    router.push(`/votes/${proposal.id.toString()}`);
  };

  const handleVote = (e: React.MouseEvent, support: boolean) => {
    e.stopPropagation();
    // Tutaj wywołaj funkcję głosowania
    console.log(`Voting ${support ? 'YES' : 'NO'} on proposal ${proposal.id}`);
  };

  return (
    <Card 
      sx={{ 
        minWidth: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        {/* Header with status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography variant="h6" component="h3" sx={{ 
              fontWeight: 600, 
              mb: 1,
              lineHeight: 1.3,
              color: theme.palette.text.primary
            }}>
              {proposal.question}
            </Typography>
            <Chip 
              icon={<HowToVote />}
              label={`Propozycja #${proposal.id.toString()}`}
              size="small"
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Box>
          <Chip
            icon={isActive ? <AccessTime /> : <CheckCircle />}
            label={
              isActive 
                ? (daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`)
                : "Zakończone"
            }
            color={isActive ? "success" : "default"}
            size="small"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { fontSize: '16px' }
            }}
          />
        </Box>

        {/* Voting Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              TAK: {Number(proposal.yesVotes)} ({yesPercentage.toFixed(1)}%)
            </Typography>
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
              NIE: {Number(proposal.noVotes)} ({noPercentage.toFixed(1)}%)
            </Typography>
          </Box>
          
          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: alpha(theme.palette.grey[300], 0.3) }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${yesPercentage}%`,
                bgcolor: theme.palette.success.main,
                transition: 'width 0.6s ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                width: `${noPercentage}%`,
                bgcolor: theme.palette.error.main,
                transition: 'width 0.6s ease',
              }}
            />
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          p: 2,
          bgcolor: alpha(theme.palette.grey[100], 0.5),
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HowToVote fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Łącznie: {totalVotes}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons - ✅ ZAKTUALIZOWANE */}
        {isActive ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              // unified green + hover scale + glow
              sx={{ 
                flex: 1, fontWeight: 600, textTransform: 'none', borderRadius: 2,
                bgcolor: '#10b981',
                '&:hover': {
                  bgcolor: '#10b981',
                  transform: 'scale(1.03)',
                  boxShadow: '0 0 18px rgba(16,185,129,0.45)',
                },
                transition: 'all .2s ease',
              }}
              startIcon={<CheckCircle />}
              onClick={(e) => handleVote(e, true)}
            >
              TAK
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{
                flex: 1, fontWeight: 600, textTransform: 'none', borderRadius: 2,
                '&:hover': { transform: 'scale(1.03)' },
                transition: 'all .2s ease',
              }}
              startIcon={<Cancel />}
              onClick={(e) => handleVote(e, false)}
            >
              NIE
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/votes/${proposal.id.toString()}`);
              }}
              sx={{ 
                fontWeight: 600, textTransform: 'none', borderRadius: 2, minWidth: '80px',
                '&:hover': { transform: 'scale(1.03)', boxShadow: '0 0 12px rgba(16,185,129,0.35)' },
                transition: 'all .2s ease',
              }}
            >
              <VisibilityOutlined fontSize="small" />
            </Button>
          </Stack>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/votes/${proposal.id.toString()}`);
            }}
            sx={{ 
              textTransform: 'none', borderRadius: 2,
              '&:hover': { transform: 'scale(1.03)', boxShadow: '0 0 12px rgba(16,185,129,0.35)' },
              transition: 'all .2s ease',
            }}
            startIcon={<VisibilityOutlined />}
          >
            Zobacz szczegóły
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Futurystyczna karuzela z minimalistycznym designem
function FuturisticCarousel({ 
  title, 
  icon,
  items, 
  renderItem, 
  emptyMessage,
  rtl = false,
  autoplayDelay = 3000,
  space, // NEW: custom gap between slides (px)
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
  rtl?: boolean;
  autoplayDelay?: number;
  space?: number; // NEW
}) {
  const theme = useTheme();
  const ACCENT = '#10b981';
  const GAP = space ?? 4;

  // Ensure enough slides for seamless loop
  const slides = React.useMemo(() => {
    if (!items || items.length === 0) return [];
    if (items.length >= 9) return items;
    const reps = Math.ceil(9 / Math.max(1, items.length));
    return Array.from({ length: reps }).flatMap(() => items).slice(0, 9);
  }, [items]);

  // NEW: custom navigation refs (external buttons)
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);

  if (!slides || slides.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 6,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 0,
        overflow: 'visible', // was 'hidden' – allow arrows outside to be visible
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 0, py: 0, mb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
          {title}
        </Typography>
      </Box>

      {/* Carousel wrapper */}
      <Box
        sx={{
          position: 'relative',
          px: 0,
          pb: 3,
          overflow: 'visible',
          '& .swiper-wrapper': { transitionTimingFunction: 'ease-in-out' },
          // Ensure visible spacing equals GAP even if Swiper rounding kicks in
          '& .swiper-slide': {
            marginInlineEnd: `${GAP}px !important`,
          },
          // Pagination below (no overlay)
          '& .swiper-pagination': {
            position: 'static !important',
            marginTop: theme.spacing(1.5),
            display: 'flex',
            justifyContent: 'center',
          },
          '& .swiper-pagination-bullet': { width: 6, height: 6, opacity: 1, backgroundColor: 'rgba(0,0,0,.25)' },
          '& .swiper-pagination-bullet-active': { backgroundColor: ACCENT },
        }}
      >
        {/* NEW: external prev/next buttons fully outside the slide area */}
        <IconButton
          ref={prevRef}
          aria-label="Poprzedni"
          sx={{
            position: 'absolute',
            left: { xs: -14, sm: -18, md: -24, lg: -32 }, // push further left outside
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5, // ensure above swiper
            backgroundColor: 'rgba(255,255,255,0.98)',
            border: `1px solid ${alpha(ACCENT, 0.25)}`,
            boxShadow: `0 6px 20px ${alpha('#000', 0.12)}`,
            color: ACCENT,
            width: 36,
            height: 36,
            '&:hover': { backgroundColor: 'white' },
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        <IconButton
          ref={nextRef}
          aria-label="Następny"
          sx={{
            position: 'absolute',
            right: { xs: -14, sm: -18, md: -24, lg: -32 }, // outside on the right
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5, // ensure above swiper
            backgroundColor: 'rgba(255,255,255,0.98)',
            border: `1px solid ${alpha(ACCENT, 0.25)}`,
            boxShadow: `0 6px 20px ${alpha('#000', 0.12)}`,
            color: ACCENT,
            width: 36,
            height: 36,
            '&:hover': { backgroundColor: 'white' },
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>

        <Swiper
          key={`swiper-${title}-${slides.length}`}
          modules={[Pagination, Autoplay, Navigation]}
          loop
          loopedSlides={slides.length}
          loopedSlidesLimit={false}
          loopAdditionalSlides={Math.min(slides.length, 12)}
          speed={750}
          autoplay={{
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            reverseDirection: rtl,    // step to the right
            waitForTransition: true,
          }}
          pagination={{ clickable: true }}
          // NEW: bind custom external buttons
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-expect-error - runtime assignment supported by Swiper
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error - runtime assignment supported by Swiper
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          slidesPerView={3}
          slidesPerGroup={1}
          spaceBetween={GAP}
          cssMode={false}
        >
          {slides.map((item, index) => (
            <SwiperSlide key={`${title}-${index}`}>
              <Box sx={{ borderRadius: 0 }}>
                {renderItem(item, index)}
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Paper>
  );
}

export default function HomePage() {
  const router = useRouter();
  
  // Używaj nowych hooków
  const { 
    fundraisers, 
    isLoading: campaignsLoading, 
    error: campaignsError, 
    refetch: refetchCampaigns, 
    count: campaignCount 
  } = useFundraisersModular();

  const { 
    proposals, 
    isLoading: proposalsLoading, 
    error: proposalsError, 
    refetchProposals, 
    proposalCount 
  } = useGetAllProposals();

  // --- Governance module: resolve and read proposals ---
  const { data: coreAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'coreContract',
  });

  const { data: governanceAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'governanceModule',
    query: { enabled: !!coreAddress },
  });

  // REPLACED: getAllProposalIds -> getProposals (paged)
  const { data: govPage, refetch: refetchGovPage } = useReadContract({
    address: governanceAddress as `0x${string}` | undefined,
    abi: poliDaoGovernanceAbi,
    functionName: 'getProposals',
    args: [0n, 200n],
    query: { enabled: !!governanceAddress },
  });

  // Keep count as fallback
  const { data: govCountRaw } = useReadContract({
    address: governanceAddress as `0x${string}` | undefined,
    abi: poliDaoGovernanceAbi,
    functionName: 'getProposalCount',
    query: { enabled: !!governanceAddress },
  });

  // IDs from page tuple or fallback to 0..count-1
  const govIds = React.useMemo(() => {
    const tuple = govPage as any;
    const pagedIds: bigint[] = Array.isArray(tuple?.ids)
      ? (tuple.ids as bigint[])
      : (Array.isArray(tuple?.[0]) ? (tuple[0] as bigint[]) : []);
    if (pagedIds && pagedIds.length > 0) return pagedIds.slice(0, 200);
    const n = Number(govCountRaw ?? 0n);
    return Array.from({ length: Math.min(n, 100) }, (_, i) => BigInt(i));
  }, [govPage, govCountRaw]);

  const govCalls = React.useMemo(() => {
    if (!governanceAddress || govIds.length === 0) return [];
    return govIds.map((id) => ({
      address: governanceAddress as `0x${string}`,
      abi: poliDaoGovernanceAbi,
      functionName: 'getProposal',
      args: [id],
    }));
  }, [governanceAddress, govIds]);

  const { data: govResults, refetch: refetchGovResults } = useReadContracts({
    contracts: govCalls,
    query: { enabled: govCalls.length > 0 },
  });

  const governanceProposals: Proposal[] = React.useMemo(() => {
    if (!govResults || govResults.length === 0) return [];
    const out: Proposal[] = [];
    govResults.forEach((r) => {
      const v = (r as any)?.result;
      if (!v) return;
      const exists = Boolean(v.exists ?? v[6] ?? true);
      if (!exists) return;
      out.push({
        id: BigInt(v.id ?? v[0] ?? 0n),
        question: String(v.question ?? v[1] ?? ''),
        yesVotes: BigInt(v.yesVotes ?? v[2] ?? 0n),
        noVotes: BigInt(v.noVotes ?? v[3] ?? 0n),
        endTime: BigInt(v.endTime ?? v[4] ?? 0n),
        creator: String(v.creator ?? v[5] ?? '0x0000000000000000000000000000000000000000'),
      });
    });
    return out;
  }, [govResults]);

  // Use governance proposals if available, else fallback to hook
  const displayProposals = React.useMemo(
    () => (governanceProposals.length > 0 ? governanceProposals : (proposals || [])),
    [governanceProposals, proposals]
  );
  const displayProposalCount = displayProposals.length || Number(govCountRaw ?? 0n) || proposalCount;

  // New: combined loading/error respecting governance fallback
  // Filter out ABI mismatch errors coming from the legacy hook (getAllProposalIds)
  const hookErrorIsAbiMismatch = Boolean(proposalsError?.message?.includes('getAllProposalIds'));
  const votesLoading = proposalsLoading && displayProposals.length === 0;
  const votesError = !!proposalsError && !hookErrorIsAbiMismatch && displayProposals.length === 0;

  // Helper: explicit governance refresh
  const refetchVotes = async () => {
    try {
      await Promise.allSettled([refetchGovPage(), refetchGovResults()]);
      // Optionally also refetch legacy hook (safe no-op if it errors)
      await Promise.resolve(refetchProposals?.());
    } catch {}
  };

  const [activeTab, setActiveTab] = useState<"zbiorki" | "glosowania">("glosowania");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "target" | "flexible">("all");
  const { isConnected } = useAccount();

  // Filtruj kampanie na podstawie wybranego filtru
  const campaigns = fundraisers; // alias dla istniejącej logiki poniżej
  const filteredCampaigns = campaigns ? campaigns.filter((campaign: ModularFundraiser) => {
    if (campaignFilter === "target") return !campaign.isFlexible;
    if (campaignFilter === "flexible") return campaign.isFlexible;
    return true; // "all"
  }) : [];

  // Sprawdź czy są aktywne propozycje
  const hasActiveProposals = displayProposals && displayProposals.some((proposal: Proposal) => {
    const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
    return timeLeft > 0;
  });

  // ✅ ZAKTUALIZOWANE: Logika dla karuzeli propozycji - aktywne propozycje pierwsze
  const getCarouselProposals = () => {
    if (!displayProposals || displayProposals.length === 0) return [];
    
    const now = Math.floor(Date.now() / 1000);
    
    // Sortuj: aktywne pierwsze (według czasu pozostałego), potem zakończone (według aktywności)
    return [...displayProposals].sort((a, b) => {
      const timeLeftA = Number(a.endTime) - now;
      const timeLeftB = Number(b.endTime) - now;
      const isActiveA = timeLeftA > 0;
      const isActiveB = timeLeftB > 0;
      
      // Aktywne propozycje pierwsze
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      
      if (isActiveA && isActiveB) {
        // Dla aktywnych: te z najmniejszym czasem pozostałym (pilne)
        return timeLeftA - timeLeftB;
      } else {
        // Dla zakończonych: te z największą liczbą głosów
        const totalVotesA = Number(a.yesVotes) + Number(a.noVotes);
        const totalVotesB = Number(b.yesVotes) + Number(b.noVotes);
        return totalVotesB - totalVotesA;
      }
    }).slice(0, 8); // Maksymalnie 8 propozycji w karuzeli
  };

  // ✅ ZAKTUALIZOWANE: Logika dla karuzeli kampanii z nowymi danymi z ABI
  const getCarouselCampaigns = () => {
    if (!campaigns || campaigns.length === 0) return [];
    
    const now = Math.floor(Date.now() / 1000);
    
    return [...campaigns].sort((a: any, b: any) => {
      const timeLeftA = Number(a.endDate ?? 0) - now;
      const timeLeftB = Number(b.endDate ?? 0) - now;
      const isActiveA = timeLeftA > 0;
      const isActiveB = timeLeftB > 0;
      
      // Aktywne kampanie pierwsze
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      
      if (isActiveA && isActiveB) {
        // Dla aktywnych: 
        // 1. Kampanie z celem - sortuj według % postępu (najbliższe celu)
        // 2. Elastyczne - sortuj według zebranej kwoty
        if (!a.isFlexible && !b.isFlexible) {
          const progressA = Number(a.raisedAmount ?? 0) / Math.max(Number(a.goalAmount ?? 0), 1);
          const progressB = Number(b.raisedAmount ?? 0) / Math.max(Number(b.goalAmount ?? 0), 1);
          return progressB - progressA; // Największy postęp pierwszy
        } else if (a.isFlexible && b.isFlexible) {
          return Number(b.raisedAmount ?? 0) - Number(a.raisedAmount ?? 0); // Więcej zebranych środków
        } else {
          return a.isFlexible ? 1 : -1; // Kampanie z celem pierwszeństwo
        }
      } else {
        // Dla zakończonych: sortuj według zebranej kwoty
        return Number(b.raisedAmount ?? 0) - Number(a.raisedAmount ?? 0);
      }
    }).slice(0, 8); // Maksymalnie 8 kampanii w karuzeli
  };

  const carouselProposals = getCarouselProposals();
  const carouselCampaigns = getCarouselCampaigns();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* HERO BACKGROUND - zawsze renderowany */}
      <Hero3D />

      {/* GŁÓWNY HERO BANNER Z INTERAKTYWNYM GŁOSOWANIEM */}
      {/* Pokazuj tylko gdy są aktywne propozycje, albo gdy zakładka głosowania jest wybrana */}
      {(hasActiveProposals || activeTab === "glosowania") && (
        <div className="relative -mt-[400px] pt-[200px] pb-[100px] flex items-center justify-center px-8">
          <VoteCardPage />
        </div>
      )}

      {/* GŁÓWNA TREŚĆ - dodano flex-1 dla wypychania footer */}
      <main className="flex-1">
        {/* KARUZELE - pokazują się tylko gdy są dane */}
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* Karuzela aktywnych głosowań */}
          <FuturisticCarousel
            title="Aktywne głosowania"
            icon={<HowToVote sx={{ fontSize: 28 }} />}
            items={carouselProposals}
            renderItem={(proposal: Proposal) => (
              <MUIProposalCard
                key={proposal.id.toString()}
                proposal={proposal}
              />
            )}
            emptyMessage="Brak aktywnych głosowań"
          />

          {/* ✅ Karuzela kampanii – super-płynny ruch w prawo */}
          <FuturisticCarousel
            title="Najlepsze kampanie i zbiórki"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            items={carouselCampaigns}
            rtl={true}
            autoplayDelay={3000}
            space={0} // CHANGED: force zero gap for a clear ~70%+ reduction
            renderItem={(campaign: ModularFundraiser) => {
              const mappedCampaign = {
                campaignId: campaign.id.toString(),
                targetAmount: campaign.goalAmount ?? 0n,
                raisedAmount: campaign.raisedAmount ?? 0n,
                creator: campaign.creator,
                token: campaign.token,
                endTime: campaign.endDate ?? 0n,
                isFlexible: campaign.isFlexible,
              };

              const metadata = {
                title: campaign.title && campaign.title.length > 0
                  ? campaign.title
                  : campaign.isFlexible
                    ? `Elastyczna kampania #${campaign.id}`
                    : `Zbiórka z celem #${campaign.id}`,
                description: campaign.description && campaign.description.length > 0
                  ? campaign.description.slice(0, 140)
                  : `Kampania utworzona przez ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
                image: "/images/zbiorka.png",
              };

              return (
                <CampaignCard
                  key={campaign.id.toString()}
                  campaign={mappedCampaign}
                  metadata={metadata}
                />
              );
            }}
            emptyMessage="Brak aktywnych kampanii i zbiórek"
          />
        </Container>

        {/* TABS */}
        <div className="container mx-auto px-4 mt-8">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab("glosowania")}
              className={`py-2 px-4 -mb-px border-b-2 font-medium ${
                activeTab === "glosowania"
                  ? "border-[#10b981] text-[#10b981]"
                  : "border-transparent text-gray-600"
              } transform transition-transform hover:scale-105`}
            >
              🗳️ Wszystkie głosowania ({displayProposalCount})
            </button>
            <button
              onClick={() => setActiveTab("zbiorki")}
              className={`py-2 px-4 -mb-px border-b-2 font-medium ${
                activeTab === "zbiorki"
                  ? "border-[#10b981] text-[#10b981]"
                  : "border-transparent text-gray-600"
              } transform transition-transform hover:scale-105`}
            >
              🎯 Wszystkie kampanie i zbiórki ({campaignCount})
            </button>
          </div>

          {/* Informacja o połączeniu */}
          {!isConnected && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-bold text-yellow-800">Portfel niepołączony</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Połącz swój portfel, aby móc uczestniczyć w zbiórkach i głosowaniach.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT */}
          <div className="mt-6 pb-12">
            {activeTab === "glosowania" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Wszystkie głosowania
                  </h2>
                  <button
                    onClick={refetchVotes}
                    disabled={votesLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      votesLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#10b981] hover:bg-[#10b981]'
                    } text-white transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]`}
                  >
                    {votesLoading ? '⏳ Ładowanie...' : '🔄 Odśwież'}
                  </button>
                </div>

                {votesLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Pobieranie danych z kontraktu...</span>
                  </div>
                )}

                {votesError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Błąd ładowania propozycji</h3>
                        <p className="text-red-700 text-sm mt-1">{proposalsError?.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!votesLoading && (
                  <>
                    {displayProposals && displayProposals.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {displayProposals.map((proposal: Proposal) => (
                          <MUIProposalCard
                            key={proposal.id.toString()}
                            proposal={proposal}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">🗳️</span>
                        <p className="text-gray-500 text-lg">Brak propozycji na kontrakcie</p>
                        <p className="text-gray-400 mt-2">Utwórz pierwszą propozycję, aby zobaczyć ją tutaj!</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === "zbiorki" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Wszystkie kampanie i zbiórki
                  </h2>
                  <button
                    onClick={refetchCampaigns}
                    disabled={campaignsLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      campaignsLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#10b981]'
                    } text-white transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]`}
                  >
                    {campaignsLoading ? '⏳ Ładowanie...' : '🔄 Odśwież'}
                  </button>
                </div>

                {/* Sub-tabs dla filtrowania kampanii */}
                <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-4">
                  <button
                    onClick={() => setCampaignFilter("all")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "all"
                        ? "border-[#10b981] text-[#10b981] bg-[#10b981]/10"
                        : "border-transparent text-gray-600 hover:text-[#10b981]"
                    }`}
                  >
                    📊 Wszystkie ({campaigns ? campaigns.length : 0})
                  </button>
                  <button
                    onClick={() => setCampaignFilter("target")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "target"
                        ? "border-[#10b981] text-[#10b981] bg-[#10b981]/10"
                        : "border-transparent text-gray-600 hover:text-[#10b981]"
                    }`}
                  >
                    🎯 Zbiórki ({campaigns ? campaigns.filter(c => !c.isFlexible).length : 0})
                  </button>
                  <button
                    onClick={() => setCampaignFilter("flexible")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "flexible"
                        ? "border-[#10b981] text-[#10b981] bg-[#10b981]/10"
                        : "border-transparent text-gray-600 hover:text-[#10b981]"
                    }`}
                  >
                    🌊 Kampanie ({campaigns ? campaigns.filter(c => c.isFlexible).length : 0})
                  </button>
                </div>

                {campaignsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">Pobieranie danych z kontraktu...</span>
                  </div>
                )}

                {campaignsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Błąd ładowania kampanii</h3>
                        <p className="text-red-700 text-sm mt-1">{campaignsError.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!campaignsLoading && !campaignsError && (
                  <>
                    {filteredCampaigns && filteredCampaigns.length > 0 ? (
                      <>
                        {/* Informacja o filtrze */}
                        {campaignFilter !== "all" && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center text-blue-800">
                              <span className="mr-2">
                                {campaignFilter === "target" ? "🎯" : "🌊"}
                              </span>
                              <span className="font-medium">
                                Wyświetlanie: {campaignFilter === "target" ? "Zbiórek z celem" : "Kampanie"} 
                                ({filteredCampaigns.length} z {campaigns?.length || 0})
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* ✅ ZAKTUALIZOWANE: Używa CampaignCard zamiast EnhancedCampaignCard */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {filteredCampaigns.map((campaign: ModularFundraiser) => {
                            const mappedCampaign = {
                              campaignId: campaign.id.toString(),
                              targetAmount: campaign.goalAmount ?? 0n,
                              raisedAmount: campaign.raisedAmount ?? 0n,
                              creator: campaign.creator,
                              token: campaign.token,
                              endTime: campaign.endDate ?? 0n,
                              isFlexible: campaign.isFlexible
                            };

                            const metadata = {
                              title: campaign.title && campaign.title.length > 0
                                ? campaign.title
                                : campaign.isFlexible ? `Elastyczna kampania #${campaign.id}` : `Zbiórka #${campaign.id}`,
                              description: campaign.description && campaign.description.length > 0
                                ? campaign.description.slice(0, 140)
                                : `Kampania utworzona przez ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
                              image: "/images/zbiorka.png"
                            };

                            return (
                              <CampaignCard
                                key={campaign.id.toString()}
                                campaign={mappedCampaign}
                                metadata={metadata}
                              />
                            );
                          })}
                        </div>
                      </>
                    ) : campaigns && campaigns.length > 0 ? (
                      // Są kampanie, ale nie pasują do filtru
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">
                          {campaignFilter === "target" ? "🎯" : campaignFilter === "flexible" ? "🌊" : "🔍"}
                        </span>
                        <p className="text-gray-500 text-lg">
                          Brak typu: {campaignFilter === "target" ? "Zbiórek z celem" : campaignFilter === "flexible" ? "Kampanii" : ""}
                        </p>
                        <p className="text-gray-400 mt-2">
                          Spróbuj wybrać inny filtr lub utwórz nowy projekt tego typu.
                        </p>
                        <button
                          onClick={() => setCampaignFilter("all")}
                          className="mt-3 px-4 py-2 bg-[#10b981] hover:bg-[#10b981] text-white rounded-lg transition-colors transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                        >
                          🔄 Pokaż wszystkie projekty
                        </button>
                      </div>
                    ) : (
                      // Brak kampanii w ogóle
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">🌱</span>
                        <p className="text-gray-500 text-lg">Brak kampanii i zbiórek na kontrakcie</p>
                        <p className="text-gray-400 mt-2">Utwórz pierwszy projekt, aby zobaczyć go tutaj!</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER - na końcu strony */}
      <Footer />
    </div>
  );
}