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
  LinearProgress
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
              color="success"
              size="small"
              sx={{ flex: 1, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
              startIcon={<CheckCircle />}
              onClick={(e) => handleVote(e, true)}
            >
              TAK
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              sx={{ flex: 1, fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
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
                router.push(`/votes/${proposal.id.toString()}`); // ✅ ZMIENIONE
              }}
              sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2, minWidth: '80px' }}
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
              router.push(`/votes/${proposal.id.toString()}`); // ✅ ZMIENIONE
            }}
            sx={{ textTransform: 'none', borderRadius: 2 }}
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
  emptyMessage 
}: { 
  title: string;
  icon: React.ReactNode;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
}) {
  const theme = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      
      // Oblicz aktualny indeks
      const cardWidth = 340; // szerokość karty + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340; // Width of one card + gap
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340 * index;
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (items.length === 0) return null;

  const visibleDots = Math.min(items.length, 8); // Maksymalnie 8 kropek

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mb: 6,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Futurystyczny header */}
      <Box sx={{ 
        p: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
      }}>
        {/* Animowane tło */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%)`,
            opacity: 0.3,
          }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 56,
                minHeight: 56,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {icon}
            </Box>
            
            <Box>
              <Typography variant="h4" component="h2" sx={{ 
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}>
                {title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`${items.length} elementów`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                />
                
                {/* Minimalistyczne kropki nawigacji */}
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {Array.from({ length: visibleDots }).map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => scrollToIndex(index)}
                      sx={{
                        width: currentIndex === index ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: currentIndex === index 
                          ? theme.palette.primary.main 
                          : alpha(theme.palette.primary.main, 0.2),
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: currentIndex === index 
                            ? theme.palette.primary.dark 
                            : alpha(theme.palette.primary.main, 0.4),
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* Futurystyczne przyciski nawigacji */}
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              sx={{
                width: 48,
                height: 48,
                bgcolor: canScrollLeft 
                  ? alpha(theme.palette.background.paper, 0.9) 
                  : alpha(theme.palette.action.disabled, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, canScrollLeft ? 0.2 : 0.1)}`,
                color: canScrollLeft 
                  ? theme.palette.primary.main 
                  : theme.palette.action.disabled,
                '&:hover': {
                  bgcolor: canScrollLeft 
                    ? alpha(theme.palette.primary.main, 0.1) 
                    : alpha(theme.palette.action.disabled, 0.1),
                  transform: canScrollLeft ? 'scale(1.05)' : 'none',
                  borderColor: canScrollLeft 
                    ? alpha(theme.palette.primary.main, 0.3) 
                    : alpha(theme.palette.divider, 0.1),
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ChevronLeft />
            </IconButton>
            
            <IconButton
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              sx={{
                width: 48,
                height: 48,
                bgcolor: canScrollRight 
                  ? alpha(theme.palette.background.paper, 0.9) 
                  : alpha(theme.palette.action.disabled, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, canScrollRight ? 0.2 : 0.1)}`,
                color: canScrollRight 
                  ? theme.palette.primary.main 
                  : theme.palette.action.disabled,
                '&:hover': {
                  bgcolor: canScrollRight 
                    ? alpha(theme.palette.primary.main, 0.1) 
                    : alpha(theme.palette.action.disabled, 0.1),
                  transform: canScrollRight ? 'scale(1.05)' : 'none',
                  borderColor: canScrollRight 
                    ? alpha(theme.palette.primary.main, 0.3) 
                    : alpha(theme.palette.divider, 0.1),
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
        </Box>
      </Box>
      
      {/* Zawartość karuzeli */}
      <Box sx={{ position: 'relative', overflow: 'hidden', p: 3, pt: 4 }}>
        <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            gap: 3,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            pb: 2,
            px: 1,
            scrollBehavior: 'smooth',
          }}
        >
          {items.map((item, index) => (
            <Box 
              key={index} 
              sx={{ 
                flexShrink: 0,
                transform: currentIndex === index ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {renderItem(item, index)}
            </Box>
          ))}
        </Box>
        
        {/* Eleganckie gradienty po bokach */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 80,
            background: `linear-gradient(90deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, transparent 100%)`,
            pointerEvents: 'none',
            opacity: canScrollLeft ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            background: `linear-gradient(270deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, transparent 100%)`,
            pointerEvents: 'none',
            opacity: canScrollRight ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
        />
        
        {/* Subtelny progress bar */}
        <LinearProgress
          variant="determinate"
          value={(currentIndex / Math.max(items.length - 1, 1)) * 100}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: theme.palette.primary.main,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }
          }}
        />
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
  const hasActiveProposals = proposals && proposals.some((proposal: Proposal) => {
    const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
    return timeLeft > 0;
  });

  // ✅ ZAKTUALIZOWANE: Logika dla karuzeli propozycji - aktywne propozycje pierwsze
  const getCarouselProposals = () => {
    if (!proposals || proposals.length === 0) return [];
    
    const now = Math.floor(Date.now() / 1000);
    
    // Sortuj: aktywne pierwsze (według czasu pozostałego), potem zakończone (według aktywności)
    return [...proposals].sort((a, b) => {
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

          {/* ✅ ZAKTUALIZOWANA: Karuzela najlepszych zbiórek używająca CampaignCard */}
          <FuturisticCarousel
            title="Najgorętsze kampanie i zbiórki"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            items={carouselCampaigns}
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
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-600"
              }`}
            >
              🗳️ Wszystkie głosowania ({proposalCount})
            </button>
            <button
              onClick={() => setActiveTab("zbiorki")}
              className={`py-2 px-4 -mb-px border-b-2 font-medium ${
                activeTab === "zbiorki"
                  ? "border-green-500 text-green-500"
                  : "border-transparent text-gray-600"
              }`}
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
                    onClick={refetchProposals}
                    disabled={proposalsLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      proposalsLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    {proposalsLoading ? '⏳ Ładowanie...' : '🔄 Odśwież'}
                  </button>
                </div>

                {proposalsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Pobieranie danych z kontraktu...</span>
                  </div>
                )}

                {proposalsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Błąd ładowania propozycji</h3>
                        <p className="text-red-700 text-sm mt-1">{proposalsError.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!proposalsLoading && !proposalsError && (
                  <>
                    {proposals && proposals.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {proposals.map((proposal: Proposal) => (
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
                      campaignsLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
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
                        ? "border-green-500 text-green-600 bg-green-50"
                        : "border-transparent text-gray-600 hover:text-green-600"
                    }`}
                  >
                    📊 Wszystkie ({campaigns ? campaigns.length : 0})
                  </button>
                  <button
                    onClick={() => setCampaignFilter("target")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "target"
                        ? "border-orange-500 text-orange-600 bg-orange-50"
                        : "border-transparent text-gray-600 hover:text-orange-600"
                    }`}
                  >
                    🎯 Zbiórki ({campaigns ? campaigns.filter(c => !c.isFlexible).length : 0})
                  </button>
                  <button
                    onClick={() => setCampaignFilter("flexible")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "flexible"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-blue-600"
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
                                Wyświetlanie: {campaignFilter === "target" ? "Zbiórki z określonym celem" : "Kampanie"} 
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
                          className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
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