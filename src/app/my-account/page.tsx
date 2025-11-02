// src/app/account/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { ROUTER_ADDRESS } from '../../blockchain/contracts';
import { poliDaoRouterAbi } from '../../blockchain/routerAbi';
import { poliDaoCoreAbi } from '../../blockchain/coreAbi';
import { poliDaoAnalyticsAbi } from '../../blockchain/analyticsAbi';
// import poliDaoGovernanceAbi from '../../blockchain/governanceAbi'; // removed
// import { POLIDAO_ABI } from '../../blockchain/poliDaoAbi'; // removed
// import { polidaoContractConfig } from '../../blockchain/contracts'; // removed
import Header from '../../components/Header';
import Footer from '../../components/Footer';
// import { useGetAllProposals } from '../../hooks/usePoliDao'; // removed
import { useFundraisersModular } from '../../hooks/useFundraisersModular';
import CampaignCard from '../../components/CampaignCard';
import { Interface, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
// NEW: simulate contracts preflight
import { usePublicClient } from 'wagmi';
// NEW: storage ABI
import { poliDaoStorageAbi } from '../../blockchain/storageAbi';

import './myaccountstyles.css';

// NEW: minimal Security ABI for diagnostics (no tx)
const SECURITY_ABI = [
  { name: 'payoutLimitUSDC', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getSecurityLevel', type: 'function', stateMutability: 'view', inputs: [], outputs: [
    { name: 'level', type: 'uint8' }, { name: 'lastChanged', type: 'uint256' }, { name: 'reason', type: 'string' }
  ] },
  { name: 'checkRateLimit', type: 'function', stateMutability: 'view', inputs: [
    { name: 'user', type: 'address' }, { name: 'functionName', type: 'string' }
  ], outputs: [
    { name: 'isWithinLimit', type: 'bool' }, { name: 'remainingCalls', type: 'uint256' }, { name: 'windowReset', type: 'uint256' }
  ] },
] as const;

// Minimal ERC20 ABI for approvals
const ERC20_ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

interface Fundraiser {
  id: bigint;
  creator: string;
  token: string;
  target: bigint;
  raised: bigint;
  endTime: bigint;
  isFlexible: boolean;
}

interface Proposal {
  id: bigint;
  question: string;
  yesVotes: bigint;
  noVotes: bigint;
  endTime: bigint;
  creator: string;
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'donations' | 'fundraisers'
  >('dashboard');
  const router = useRouter();
  // NEW: public client for simulateContract
  const publicClient = usePublicClient();

  // FIX: define chainRefresh early (used by many hooks below)
  const [chainRefresh, setChainRefresh] = useState(0);

  // Używaj istniejących hooków
  const { 
    fundraisers: campaigns, 
    isLoading: campaignsLoading, 
    error: campaignsError 
  } = useFundraisersModular();

