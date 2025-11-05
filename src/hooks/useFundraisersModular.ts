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

// Simple cache to avoid redundant requests
const fundraiserCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(provider: any, id: number | bigint): string {
  return `fundraiser_${id}_${provider?.connection?.url || 'default'}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// Enhanced fetch with caching
async function fetchFundraiserCached(provider: ethers.AbstractProvider, id: number | bigint) {
  const cacheKey = getCacheKey(provider, id);
  const cached = fundraiserCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  
  try {
    const data = await fetchFundraiser(provider, id);
    fundraiserCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    // If we have stale cache data, use it as fallback
    if (cached) {
      console.warn(`Using stale cache for fundraiser ${id} due to error:`, error);
      return cached.data;
    }
    throw error;
  }
}
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

      // Enhanced: use batch processing for better rate limit handling
      const MAX_FETCH_ALL = Number(process.env.NEXT_PUBLIC_MAX_FETCH_ALL ?? 1000);
      let start = page * pageSize + 1;
      let end = Math.min(start + pageSize - 1, total);

      // If we're on the first page and total is modest, fetch the full range (1..total)
      if (page === 0 && total > pageSize && total <= MAX_FETCH_ALL) {
        start = 1;
        end = total;
      }

      const ids = Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

      // Enhanced: Use batch processing with reduced concurrency to handle rate limits
      const batchSize = 3; // Process 3 items at a time
      const rows: Awaited<ReturnType<typeof fetchFundraiser>>[] = [];
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        
        try {
          const batchResults = await Promise.allSettled(
            batch.map(id => 
              fetchFundraiserCached(provider as ethers.AbstractProvider, id)
                .catch(error => {
                  console.warn(`Failed to fetch fundraiser ${id}:`, error?.message);
                  throw error;
                })
            )
          );

          for (const result of batchResults) {
            if (result.status === 'fulfilled') {
              rows.push(result.value);
            } else {
              console.error(`Batch item failed:`, result.reason?.message);
            }
          }

          // Small delay between batches to avoid overwhelming RPC endpoints
          if (i + batchSize < ids.length) {
            await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
          }
          
        } catch (batchError) {
          console.error(`Batch processing failed for IDs ${batch}:`, batchError);
          // Continue with next batch rather than failing completely
        }
      }

      // If we couldn't fetch any fundraisers but total > 0, it's likely a temporary issue
      if (rows.length === 0 && total > 0) {
        throw new Error(`Unable to fetch any fundraisers (total: ${total}). This may be due to rate limiting.`);
      }

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
      console.error('useFundraisersModular load error:', e);
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
