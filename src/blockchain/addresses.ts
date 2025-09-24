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

export default POLIDAO_ADDRESSES;
