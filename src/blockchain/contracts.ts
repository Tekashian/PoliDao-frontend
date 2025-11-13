import { ethers } from 'ethers';
import routerAbi from './routerAbi';
import coreAbi from './coreAbi';
import storageAbi from './storageAbi';

// Updated contract addresses (Router/Core/Storage) per migration request
export const ROUTER_ADDRESS = '0x1B3eb6b653dc1f5caa084aE8a33FcA0aF609dE2b' as `0x${string}`;
export const ROUTER_ABI = routerAbi;

// New proxy Core address (minimal ABI now) – retained for compatibility where referenced
export const CORE_ADDRESS = '0xD573d2F7b33363c8A7bE90c93389Ee2fc30f32eb' as `0x${string}`;

// Direct Storage address (module resolution & media/updates mapping)
export const STORAGE_ADDRESS = '0xe7f4fF854dBfDFA1A454278E3F7127e4bb4d2B6B' as `0x${string}`;

// Legacy constant removed: ANALYTICS_ADDRESS is now resolved dynamically from Storage.modules('ANALYTICS')

export const polidaoContractConfig = {
  address: ROUTER_ADDRESS,
  abi: ROUTER_ABI,
} as const;

export const POLIDAO_ABI = ROUTER_ABI;

export const DEFAULT_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_DEFAULT_TOKEN_ADDRESS as `0x${string}`) ||
  ('0x0000000000000000000000000000000000000000' as const);

export function getRouterContract(providerOrSigner: ethers.Signer | ethers.AbstractProvider) {
  return new ethers.Contract(ROUTER_ADDRESS, routerAbi, providerOrSigner);
}

export function getCoreContract(providerOrSigner: ethers.Signer | ethers.AbstractProvider) {
  return new ethers.Contract(CORE_ADDRESS, coreAbi, providerOrSigner);
}

export async function getCoreAddress(): Promise<`0x${string}`> {
  return CORE_ADDRESS;
}

