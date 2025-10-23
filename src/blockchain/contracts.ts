// src/blockchain/contracts.ts

import { ethers } from 'ethers';
import routerAbi from './routerAbi';
import coreAbi from './coreAbi';

// Router-only source of truth
export const ROUTER_ADDRESS = '0xB8DDB0D2Bce9200C87e53Ed06F4Ed2a15dde3423' as `0x${string}`;
export const ROUTER_ABI = routerAbi;

// NEW: fixed Core address (from new deployment)
export const CORE_ADDRESS = '0x9362d1b929c8cC161830292b95Ad5E1187239a38' as `0x${string}`;

// NEW: fixed Analytics module address from new deployment
export const ANALYTICS_ADDRESS = '0x687e6294cf28D1b0D12AF25D8B23f298A5F1705B' as `0x${string}`;

// Backward-compatible config for wagmi hooks/components
export const polidaoContractConfig = {
  address: ROUTER_ADDRESS,
  abi: ROUTER_ABI,
} as const;

// Legacy alias so old imports keep working (recommended to migrate to ROUTER_ABI)
export const POLIDAO_ABI = ROUTER_ABI;

// Optional: default ERC20 token address for create/donate flows (set in .env)
export const DEFAULT_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_DEFAULT_TOKEN_ADDRESS as `0x${string}`) ||
  ('0x0000000000000000000000000000000000000000' as const);

// Fabryka kontraktu Router
export function getRouterContract(providerOrSigner: ethers.Signer | ethers.AbstractProvider) {
  return new ethers.Contract(ROUTER_ADDRESS, routerAbi, providerOrSigner);
}

// NEW: Fabryka kontraktu Core (legacy, may be stale if CORE_ADDRESS changes)
export function getCoreContract(providerOrSigner: ethers.Signer | ethers.AbstractProvider) {
  return new ethers.Contract(CORE_ADDRESS, coreAbi, providerOrSigner);
}

// NEW: resolve Core via Router dynamically (single source of truth)
export async function getCoreAddress(
  providerOrSigner: ethers.Signer | ethers.AbstractProvider
): Promise<`0x${string}`> {
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, providerOrSigner) as any;
  const addr = await router.coreContract();
  return addr as `0x${string}`;
}

// Typy pomocnicze
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

export async function fetchFundraiserProgress(
  provider: ethers.AbstractProvider,
  id: number | bigint
): Promise<RouterFundraiserProgress> {
  const contract = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider) as any;
  const p: any = await contract.getFundraiserProgress(id);
  return {
    raised: (p?.[0] ?? p?.raised ?? 0n) as bigint,
    goal: (p?.[1] ?? p?.goal ?? 0n) as bigint,
    percentage: (p?.[2] ?? p?.percentage ?? 0n) as bigint,
    donorsCount: (p?.[3] ?? p?.donorsCount ?? 0n) as bigint,
    timeLeft: (p?.[4] ?? p?.timeLeft ?? 0n) as bigint,
    refundDeadline: (p?.[5] ?? p?.refundDeadline ?? 0n) as bigint,
    isSuspended: Boolean(p?.[6] ?? p?.isSuspended ?? false),
    suspensionTime: (p?.[7] ?? p?.suspensionTime ?? 0n) as bigint,
  };
}

// Liczba kampanii – READ FROM CORE (resolved via Router)
export async function fetchFundraiserCount(provider: ethers.AbstractProvider) {
  const coreAddr = await getCoreAddress(provider);
  const core = new ethers.Contract(coreAddr, coreAbi, provider);
  const count: bigint = await core.getFundraiserCount();
  return count;
}

// Pojedyncza kampania (details + basicInfo) – READ FROM CORE (resolved via Router)
export async function fetchFundraiser(provider: ethers.AbstractProvider, id: bigint | number) {
  const coreAddr = await getCoreAddress(provider);
  const core = new ethers.Contract(coreAddr, coreAbi, provider);
  const [details, basic] = await Promise.all([
    core.getFundraiserDetails(id),
    core.getFundraiserBasicInfo(id),
  ]);
  // Map details as before
  const mappedDetails = details as FundraiserDetails;
  const progress: FundraiserProgress = {
    raised: (basic?.[2] ?? basic?.raised ?? mappedDetails.raisedAmount ?? 0n) as bigint,
    goal: (basic?.[3] ?? basic?.goal ?? mappedDetails.goalAmount ?? 0n) as bigint,
    percentage: 0n,
    donorsCount: 0n,
    timeLeft: 0n,
    refundDeadline: 0n,
    isSuspended: Boolean((details as any)?.isSuspended ?? false),
    suspensionTime: 0n,
  };
  return { id: BigInt(id), details: mappedDetails, progress };
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

// Strona kampanii (odporna na luki)
export async function fetchFundraisersPage(provider: ethers.AbstractProvider, page: number, pageSize: number) {
  const { ids, total } = await listFundraiserIds(provider, page, pageSize);
  if (ids.length === 0) return { total, items: [] as Awaited<ReturnType<typeof fetchFundraiser>>[] };

  const rows = await Promise.all(ids.map((id) => fetchFundraiserSafe(provider, id)));
  const items = rows.filter((x): x is NonNullable<typeof x> => x !== null);
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