  // Resolve Core and Analytics module
  const { data: coreAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'coreContract'
  });

  // Security module from Router (single definition)
  const { data: securityAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'security',
  });

  // ADD: analytics and storage modules (used later)
  const { data: analyticsAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'analyticsModule',
    query: { enabled: !!coreAddress }
  });

  const { data: storageAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'storageContract',
    query: { enabled: !!coreAddress }
  });

  // ADD: spenderAddress (used in allowances)
  const { data: coreSpender } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'spenderAddress',
    query: { enabled: !!coreAddress }
  });

  // Security diagnostics reads (single set)
  const { data: payoutLimitUSDC } = useReadContract({
    address: securityAddress as `0x${string}` | undefined,
    abi: SECURITY_ABI,
    functionName: 'payoutLimitUSDC',
    query: { enabled: !!securityAddress },
  });
  const { data: securityLevelTuple } = useReadContract({
    address: securityAddress as `0x${string}` | undefined,
    abi: SECURITY_ABI,
    functionName: 'getSecurityLevel',
    query: { enabled: !!securityAddress },
  });
  const { data: refundRateLimit } = useReadContract({
    address: securityAddress as `0x${string}` | undefined,
    abi: SECURITY_ABI,
    functionName: 'checkRateLimit',
    args: [(address || '0x0000000000000000000000000000000000000000') as `0x${string}`, 'refund'],
    query: { enabled: !!securityAddress && !!address },
  });
  const { data: withdrawRateLimit } = useReadContract({
    address: securityAddress as `0x${string}` | undefined,
    abi: SECURITY_ABI,
    functionName: 'checkRateLimit',
    args: [(address || '0x0000000000000000000000000000000000000000') as `0x${string}`, 'withdrawFunds'],
    query: { enabled: !!securityAddress && !!address },
  });

  // Security memos (single set)
  const trancheLimitHuman = React.useMemo(
    () => (typeof payoutLimitUSDC === 'bigint' ? Number(payoutLimitUSDC) / 1_000_000 : undefined),
    [payoutLimitUSDC]
  );
  const secLevelName = React.useMemo(() => {
    const lv = (securityLevelTuple as any)?.[0] as number | undefined;
    return lv === 0 ? 'NORMAL' : lv === 1 ? 'ELEVATED' : lv === 2 ? 'CRITICAL' : lv != null ? `LEVEL ${lv}` : '—';
  }, [securityLevelTuple]);
  const secLevelReason = React.useMemo(
    () => (((securityLevelTuple as any)?.[2] as string) || ''),
    [securityLevelTuple]
  );
  const refundRateInfo = React.useMemo(() => {
    const t = refundRateLimit as any;
    if (!t) return { text: '—' };
    const windowReset = t[2] as bigint;
    if (!windowReset || windowReset === 0n) return { text: 'Brak limitu (nie ustawiono)' };
    const remaining = t[1] as bigint;
    const isWithin = !!t[0];
    return {
      text: `${isWithin ? 'W limicie' : 'Przekroczono limit'} — pozostało: ${remaining?.toString?.() ?? '0'}, reset: ${new Date(Number(windowReset) * 1000).toLocaleString('pl-PL')}`,
    };
  }, [refundRateLimit]);
  const withdrawRateInfo = React.useMemo(() => {
    const t = withdrawRateLimit as any;
    if (!t) return { text: '—' };
    const windowReset = t[2] as bigint;
    if (!windowReset || windowReset === 0n) return { text: 'Brak limitu (nie ustawiono)' };
    const remaining = t[1] as bigint;
    const isWithin = !!t[0];
    return {
      text: `${isWithin ? 'W limicie' : 'Przekroczono limit'} — pozostało: ${remaining?.toString?.() ?? '0'}, reset: ${new Date(Number(windowReset) * 1000).toLocaleString('pl-PL')}`,
    };
  }, [withdrawRateLimit]);

  // NEW: user's own campaigns (sorted: closest to target -> furthest)
  const myCampaigns = React.useMemo(() => {
    if (!campaigns || !address) return [];
    const mine = (campaigns as any[]).filter(
      (f: any) => f?.creator?.toLowerCase?.() === address?.toLowerCase?.()
    );

    // Sort by remaining to goal ascending; campaigns without a valid target go last.
    const BIG_SENTINEL = 10n ** 40n; // for unknown/zero targets
    const norm = (c: any) => {
      const target = (c.goalAmount ?? c.target ?? 0n) as bigint;
      const raised = (c.raisedAmount ?? c.raised ?? 0n) as bigint;
      const end = (c.endDate ?? c.endTime ?? 0n) as bigint;
      const hasTarget = target > 0n;
      // Remaining cannot be negative (overshoot treated as 0 = reached/over goal -> first)
      const remaining = hasTarget ? (target > raised ? target - raised : 0n) : BIG_SENTINEL;
      return { remaining, hasTarget, end };
    };

    return mine
      .slice()
      .sort((a: any, b: any) => {
        const A = norm(a);
        const B = norm(b);
        if (A.remaining !== B.remaining) return A.remaining < B.remaining ? -1 : 1; // closest first
        if (A.hasTarget !== B.hasTarget) return A.hasTarget ? -1 : 1;               // with target before no-target
        if (A.end !== B.end) return A.end < B.end ? -1 : 1;                          // earlier end first
        const aid = (a.id ?? 0n) as bigint;
        const bid = (b.id ?? 0n) as bigint;
        return aid < bid ? -1 : aid > bid ? 1 : 0;                                    // stable fallback
      });
  }, [campaigns, address]);

  // NEW: ids of user's campaigns (used by Storage/Router reads)
  const myCampaignIds = React.useMemo(
    () => myCampaigns.map((c: any) => BigInt(c.id ?? c.campaignId ?? 0n)),
    [myCampaigns]
  );

  // NEW: Router progress fallback (used when Storage progress is unavailable)
  const progressCalls = React.useMemo(() => {
    if (myCampaignIds.length === 0) return [];
    return myCampaignIds.map((fid) => ({
      address: ROUTER_ADDRESS,
      abi: poliDaoRouterAbi,
      functionName: 'getFundraiserProgress' as const,
      args: [fid],
    }));
  }, [myCampaignIds, chainRefresh]);

  const { data: progressResults } = useReadContracts({
    contracts: progressCalls,
    query: { enabled: progressCalls.length > 0 },
  });

  // --- Governance proposals (prefer governanceModule if present) ---
  // const { data: governanceAddress } = useReadContract({
  //   address: coreAddress as `0x${string}` | undefined,
  //   abi: poliDaoCoreAbi,
  //   functionName: 'governanceModule',
  //   query: { enabled: !!coreAddress }
  // });

  // const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
  // const isNonZeroAddress = (addr?: string) =>
  //   typeof addr === 'string' &&
  //   /^0x[a-fA-F0-9]{40}$/.test(addr) &&
  //   addr.toLowerCase() !== ZERO_ADDR;

  // REPLACED: getAllProposalIds -> getProposals (paged)
  // const { data: govPage } = useReadContract({
  //   address: (governanceAddress as `0x${string}`) ?? undefined,
  //   abi: poliDaoGovernanceAbi,
  //   functionName: 'getProposals',
  //   args: [0n, 200n],
  //   query: { enabled: isNonZeroAddress(governanceAddress as string) },
  // });

  // const { data: govCountRaw } = useReadContract({
  //   address: (governanceAddress as `0x${string}`) ?? undefined,
  //   abi: poliDaoGovernanceAbi,
  //   functionName: 'getProposalCount',
  //   query: { enabled: isNonZeroAddress(governanceAddress as string) },
  // });

  // Fallback: resolve real IDs via proposalIds(index) if needed
  // const proposalIndexCalls = React.useMemo(() => {
  //   const count = Number(govCountRaw ?? 0n);
  //   if (!isNonZeroAddress(governanceAddress as string) || count === 0) return [];
  //   const limit = Math.min(count, 200);
  //   return Array.from({ length: limit }, (_, i) => ({
  //     address: governanceAddress as `0x${string}`,
  //     abi: poliDaoGovernanceAbi,
  //     functionName: 'proposalIds' as const,
  //     args: [BigInt(i)],
  //   }));
  // }, [governanceAddress, govCountRaw]);

  // const { data: indexIdResults } = useReadContracts({
  //   contracts: proposalIndexCalls,
  //   query: { enabled: proposalIndexCalls.length > 0 },
  // });

  // const govIds = React.useMemo(() => {
  //   const tuple = govPage as any;
  //   const pagedIds: bigint[] = Array.isArray(tuple?.ids)
  //     ? (tuple.ids as bigint[])
  //     : (Array.isArray(tuple?.[0]) ? (tuple[0] as bigint[]) : []);
  //   if (pagedIds && pagedIds.length > 0) return pagedIds.slice(0, 200);

  //   if (indexIdResults && indexIdResults.length > 0) {
  //     const realIds = indexIdResults
  //       .map((r) => (r as any)?.result as bigint | undefined)
  //       .filter((x): x is bigint => typeof x === 'bigint');
  //     if (realIds.length > 0) return realIds.slice(0, 200);
  //   }

  //   const n = Number(govCountRaw ?? 0n);
  //   return Array.from({ length: Math.min(n, 100) }, (_, i) => BigInt(i));
  // }, [govPage, indexIdResults, govCountRaw]);

  // const govCalls = React.useMemo(() => {
  //   if (!isNonZeroAddress(governanceAddress as string) || govIds.length === 0) return [];
  //   return govIds.map((id) => ({
  //     address: governanceAddress as `0x${string}`,
  //     abi: poliDaoGovernanceAbi,
  //     functionName: 'getProposal' as const,
  //     args: [id],
  //   }));
  // }, [governanceAddress, govIds]);

  // const { data: govResults } = useReadContracts({
  //   contracts: govCalls,
  //   query: { enabled: govCalls.length > 0 },
  // });

  // const governanceProposals = React.useMemo(() => {
  //   if (!govResults || govResults.length === 0) return [];
  //   const out: { id: bigint; question: string; yesVotes: bigint; noVotes: bigint; endTime: bigint; creator: string }[] = [];
  //   govResults.forEach((r) => {
  //     const v = (r as any)?.result;
  //     if (!v) return;
  //     const exists = Boolean(v.exists ?? v[6] ?? true);
  //     if (!exists) return;
  //     out.push({
  //       id: BigInt(v.id ?? v[0] ?? 0n),
  //       question: String(v.question ?? v[1] ?? ''),
  //       yesVotes: BigInt(v.yesVotes ?? v[2] ?? 0n),
  //       noVotes: BigInt(v.noVotes ?? v[3] ?? 0n),
  //       endTime: BigInt(v.endTime ?? v[4] ?? 0n),
  //       creator: String(v.creator ?? v[5] ?? ZERO_ADDR),
  //     });
  //   });
  //   return out;
  // }, [govResults]);

  // const displayProposals = React.useMemo(
  //   () => (governanceProposals.length > 0 ? governanceProposals : (proposals || [])),
  //   [governanceProposals, proposals]
  // );

  // NEW: mark from which source current list originates (module vs legacy)
  // const proposalsFromModule = React.useMemo(() => governanceProposals.length > 0, [governanceProposals]);

  // Router: list user's donations globally (ids[], amounts[])
  const { data: userDonationsTuple } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'listUserDonations',
    args: [address ?? '0x0000000000000000000000000000000000000000', 0n, 1000n],
    query: { enabled: !!address }
  });

  // Fallback A: batch per-campaign donation reads (Router.getDonationAmount)
  const donationAmountContracts = React.useMemo(() => {
    if (!address || !campaigns || campaigns.length === 0) return [];
    // Limit to first 200 to avoid RPC overload
    return campaigns.slice(0, 200).map((f: any) => ({
      address: ROUTER_ADDRESS,
      abi: poliDaoRouterAbi,
      functionName: 'getDonationAmount',
      args: [BigInt(f.id), address as `0x${string}`]
    }));
  }, [address, campaigns]);

  const { data: donationAmountResults } = useReadContracts({
    contracts: donationAmountContracts,
    query: { enabled: donationAmountContracts.length > 0 }
  });

  // Derived: unique donated fundraisers + per-fundraiser donated sum for this user (bigint)
  const donatedPerFundraiser = React.useMemo(() => {
    const res = new Map<string, bigint>();
    const ids = (userDonationsTuple as any)?.[0] as bigint[] | undefined;
    const amounts = (userDonationsTuple as any)?.[1] as bigint[] | undefined;
    if (ids && amounts && ids.length === amounts.length) {
      for (let i = 0; i < ids.length; i++) {
        const k = (ids[i] ?? 0n).toString();
        res.set(k, (res.get(k) ?? 0n) + (amounts[i] ?? 0n));
      }
    }
    return res;
  }, [userDonationsTuple]);

  const donatedFundraiserIds = React.useMemo(
    () => Array.from(donatedPerFundraiser.keys()).map((k) => BigInt(k)),
    [donatedPerFundraiser]
  );

  // Unified set of fundraiser IDs with user donations (Router primary + per-campaign fallback)
  const donatedIdsSet = React.useMemo(() => {
    const set = new Set<string>();
    // Primary: Router.listUserDonations aggregation
    for (const k of donatedPerFundraiser.keys()) set.add(k);
    // Fallback: per-campaign getDonationAmount aligned with campaigns order
    if (donationAmountResults && campaigns && campaigns.length > 0) {
      const aligned = campaigns.slice(0, 200);
      donationAmountResults.forEach((r, idx) => {
        const v = (r as any)?.result as bigint | undefined;
        const fid = aligned[idx]?.id;
        if (typeof v === 'bigint' && v > 0n && fid != null) {
          set.add(fid.toString());
        }
      });
    }
    return set;
  }, [donatedPerFundraiser, donationAmountResults, campaigns]);

  // --- Approvals: read-only list of ERC20 allowances granted to Core SPENDER ---
  // Candidate tokens: from campaigns user donated to (fallback to all campaign tokens)
  const tokensOfInterest = React.useMemo(() => {
    const set = new Set<string>();
    if (campaigns && campaigns.length > 0) {
      const donatedTokens = campaigns
        .filter((c: any) => donatedIdsSet.has((c.id ?? 0n).toString()))
        .map((c: any) => (c.token || '').toLowerCase())
        .filter(Boolean);
      donatedTokens.forEach(t => set.add(t));
      if (set.size === 0) {
        campaigns.forEach((c: any) => {
          const t = (c.token || '').toLowerCase();
          if (t) set.add(t);
        });
      }
    }
    return Array.from(set).slice(0, 25) as `0x${string}`[];
  }, [campaigns, donatedIdsSet]);

  // Owner->Spender allowances for tokensOfInterest
  const allowancesContracts = React.useMemo(() => {
    if (!address || (!coreAddress && !coreSpender) || tokensOfInterest.length === 0) return [];
    const spender = (coreSpender as `0x${string}`) ?? (coreAddress as `0x${string}`);
    return tokensOfInterest.map((t) => ({
      address: t as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address as `0x${string}`, spender],
    }));
  }, [address, coreAddress, coreSpender, tokensOfInterest]);

  const { data: allowances } = useReadContracts({
    contracts: allowancesContracts,
    query: { enabled: (allowancesContracts?.length ?? 0) > 0 },
  });

  // Keep only tokens with allowance > 0
  const tokensWithAllowance = React.useMemo(() => {
    const out: { token: `0x${string}`; allowance: bigint }[] = [];
    if (!allowances || tokensOfInterest.length === 0) return out;
    allowances.forEach((r, idx) => {
      const val = (r as any)?.result as bigint | undefined;
      if (typeof val === 'bigint' && val > 0n) {
        out.push({ token: tokensOfInterest[idx], allowance: val });
      }
    });
    return out;
  }, [allowances, tokensOfInterest]);

  // Metadata for display
  const symbolContracts = React.useMemo(() => tokensWithAllowance.map((x) => ({
    address: x.token,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })), [tokensWithAllowance]);

  const decimalsContracts = React.useMemo(() => tokensWithAllowance.map((x) => ({
    address: x.token,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })), [tokensWithAllowance]);

  const { data: symbolResults } = useReadContracts({
    contracts: symbolContracts,
    query: { enabled: symbolContracts.length > 0 },
  });
  const { data: decimalsResults } = useReadContracts({
    contracts: decimalsContracts,
    query: { enabled: decimalsContracts.length > 0 },
  });

  const symbolByToken = React.useMemo(() => {
    const map = new Map<string, string>();
    if (!symbolResults) return map;
    tokensWithAllowance.forEach((x, i) => {
      const s = (symbolResults[i] as any)?.result as string | undefined;
      map.set(x.token.toLowerCase(), s || 'TOKEN');
    });
    return map;
  }, [symbolResults, tokensWithAllowance]);

  const decimalsByToken = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!decimalsResults) return map;
    tokensWithAllowance.forEach((x, i) => {
      const d = (decimalsResults[i] as any)?.result as number | bigint | undefined;
      map.set(x.token.toLowerCase(), typeof d === 'bigint' ? Number(d) : Number(d ?? 6));
    });
    return map;
  }, [decimalsResults, tokensWithAllowance]);

  const approvals = React.useMemo(() => {
    return tokensWithAllowance.map(({ token, allowance }) => {
      const sym = symbolByToken.get(token.toLowerCase()) || 'TOKEN';
      const dec = decimalsByToken.get(token.toLowerCase()) ?? 6;
      const human = Number(allowance) / Math.pow(10, dec);
      return { token, symbol: sym, decimals: dec, allowance, allowanceHuman: human };
    });
  }, [tokensWithAllowance, symbolByToken, decimalsByToken]);

  // Analytics: donors count for user's own fundraisers
  const donorsCountContracts = React.useMemo(() => {
    if (!analyticsAddress || !campaigns || campaigns.length === 0) return [];
    const mine = campaigns.filter((f: any) => f.creator?.toLowerCase?.() === address?.toLowerCase?.());
    return mine.map((f: any) => ({
      address: analyticsAddress as `0x${string}`,
      abi: poliDaoAnalyticsAbi,
      functionName: 'getDonorsCount',
      args: [BigInt(f.id)]
    }));
  }, [analyticsAddress, campaigns, address]);

  const { data: donorsCountResults } = useReadContracts({
    contracts: donorsCountContracts,
    query: { enabled: donorsCountContracts.length > 0 }
  });

  const donorsCountById = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!donorsCountResults) return map;
    // align with mine order
    const mine = (campaigns || []).filter((f: any) => f.creator?.toLowerCase?.() === address?.toLowerCase?.());
    donorsCountResults.forEach((r, idx) => {
      const fid = mine[idx]?.id;
      if (!fid) return;
      const val = (r as any)?.result as bigint | undefined;
      map.set(fid.toString(), Number(val ?? 0n));
    });
    return map;
  }, [donorsCountResults, campaigns, address]);

  // Router.canRefund for campaigns the user donated to (limited to first 50 to avoid overload)
  const refundCheckContracts = React.useMemo(() => {
    if (!address || donatedFundraiserIds.length === 0) return [];
    return donatedFundraiserIds.slice(0, 50).map((fid) => ({
      address: ROUTER_ADDRESS,
      abi: poliDaoRouterAbi,
      functionName: 'canRefund',
      args: [fid, address as `0x${string}`]
    }));
  }, [donatedFundraiserIds, address]);

  const { data: refundChecks } = useReadContracts({
    contracts: refundCheckContracts,
    query: { enabled: refundCheckContracts.length > 0 }
  });

  // Map refund checks back to fundraiser ids (in order of donatedFundraiserIds)
  const canRefundById = React.useMemo(() => {
    const map = new Map<string, boolean>();
    if (!refundChecks || donatedFundraiserIds.length === 0) return map;
    const ids = donatedFundraiserIds.slice(0, 50);
    ids.forEach((fid, idx) => {
      const r = refundChecks[idx] as any;
      const tuple = r?.result;
      const can = Array.isArray(tuple) ? Boolean(tuple[0]) : Boolean(tuple?.canRefundResult);
      map.set(fid.toString(), !!can);
    });
    return map;
  }, [refundChecks, donatedFundraiserIds]);

  // NEW: keep refund reason for UX
  const canRefundReasonById = React.useMemo(() => {
    const map = new Map<string, string>();
    if (!refundChecks || donatedFundraiserIds.length === 0) return map;
    const ids = donatedFundraiserIds.slice(0, 50);
    ids.forEach((fid, idx) => {
      const r = refundChecks[idx] as any;
      const tuple = r?.result;
      const reason = Array.isArray(tuple) ? String(tuple[1] ?? '') : String(tuple?.reason ?? '');
      map.set(fid.toString(), reason);
    });
    return map;
  }, [refundChecks, donatedFundraiserIds]);

  // --- RESTORED: DonationMade event scan state + effect (was missing) ---
  const [eventTotals, setEventTotals] = useState<{ count: number; sumBase: bigint } | null>(null);
  const [donationHistory, setDonationHistory] = useState<
    { fundraiserId: bigint; amount: bigint; timestamp: number; txHash: string }[]
  >([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!address || !coreAddress) return;

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
      if (!rpcUrl) return;

      try {
        setHistoryLoading(true);
        const provider = new JsonRpcProvider(rpcUrl);
        const iface = new Interface(poliDaoCoreAbi as any);

        const ev =
          (iface as any).getEvent?.('DonationMade') ??
          (iface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
        if (!ev) {
          if (!disposed) {
            setEventTotals(null);
            setDonationHistory([]);
            setHistoryLoading(false);
          }
          return;
        }
        const topic = (iface as any).getEventTopic
          ? (iface as any).getEventTopic(ev)
          : (iface as any).getEventTopic?.('DonationMade');

        const startBlockEnv = process.env.NEXT_PUBLIC_CORE_START_BLOCK;
        const fromBlock = startBlockEnv ? BigInt(startBlockEnv) : 0n;

        const logs = await provider.getLogs({
          address: coreAddress as string,
          fromBlock,
          toBlock: 'latest',
          topics: [topic],
        });

        let count = 0;
        let sumBase = 0n;
        const entries: { fundraiserId: bigint; amount: bigint; timestamp: number; txHash: string }[] = [];
        const blockTsCache = new Map<number, number>();

        for (const log of logs) {
          try {
            const decoded = iface.parseLog(log as any);
            const args = decoded.args as any;
            const donor = (args?.donor ?? args?.[1] ?? '').toLowerCase?.();
            const fundraiserId = (args?.fundraiserId ?? args?.id ?? args?.[0] ?? 0n) as bigint;
            const amountRaw = (args?.amount ?? args?.[3] ?? 0n) as bigint;
            if (donor && donor === address.toLowerCase()) {
              count += 1;
              sumBase += (amountRaw ?? 0n);

              const bn = Number(log.blockNumber ?? 0);
              let ts = blockTsCache.get(bn);
              if (ts == null) {
                const block = await provider.getBlock(log.blockHash!);
                ts = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
                blockTsCache.set(bn, ts);
              }
              entries.push({
                fundraiserId,
                amount: amountRaw ?? 0n,
                timestamp: ts,
                txHash: log.transactionHash || '',
              });
            }
          } catch {
            // ignore parse errors
          }
        }

        entries.sort((a, b) => b.timestamp - a.timestamp);

        if (!disposed) {
          setEventTotals({ count, sumBase });
          setDonationHistory(entries);
          setHistoryLoading(false);
        }
      } catch {
        if (!disposed) {
          setEventTotals(null);
          setDonationHistory([]);
          setHistoryLoading(false);
        }
      }
    })();
    return () => {
      disposed = true;
    };
  }, [address, coreAddress]);

  // KPIs: totals and available refunds count
  const [totalDonationsCount, setTotalDonationsCount] = useState<number>(0);
  const [totalDonationsSum, setTotalDonationsSum] = useState<string>('0');
  const [availableRefundsCount, setAvailableRefundsCount] = useState<number>(0);
  // NEW: mark when KPI got overridden by Transfer scan
  const [kpiOverride, setKpiOverride] = useState(false);

  // REMOVE: Router-based KPI and per-campaign fallback; rely only on Core DonationMade events
  useEffect(() => {
    if (kpiOverride) return; // keep transfer-based KPI if available
    if (eventTotals) {
      setTotalDonationsCount(eventTotals.count);
      const human = Number(eventTotals.sumBase) / 1_000_000; // assume USDC 6 decimals
      setTotalDonationsSum(`${human.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`);
    } else {
      setTotalDonationsCount(0);
      setTotalDonationsSum('0');
    }
  }, [eventTotals, kpiOverride]);

  // NEW: compute KPI strictly from ERC20 Transfer logs with to == Storage and from == user
  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!address || !storageAddress) return;
      if (!tokensOfInterest || tokensOfInterest.length === 0) return;

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
      if (!rpcUrl) return;

      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const transferTopic = keccak256(toUtf8Bytes('Transfer(address,address,uint256)'));
        const fromTopic = '0x' + address.slice(2).padStart(64, '0').toLowerCase();
        const toTopic = '0x' + (storageAddress as string).slice(2).padStart(64, '0').toLowerCase();

        // Optional: start block env for Storage/Router
        const startBlockEnv =
          process.env.NEXT_PUBLIC_STORAGE_START_BLOCK ||
          process.env.NEXT_PUBLIC_CORE_START_BLOCK ||
          '0';
        const fromBlock = BigInt(startBlockEnv);

        // Scan per token to avoid chain-wide query
        const logsPerToken = await Promise.all(
          tokensOfInterest.map((token) =>
            provider.getLogs({
              address: token as string,
              fromBlock,
              toBlock: 'latest',
              topics: [transferTopic, fromTopic, toTopic],
            })
          )
        );

        // Sum amounts (data field) and count all matches
        let totalBase = 0n;
        let totalCount = 0;
        for (const logs of logsPerToken) {
          totalCount += logs.length;
          for (const log of logs) {
            // ERC20 Transfer packs amount in data; parse as BigInt
            const amount = BigInt(log.data || '0x0');
            totalBase += amount;
          }
        }

        if (disposed) return;

        // Update KPI if we found any transfer; assumes 6 decimals (USDC)
        if (totalCount > 0 || totalBase > 0n) {
          setKpiOverride(true);
          setTotalDonationsCount(totalCount);
          const human = Number(totalBase) / 1_000_000;
          setTotalDonationsSum(`${human.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`);
        }
      } catch {
        // ignore; fall back to eventTotals effect
      }
    })();
    return () => {
      disposed = true;
    };
  }, [address, storageAddress, tokensOfInterest, chainRefresh]);

  // --- Refunds/Withdrawals: state and actions ---
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundCtx, setRefundCtx] = useState<{
    fid: bigint;
    donated: bigint;
    title: string;
    isRefundable: boolean;
    reason: string;
    // NEW: schedule info (preflight)
    allowedNow?: bigint;
    nextAt?: bigint;
    remaining?: bigint;
    // NEW: diagnostics from Storage/Core
    token?: `0x${string}`;
    donationStorage?: bigint;
    withdrawalsStarted?: boolean;
    raised?: bigint;
    goal?: bigint;
    // NEW: commission (bps) and expected net
    refundCommissionBps?: bigint;
    expectedNet?: bigint;
  } | null>(null);
  // REMOVED: custom refund amount
  // const [refundInput, setRefundInput] = useState<string>('');
  const [refundUi, setRefundUi] = useState<string>('');

  // NEW: withdraw modal state and actions
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawCtx, setWithdrawCtx] = useState<{
    fid: bigint;
    title: string;
    raised: bigint;
    goal: bigint;
    isFlexible: boolean;
    // NEW: schedule info (preflight)
    allowedNow?: bigint;
    nextAt?: bigint;
    remaining?: bigint;
  } | null>(null);
  const [withdrawInput, setWithdrawInput] = useState<string>('');
  const [withdrawUi, setWithdrawUi] = useState<string>('');

  // NEW: write states for refunds and withdrawals
  const { writeContractAsync } = useWriteContract();
  const [pendingRefund, setPendingRefund] = useState<{ id: bigint; hash: `0x${string}` } | null>(null);
  const { isLoading: isRefundMining, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: pendingRefund?.hash,
  });
  const [pendingWithdraw, setPendingWithdraw] = useState<{ id: bigint; hash: `0x${string}` } | null>(null);
  const { isLoading: isWithdrawMining, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: pendingWithdraw?.hash,
  });

  useEffect(() => {
    if (isRefundSuccess && pendingRefund) {
      setAvailableRefundsCount((c) => Math.max(0, c - 1));
      setRefundUi('Refund confirmed.');
      setPendingRefund(null);
      setChainRefresh((v) => v + 1); // refresh reads
      setTimeout(() => setRefundOpen(false), 900);
    }
  }, [isRefundSuccess, pendingRefund]);

  useEffect(() => {
    if (isWithdrawSuccess && pendingWithdraw) {
      setWithdrawUi('Withdrawal confirmed.');
      setPendingWithdraw(null);
      setChainRefresh((v) => v + 1); // refresh reads
      setTimeout(() => setWithdrawOpen(false), 900);
    }
  }, [isWithdrawSuccess, pendingWithdraw]);

  // Helpers
  function toBaseUnits(amount: string, decimals = 6): bigint {
    const s = amount.trim().replace(',', '.');
    if (!/^\d+(\.\d{0,18})?$/.test(s)) throw new Error('Invalid amount');
    const [intPart, fracPartRaw] = s.split('.');
    const frac = (fracPartRaw || '').padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart || '0') * (10n ** BigInt(decimals)) + BigInt(frac || '0');
  }

  // Simulate helpers
  async function simulateRefundSchedule(fid: bigint, amount: bigint) {
    try {
      if (!publicClient || !address) return null;
      const res = await publicClient.simulateContract({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'refundWithSchedule',
        args: [fid, amount],
        account: address as `0x${string}`,
      });
      const [allowedNow, nextAt, remaining] = res.result as readonly [bigint, bigint, bigint];
      return { allowedNow, nextAt, remaining };
    } catch {
      return null;
    }
  }
  async function simulateWithdrawSchedule(fid: bigint, amount: bigint) {
    try {
      if (!publicClient || !address) return null;
      const res = await publicClient.simulateContract({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'withdrawWithSchedule',
        args: [fid, amount],
        account: address as `0x${string}`,
      });
      const [allowedNow, nextAt, remaining] = res.result as readonly [bigint, bigint, bigint];
      return { allowedNow, nextAt, remaining };
    } catch {
      return null;
    }
  }

  // ADD: diagnostics loader used by openRefundDialog/doQuickRefund
  async function loadRefundDiagnostics(fid: bigint) {
    try {
      if (!publicClient) return {};
      const reads: Promise<any>[] = [];

      // Storage reads (donations + token)
      if (storageAddress && address) {
        reads.push(
          publicClient.readContract({
            address: storageAddress as `0x${string}`,
            abi: poliDaoStorageAbi,
            functionName: 'donations',
            args: [fid, address as `0x${string}`],
          }).catch(() => null)
        );
        reads.push(
          publicClient.readContract({
            address: storageAddress as `0x${string}`,
            abi: poliDaoStorageAbi,
            functionName: 'fundraiserTokens',
            args: [fid],
          }).catch(() => null)
        );
        // NEW: refund commission (bps)
        reads.push(
          publicClient.readContract({
            address: storageAddress as `0x${string}`,
            abi: poliDaoStorageAbi,
            functionName: 'refundCommission',
          }).catch(() => null)
        );
      } else {
        reads.push(Promise.resolve(null), Promise.resolve(null), Promise.resolve(null));
      }

      // Core reads (withdrawalsStarted + basic info)
      if (coreAddress) {
        reads.push(
          publicClient.readContract({
            address: coreAddress as `0x${string}`,
            abi: poliDaoCoreAbi,
            functionName: 'withdrawalsStarted',
            args: [fid],
          }).catch(() => null)
        );
        reads.push(
          publicClient.readContract({
            address: coreAddress as `0x${string}`,
            abi: poliDaoCoreAbi,
            functionName: 'getFundraiserBasicInfo',
            args: [fid],
          }).catch(() => null)
        );
      } else {
        reads.push(Promise.resolve(null), Promise.resolve(null));
      }

      const [donationStorage, token, refundCommissionBps, withdrawalsStarted, basic] = await Promise.all(reads);
      const raised = basic ? BigInt((basic as any)[2] ?? 0n) : undefined;
      const goal = basic ? BigInt((basic as any)[3] ?? 0n) : undefined;

      return {
        donationStorage: donationStorage != null ? BigInt(donationStorage) : undefined,
        token: token as `0x${string}` | undefined,
        refundCommissionBps: refundCommissionBps != null ? BigInt(refundCommissionBps) : undefined,
        withdrawalsStarted: withdrawalsStarted != null ? Boolean(withdrawalsStarted) : undefined,
        raised,
        goal,
      };
    } catch {
      return {};
    }
  }

  const openRefundDialog = async (fid: bigint) => {
    const idStr = fid.toString();
    const donated = donatedPerFundraiser.get(idStr) ?? 0n;
    const camp = (campaigns as any[])?.find((x) => x?.id?.toString?.() === idStr);
    const title =
      camp?.title && String(camp.title).trim().length > 0
        ? camp.title
        : camp?.isFlexible
          ? `Flexible campaign #${idStr}`
          : `Fundraiser #${idStr}`;
    const isRefundable = canRefundById.get(idStr) ?? false;
    const reason = canRefundReasonById.get(idStr) || '';
    setRefundCtx({ fid, donated, title, isRefundable, reason });
    setRefundUi('');
    setRefundOpen(true);

    // 1) Load diagnostics from Storage/Core first (donationStorage, commission, etc.)
    const diag = await loadRefundDiagnostics(fid);
    setRefundCtx((prev) => {
      if (!prev) return prev;
      const donationFromStorage = (diag as any)?.donationStorage as bigint | undefined;
      // override donated with storage value if available
      const next = { ...prev, ...diag } as any;
      if (typeof donationFromStorage === 'bigint') next.donated = donationFromStorage;
      return next;
    });

    // 2) Simulate using Storage donation when present
    const donationAmount = (diag as any)?.donationStorage ?? donated;
    const sim = await simulateRefundSchedule(fid, donationAmount as bigint);
    if (sim) {
      const bps = (diag as any)?.refundCommissionBps as bigint | undefined;
      const expectedNet = typeof bps === 'bigint'
        ? sim.allowedNow - (sim.allowedNow * bps / 10_000n)
        : undefined;
      setRefundCtx((prev) =>
        prev ? { ...prev, allowedNow: sim.allowedNow, nextAt: sim.nextAt, remaining: sim.remaining, expectedNet } : prev
      );
    }
  };

  // NEW: open withdraw dialog for creator
  const openWithdrawDialog = async (fid: bigint) => {
    const idStr = fid.toString();
    const camp = (campaigns as any[])?.find((x) => x?.id?.toString?.() === idStr);
    const title =
      camp?.title && String(camp.title).trim().length > 0
        ? camp.title
        : camp?.isFlexible
          ? `Flexible campaign #${idStr}`
          : `Fundraiser #${idStr}`;
    const raised = BigInt(camp?.raisedAmount ?? camp?.raised ?? 0n);
    const goal = BigInt(camp?.goalAmount ?? camp?.target ?? 0n);
    const isFlexible = Boolean(camp?.isFlexible);
    setWithdrawCtx({ fid, title, raised, goal, isFlexible });
    setWithdrawInput('');
    setWithdrawUi('');
    setWithdrawOpen(true);
    // NEW: preflight and enrich context (for flexible/partial withdrawals)
    const sim = await simulateWithdrawSchedule(fid, raised);
    if (sim) {
      setWithdrawCtx((prev) => prev ? { ...prev, allowedNow: sim.allowedNow, nextAt: sim.nextAt, remaining: sim.remaining } : prev);
    }
  };

  const doFullRefund = async () => {
    if (!refundCtx) return;
    try {
      setRefundUi('');

      // Always use Storage donation when available
      const donationAmount = (typeof refundCtx.donationStorage === 'bigint'
        ? refundCtx.donationStorage
        : refundCtx.donated) ?? 0n;

      // Simulate with Storage donation
      const sim = await simulateRefundSchedule(refundCtx.fid, donationAmount);
      if (sim) {
        setRefundCtx((prev) => prev ? { ...prev, allowedNow: sim.allowedNow, nextAt: sim.nextAt, remaining: sim.remaining } : prev);
        if (!refundCtx.isRefundable && sim.allowedNow === 0n) {
          const when = sim.nextAt ? new Date(Number(sim.nextAt) * 1000).toLocaleString('pl-PL') : '';
          setRefundUi(when ? `Refund in tranches not available yet. Try after: ${when}` : 'Refund temporarily unavailable (Security).');
          return;
        }
      }

      // Prefer router.refund if present in ABI (single-shot)
      const abi = poliDaoRouterAbi as any[];
      const refundFn = abi?.find?.((f: any) => f?.type === 'function' && f?.name === 'refund');

      if (refundFn) {
        const inputsLen = Array.isArray(refundFn.inputs) ? refundFn.inputs.length : 0;
        const args = inputsLen >= 2 ? [refundCtx.fid, donationAmount] : [refundCtx.fid];
        const txHash = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: 'refund',
          args,
        });
        setPendingRefund({ id: refundCtx.fid, hash: txHash });
        setRefundUi('Refund initiated. Waiting for confirmation...');
        return;
      }

      // Fallbacks
      if (refundCtx.isRefundable) {
        // Full immediate refund pays out
        const txHash = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: 'claimRefund',
          args: [refundCtx.fid],
        });
        setPendingRefund({ id: refundCtx.fid, hash: txHash });
        setRefundUi('Refund initiated. Waiting for confirmation...');
      } else {
        // Scheduled path: 1) set/consume schedule 2) claim payout
        const schedHash = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: 'refundWithSchedule',
          args: [refundCtx.fid, donationAmount],
        });
        setRefundUi('Schedule set. Preparing payout...');
        // Wait for schedule tx before claiming
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: schedHash });
        }
        const claimHash = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: 'claimRefund',
          args: [refundCtx.fid],
        });
        setPendingRefund({ id: refundCtx.fid, hash: claimHash });
        setRefundUi('Payout initiated. Waiting for confirmation...');
      }
    } catch (err: any) {
      setRefundUi(err?.shortMessage || err?.message || 'Failed to process refund.');
    }
  };

  // NEW: Quick refund from overlay using Router with preflight
  const doQuickRefund = async (fid: bigint) => {
    try {
      const idStr = fid.toString();
      const donatedAgg = donatedPerFundraiser.get(idStr) ?? 0n;
      const camp = (campaigns as any[])?.find((x) => x?.id?.toString?.() === idStr);
      const title = camp?.title && String(camp.title).trim().length >  0 ? camp.title : (camp?.isFlexible ? `Flexible campaign #${idStr}` : `Fundraiser #${idStr}`);
      const refundable = canRefundById.get(idStr) ?? false;
      const reason = canRefundReasonById.get(idStr) || '';
      setRefundCtx({ fid, donated: donatedAgg, title, isRefundable: refundable, reason });
      setRefundUi('Initiating refund...');
      setRefundOpen(true);

      // Load diagnostics (Storage donation and commission)
      const diag = await loadRefundDiagnostics(fid);
      setRefundCtx((prev) => (prev ? { ...prev, ...diag } : prev));

      // Use Storage donation if available
      const donationAmount = ((diag as any)?.donationStorage as bigint | undefined) ?? donatedAgg;

      if (donationAmount <= 0n) {
        setRefundUi('No donations to refund.');
        return;
      }

      // Simulate with Storage donation
      const sim = await simulateRefundSchedule(fid, donationAmount);
      if (sim) {
        const bps = (diag as any)?.refundCommissionBps as bigint | undefined;
        const expectedNet = typeof bps === 'bigint' ? sim.allowedNow - (sim.allowedNow * bps / 10_000n) : undefined;
        setRefundCtx((prev) => prev ? { ...prev, allowedNow: sim.allowedNow, nextAt: sim.nextAt, remaining: sim.remaining, expectedNet } : prev);
        if (!refundable && sim.allowedNow === 0n) {
          const when = sim.nextAt ? new Date(Number(sim.nextAt) * 1000).toLocaleString('pl-PL') : '';
          setRefundUi(when ? `Refund in tranches not available yet. Try after: ${when}` : 'Refund temporarily unavailable (Security).');
          return;
        }
      }

      if (refundable) {
        // Immediate path pays out
        const txHash = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: poliDaoRouterAbi,
          functionName: 'claimRefund',
          args: [fid],
        });
        setPendingRefund({ id: fid, hash: txHash });
        setRefundUi('Refund initiated. Waiting for confirmation...');
        return;
      }

      // Scheduled path: schedule then claim
      const schedHash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'refundWithSchedule',
        args: [fid, donationAmount],
      });
      setRefundUi('Schedule set. Preparing payout...');
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: schedHash });
      }
      const claimHash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'claimRefund',
        args: [fid],
      });
      setPendingRefund({ id: fid, hash: claimHash });
      setRefundUi('Payout initiated. Waiting for confirmation...');
    } catch (err: any) {
      setRefundUi(err?.shortMessage || err?.message || 'Failed to process refund.');
    }
  };

  // ADD: Withdraw handlers (used by Withdraw modal and overlay)
  const doFullWithdraw = async () => {
    if (!withdrawCtx) return;
    try {
      setWithdrawUi('');

      const isFlexible = Boolean(withdrawCtx.isFlexible || withdrawCtx.goal === 0n);

      // Preflight: if tranche not available yet, inform and exit
      const requested = withdrawCtx.raised;
      if (requested <= 0n) {
        setWithdrawUi('No funds to withdraw.');
        return;
      }
      const sim = await simulateWithdrawSchedule(withdrawCtx.fid, requested);
      if (!sim || sim.allowedNow === 0n) {
        const when = sim?.nextAt ? new Date(Number(sim.nextAt) * 1000).toLocaleString('pl-PL') : '';
        setWithdrawUi(sim ? `Withdrawal in tranches not available yet. Try after: ${when}` : 'Withdrawal temporarily unavailable (Security).');
        return;
      }

      // IMPORTANT: actual payout → Core.withdrawFunds via Router
      const txHash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'withdrawFunds',
        args: [withdrawCtx.fid],
      });
      setPendingWithdraw({ id: withdrawCtx.fid, hash: txHash });
      setWithdrawUi(isFlexible ? 'Withdrawing available tranche...' : 'Withdrawal initiated. Waiting for confirmation...');
    } catch (err: any) {
      setWithdrawUi(err?.shortMessage || err?.message || 'Failed to process withdrawal.');
    }
  };

  const doCustomWithdraw = async () => {
    if (!withdrawCtx) return;
    try {
      // Note: Core.withdrawFunds ignores a custom requested amount and enforces Security tranche.
      const requested = toBaseUnits(withdrawInput || '0', 6);
      if (requested <= 0n) {
        setWithdrawUi('Amount must be greater than 0.');
        return;
      }

      // Preflight for UX (still call withdrawFunds for payout)
      const sim = await simulateWithdrawSchedule(withdrawCtx.fid, requested);
      if (!sim || sim.allowedNow === 0n) {
        const when = sim?.nextAt ? new Date(Number(sim.nextAt) * 1000).toLocaleString('pl-PL') : '';
        setWithdrawUi(sim ? `Withdrawal in tranches not available yet. Try after: ${when}` : 'Withdrawal temporarily unavailable (Security).');
        return;
      }

      // Actual payout via Router.withdrawFunds (Core handles tranche and fees)
      const txHash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: poliDaoRouterAbi,
        functionName: 'withdrawFunds',
        args: [withdrawCtx.fid],
      });
      setPendingWithdraw({ id: withdrawCtx.fid, hash: txHash });
      setWithdrawUi('Withdrawal initiated. Waiting for confirmation...');
    } catch (err: any) {
      setWithdrawUi(err?.shortMessage || err?.message || 'Failed to process withdrawal.');
    }
  };

  // --- Diagnostics: read fundraiser data directly from Storage for user's campaigns
  const storageFundraiserCalls = React.useMemo(() => {
    if (!storageAddress || myCampaignIds.length === 0) return [];
    return myCampaignIds.map((fid) => ({
      address: storageAddress as `0x${string}`,
      abi: poliDaoStorageAbi,
      functionName: 'fundraisers' as const,
      args: [fid],
    }));
  }, [storageAddress, myCampaignIds, chainRefresh]);

  const { data: storageFundraiserResults } = useReadContracts({
    contracts: storageFundraiserCalls,
    query: { enabled: storageFundraiserCalls.length > 0 },
  });

  const storageProgressById = React.useMemo(() => {
    const map = new Map<string, { raised: bigint; goal: bigint; end?: bigint; isFlexible?: boolean; fundsWithdrawn?: boolean }>();
    if (!storageFundraiserResults) return map;
    myCampaignIds.forEach((fid, idx) => {
      const r = (storageFundraiserResults[idx] as any)?.result;
      if (!r) return;
      // Support both named and indexed tuple access
      const goal = BigInt(r?.goalAmount ?? r?.[0] ?? 0n);
      const raised = BigInt(r?.raisedAmount ?? r?.[1] ?? 0n);
      const end = BigInt(r?.endDate ?? r?.[2] ?? 0n);
      const fundsWithdrawn = Boolean(r?.fundsWithdrawn ?? r?.[10] ?? false);
      const isFlexible = Boolean(r?.isFlexible ?? r?.[11] ?? false);
      map.set(fid.toString(), { raised, goal, end, isFlexible, fundsWithdrawn });
    });
    return map;
  }, [storageFundraiserResults, myCampaignIds]);

  // UPDATED: prefer Storage-provided success, fallback to Router-based flags if missing
  const successById = React.useMemo(() => {
    // Prefer Storage
    if (storageProgressById.size > 0) {
      const m = new Map<string, boolean>();
      storageProgressById.forEach((p, key) => {
        const success = Boolean(p.fundsWithdrawn); // only gray-out after withdrawal, not just goal reached
        m.set(key, success);
      });
      return m;
    }
    // Fallback: unknown -> not success (keep CTA visible)
    return new Map<string, boolean>();
  }, [storageProgressById]);

  // UPDATED: prefer Storage-provided raised/goal for rendering in "Twoje zbiórki"
  const progressById = React.useMemo(() => {
    if (storageProgressById.size > 0) {
      const m = new Map<string, { raised: bigint; goal: bigint }>();
      storageProgressById.forEach((p, key) => {
        m.set(key, { raised: p.raised, goal: p.goal });
      });
      return m;
    }
    const map = new Map<string, { raised: bigint; goal: bigint }>();
    if (!progressResults) return map;
    myCampaignIds.forEach((fid, idx) => {
      const pr = (progressResults[idx] as any)?.result;
      const raised = BigInt(pr?.raised ?? pr?.[0] ?? 0n);
      const goal = BigInt(pr?.goal ?? pr?.[1] ?? 0n);
      map.set(fid.toString(), { raised, goal });
    });
    return map;
  }, [storageProgressById, progressResults, myCampaignIds]);

  return (
    <>
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'tab-active'
                  : 'tab-inactive'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'donations'
                  ? 'tab-active'
                  : 'tab-inactive'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('fundraisers')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'fundraisers'
                  ? 'tab-active'
                  : 'tab-inactive'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Your Fundraisers
            </button>
            {/* removed "Głosowania" tab button */}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setHistoryOpen(true)}
                className="kpi-card p-4 rounded-lg cursor-pointer transition-colors hover:shadow-md"
                title="Click to view your donation history"
              >
                <h3 className="text-lg font-semibold mb-2">Total number of donations</h3>
                <p className="text-2xl font-bold">{totalDonationsCount}</p>
              </div>

              <div
                onClick={() => setHistoryOpen(true)}
                className="kpi-card p-4 rounded-lg cursor-pointer transition-colors hover:shadow-md"
                title="Click to view your donation history"
              >
                <h3 className="text-lg font-semibold mb-2">Total volume</h3>
                <p className="text-2xl font-bold">{totalDonationsSum}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">My donations</h2>
            {campaignsLoading ? (
              <p>Loading...</p>
            ) : campaignsError ? (
              <p className="text-red-500">Error loading donations</p>
            ) : campaigns && campaigns.length > 0 ? (
              (() => {
                const donatedCampaigns = campaigns.filter((c: any) =>
                  donatedIdsSet.has((c.id ?? 0n).toString())
                );

                // --- NEW: sort so not reached first, then reached; tie-breakers: closer to goal, newest ---
                const BIG = 10n ** 40n;
                const getProg = (c: any) => {
                  const raised = BigInt(c.raisedAmount ?? c.raised ?? 0n);
                  const goal = BigInt(c.goalAmount ?? c.target ?? 0n);
                  return { raised, goal };
                };
                const isReached = (c: any) => {
                  const { raised, goal } = getProg(c);
                  return goal > 0n && raised >= goal;
                };
                const remainingToGoal = (c: any) => {
                  const { raised, goal } = getProg(c);
                  if (goal <= 0n) return BIG;
                  return raised >= goal ? 0n : (goal - raised);
                };
                const sortedDonated = donatedCampaigns.slice().sort((a: any, b: any) => {
                  const aReached = isReached(a);
                  const bReached = isReached(b);
                  if (aReached !== bReached) return aReached ? 1 : -1; // not reached first
                  const aRem = remainingToGoal(a);
                  const bRem = remainingToGoal(b);
                  if (aRem !== bRem) return aRem < bRem ? -1 : 1; // closer first
                  const aid = BigInt(a.id ?? 0n);
                  const bid = BigInt(b.id ?? 0n);
                  if (aid !== bid) return aid > bid ? -1 : 1; // newest first
                  return 0;
                });

                return sortedDonated.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-6">
                    {sortedDonated.map((c: any) => {
                      const idStr = (c.id ?? 0n).toString();
                      const donationAmount = donatedPerFundraiser.get(idStr) ?? 0n;

                      // Detect flexible/no-goal
                      const goalRaw = BigInt(c.goalAmount ?? c.target ?? 0n);
                      const isFlexibleCampaign = Boolean(c.isFlexible) || goalRaw === 0n;

                      // Normalize to CampaignCard's expected shape
                      const mappedCampaign = {
                        campaignId: idStr,
                        targetAmount: (c.goalAmount ?? c.target ?? 0n) as bigint,
                        raisedAmount: (c.raisedAmount ?? c.raised ?? 0n) as bigint,
                        creator: c.creator as string,
                        token: c.token as string,
                        endTime: (c.endDate ?? c.endTime ?? 0n) as bigint,
                        // ensure cards hide progress for flexible/no-goal
                        isFlexible: isFlexibleCampaign,
                      };

                      // REPLACED: prefer on-chain/metadata description when present
                      const plainDesc = String(c.description ?? c.details ?? c.story ?? c.metadata?.description ?? '').trim();
                      const description =
                        plainDesc.length > 0
                          ? plainDesc
                          : (donationAmount > 0n
                              ? `Your donations: ${(Number(donationAmount) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`
                              : `Campaign created by ${String(c.creator).slice(0, 6)}...${String(c.creator).slice(-4)}`);

                      const metadata = {
                        title:
                          (c.title && String(c.title).trim().length > 0)
                            ? c.title
                            : c.isFlexible
                              ? `Flexible campaign #${idStr}`
                              : `Fundraiser #${idStr}`,
                        // CHANGED: show real description if provided
                        description,
                        image: "/images/zbiorka.png",
                      };

                      const isRefundable = canRefundById.get(idStr) ?? false;
                      const isPending = pendingRefund?.id === BigInt(idStr) || isRefundMining;

                      // goal reached only applies to goal-based fundraisers
                      const reached = (() => {
                        const raised = BigInt(c.raisedAmount ?? c.raised ?? 0n);
                        return goalRaw > 0n && raised >= goalRaw;
                      })();

                      return (
                        <div key={idStr} className="w-full sm:w-[24rem] flex-none">
                          <div
                            className="relative group cursor-pointer transition-transform"
                            onClick={() => router.push(`/campaigns/${idStr}`)}
                            title="Go to campaign page"
                          >
                            <CampaignCard
                              campaign={mappedCampaign}
                              metadata={metadata}
                              donationAmount={donationAmount}
                              isRefundable={isRefundable}
                              showDetails
                            />

                            {/* Thank-you overlay when goal-based campaign reached its target */}
                            {reached ? (
                              // Full-card overlay (previously only image area)
                              <div className="pointer-events-none absolute inset-0 z-10 rounded-t-xl overflow-hidden opacity-100">
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/40 via-fuchsia-400/20 to-transparent" />
                                <div className="absolute inset-0 rounded-t-xl ring-1 ring-white/30 shadow-[inset_0_0_28px_rgba(16,185,129,0.45)]" />
                                {/* CHANGED: center the thank-you message */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {/* CHANGED: solid white (no transparency) */}
                                  <span className="pointer-events-none px-4 py-2 rounded-full bg-white text-emerald-700 text-sm font-semibold ring-1 ring-emerald-300 shadow">
                                    Thank you for your support! 🎉
                                  </span>
                                </div>
                              </div>
                            ) : isFlexibleCampaign ? (
                              // NEW: Yellow info overlay for flexible/no-goal campaigns (refunds unavailable)
                              <div className="pointer-events-none absolute inset-0 z-10 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-400/35 via-amber-300/10 to-transparent" />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-amber-400/40 shadow-[inset_0_0_22px_rgba(251,191,36,0.45)]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span
                                    className="pointer-events-none px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-semibold ring-1 ring-white/20 shadow"
                                    title="Refunds are not available for flexible campaigns"
                                  >
                                    Refunds unavailable for flexible campaigns
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Red revoke overlay on hover – only for goal-based not-yet-reached
                              <div className="pointer-events-none absolute inset-0 z-10 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#ef4444]/35 via-[#ef4444]/10 to-transparent" />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-[#ef4444]/40 shadow-[inset_0_0_22px_rgba(239,68,68,0.45)]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <button
                                    className={`pointer-events-auto px-4 py-2 rounded-full text-white text-sm font-semibold ring-1 ring-white/20 transition-shadow
                                      bg-[#ef4444] shadow-[0_0_14px_rgba(239,68,68,0.65)] hover:shadow-[0_0_26px_rgba(239,68,68,0.95)]
                                      ${isPending ? 'cursor-wait' : ''}`}
                                    aria-label="Revoke donation"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      doQuickRefund(BigInt(idStr));
                                    }}
                                    disabled={isPending}
                                  >
                                    {isPending ? 'Revoking...' : 'Revoke donation'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* delikatny ogólny hover dla kart */}
                            <div className="absolute inset-0 rounded-lg transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>You haven't made any donations yet.</p>
                );
              })()
            ) : (
              <p>You haven't made any donations yet.</p>
            )}
          </div>
        )}

        {activeTab === 'fundraisers' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-center">Your Fundraisers</h2>
            {!address ? (
              <p>Connect your wallet to see your fundraisers.</p>
            ) : campaignsLoading ? (
              <p>Loading...</p>
            ) : campaignsError ? (
              <p className="text-red-500">Error loading fundraisers</p>
            ) : myCampaigns.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {(() => {
                  // NEW ORDER:
                  // 1) Ready to withdraw (reached goal, not withdrawn) -> first
                  // 2) Others by highest raised (including no-goal campaigns) -> next
                  // 3) Withdrawn/successful -> last
                  // Tie-breaker for equal raised: newest first (id desc)

                  const getProg = (c: any) => {
                    const idStr = (c.id ?? 0n).toString();
                    const pr = progressById.get(idStr);
                    const raised = BigInt(pr?.raised ?? c.raisedAmount ?? c.raised ?? 0n);
                    const goal = BigInt(pr?.goal ?? c.goalAmount ?? c.target ?? 0n);
                    return { raised, goal };
                  };
                  const isSuccess = (c: any) => {
                    const idStr = (c.id ?? 0n).toString();
                    return successById.get(idStr) ?? false;
                  };
                  const reachedGoal = (c: any) => {
                    const { raised, goal } = getProg(c);
                    return goal > 0n && raised >= goal;
                  };
                  const idOf = (c: any) => BigInt(c.id ?? 0n);

                  const sorted = myCampaigns.slice().sort((a: any, b: any) => {
                    const aId = idOf(a);
                    const bId = idOf(b);

                    const aProg = getProg(a);
                    const bProg = getProg(b);

                    const aSucc = isSuccess(a);
                    const bSucc = isSuccess(b);

                    const aReached = reachedGoal(a);
                    const bReached = reachedGoal(b);

                    // Grouping:
                    // 0 = reached (ready to withdraw, not withdrawn)
                    // 1 = not reached and not withdrawn (incl. no-goal)
                    // 2 = withdrawn/success
                    const aGroup = !aSucc && aReached ? 0 : (aSucc ? 2 : 1);
                    const bGroup = !bSucc && bReached ? 0 : (bSucc ? 2 : 1);

                    if (aGroup !== bGroup) return aGroup - bGroup;

                    // For group 1: sort by raised desc, then newest first
                    if (aGroup === 1) {
                      if (aProg.raised !== bProg.raised) return aProg.raised > bProg.raised ? -1 : 1;
                      if (aId !== bId) return aId > bId ? -1 : 1;
                      return 0;
                    }

                    // For groups 0 and 2: tie-breaker newest first
                    if (aId !== bId) return aId > bId ? -1 : 1;
                    return 0;
                  });

                  return sorted.map((c: any) => {
                    const idStr = (c.id ?? 0n).toString();
                    const success = successById.get(idStr) ?? false;
                    const prog = progressById.get(idStr);
                    return (
                      <div key={String(c.id)} className="w-full sm:w-[24rem] flex-none">
                        <MyCampaignCard
                          campaign={c}
                          progress={prog}
                          onWithdraw={(id) => openWithdrawDialog(BigInt(id))}
                          success={success}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <p>You haven't created any fundraisers yet.</p>
            )}
          </div>
        )}

        {/* removed votes section */}
        {/* {activeTab === 'votes' && ( ... )} */}
      </div>

      {/* NEW: Historia darowizn – modal */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: 'dialog-surface',
          sx: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            '& .MuiDialogTitle-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-root': {
              background: 'color-mix(in srgb, var(--surface) 96%, white 4%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-dividers': {
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            },
            '& .MuiDialogActions-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              borderTop: '1px solid var(--border)',
            },
            '& a': { color: 'var(--primary)' },
          },
        }}
      >
        <DialogTitle>Donation history</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <p>Loading history...</p>
          ) : donationHistory.length === 0 ? (
            <p className="text-gray-600">No recorded donations for this account.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {donationHistory.map((d, idx) => {
                const fid = d.fundraiserId.toString();
                const camp = (campaigns as any[])?.find(x => x?.id?.toString?.() === fid);
                const title = camp?.title && String(camp.title).trim().length >  0
                  ? camp.title
                  : camp?.isFlexible
                    ? `Flexible campaign #${fid}`
                    : `Fundraiser #${fid}`;
                return (
                  <li key={`${d.txHash}-${idx}`} className="flex items-center justify-between py-3">
                    <div>
                      <a href={`/campaigns/${fid}`} className="text-sm font-medium text-[#10b981] hover:underline">
                        {title}
                      </a>
                      <p className="text-xs text-gray-500">{new Date(d.timestamp).toLocaleString('pl-PL')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-700">
                        {(Number(d.amount) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC
                      </p>
                      {d.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${d.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Etherscan
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Refund modal – styled to match app */}
      <Dialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'dialog-surface',
          sx: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            '& .MuiDialogTitle-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-root': {
              background: 'color-mix(in srgb, var(--surface) 96%, white 4%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-dividers': {
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            },
            '& .MuiDialogActions-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              borderTop: '1px solid var(--border)',
            },
          },
        }}
      >
        <DialogTitle>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4444]/10 text-[#ef4444]">↩</span>
            <span>Revoke donation</span>
          </div>
        </DialogTitle>
        <DialogContent dividers>
          {!refundCtx ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">Fundraiser</p>
                <p className="text-base font-semibold">{refundCtx.title}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Your total donations</span>
                  {(() => {
                    const donatedNow = (typeof refundCtx.donationStorage === 'bigint'
                      ? refundCtx.donationStorage
                      : refundCtx.donated) ?? 0n;
                    return (
                      <span className="text-sm font-semibold text-gray-900">
                        {(Number(donatedNow) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC
                      </span>
                    );
                  })()}
                </div>
                {/* Removed any 'available/remaining/next tranche' indicators — full amount is refunded */}
              </div>

              <div className="rounded-xl p-4 ring-1 ring-gray-100 bg-white">
                {(() => {
                  const donatedNow = (typeof refundCtx.donationStorage === 'bigint'
                    ? refundCtx.donationStorage
                    : refundCtx.donated) ?? 0n;
                  const isPending = isRefundMining || (pendingRefund && refundCtx && pendingRefund.id === refundCtx.fid);
                  const noFunds = donatedNow <= 0n;
                  const disabled = isPending || noFunds;

                  // CHANGED: static label
                  const label = 'Refunding all amount ...';

                  return (
                    <button
                      onClick={doFullRefund}
                      disabled={disabled}
                      className={`w-full px-4 py-2 rounded-lg text-white text-sm font-semibold shadow transition
                        bg-[#ef4444] hover:shadow-[0_0_22px_rgba(239,68,68,0.45)]
                        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })()}

                {refundUi && (
                  <p className="mt-3 text-xs text-gray-600">{refundUi}</p>
                )}
              </div>

              {/* Removed fee/net/remaining badges — modal focuses on total donation only */}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Withdraw modal – styled to match app */}
      <Dialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'dialog-surface',
          sx: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            '& .MuiDialogTitle-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-root': {
              background: 'color-mix(in srgb, var(--surface) 96%, white 4%)',
              color: 'var(--text)',
            },
            '& .MuiDialogContent-dividers': {
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            },
            '& .MuiDialogActions-root': {
              background: 'color-mix(in srgb, var(--surface) 90%, black 10%)',
              borderTop: '1px solid var(--border)',
            },
          },
        }}
      >
        <DialogTitle>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981]">⬇</span>
            <span>Withdraw funds</span>
          </div>
        </DialogTitle>
        <DialogContent dividers>
          {!withdrawCtx ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">Fundraiser</p>
                <p className="text-base font-semibold">{withdrawCtx.title}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Raised</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(Number(withdrawCtx.raised) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC
                  </span>
                </div>
                <div className="mt-3">
                  {withdrawCtx.goal > 0n && withdrawCtx.raised >= withdrawCtx.goal ? (
                    <span className="inline-flex items-center rounded-full bg-[#10b981]/10 px-2.5 py-1 text-xs font-semibold text-[#10b981] ring-1 ring-[#10b981]/20">
                      Goal reached — full withdrawal available
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Tranche-based withdrawal — available amount depends on schedule
                    </span>
                  )}
                </div>

                {/* CHANGED: show tranche diagnostics for flexible/no-goal and for target-not-reached */}
                {(withdrawCtx.goal === 0n || withdrawCtx.raised < withdrawCtx.goal) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">Available now</div>
                      <div className="mt-0.5">
                        {((Number(withdrawCtx.allowedNow ?? 0n) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 }))} USDC
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">Remaining</div>
                      <div className="mt-0.5">
                        {((Number(withdrawCtx.remaining ?? 0n) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 }))} USDC
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">Next tranche</div>
                      <div className="mt-0.5">
                        {withdrawCtx.nextAt && withdrawCtx.nextAt > 0n
                          ? new Date(Number(withdrawCtx.nextAt) * 1000).toLocaleString('pl-PL')
                          : '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl p-4 ring-1 ring-gray-100 bg-white">
                <button
                  onClick={doFullWithdraw}
                  disabled={isWithdrawMining || (pendingWithdraw && withdrawCtx && pendingWithdraw.id === withdrawCtx.fid)}
                  className={`w-full px-4 py-2 rounded-lg text-white text-sm font-semibold shadow transition
                    bg-[#10b981] ${isWithdrawMining ? 'opacity-70 cursor-wait' : 'hover:shadow-[0_0_22px_rgba(16,185,129,0.35)]'}`}
                >
                  {(() => {
                    const reached = withdrawCtx.goal > 0n && withdrawCtx.raised >= withdrawCtx.goal;
                    if (isWithdrawMining) return 'Processing...';
                    return reached ? 'Withdraw full amount now' : 'Withdraw available tranche';
                  })()}
                </button>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Or withdraw a custom amount (USDC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 250.00"
                      value={withdrawInput}
                      onChange={(e) => setWithdrawInput(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/30"
                    />
                    <button
                      onClick={doCustomWithdraw}
                      disabled={isWithdrawMining}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#10b981] transition ${isWithdrawMining ? 'opacity-70 cursor-wait' : 'hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'}`}
                    >
                      Withdraw amount
                    </button>
                  </div>
                </div>

                {withdrawUi && (
                  <p className="mt-3 text-xs text-gray-600">{withdrawUi}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  );
}

// Extend MyCampaignCard to accept success flag and gray out if finished
function MyCampaignCard({
  campaign,
  onWithdraw,
  success,
  progress
}: {
  campaign: any,
  onWithdraw?: (id: string) => void,
  success?: boolean,
  progress?: { raised: bigint; goal: bigint }
}) {
  const router = useRouter();
  const idStr = (campaign.id ?? 0n).toString();

  // NEW: compute target/raised and treat goal==0 as flexible to hide progress
  const targetAmount = BigInt(progress?.goal ?? (campaign.goalAmount ?? campaign.target ?? 0n));
  const raisedAmount = BigInt(progress?.raised ?? (campaign.raisedAmount ?? campaign.raised ?? 0n));
  const isFlexibleComputed = Boolean(campaign.isFlexible) || targetAmount === 0n;

  // Normalize and override with progress when available
  const mappedCampaign = {
    campaignId: idStr,
    targetAmount,
    raisedAmount,
    creator: campaign.creator as string,
    token: campaign.token as string,
    endTime: (campaign.endDate ?? campaign.endTime ?? 0n) as bigint,
    // CHANGED: mark no-goal campaigns as flexible to hide progress bar
    isFlexible: isFlexibleComputed,
  };

  const isReached =
    mappedCampaign.targetAmount > 0n &&
    mappedCampaign.raisedAmount >= mappedCampaign.targetAmount;

  // NEW: no-goal campaigns are always withdrawable
  const isNoGoal = mappedCampaign.targetAmount === 0n;

  // REPLACED: prefer campaign description if available
  const descCandidate = String(
    campaign.description ?? campaign.details ?? campaign.story ?? campaign.metadata?.description ?? ''
  ).trim();

  const metadata = {
    title:
      (campaign.title && String(campaign.title).trim().length > 0)
        ? campaign.title
        : campaign.isFlexible
          ? `Flexible campaign #${idStr}`
          : `Fundraiser #${idStr}`,
    // CHANGED: show real description if provided, otherwise fallback
    description:
      descCandidate.length > 0
        ? descCandidate
        : `Campaign created by ${String(campaign.creator).slice(0, 6)}...${String(campaign.creator).slice(-4)}`,
    image: "/images/zbiorka.png",
  };

  return (
    <div
      className={`relative group cursor-pointer transition-transform ${success ? 'grayscale opacity-80' : ''}`}
      onClick={() => router.push(`/campaigns/${idStr}`)}
      title="Przejdź do strony zbiórki"
    >
      <CampaignCard campaign={mappedCampaign} metadata={metadata} />

      {/* If finished successfully, show grey badge and no CTA */}
      {success ? (
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-60 z-10 rounded-t-xl overflow-hidden opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-500/30 via-gray-300/10 to-transparent" />
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center rounded-full bg-gray-800/80 text-white text-xs font-semibold px-2.5 py-1 ring-1 ring-white/10 shadow">
              Successful
            </span>
          </div>
        </div>
      ) : (
        // CHANGED: full-card overlay, button centered on the image area (h-60)
        (isReached || isNoGoal) && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 bg-gradient-to-t from-[#10b981]/35 via-[#10b981]/10 to-transparent" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-[#10b981]/40 shadow-[inset_0_0_22px_rgba(16,185,129,0.45)]" />
            {/* CHANGED: center button in the middle of the entire card */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className="pointer-events-auto px-4 py-2 rounded-full bg-[#10b981] text-white text-sm font-semibold ring-1 ring-white/20 shadow-[0_0_14px_rgba(16,185,129,0.65)] hover:shadow-[0_0_26px_rgba(16,185,129,0.95)] transition-shadow"
                aria-label="Withdraw funds"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onWithdraw) onWithdraw(idStr);
                  else router.push(`/campaigns/${idStr}`);
                }}
              >
                Withdraw funds
              </button>
            </div>
          </div>
        )
      )}

      <div className="absolute inset-0 rounded-lg transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
    </div>
  );
}