// Graceful router read helper: returns null on CALL_EXCEPTION / missing revert data
export async function safeRouterRead<T>(
  provider: ethers.AbstractProvider,
  fn: (router: ethers.Contract) => Promise<T>,
  context: string
): Promise<T | null> {
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);
  try {
    return await fn(router);
  } catch (e) {
    const err = e as Error & { code?: string; message?: string };
    if (err?.code === 'CALL_EXCEPTION' || /missing revert data/i.test(err?.message || '')) {
      console.warn(`Router read failed (${context}) – treating as null`);
      return null;
    }
    throw err;
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
  context = 'operation'
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if this is a rate limit error
  const err = error as (Error & { code?: string; status?: number });
      const msg: string = err?.message || '';
  const codeStr = String(err?.code ?? '');
  const isRateLimit = msg.includes('Too Many Requests') ||
         msg.includes('-32005') ||
         codeStr === '-32005' ||
         err?.status === 429;
      
      if (attempt === maxRetries) {
        console.error(`${context} failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }
      
      // Calculate delay with jitter
      const jitter = Math.random() * 0.5; // ±25% jitter
      const delay = baseDelay * Math.pow(2, attempt) * (1 + jitter);
      
      // For rate limits, wait longer
      const actualDelay = isRateLimit ? Math.max(delay, 2000 + Math.random() * 1000) : delay;
      
  console.warn(`${context} attempt ${attempt + 1} failed, retrying in ${actualDelay}ms:`, msg);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }
  
  throw lastError;
}

// Optimal batch processing for free RPC endpoints
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 6, // Optimal concurrency for free endpoints
  context = 'batch'
): Promise<R[]> {
  const results: R[] = [];
  const errors: unknown[] = [];
  
  // Process all items in parallel with concurrency limit
  const semaphore = Array(concurrency).fill(null);
  let itemIndex = 0;
  
  const workers = semaphore.map(async () => {
    while (itemIndex < items.length) {
      const currentIndex = itemIndex++;
      const item = items[currentIndex];
      
      try {
        const result = await retryWithBackoff(
          () => processor(item), 
          2, // Conservative retry count for free endpoints
          600, // Optimal delay for free RPC stability
          `${context}[${currentIndex}]`
        );
        results.push(result);
      } catch (error) {
        console.error(`Batch item ${currentIndex} failed:`, error);
        errors.push(error);
      }
    }
  });
  
  await Promise.all(workers);
  
  // If too many failures, throw an aggregate error
  if (errors.length > 0 && results.length === 0) {
    const first = errors[0] as (Error & { message?: string }) | undefined;
    const msg = first?.message || 'Unknown error';
    throw new Error(`All batch operations failed. Sample error: ${msg}`);
  }
  
  return results;
}
export type FundraiserDetails = {
  title: string;
  description: string;
  location: string;
  endDate: bigint;
  fundraiserType: number;
  status: number;
  token: string;
  goalAmount: bigint;
  raisedAmount: bigint;
  creator: string;
  extensionCount: bigint;
  isSuspended: boolean;
  suspensionReason: string;
};

export type FundraiserProgress = {
  raised: bigint;
  goal: bigint;
  percentage: bigint;
  donorsCount: bigint;
  timeLeft: bigint;
  refundDeadline: bigint;
  isSuspended: boolean;
  suspensionTime: bigint;
};

export type RouterFundraiserProgress = {
  raised: bigint;
  goal: bigint;
  percentage: bigint;
  donorsCount: bigint;
  timeLeft: bigint;
  refundDeadline: bigint;
  isSuspended: boolean;
  suspensionTime: bigint;
};

type RawRouterProgress = [
  bigint, // raised
  bigint, // goal
  bigint, // percentage
  bigint, // donorsCount
  bigint, // timeLeft
  bigint, // refundDeadline
  boolean, // isSuspended
  bigint // suspensionTime
];

export async function fetchFundraiserProgress(
  provider: ethers.AbstractProvider,
  id: number | bigint
): Promise<RouterFundraiserProgress> {
  const contract = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);
  const p = await contract.getFundraiserProgress(id) as RawRouterProgress;
  return {
    raised: p[0] ?? 0n,
    goal: p[1] ?? 0n,
    percentage: p[2] ?? 0n,
    donorsCount: p[3] ?? 0n,
    timeLeft: p[4] ?? 0n,
    refundDeadline: p[5] ?? 0n,
    isSuspended: p[6] ?? false,
    suspensionTime: p[7] ?? 0n,
  };
}

// Fetch total fundraiser count via Router (Core no longer exposes this in new minimal ABI)
export async function fetchFundraiserCount(provider: ethers.AbstractProvider) {
  return retryWithBackoff(async () => {
    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);
    const count: bigint = await router.getFundraiserCount();
    return count;
  }, 3, 1000, 'fetchFundraiserCount');
}

export async function fetchFundraiser(provider: ethers.AbstractProvider, id: bigint | number) {
  return retryWithBackoff(async () => {
    const fundraiserId = BigInt(id);
    if (fundraiserId < 1n) throw new Error('Invalid fundraiser id');

    const detailsRaw = await safeRouterRead(provider, r => r.getFundraiserDetails(fundraiserId), 'getFundraiserDetails');
    if (!detailsRaw) throw new Error(`Fundraiser ${fundraiserId} not found`);
    const progressRaw = await safeRouterRead(provider, r => r.getFundraiserProgress(fundraiserId), 'getFundraiserProgress');
    // If progress not available, fabricate zeroed progress to allow listing
    const mappedDetails = detailsRaw as FundraiserDetails;

    // If both detail raisedAmount and progress raised are zero, attempt Storage fallback.
    let storageRaised: bigint | null = null;
    let storageGoal: bigint | null = null;
    if ((mappedDetails.raisedAmount === 0n) && (!progressRaw || progressRaw[0] === 0n)) {
      const storage = new ethers.Contract(STORAGE_ADDRESS, storageAbi, provider);
      try {
        // Storage.fundraisers(fundraiserId) returns PackedFundraiserData tuple
        const packed: any = await storage.fundraisers(fundraiserId);
        // packed.goalAmount, packed.raisedAmount (uint128 each)
        if (packed) {
          storageGoal = packed.goalAmount ?? null;
          storageRaised = packed.raisedAmount ?? null;
        }
      } catch (e) {
        console.warn('Storage fallback failed for fundraiser', fundraiserId.toString(), e);
      }
    }
    const p = (progressRaw || [0n, mappedDetails.goalAmount, 0n, 0n, 0n, 0n, false, 0n]) as RawRouterProgress;
    const progress: FundraiserProgress = {
      raised: (p[0] && p[0] > 0n) ? p[0] : (storageRaised ?? mappedDetails.raisedAmount ?? 0n),
      goal: (p[1] && p[1] > 0n) ? p[1] : (storageGoal ?? mappedDetails.goalAmount ?? 0n),
      percentage: p[2] ?? 0n,
      donorsCount: p[3] ?? 0n,
      timeLeft: p[4] ?? 0n,
      refundDeadline: p[5] ?? 0n,
      isSuspended: p[6] ?? false,
      suspensionTime: p[7] ?? 0n,
    };
    return { id: fundraiserId, details: mappedDetails, progress };
  }, 1, 900, `fetchFundraiser[${id}]`);
}

// Safe wrapper – zwraca null, jeśli ID nie istnieje/revertuje
export async function fetchFundraiserSafe(provider: ethers.AbstractProvider, id: number) {
  try {
    return await fetchFundraiser(provider, id);
  } catch {
    return null;
  }
}

// Lista ID wg strony – build 1..count using Core.getFundraiserCount()
export async function listFundraiserIds(
  provider: ethers.AbstractProvider,
  page: number,
  pageSize: number
) {
  const totalBig = await fetchFundraiserCount(provider);
  const total = Number(totalBig);
  if (total <= 0) return { ids: [] as number[], total };

  // Assume IDs are 1..count (as per new Core)
  const start = 1 + page * pageSize;
  const end = Math.min(start + pageSize - 1, total);
  const ids = Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
  return { ids, total };
}

// Enhanced page fetching with aggressive parallel processing
export async function fetchFundraisersPage(provider: ethers.AbstractProvider, page: number, pageSize: number) {
  const { ids, total } = await listFundraiserIds(provider, page, pageSize);
  if (ids.length === 0) return { total, items: [] as Awaited<ReturnType<typeof fetchFundraiser>>[] };

  // Optimal parallel processing respecting free endpoint limits
  const items = await processBatch(
    ids,
    async (id) => {
      const result = await fetchFundraiserSafe(provider, id);
      if (!result) {
        throw new Error(`Fundraiser ${id} not found or failed to fetch`);
      }
      return result;
    },
    6, // Optimal concurrency for free endpoints
    `fetchFundraisersPage[${page}]`
  );
  
  return { total, items };
}

// Statystyki platformy - zastąp getPlatformStats -> getHealthStatus (from Router)
export async function fetchPlatformStats(provider: ethers.AbstractProvider) {
  const router = getRouterContract(provider);
  const [count, health] = await Promise.all([
    router.getFundraiserCount(),
    router.getHealthStatus(), // returns: [isHealthy, lastTransaction, successRate, totalTx, failedTx]
  ]);
  return {
    totalFundraisers: count as bigint,
    // Mapujemy totalTx jako zastępstwo "totalDonations" (brak bezpośredniej funkcji w nowym ABI)
    totalDonations: (Array.isArray(health) ? health[3] : health.totalTx) as bigint,
  };
}

// Status użytkownika – can remain on Router or migrate later
export async function fetchUserStatus(provider: ethers.AbstractProvider, user: string) {
  const router = getRouterContract(provider);
  const s = await router.getUserStatus(user);
  return {
    donationCount: s[0] as bigint,
    creationCount: s[1] as bigint,
    donationLimit: s[2] as bigint,
    creationLimit: s[3] as bigint,
    isWhitelisted: s[4] as boolean,
    isBanned: s[5] as boolean,
  };
}
