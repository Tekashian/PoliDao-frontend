// src/hooks/useFundraisersModular.ts
// Enumeracja fundraiserów w architekturze modularnej (Core + Storage).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { fetchFundraiser, fetchFundraiserCount } from '@/blockchain/contracts';

// Typ wyświetlanej kampanii (spłaszczony z Routera pod UI)
export type ModularFundraiser = {
  id: bigint;

  // Z Router.getFundraiserDetails
  title: string;
  description: string;
  location: string;
  endDate: bigint;
  fundraiserType: number;
  status: number;
  token: `0x${string}`;
  goalAmount: bigint;
  raisedAmount: bigint;   // kopia z progress.raised (a jeśli brak, z details.raisedAmount)
  creator: `0x${string}`;
  extensionCount: bigint;
  isSuspended: boolean;
  suspensionReason: string;

  // Z Router.getFundraiserProgress
  donorsCount: bigint;
  percentage: bigint;
  timeLeft: bigint;
  refundDeadline: bigint;
  suspensionTime: bigint;

  // Pole wymagane przez UI (Router nie zwraca jawnie) – domyślnie false
  isFlexible: boolean;
};

// Domyślny provider (browser/JSON-RPC)
function useProvider() {
  return useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // BrowserProvider do odczytów też działa (ethers v6)
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    const url =
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
      'https://rpc.sepolia.org';
    return new ethers.JsonRpcProvider(url);
  }, []);
}

export function useFundraisersModular(page = 0, pageSize = 50) {
  const provider = useProvider();

  const [fundraisers, setFundraisers] = useState<ModularFundraiser[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const totalBig = await fetchFundraiserCount(provider as ethers.AbstractProvider);
      const total = Number(totalBig);
      setCount(total);

      if (total === 0) {
        setFundraisers([]);
        setIsLoading(false);
        return;
      }

      // Zakładamy ID 1..total
      const start = page * pageSize + 1;
      const end = Math.min(start + pageSize - 1, total);
      const ids = Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

      const rows = await Promise.all(ids.map((id) => fetchFundraiser(provider as ethers.AbstractProvider, id)));

      const mapped: ModularFundraiser[] = rows.map((row) => {
        const d = row.details as any;
        const p = row.progress as any;

        return {
          id: row.id,
          title: d.title,
          description: d.description,
          location: d.location,
          endDate: d.endDate,
          fundraiserType: Number(d.fundraiserType ?? 0),
          status: Number(d.status ?? 0),
          token: d.token as `0x${string}`,
          goalAmount: d.goalAmount,
          // preferuj bieżący raised z progress; fallback: details.raisedAmount
          raisedAmount: (p?.raised ?? d?.raisedAmount) as bigint,
          creator: d.creator as `0x${string}`,
          extensionCount: d.extensionCount,
          isSuspended: d.isSuspended,
          suspensionReason: d.suspensionReason,

          donorsCount: p?.donorsCount ?? 0n,
          percentage: p?.percentage ?? 0n,
          timeLeft: p?.timeLeft ?? 0n,
          refundDeadline: p?.refundDeadline ?? 0n,
          suspensionTime: p?.suspensionTime ?? 0n,

          // Router obecnie nie zwraca flagi elastyczności – ustawiamy false (lub wylicz z fundraiserType, jeśli umowa tak definiuje)
          isFlexible: false,
        };
      });

      setFundraisers(mapped);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e?.message ?? 'Failed to load fundraisers'));
    } finally {
      setIsLoading(false);
    }
  }, [provider, page, pageSize]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { fundraisers, count, isLoading, error, refetch };
}

export default useFundraisersModular;
