// src/config/index.tsx
import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
// Upewnij się, że importujesz Chain, jeśli jest potrzebny do typowania `networks`
import { mainnet, sepolia} from "@reown/appkit/networks"; // lub z wagmi/chains

// 1. Tymczasowo zahardkoduj swój Project ID, aby wykluczyć problemy z .env
// export const projectId = "35507617726bb609e677aecfe94eaa82";
// Poniżej oryginalny sposób ładowania - przywrócisz go później
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) { // Możesz tymczasowo zakomentować to oryginalne sprawdzenie
  throw new Error("Project Id is not defined.");
}

// Twoja konfiguracja sieci - Sepolia
export const networks = [mainnet, sepolia] as const; // Użycie `as const` dla lepszego typowania

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  // Rzutowanie typu dla `networks` może być potrzebne w zależności od wersji bibliotek
  networks,
  projectId // Używamy projectId (teraz zahardkodowanego)
});

export const config = wagmiAdapter.wagmiConfig;
