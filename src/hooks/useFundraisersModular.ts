// src/hooks/useFundraisersModular.ts
// Enumeracja fundraiserów w architekturze modularnej (Core + Storage).
import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { sepolia } from '@reown/appkit/networks';
import POLIDAO_ADDRESSES from '../blockchain/addresses';
import { poliDaoStorageAbi } from '../blockchain/storageAbi';
import { poliDaoCoreAbi } from '../blockchain/coreAbi';

export interface ModularFundraiser {
  id: bigint;
  title: string;
  description: string;
  location: string;
  endDate: bigint;
  fundraiserType: number;
  status: number;
  token: `0x${string}`;
  goalAmount: bigint;
  raisedAmount: bigint;
  creator: `0x${string}`;
  isFlexible: boolean; // pochodna fundraiserType / goalAmount
}

export function useFundraisersModular() {
  // 1. Pobierz licznik ze Storage
  const { data: counterData, isLoading: loadingCounter, error: errorCounter, refetch: refetchCounter } = useReadContract({
    address: POLIDAO_ADDRESSES.storage,
    abi: poliDaoStorageAbi,
    functionName: 'fundraiserCounter',
    chainId: sepolia.id,
  });

  const total = Number(counterData ?? 0);
  // Możliwość ustawienia bazy ID przez ENV; domyślnie zakładamy 1 (1..counter)
  const idBaseEnv = process.env.NEXT_PUBLIC_POLIDAO_ID_BASE;
  const forcedBase = idBaseEnv ? Number(idBaseEnv) : undefined; // jeśli ustawione, nie auto-detekujemy
  const ids1: bigint[] = total > 0 ? Array.from({ length: total }, (_, i) => BigInt(i + 1)) : [];
  const ids0: bigint[] = total > 0 ? Array.from({ length: total }, (_, i) => BigInt(i)) : [];
  // Wstępnie wybieramy bazę 1 (historyczna) chyba że wymuszona env
  const primaryIds = forcedBase === 0 ? ids0 : ids1;
  // 2. Przygotuj batch wywołań getFundraiserDetails z Core
  const callsPrimary = useMemo(() => primaryIds.map(id => ({
    address: POLIDAO_ADDRESSES.core,
    abi: poliDaoCoreAbi,
    functionName: 'getFundraiserDetails',
    args: [id],
    chainId: sepolia.id,
  })), [primaryIds]);

  // Alternatywne wywołania dla bazy 0 jeśli NIE wymuszono env i total > 0
  const callsAlt = useMemo(() => (!forcedBase && total > 0 ? ids0 : []).map(id => ({
    address: POLIDAO_ADDRESSES.core,
    abi: poliDaoCoreAbi,
    functionName: 'getFundraiserDetails',
    args: [id],
    chainId: sepolia.id,
  })), [forcedBase, total, ids0]);

  const { data: dataPrimary, isLoading: loadingPrimary, error: errorPrimary, refetch: refetchPrimary } = useReadContracts({
    contracts: callsPrimary,
    query: { enabled: callsPrimary.length > 0 }
  });

  const { data: dataAlt, isLoading: loadingAlt, error: errorAlt, refetch: refetchAlt } = useReadContracts({
    contracts: callsAlt,
    query: { enabled: callsAlt.length > 0 }
  });

  const parseBatch = (multiData: any[], idsSource: bigint[]): ModularFundraiser[] => {
    const out: ModularFundraiser[] = [];
    if (!multiData) return out;
    for (let i = 0; i < idsSource.length; i++) {
      const res = multiData[i];
      if (res?.error || !res.result) continue;
      const raw: any = res.result;
      try {
        // Obsługa dwóch przypadków: wynik jako obiekt z nazwami lub czysta krotka indeksowana
        const title = raw.title ?? raw[0] ?? '';
        const description = raw.description ?? raw[1] ?? '';
        const location = raw.location ?? raw[2] ?? '';
        const endDate = (raw.endDate ?? raw[3] ?? 0n) as bigint;
        const fundraiserType = Number(raw.fundraiserType ?? raw[4] ?? 0);
        const status = Number(raw.status ?? raw[5] ?? 0);
  const tokenAddress = (raw.token ?? raw[6] ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
        const goalAmount = (raw.goalAmount ?? raw[7] ?? 0n) as bigint;
        const raisedAmount = (raw.raisedAmount ?? raw[8] ?? 0n) as bigint;
        const creator = (raw.creator ?? raw[9] ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
        // extensionCount: raw[10]; isSuspended: raw[11]; suspensionReason: raw[12] (jeśli istnieją)

        const fr: ModularFundraiser = {
          id: idsSource[i],
          title,
          description,
          location,
          endDate,
          fundraiserType,
          status,
          token: tokenAddress,
          goalAmount,
          raisedAmount,
          creator,
          isFlexible: goalAmount === 0n || fundraiserType === 1,
        };
        out.push(fr);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[PoliDAO][Diag] Nie udało się sparsować fundraiser', idsSource[i].toString(), e, raw);
      }
    }
    return out;
  };

  let fundraisersPrimary = parseBatch(dataPrimary as any[], primaryIds);
  let fundraisersAlt = parseBatch(dataAlt as any[], ids0);

  // Auto-detekcja: jeśli nie wymuszono bazy i primary zwraca 0 poprawnych wpisów
  // a alternatywa (0-based) zwraca >0 z niezerowym creatorem -> użyj alternatywy
  const useAlt = !forcedBase
    && fundraisersPrimary.length > 0
    ? (fundraisersPrimary[0].creator === '0x0000000000000000000000000000000000000000'
        && fundraisersAlt.length > 0
        && fundraisersAlt[0].creator !== '0x0000000000000000000000000000000000000000')
    : (!forcedBase && fundraisersPrimary.length === 0 && fundraisersAlt.length > 0);

  const ids = useAlt ? ids0 : primaryIds;
  const fundraisers = useAlt ? fundraisersAlt : fundraisersPrimary;

  if (typeof window !== 'undefined') {
    if (!forcedBase && useAlt) {
      // eslint-disable-next-line no-console
      console.info('[PoliDAO][AutoDetect] Wykryto bazę ID = 0 (0..counter-1). Ustaw NEXT_PUBLIC_POLIDAO_ID_BASE=0 aby wymusić.');
    }
  }

  return {
    fundraisers,
    count: fundraisers.length,
    isLoading: loadingCounter || loadingPrimary || loadingAlt,
    error: errorCounter || errorPrimary || errorAlt,
    refetch: () => { 
      refetchCounter();
      if (callsPrimary.length) refetchPrimary();
      if (callsAlt.length) refetchAlt();
    }
  };
}

export default useFundraisersModular;
