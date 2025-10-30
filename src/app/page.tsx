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
// ADD: voting writes + receipt, and Interface utils
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Interface, keccak256, toUtf8Bytes } from 'ethers';

// NEW: Swiper imports (minimal)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'; // + navigation CSS
// CHANGED: import coverflow effect for 3D-like center emphasis
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css/effect-coverflow';

// ===== Replaced MUIProposalCard (Polish -> English labels) =====
function MUIProposalCard({ proposal, onVote, isVoting, votingId }: {
  proposal: Proposal;
  onVote?: (id: bigint, support: boolean) => void;
  isVoting?: boolean;
  votingId?: bigint | null;
}) {
  const theme = useTheme();
  const router = useRouter();
  
  const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
  const yesPercentage = totalVotes > 0 ? (Number(proposal.yesVotes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (Number(proposal.noVotes) / totalVotes) * 100 : 0;
  
  const timeLeft = Number(proposal.endTime) - Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor(timeLeft / (24 * 60 * 60)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (24 * 60 * 60)) / 3600));
  
  const isActive = timeLeft > 0;

  // Navigate to proposal details
  const handleCardClick = () => {
    router.push(`/votes/${proposal.id.toString()}`);
  };

  const handleVote = (e: React.MouseEvent, support: boolean) => {
    e.stopPropagation();
    if (onVote) onVote(proposal.id, support);
  };
  const disabled = Boolean(isVoting && votingId === proposal.id);

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
              label={`Proposal #${proposal.id.toString()}`}
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
                : "Closed"
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
              YES: {Number(proposal.yesVotes)} ({yesPercentage.toFixed(1)}%)
            </Typography>
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
              NO: {Number(proposal.noVotes)} ({noPercentage.toFixed(1)}%)
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
              Total: {totalVotes}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        {isActive ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
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
              disabled={disabled}
            >
              {disabled ? 'Voting...' : 'YES'}
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
              disabled={disabled}
            >
              {disabled ? 'Voting...' : 'NO'}
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
            View details
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
  space,
  myAccountCardLayout = false,
  simpleNavOnly = false, // NEW
  staticCount, // NEW: renderuj statycznie N elementów bez przewijania
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
  rtl?: boolean;
  autoplayDelay?: number;
  space?: number;
  myAccountCardLayout?: boolean;
  simpleNavOnly?: boolean; // NEW
  staticCount?: number; // NEW
}) {
  const theme = useTheme();
  const ACCENT = '#10b981';
  const GAP = space ?? 4;

  // Ensure enough slides for seamless loop
  const slides = React.useMemo(() => {
    if (!items || items.length === 0) return [];
    if (simpleNavOnly) return items;
    if (items.length >= 9) return items;
    const reps = Math.ceil(9 / Math.max(1, items.length));
    return Array.from({ length: reps }).flatMap(() => items).slice(0, 9);
  }, [items, simpleNavOnly]);

  // NEW: tryb statyczny bez przewijania
  const staticMode = typeof staticCount === 'number' && staticCount > 0;
  const displayed = staticMode ? slides.slice(0, Math.min(staticCount!, slides.length)) : slides;

  // NEW: custom navigation refs (external buttons)
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);

  if (!displayed || displayed.length === 0) return null;

  // NEW: statyczny render bez Swipera, bez strzałek i bez drag
  if (staticMode) {
    return (
      <Paper elevation={0} sx={{ mb: 6, background: 'transparent', border: 'none', boxShadow: 'none', borderRadius: 0 }}>
        <Box sx={{ px: 0, py: 0, mb: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: `${GAP}px`,
            px: 0,
            pb: 3,
          }}
        >
          {displayed.map((item, index) => (
            <div key={`${title}-static-${index}`} className="w-full sm:w-[24rem] flex-none">
              <Box sx={{ borderRadius: 0 }}>
                {renderItem(item, index)}
              </Box>
            </div>
          ))}
        </Box>
      </Paper>
    );
  }

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
          // NEW: pokaż dokładnie 3 karty na desktopie (24rem * 3 + przerwy)
          ...(simpleNavOnly && myAccountCardLayout
            ? { maxWidth: { md: `calc(24rem * 3 + ${GAP}px * 2)` }, mx: 'auto' }
            : {}),
          '& .swiper-wrapper': { transitionTimingFunction: 'ease-in-out' },
          '& .swiper-slide': {
            marginInlineEnd: `${GAP}px !important`,
          },
          // Hide pagination entirely in simple mode
          '& .swiper-pagination': simpleNavOnly ? { display: 'none !important' } : {
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
          key={`swiper-${title}-${slides.length}-${simpleNavOnly}`}
          modules={simpleNavOnly ? [Navigation] : [Pagination, Autoplay, Navigation, EffectCoverflow]}
          loop={!simpleNavOnly}
          loopAdditionalSlides={Math.min(slides.length, 12)}
          speed={550}
          autoplay={simpleNavOnly ? undefined : {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            reverseDirection: rtl,
            waitForTransition: true,
          }}
          pagination={simpleNavOnly ? false : { clickable: true }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-expect-error
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          // slidesPerView: użyj 'auto' dla layoutu kart jak w "Zbiórkach dnia"
          slidesPerView={myAccountCardLayout ? 'auto' : (simpleNavOnly ? 3 : 3)}
          // centrowanie tylko dla coverflow; w trybie simpleNavOnly wyłączone
          centeredSlides={!simpleNavOnly && myAccountCardLayout ? true : false}
          // wyłącz breakpoints gdy sterujemy stałą szerokością slajdu
          breakpoints={myAccountCardLayout ? undefined : (simpleNavOnly ? {
            0:   { slidesPerView: 1, centeredSlides: false },
            640: { slidesPerView: 2, centeredSlides: false },
            1024:{ slidesPerView: 3, centeredSlides: false },
          } : undefined)}
          slidesPerGroup={1}
          slidesPerGroupAuto={false}
          spaceBetween={GAP}
          cssMode={false}
          effect={!simpleNavOnly && myAccountCardLayout ? 'coverflow' : undefined}
          coverflowEffect={!simpleNavOnly && myAccountCardLayout
            ? { rotate: 0, stretch: 0, depth: 180, modifier: 1, slideShadows: false }
            : undefined
          }
          allowTouchMove={!simpleNavOnly ? true : false}
          simulateTouch={!simpleNavOnly ? true : false}
          grabCursor={!simpleNavOnly ? true : false}
          // NEW: hide nav when not enough items to scroll
          watchOverflow
        >
          {slides.map((item, index) => (
            <SwiperSlide
              key={`${title}-${index}`}
              // Wymuś szerokość slajdu jak w "Zbiórkach dnia"
              className={myAccountCardLayout ? 'w-[24rem] max-w-[24rem] flex-none' : undefined}
              // opcjonalnie można zachować pełną szerokość na mobile zmieniając klasę na: 'w-full sm:w-[24rem] flex-none'
            >
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

  // ADD: voting via Router.routeModule -> GOVERNANCE key
  const GOVERNANCE_KEY = React.useMemo(
    () => keccak256(toUtf8Bytes('GOVERNANCE')) as `0x${string}`,
    []
  );
  const { writeContract: writeVote, isPending: isVotePending, data: voteTxHash } = useWriteContract();
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({
    hash: voteTxHash,
  });
  const [votingId, setVotingId] = React.useState<bigint | null>(null);

  // Keep a single useAccount declaration (provides both address and isConnected)
  const { address, isConnected } = useAccount();

  const onVoteProposal = React.useCallback(async (id: bigint, support: boolean) => {
    try {
      if (!isConnected || !address) return; // guard: requires connected wallet
      setVotingId(id);
      // CHANGED: encode voteFor(uint256,bool,address) so voter != Core
      const gIface = new Interface(['function voteFor(uint256,bool,address)']);
      const calldata = gIface.encodeFunctionData('voteFor', [
        id,
        support,
        address as `0x${string}`,
      ]) as `0x${string}`;
      await writeVote({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'routeModule',
        args: [GOVERNANCE_KEY, calldata],
      });
    } catch {
      setVotingId(null);
    }
  }, [writeVote, GOVERNANCE_KEY, isConnected, address]);

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

  // FIX: move effect after refs exist + guard calls
  React.useEffect(() => {
    if (!isVoteSuccess) return;
    Promise.allSettled([
      typeof refetchGovPage === 'function' ? refetchGovPage() : Promise.resolve(),
      typeof refetchGovResults === 'function' ? refetchGovResults() : Promise.resolve(),
    ]);
    setVotingId(null);
  }, [isVoteSuccess, refetchGovPage, refetchGovResults]);

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

  const [activeTab, setActiveTab] = useState<"zbiorki" | "glosowania">("zbiorki");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "target" | "flexible">("all");
  // NEW: pagination (6 at a time)
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // NEW: hover state for Show More button to guarantee color change
  const [showMoreHover, setShowMoreHover] = useState(false);

  // Filtruj kampanie na podstawie wybranego filtru
  const campaigns = fundraisers; // alias dla istniejącej logiki poniżej

  // NEW: robust detector for "no-goal" (flexible) campaigns — handles ABI variants
  const isNoGoalFlexible = React.useCallback((c: any) => {
    const flag = Boolean(c?.isFlexible);
    // goal can be goalAmount or target (bigint), treat 0 as "no goal"
    const goalRaw = (c?.goalAmount ?? c?.target ?? 0n) as bigint;
    const goalIsZero = (() => {
      try { return BigInt(goalRaw) === 0n; } catch { return Number(goalRaw ?? 0) === 0; }
    })();
    // fundraiserType enum: likely 0=Target, 1=Flexible
    const fType = Number(c?.fundraiserType ?? c?.type ?? -1);
    return flag || goalIsZero || fType === 1;
  }, []);

  // UPDATED: counts using robust detector
  const flexibleCount = campaigns ? campaigns.filter((c: any) => isNoGoalFlexible(c)).length : 0;
  const targetCount = campaigns ? campaigns.filter((c: any) => !isNoGoalFlexible(c)).length : 0;

  const filteredCampaigns = campaigns ? campaigns.filter((campaign: ModularFundraiser) => {
    if (campaignFilter === "target") return !isNoGoalFlexible(campaign);
    if (campaignFilter === "flexible") return isNoGoalFlexible(campaign);
    return true; // "all"
  }) : [];

  // NEW: sort by newest first (descending id)
  const sortedFilteredCampaigns = React.useMemo(() => {
    if (!filteredCampaigns || filteredCampaigns.length === 0) return [];
    return [...filteredCampaigns].sort((a: any, b: any) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  }, [filteredCampaigns]);

  // NEW: reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [campaignFilter]);

  // NEW: data for current page (after sorting)
  const visibleCampaigns = React.useMemo(
    () => sortedFilteredCampaigns.slice(0, visibleCount),
    [sortedFilteredCampaigns, visibleCount]
  );

  // ✅ ZAKTUALIZOWANE: Logika dla karuzeli kampanii z nowymi danymi z ABI
  const getCarouselCampaigns = () => {
    if (!campaigns || campaigns.length === 0) return [];
    const now = Math.floor(Date.now() / 1000);
    return [...campaigns].sort((a: any, b: any) => {
      const timeLeftA = Number(a.endDate ?? 0) - now;
      const timeLeftB = Number(b.endDate ?? 0) - now;
      const isActiveA = timeLeftA > 0;
      const isActiveB = timeLeftB > 0;
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      if (isActiveA && isActiveB) {
        // target vs flexible sort based on robust detector
        const aFlex = isNoGoalFlexible(a);
        const bFlex = isNoGoalFlexible(b);
        if (!aFlex && !bFlex) {
          const progressA = Number(a.raisedAmount ?? 0) / Math.max(Number(a.goalAmount ?? 0), 1);
          const progressB = Number(b.raisedAmount ?? 0) / Math.max(Number(b.goalAmount ?? 0), 1);
          return progressB - progressA;
        } else if (aFlex && bFlex) {
          return Number(b.raisedAmount ?? 0) - Number(a.raisedAmount ?? 0);
        } else {
          return aFlex ? 1 : -1; // campaigns with goal first
        }
      } else {
        return Number(b.raisedAmount ?? 0) - Number(a.raisedAmount ?? 0);
      }
    }).slice(0, 8);
  };

  const carouselCampaigns = getCarouselCampaigns();

  // NEW: pick top-3 “Zbiórki dnia”
  const dayPicks = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    const now = Math.floor(Date.now() / 1000);

    const score = (c: ModularFundraiser) => {
      if (c.isFlexible) return Number(c.raisedAmount ?? 0);
      const goal = Math.max(Number(c.goalAmount ?? 0), 1);
      return Number(c.raisedAmount ?? 0) / goal; // progress: 0..1+
    };

    const sorted = [...campaigns].sort((a, b) => {
      const aActive = Number(a.endDate ?? 0) > now;
      const bActive = Number(b.endDate ?? 0) > now;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // both active: compare by “closeness” to goal
      if (aActive && bActive) {
        const sa = score(a);
        const sb = score(b);
        if (sb !== sa) return sb - sa;
        // tie-breaker: sooner deadline
        return Number(a.endDate ?? 0) - Number(b.endDate ?? 0);
      }

      // both inactive: newest first
      return Number(b.endDate ?? 0) - Number(a.endDate ?? 0);
    });

    return sorted.slice(0, 3);
  }, [campaigns]);

  // NEW: total raised (USDC-style formatting: 6 decimals truncated to whole USDC for large counter)
  const totalRaisedRaw = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return 0n;
    return campaigns.reduce((acc: bigint, c: ModularFundraiser) => acc + BigInt(c.raisedAmount ?? 0n), 0n);
  }, [campaigns]);
  const formatUSDCInteger = (raw: bigint) => {
    const whole = raw / 1_000_000n; // USDC 6 decimals
    return new Intl.NumberFormat('pl-PL').format(Number(whole));
  };
  const totalRaisedUSDC = formatUSDCInteger(totalRaisedRaw);

  // NEW: latest flexible campaigns (no goal) – newest first, up to 3
  const latestFlexibleCampaigns = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    return [...campaigns]
      .filter((c: any) => isNoGoalFlexible(c))
      .sort((a: any, b: any) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
      .slice(0, 3);
  }, [campaigns, isNoGoalFlexible]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Hero3D />

      {/* Mission overlay card — left on desktop, centered on mobile */}
      <div className="relative">
        {/* Overlay card: absolute so it sits over the hero/banner */}
        <div className="absolute z-30 -top-28 left-4 md:-top-120 md:left-12 lg:left-20 w-[92%] sm:w-80 md:w-96">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-extrabold text-gray-900 mb-2">
              Our mission — transparent, on‑chain fundraising
            </h3>
            <div className="text-xs md:text-sm text-gray-600 space-y-2">
              <p>
                PoliDAO coordinates transparent, on‑chain fundraisers: donations are deposited to a secure storage contract and all actions are auditable.
              </p>
              <p>
                The lightweight Core delegates complex logic to specialized modules (governance, security, analytics), improving clarity and upgradeability.
              </p>
              <p>
                Creators withdraw funds according to on‑chain rules; refunds and scheduled payouts respect protocol security policies and state.
              </p>
              <p>
                Fees, module upgrades and permissions are managed on‑chain to guarantee predictable, auditable platform operations.
              </p>
            </div>

            <div className="mt-3">
              <a
                href="/whitepaper"
                className="inline-block px-3 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        {/* KARUZELE - pokazują się tylko gdy są dane */}
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* ✅ Karuzela kampanii – tryb prosty, tylko strzałki */}
          <FuturisticCarousel
            title="Top Campaigns & Fundraisers"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            items={carouselCampaigns}
            simpleNavOnly={true}
            myAccountCardLayout={true}
            space={24}
            renderItem={(campaign: ModularFundraiser) => {
              const mappedCampaign = {
                campaignId: campaign.id.toString(),
                targetAmount: campaign.goalAmount ?? 0n,
                raisedAmount: campaign.raisedAmount ?? 0n,
                creator: campaign.creator,
                token: campaign.token,
                endTime: campaign.endDate ?? 0n,
                isFlexible: isNoGoalFlexible(campaign), // UPDATED
              };

              const metadata = {
                title: campaign.title && campaign.title.length > 0
                  ? campaign.title
                  : (isNoGoalFlexible(campaign)
                      ? `Flexible campaign #${campaign.id}`
                      : `Targeted fundraiser #${campaign.id}`), // UPDATED
                description: campaign.description && campaign.description.length > 0
                  ? campaign.description.slice(0, 140)
                  : `Campaign created by ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
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
            emptyMessage="No active campaigns or fundraisers"
          />
        </Container>

        {/* Zbiórki dnia (3 najciekawsze) */}
        {dayPicks && dayPicks.length > 0 && (
          <div className="container mx-auto px-4 mt-10">
            {/* inner wrapper matches width of 3 cards (24rem each) + gap (gap-6 = 1.5rem) */}
            <div className="mx-auto w-full" style={{ maxWidth: 'calc(24rem * 3 + 1.5rem * 2)' }}>
              <div className="flex items-center justify-between mb-4">
                {/* left-aligned header inside the limited-width wrapper */}
                <h2 className="text-2xl font-bold text-gray-800">Fundraisers of the Day</h2>
                <span className="text-sm text-gray-500">Selected: newest or closest to goal</span>
              </div>
            </div>
            <div className="mx-auto w-full" style={{ maxWidth: 'calc(24rem * 3 + 1.5rem * 2)' }}>
              <div className="flex flex-wrap justify-center gap-6">
               {dayPicks.map((campaign: ModularFundraiser) => {
                 const mappedCampaign = {
                   campaignId: campaign.id.toString(),
                   targetAmount: campaign.goalAmount ?? 0n,
                   raisedAmount: campaign.raisedAmount ?? 0n,
                   creator: campaign.creator,
                   token: campaign.token,
                   endTime: campaign.endDate ?? 0n,
                   isFlexible: isNoGoalFlexible(campaign), // UPDATED
                 };

                 const metadata = {
                   title: campaign.title && campaign.title.length > 0
                     ? campaign.title
                     : (isNoGoalFlexible(campaign)
                         ? `Flexible campaign #${campaign.id}`
                         : `Targeted fundraiser #${campaign.id}`), // UPDATED
                   description: campaign.description && campaign.description.length > 0
                     ? campaign.description.slice(0, 140)
                     : `Campaign created by ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
                   image: "/images/zbiorka.png",
                 };
                 return (
                   <div key={campaign.id.toString()} className="w-full sm:w-[24rem] flex-none">
                     <CampaignCard campaign={mappedCampaign} metadata={metadata} />
                   </div>
                 );
               })}
              </div>
            </div>
          </div>
        )}

        {/* NEW: Trust + Counter + Extra value (under day picks) — removed solid green band so cards sit on page background */}
        <div className="mt-12 py-10">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3 items-center text-center">
              {/* Left: Trustworthy */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Trustworthy</h3>
                <p className="text-gray-600 text-sm">
                  All fundraisers undergo multi-step verification. Funds are settled on-chain.
                </p>
              </div>

              {/* Center: Big counter */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <div className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg,#10b981,#065f46)' }}>
                  {totalRaisedUSDC} USDC
                </div>
                <p className="text-gray-700 font-semibold mt-2">
                  Raised on PolyFund (on‑chain)
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Updated in real-time based on contract data
                </p>
              </div>

              {/* Right: Something extra (Open-source & on-chain) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Open‑source and on‑chain</h3>
                <p className="text-gray-600 text-sm">
                  Contracts are public and auditable. Full transparency of transactions and campaign results.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Najnowsze Kampanie (flexible, up to 3) */}
        {latestFlexibleCampaigns && latestFlexibleCampaigns.length > 0 && (
          <div className="container mx-auto px-4 mt-10">
            <div className="mx-auto w-full" style={{ maxWidth: 'calc(24rem * 3 + 1.5rem * 2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Latest Campaigns</h2>
                <span className="text-sm text-gray-500">Flexible campaigns with no target</span>
              </div>
            </div>
            <div className="mx-auto w-full" style={{ maxWidth: 'calc(24rem * 3 + 1.5rem * 2)' }}>
              <div className="flex flex-wrap justify-center gap-6">
               {latestFlexibleCampaigns.map((campaign: ModularFundraiser) => {
                 const mappedCampaign = {
                   campaignId: campaign.id.toString(),
                   targetAmount: campaign.goalAmount ?? 0n,
                   raisedAmount: campaign.raisedAmount ?? 0n,
                   creator: campaign.creator,
                   token: campaign.token,
                   endTime: campaign.endDate ?? 0n,
                   isFlexible: isNoGoalFlexible(campaign), // UPDATED
                 };
                 const metadata = {
                   title: campaign.title && campaign.title.length > 0
                     ? campaign.title
                     : `Flexible campaign #${campaign.id}`,
                   description: campaign.description && campaign.description.length > 0
                     ? campaign.description.slice(0, 140)
                     : `Campaign created by ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
                   image: "/images/zbiorka.png",
                 };
                 return (
                   <div key={campaign.id.toString()} className="w-full sm:w-[24rem] flex-none">
                     <CampaignCard campaign={mappedCampaign} metadata={metadata} />
                   </div>
                 );
               })}
              </div>
            </div>
          </div>
         )}

        {/* NEW: Onboarding/Start fundraising segment (under "Najnowsze Kampanie") */}
        <div className="container mx-auto px-4 mt-12">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center">
              Looking for help for yourself or a loved one?
            </h2>
            <p className="mt-2 text-gray-600 text-center">
              Choose how you want to raise funds — we will help you. Everything transparently, on‑chain.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-3 items-center">
              {/* Left benefits */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">💳</span>
                  <div>
                    <div className="font-semibold text-gray-800">Online payments</div>
                    <div className="text-sm text-gray-500">Fast and secure support in USDC</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">📈</span>
                  <div>
                    <div className="font-semibold text-gray-800">Statistics and progress</div>
                    <div className="text-sm text-gray-500">Full insight into raised funds and results</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">🔒</span>
                  <div>
                    <div className="font-semibold text-gray-800">Trust and security</div>
                    <div className="text-sm text-gray-500">Settlements on the blockchain, public contracts</div>
                  </div>
                </div>
              </div>

              {/* Center CTAs */}
              <div className="text-center">
                <a
                  href="/create-campaign"
                  className="inline-block w-full md:w-auto px-8 py-4 rounded-full bg-[#10b981] no-underline !text-white hover:!text-white focus:!text-white active:!text-white visited:!text-white font-bold shadow hover:shadow-[0_0_22px_rgba(16,185,129,0.45)] transition-transform hover:scale-105"
                  style={{ color: '#fff' }}
                >
                  Start a Fundraiser
                </a>
                <p className="mt-3 text-xs text-gray-500">
                  Don't know where to start? Contact us — we will help.
                </p>
              </div>

              {/* Right benefits */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">🧰</span>
                  <div>
                    <div className="font-semibold text-gray-800">Management panel</div>
                    <div className="text-sm text-gray-500">Easy addition of updates and media</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">📣</span>
                  <div>
                    <div className="font-semibold text-gray-800">Promotional materials</div>
                    <div className="text-sm text-gray-500">Ready-made graphics and sharing links</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">⏱️</span>
                  <div>
                    <div className="font-semibold text-gray-800">Quick start</div>
                    <div className="text-sm text-gray-500">Create a campaign in minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              🗳️ All Votes ({displayProposalCount})
            </button>
            <button
              onClick={() => setActiveTab("zbiorki")}
              className={`py-2 px-4 -mb-px border-b-2 font-medium ${
                activeTab === "zbiorki"
                  ? "border-[#10b981] text-[#10b981]"
                  : "border-transparent text-gray-600"
              } transform transition-transform hover:scale-105`}
            >
              🎯 All Campaigns & Fundraisers ({campaignCount})
            </button>
          </div>

          {/* Informacja o połączeniu */}
          {!isConnected && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-bold text-yellow-800">Wallet not connected</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Connect your wallet to participate in fundraisers and votes.
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
                    All Votes
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
                    {votesLoading ? '⏳ Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {votesLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Fetching on‑chain data...</span>
                  </div>
                )}

                {votesError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Error loading proposals</h3>
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
                            onVote={onVoteProposal}
                            isVoting={isVotePending || isVoteConfirming}
                            votingId={votingId}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">🗳️</span>
                        <p className="text-gray-500 text-lg">No proposals on the contract</p>
                        <p className="text-gray-400 mt-2">Create the first proposal to see it here!</p>
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
                    All Campaigns & Fundraisers
                  </h2>
                  <button
                    onClick={refetchCampaigns}
                    disabled={campaignsLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      campaignsLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#10b981]'
                    } text-white transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]`}
                  >
                    {campaignsLoading ? '⏳ Loading...' : '🔄 Refresh'}
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
                    📊 All ({campaigns ? campaigns.length : 0})
                  </button>
                  <button
                    onClick={() => setCampaignFilter("target")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "target"
                        ? "border-[#10b981] text-[#10b981] bg-[#10b981]/10"
                        : "border-transparent text-gray-600 hover:text-[#10b981]"
                    }`}
                  >
                    🎯 Fundraisers ({targetCount}) {/* UPDATED */}
                  </button>
                  <button
                    onClick={() => setCampaignFilter("flexible")}
                    className={`py-3 px-6 -mb-px border-b-2 font-medium transition-colors ${
                      campaignFilter === "flexible"
                        ? "border-[#10b981] text-[#10b981] bg-[#10b981]/10"
                        : "border-transparent text-gray-600 hover:text-[#10b981]"
                    }`}
                  >
                    🌊 Campaigns ({flexibleCount}) {/* UPDATED */}
                  </button>
                </div>

                {campaignsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">Fetching on‑chain data...</span>
                  </div>
                )}

                {campaignsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-800">Error loading campaigns</h3>
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
                                Showing: {campaignFilter === "target" ? "Targeted Fundraisers" : "Flexible Campaigns"} 
                                ({filteredCampaigns.length} of {campaigns?.length || 0})
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Grid: show only visibleCampaigns */}
                        {/* limit width so H2 aligns with first card while cards remain centered */}
                        <div className="mx-auto w-full" style={{ maxWidth: 'calc(24rem * 3 + 1.5rem * 2)' }}>
                          <div className="flex flex-wrap justify-center gap-6">
                           {visibleCampaigns.map((campaign: ModularFundraiser) => {
                             const mappedCampaign = {
                               campaignId: campaign.id.toString(),
                               targetAmount: campaign.goalAmount ?? 0n,
                               raisedAmount: campaign.raisedAmount ?? 0n,
                               creator: campaign.creator,
                               token: campaign.token,
                               endTime: campaign.endDate ?? 0n,
                               isFlexible: isNoGoalFlexible(campaign),
                             };
                             const metadata = {
                               title: campaign.title && campaign.title.length > 0
                                 ? campaign.title
                                 : (isNoGoalFlexible(campaign) ? `Flexible campaign #${campaign.id}` : `Fundraiser #${campaign.id}`),
                               description: campaign.description && campaign.description.length > 0
                                 ? campaign.description.slice(0, 140)
                                 : `Campaign created by ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`,
                               image: "/images/zbiorka.png"
                             };

                             return (
                               <div key={campaign.id.toString()} className="w-full sm:w-[24rem] flex-none">
                                 <CampaignCard
                                   campaign={mappedCampaign}
                                   metadata={metadata}
                                 />
                               </div>
                             );
                           })}
                          </div>
                        </div>

                        {/* NEW: "Pokaż więcej" – load next 6 until all are shown */}
                        {visibleCount < filteredCampaigns.length && (
                          <div className="mt-6 flex justify-center">
                            <button
                              onClick={() => setVisibleCount(Math.min(visibleCount + PAGE_SIZE, filteredCampaigns.length))}
                              onMouseEnter={() => setShowMoreHover(true)}
                              onMouseLeave={() => setShowMoreHover(false)}
                              onFocus={() => setShowMoreHover(true)}
                              onBlur={() => setShowMoreHover(false)}
                              className={`px-5 py-2 rounded-full border font-semibold transition-colors transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#10b981]/30
                                ${showMoreHover
                                  ? 'bg-[#10b981] text-white border-[#10b981]'
                                  : 'bg-white text-[#10b981] border-[#10b981] dark:bg-[#0f1724] dark:text-[#10b981]'}
                              `}
                            >
                              Show more campaigns →
                            </button>
                          </div>
                        )}
                      </>
                    ) : campaigns && campaigns.length > 0 ? (
                      // Są kampanie, ale nie pasują do filtru
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">
                          {campaignFilter === "target" ? "🎯" : campaignFilter === "flexible" ? "🌊" : "🔍"}
                        </span>
                        <p className="text-gray-500 text-lg">
                          No type: {campaignFilter === "target" ? "Targeted Fundraisers" : campaignFilter === "flexible" ? "Flexible Campaigns" : ""}
                        </p>
                        <p className="text-gray-400 mt-2">
                          Try selecting a different filter or create a new project of this type.
                        </p>
                        <button
                          onClick={() => setCampaignFilter("all")}
                          className="mt-3 px-4 py-2 bg-[#10b981] hover:bg-[#10b981] text-white rounded-lg transition-colors transform transition-transform hover:scale-105 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                        >
                          🔄 Show all projects
                        </button>
                      </div>
                    ) : (
                      // Brak kampanii w ogóle
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-4xl mb-4 block">🌱</span>
                        <p className="text-gray-500 text-lg">No campaigns or fundraisers on the contract</p>
                        <p className="text-gray-400 mt-2">Create the first project to see it here!</p>
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