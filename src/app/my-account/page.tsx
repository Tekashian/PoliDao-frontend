// src/app/account/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { ROUTER_ADDRESS } from '../../blockchain/contracts';
import { poliDaoRouterAbi } from '../../blockchain/routerAbi';
import { poliDaoCoreAbi } from '../../blockchain/coreAbi';
import { poliDaoAnalyticsAbi } from '../../blockchain/analyticsAbi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useGetAllProposals } from '../../hooks/usePoliDao';
import { useFundraisersModular } from '../../hooks/useFundraisersModular';
import CampaignCard from '../../components/CampaignCard';
// Fallback B: event scan
import { Interface, JsonRpcProvider } from 'ethers';

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
    'dashboard' | 'donations' | 'approvals' | 'refunds' | 'fundraisers' | 'proposals' | 'activity'
  >('dashboard');

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

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!address || !coreAddress) return;

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
      if (!rpcUrl) return;

      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const iface = new Interface(poliDaoCoreAbi as any);

        const ev = (iface as any).getEvent?.('DonationMade')
          ?? (iface.fragments.find((f: any) => f.type === 'event' && f.name === 'DonationMade'));
        if (!ev) return;
        const topic = (iface as any).getEventTopic
          ? (iface as any).getEventTopic(ev)
          : (iface as any).getEventTopic?.('DonationMade');

        const startBlockEnv = process.env.NEXT_PUBLIC_CORE_START_BLOCK;
        const fromBlock = startBlockEnv ? BigInt(startBlockEnv) : 0n;

        // fetch all DonationMade logs, filter by donor locally (robust across ABI variants)
        const logs = await provider.getLogs({
          address: coreAddress as string,
          fromBlock,
          toBlock: 'latest',
          topics: [topic],
        });

        let count = 0;
        let sumBase = 0n;
        for (const log of logs) {
          try {
            const decoded = iface.parseLog(log as any);
            const args = decoded.args as any;
            const donor = (args?.donor ?? args?.[1] ?? '').toLowerCase?.();
            const amountRaw = (args?.amount ?? args?.[3] ?? 0n) as bigint;
            if (donor && donor === address.toLowerCase()) {
              count += 1;
              sumBase += (amountRaw ?? 0n);
            }
          } catch {
            // ignore decode error
          }
        }
        if (!disposed) setEventTotals({ count, sumBase });
      } catch {
        if (!disposed) setEventTotals(null);
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
              Fundraisingi
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'proposals'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Propozycje
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'activity'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#10b981]/10 hover:text-[#10b981]'
              } transform hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]`}
            >
              Aktywność
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Całkowita liczba darowizn</h3>
                <p className="text-2xl font-bold">{totalDonationsCount}</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((c: any) => {
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
                      // Optional props if supported by CampaignCard
                      donationAmount={donationAmount}
                      isRefundable={isRefundable}
                      showDetails
                    />
                  );
                })}
              </div>
            ) : (
              <p>Nie masz jeszcze żadnych darowizn.</p>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Zatwierdzenia</h2>
            <p>Tu będą wyświetlane propozycje zatwierdzenia przez Ciebie.</p>
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
            <h2 className="text-xl font-semibold mb-4">Moje fundraisingi</h2>
            <p>Tu będą wyświetlane Twoje aktywne fundraisingi.</p>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Moje propozycje</h2>
            {proposalsLoading ? (
              <p>Ładowanie...</p>
            ) : proposalsError ? (
              <p className="text-red-500">Błąd podczas ładowania propozycji</p>
            ) : proposals && proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal: Proposal) => (
                  <div key={proposal.id.toString()} className="p-4 bg-gray-100 rounded-lg">
                    <h3 className="text-lg font-semibold">{proposal.question}</h3>
                    <p className="text-sm text-gray-500">
                      Tak: {proposal.yesVotes.toString()} | Nie: {proposal.noVotes.toString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nie masz jeszcze żadnych propozycji.</p>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Aktywność</h2>
            <p>Tu będzie wyświetlana Twoja aktywność na platformie.</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}