// src/blockchain/addresses.ts
// Adresy modułów PoliDao (możliwe nadpisanie przez zmienne środowiskowe)
export const POLIDAO_ADDRESSES = {
  core: (process.env.NEXT_PUBLIC_POLIDAO_CORE_ADDRESS || '0xd800C9b42dD17ddC792c0d6E1DceFFa3bfe500f2') as `0x${string}`,
  storage: (process.env.NEXT_PUBLIC_POLIDAO_STORAGE_ADDRESS || '0x13dC13Bd0533910791622e0DD7f4DcFb25149B7e') as `0x${string}`,
};

if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_POLIDAO_CORE_ADDRESS) {
    console.warn('[PoliDAO] Używam domyślnego adresu CORE', POLIDAO_ADDRESSES.core);
  }
  if (!process.env.NEXT_PUBLIC_POLIDAO_STORAGE_ADDRESS) {
    console.warn('[PoliDAO] Używam domyślnego adresu STORAGE', POLIDAO_ADDRESSES.storage);
  }
}

// Preferuj wartość z ENV. Ustaw w .env: NEXT_PUBLIC_ROUTER_ADDRESS=0x...
const ENV_ROUTER = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}` | undefined;

// Zero address jako bezpieczny fallback (do czasu podania ENV)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// Eksport stałego adresu Routera używanego przez frontend
export const ROUTER_ADDRESS: `0x${string}` = ENV_ROUTER ?? ZERO_ADDR;

// (opcjonalnie) helper do walidacji adresu
export function assertRouterAddress() {
  if (!ENV_ROUTER || ENV_ROUTER === ZERO_ADDR) {
    // eslint-disable-next-line no-console
    console.warn('Router address is not set. Define NEXT_PUBLIC_ROUTER_ADDRESS in your .env');
  }
  return ROUTER_ADDRESS;
}

export default POLIDAO_ADDRESSES;
