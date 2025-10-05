// src/app/account/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { ROUTER_ADDRESS } from '../../blockchain/contracts';
import { poliDaoRouterAbi } from '../../blockchain/routerAbi';
import { poliDaoCoreAbi } from '../../blockchain/coreAbi';
import { poliDaoAnalyticsAbi } from '../../blockchain/analyticsAbi';
import poliDaoGovernanceAbi from '../../blockchain/governanceAbi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGetAllProposals } from '../../hooks/usePoliDao';
import { useFundraisersModular } from '../../hooks/useFundraisersModular';
import CampaignCard from '../../components/CampaignCard';
// Fallback B: event scan
import { Interface, JsonRpcProvider } from 'ethers';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
// Add write hooks for revoke
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';

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
    'dashboard' | 'donations' | 'approvals' | 'refunds' | 'fundraisers' | 'votes'
  >('dashboard');
  const router = useRouter();

  // Używaj istniejących hooków
  const { 
    fundraisers: campaigns, 
    isLoading: campaignsLoading, 
    error: campaignsError 
  } = useFundraisersModular();

  const { 
    proposals, 
    isLoading: proposalsLoading, 
    error: proposalsError 
  } = useGetAllProposals();

// NEW: user's own campaigns
  const myCampaigns = React.useMemo(() => {
    if (!campaigns || !address) return [];
    return (campaigns as any[]).filter(
      (f: any) => f?.creator?.toLowerCase?.() === address?.toLowerCase?.()
    );
  }, [campaigns, address]);

  // Resolve Core and Analytics module
  const { data: coreAddress } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: poliDaoRouterAbi,
    functionName: 'coreContract'
  });

  const { data: analyticsAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'analyticsModule',
    query: { enabled: !!coreAddress }
  });

