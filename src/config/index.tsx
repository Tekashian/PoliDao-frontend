// src/config/index.tsx
import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
// Upewnij się, że importujesz Chain, jeśli jest potrzebny do typowania `networks`
import { mainnet, sepolia} from "@reown/appkit/networks";
import { http, fallback } from "viem";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

// Enhanced RPC configuration with fallback and retry logic
const INFURA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

// Create enhanced transport configuration with proper fallback
const createEnhancedTransport = () => {
  const transports = [];
  
  // Add both endpoints if available
  if (ALCHEMY_RPC) {
    transports.push(
      http(ALCHEMY_RPC, {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10_000,
        batch: true,
      })
    );
  }
  
  if (INFURA_RPC) {
    transports.push(
      http(INFURA_RPC, {
        retryCount: 3,
        retryDelay: 1500,
        timeout: 10_000,
        batch: true,
      })
    );
  }
  
  // Default fallback if no environment variables
  if (transports.length === 0) {
    return http(`https://sepolia.infura.io/v3/a5b92b367ca74b259a2f48df6e8dcfa1`, {
      retryCount: 2,
      retryDelay: 2000,
      timeout: 8_000,
    });
  }
  
  // Use fallback transport to automatically switch between endpoints
  return transports.length === 1 ? transports[0] : fallback(transports);
};

// Twoja konfiguracja sieci - Sepolia 
export const networks = [mainnet, sepolia]; // Remove as const to fix typing issue

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  // Enhanced configuration with custom transports
  networks: networks as any, // Type assertion to work around AppKit typing
  transports: {
    [sepolia.id]: createEnhancedTransport(),
    [mainnet.id]: http(), // Default for mainnet
  },
  projectId // Używamy projectId (teraz zahardkodowanego)
});

export const config = wagmiAdapter.wagmiConfig;
