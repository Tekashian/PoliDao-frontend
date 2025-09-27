// src/blockchain/contracts.ts

import { ethers } from 'ethers';
import { poliDaoRouterAbi } from './routerAbi';
import { ROUTER_ADDRESS, assertRouterAddress, POLIDAO_ADDRESSES } from './addresses';
import { POLIDAO_ABI } from './poliDaoAbi';

// Upewnij się, że mamy ustawiony adres Routera (zaloguje ostrzeżenie, jeśli brak ENV)
assertRouterAddress();

// Fabryka kontraktu Router
export function getRouterContract(providerOrSigner: ethers.Signer | ethers.AbstractProvider) {
  return new ethers.Contract(ROUTER_ADDRESS, poliDaoRouterAbi, providerOrSigner);
}

// Konfiguracja kontraktu rdzenia (propozycje) dla wagmi
export const polidaoContractConfig = {
  address: POLIDAO_ADDRESSES.core,
  abi: POLIDAO_ABI,
} as const;

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

// Liczba kampanii
export async function fetchFundraiserCount(provider: ethers.AbstractProvider) {
  const router = getRouterContract(provider);
  const count: bigint = await router.getFundraiserCount();
  return count;
}

// Pojedyncza kampania (details + progress)
export async function fetchFundraiser(provider: ethers.AbstractProvider, id: bigint | number) {
  const router = getRouterContract(provider);
  const [details, progress] = await Promise.all([
    router.getFundraiserDetails(id),
    router.getFundraiserProgress(id),
  ]);
  return {
    id: BigInt(id),
    details: details as FundraiserDetails,
    progress: progress as FundraiserProgress,
  };
}

// Safe wrapper – zwraca null, jeśli ID nie istnieje/revertuje
export async function fetchFundraiserSafe(provider: ethers.AbstractProvider, id: number) {
  try {
    return await fetchFundraiser(provider, id);
  } catch {
    return null;
  }
}

// Wykryj bazę ID (0/1)
async function detectIdBase(provider: ethers.AbstractProvider) {
  const router = getRouterContract(provider);
  try {
    await router.getFundraiserDetails(0);
    return 0;
  } catch {
    return 1;
  }
}

// Lista ID wg strony
export async function listFundraiserIds(provider: ethers.AbstractProvider, page: number, pageSize: number) {
  const totalBig = await fetchFundraiserCount(provider);
  const total = Number(totalBig);
  if (total <= 0) return { ids: [] as number[], total };

  const base = await detectIdBase(provider);
  const start = base + page * pageSize;
  const end = Math.min(start + pageSize - 1, base + total - 1);
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

// Statystyki platformy
export async function fetchPlatformStats(provider: ethers.AbstractProvider) {
  const router = getRouterContract(provider);
  const stats = await router.getPlatformStats();
  return { totalFundraisers: stats[0] as bigint, totalDonations: stats[1] as bigint };
}

// Status użytkownika
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