// --- Governance proposals (prefer governanceModule if present) ---
  const { data: governanceAddress } = useReadContract({
    address: coreAddress as `0x${string}` | undefined,
    abi: poliDaoCoreAbi,
    functionName: 'governanceModule',
    query: { enabled: !!coreAddress }
  });

  const { data: govIdsAll } = useReadContract({
    address: governanceAddress as `0x${string}` | undefined,
    abi: poliDaoGovernanceAbi,
    functionName: 'getAllProposalIds',
    query: { enabled: !!governanceAddress },
  });

  const { data: govCountRaw } = useReadContract({
    address: governanceAddress as `0x${string}` | undefined,
    abi: poliDaoGovernanceAbi,
    functionName: 'getProposalCount',
    query: { enabled: !!governanceAddress && (!(Array.isArray(govIdsAll)) || (govIdsAll as any[]).length === 0) },
  });

  const govIds = React.useMemo(() => {
    if (Array.isArray(govIdsAll) && govIdsAll.length > 0) {
      return (govIdsAll as bigint[]).slice(0, 200);
    }
    const n = Number(govCountRaw ?? 0n);
    return Array.from({ length: Math.min(n, 100) }, (_, i) => BigInt(i));
  }, [govIdsAll, govCountRaw]);

  const govCalls = React.useMemo(() => {
    if (!governanceAddress || govIds.length === 0) return [];
    return govIds.map((id) => ({
      address: governanceAddress as `0x${string}`,
      abi: poliDaoGovernanceAbi,
      functionName: 'getProposal',
      args: [id],
    }));
  }, [governanceAddress, govIds]);

  const { data: govResults } = useReadContracts({
    contracts: govCalls,
    query: { enabled: govCalls.length > 0 },
  });

  const governanceProposals = React.useMemo(() => {
    if (!govResults || govResults.length === 0) return [];
    const out: { id: bigint; question: string; yesVotes: bigint; noVotes: bigint; endTime: bigint; creator: string }[] = [];
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

  const displayProposals = React.useMemo(
    () => (governanceProposals.length > 0 ? governanceProposals : (proposals || [])),
    [governanceProposals, proposals]
  );

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

  // --- Approvals: read-only list of ERC20 allowances granted to Core ---
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

  // Owner->Core allowances for tokensOfInterest
  const allowancesContracts = React.useMemo(() => {
    if (!address || !coreAddress || tokensOfInterest.length === 0) return [];
    return tokensOfInterest.map((t) => ({
      address: t as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address as `0x${string}`, coreAddress as `0x${string}`],
    }));
  }, [address, coreAddress, tokensOfInterest]);

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

  // Fallback B: scan Core.DonationMade events for this user (count + sum)
  const [eventTotals, setEventTotals] = useState<{ count: number; sumBase: bigint } | null>(null);
  // NEW: full donation history for the user (all campaigns)
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

        const ev = (iface as any).getEvent?.('DonationMade')
          ?? (iface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
        if (!ev) { if (!disposed) { setEventTotals(null); setDonationHistory([]); setHistoryLoading(false); } return; }
        const topic = (iface as any).getEventTopic
          ? (iface as any).getEventTopic(ev)
          : (iface as any).getEventTopic?.('DonationMade');

        const startBlockEnv = process.env.NEXT_PUBLIC_CORE_START_BLOCK;
        const fromBlock = startBlockEnv ? BigInt(startBlockEnv) : 0n;

        // fetch all DonationMade logs and filter by donor
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

              // block timestamp (cached by blockNumber)
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
                txHash: log.transactionHash || ''
              });
            }
          } catch {
            // ignore
          }
        }

        // sort newest first
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
    return () => { disposed = true; };
  }, [address, coreAddress]);

  // KPIs: totals and available refunds count
  const [totalDonationsCount, setTotalDonationsCount] = useState<number>(0);
  const [totalDonationsSum, setTotalDonationsSum] = useState<string>('0');
  const [availableRefundsCount, setAvailableRefundsCount] = useState<number>(0);

  // Primary source: Router.listUserDonations
  useEffect(() => {
    const ids = (userDonationsTuple as any)?.[0] as bigint[] | undefined;
    const amounts = (userDonationsTuple as any)?.[1] as bigint[] | undefined;

    if (Array.isArray(ids) && Array.isArray(amounts) && ids.length === amounts.length && ids.length > 0) {
      setTotalDonationsCount(ids.length);
      const sum = amounts.reduce((acc, v) => acc + (v ?? 0n), 0n);
      const human = Number(sum) / 1_000_000; // assume USDC 6 decimals
      setTotalDonationsSum(`${human.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`);
      return;
    }

    // If Router returns nothing usable, clear (fallbacks will fill)
    setTotalDonationsCount(0);
    setTotalDonationsSum('0');
  }, [userDonationsTuple]);

  // Fallback preference: Core events (accurate count) → per-campaign getDonationAmount (coverage)
  useEffect(() => {
    // Use events if have any matches
    if (eventTotals && (eventTotals.count > 0 || eventTotals.sumBase > 0n)) {
      setTotalDonationsCount(eventTotals.count);
      const human = Number(eventTotals.sumBase) / 1_000_000; // assume USDC 6 decimals
      setTotalDonationsSum(`${human.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`);
      return;
    }

    // Else aggregate per-campaign results
    if (donationAmountResults && donationAmountResults.length > 0) {
      let sum = 0n;
      let nonZero = 0;
      for (const r of donationAmountResults) {
        const v = (r as any)?.result as bigint | undefined;
        if (typeof v === 'bigint') {
          sum += v;
          if (v > 0n) nonZero += 1; // fixed parentheses
        }
      }
      if (sum > 0n || nonZero > 0) {
        setTotalDonationsCount(nonZero); // approximation of "number of donations" via number of campaigns with any donation
        const human = Number(sum) / 1_000_000; // assume USDC 6 decimals
        setTotalDonationsSum(`${human.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`);
      }
    }
  }, [eventTotals, donationAmountResults]);

  // Compute availableRefundsCount from refundChecks
  useEffect(() => {
    if (!refundChecks || refundChecks.length === 0) {
      setAvailableRefundsCount(0);
      return;
    }
    const count = refundChecks.reduce((acc, r) => {
      const res = (r as any)?.result;
      const can = Array.isArray(res) ? Boolean(res[0]) : Boolean(res?.canRefundResult);
      return acc + (can ? 1 : 0);
    }, 0);
    setAvailableRefundsCount(count);
  }, [refundChecks]);

  return (
    <>
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Moje konto</h1>
        </div>

        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'donations'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Wspierane zbiórki
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'approvals'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Zatwierdzenia
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'refunds'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Refundacje
            </button>
            <button
              onClick={() => setActiveTab('fundraisers')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'fundraisers'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Twoje zbiórki
            </button>
            <button
              onClick={() => setActiveTab('votes')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'votes'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Głosowania
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setHistoryOpen(true)}
                className="p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-[#10b981]/10 transition-colors"
                title="Kliknij, aby zobaczyć historię Twoich darowizn"
              >
                <h3 className="text-lg font-semibold mb-2">Całkowita liczba darowizn</h3>
                <p className="text-2xl font-bold">{totalDonationsCount}</p>
              </div>
              <div
                onClick={() => setHistoryOpen(true)}
                className="p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-[#10b981]/10 transition-colors"
                title="Kliknij, aby zobaczyć historię Twoich darowizn"
              >
                <h3 className="text-lg font-semibold mb-2">Całkowita suma darowizn</h3>
                <p className="text-2xl font-bold">{totalDonationsSum}</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Dostępne do zwrotu</h3>
                <p className="text-2xl font-bold">{availableRefundsCount}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Moje darowizny</h2>
            {campaignsLoading ? (
              <p>Ładowanie...</p>
            ) : campaignsError ? (
              <p className="text-red-500">Błąd podczas ładowania darowizn</p>
            ) : campaigns && campaigns.length > 0 ? (
              (() => {
                const donatedCampaigns = campaigns.filter((c: any) =>
                  donatedIdsSet.has((c.id ?? 0n).toString())
                );
                return donatedCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {donatedCampaigns.map((c: any) => {
                      const idStr = (c.id ?? 0n).toString();
                      const donationAmount = donatedPerFundraiser.get(idStr) ?? 0n;

                      // Normalize to CampaignCard's expected shape
                      const mappedCampaign = {
                        campaignId: idStr,
                        targetAmount: (c.goalAmount ?? c.target ?? 0n) as bigint,
                        raisedAmount: (c.raisedAmount ?? c.raised ?? 0n) as bigint,
                        creator: c.creator as string,
                        token: c.token as string,
                        endTime: (c.endDate ?? c.endTime ?? 0n) as bigint,
                        isFlexible: Boolean(c.isFlexible),
                      };

                      // Always provide metadata with image to avoid undefined errors
                      const metadata = {
                        title:
                          (c.title && String(c.title).trim().length > 0)
                            ? c.title
                            : c.isFlexible
                              ? `Elastyczna kampania #${idStr}`
                              : `Zbiórka #${idStr}`,
                        description:
                          donationAmount > 0n
                            ? `Twoje wpłaty: ${(Number(donationAmount) / 1_000_000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} USDC`
                            : `Kampania utworzona przez ${String(c.creator).slice(0, 6)}...${String(c.creator).slice(-4)}`,
                        image: "/images/zbiorka.png",
                      };

                      const isRefundable = canRefundById.get(idStr) ?? false;

                      return (
                        <CampaignCard
                          key={idStr}
                          campaign={mappedCampaign}
                          metadata={metadata}
                          donationAmount={donationAmount}
                          isRefundable={isRefundable}
                          showDetails
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p>Nie masz jeszcze żadnych darowizn.</p>
                );
              })()
            ) : (
              <p>Nie masz jeszcze żadnych darowizn.</p>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Zatwierdzenia (approvals)</h2>
            {!address ? (
              <p>Zaloguj się, aby zobaczyć zatwierdzenia.</p>
            ) : !coreAddress ? (
              <p>Ładowanie konfiguracji kontraktu...</p>
            ) : allowancesContracts.length === 0 ? (
              <p>Brak tokenów do sprawdzenia.</p>
            ) : approvals.length === 0 ? (
              <p>Brak aktywnych zgód dla kontraktu rdzeniowego.</p>
            ) : (
              <div className="space-y-3">
                {approvals.map((a) => (
                  <div key={a.token} className="flex items-center justify-between bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {a.symbol} — {a.token.slice(0, 6)}...{a.token.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Zgoda dla: {String(coreAddress).slice(0, 6)}...{String(coreAddress).slice(-4)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Kwota: {a.allowanceHuman.toLocaleString('pl-PL', { maximumFractionDigits: 6 })} {a.symbol}
                      </p>
                    </div>
                    {/* Cofanie wyłączone – tylko wyświetlamy pozwolenia */}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Refundacje</h2>
            <p>Tu będą wyświetlane dostępne zwroty dla Twoich darowizn.</p>
          </div>
        )}

        {activeTab === 'fundraisers' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Twoje zbiórki</h2>
            {!address ? (
              <p>Połącz portfel, aby zobaczyć swoje zbiórki.</p>
            ) : campaignsLoading ? (
              <p>Ładowanie...</p>
            ) : campaignsError ? (
              <p className="text-red-500">Błąd podczas ładowania zbiórek</p>
            ) : myCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCampaigns.map((c: any) => {
                  const idStr = (c.id ?? 0n).toString();
                  const mappedCampaign = {
                    campaignId: idStr,
                    targetAmount: (c.goalAmount ?? c.target ?? 0n) as bigint,
                    raisedAmount: (c.raisedAmount ?? c.raised ?? 0n) as bigint,
                    creator: c.creator as string,
                    token: c.token as string,
                    endTime: (c.endDate ?? c.endTime ?? 0n) as bigint,
                    isFlexible: Boolean(c.isFlexible),
                  };
                  const metadata = {
                    title:
                      (c.title && String(c.title).trim().length > 0)
                        ? c.title
                        : c.isFlexible
                          ? `Elastyczna kampania #${idStr}`
                          : `Zbiórka #${idStr}`,
                    description:
                      c.description && String(c.description).trim().length > 0
                        ? String(c.description).slice(0, 140)
                        : `Kampania utworzona przez ${String(c.creator).slice(0, 6)}...${String(c.creator).slice(-4)}`,
                    image: "/images/zbiorka.png",
                  };
                  return (
                    <div
                      key={idStr}
                      className="cursor-pointer hover:scale-[1.01] transition-transform"
                      onClick={() => router.push(`/campaigns/${idStr}`)}
                      title="Przejdź do strony zbiórki"
                    >
                      <CampaignCard campaign={mappedCampaign} metadata={metadata} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Nie utworzyłeś jeszcze żadnej zbiórki.</p>
            )}
          </div>
        )}

        {activeTab === 'votes' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Głosowania</h2>
            {!address ? (
              <p>Zaloguj się, aby zobaczyć głosowania.</p>
            ) : proposalsLoading ? (
              <p>Ładowanie...</p>
            ) : proposalsError ? (
              <p className="text-red-500">Błąd podczas ładowania głosowań</p>
            ) : displayProposals && displayProposals.length > 0 ? (
              <div className="space-y-3">
                {displayProposals.map((p: any) => (
                  <div key={p.id.toString()} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{p.question}</p>
                      <p className="text-xs text-gray-500">
                        Tak: {p.yesVotes.toString()} | Nie: {p.noVotes.toString()}
                      </p>
                    </div>
                    <a
                      href={`/votes/${p.id.toString()}`}
                      className="text-xs text-[#10b981] hover:underline font-semibold"
                    >
                      Szczegóły
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p>Brak utworzonych głosowań.</p>
            )}
          </div>
        )}

        {/* removed Aktywność tab content */}
      </div>

      {/* NEW: Historia darowizn – modal */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historia Twoich darowizn</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <p>Ładowanie historii...</p>
          ) : donationHistory.length === 0 ? (
            <p className="text-gray-600">Brak zapisanych wpłat dla tego konta.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {donationHistory.map((d, idx) => {
                const fid = d.fundraiserId.toString();
                const camp = (campaigns as any[])?.find(x => x?.id?.toString?.() === fid);
                const title = camp?.title && String(camp.title).trim().length > 0
                  ? camp.title
                  : camp?.isFlexible
                    ? `Elastyczna kampania #${fid}`
                    : `Zbiórka #${fid}`;
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
          <Button onClick={() => setHistoryOpen(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  );
}