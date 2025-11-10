import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { http, fallback } from "viem";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

const INFURA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

const createEnhancedTransport = () => {
  const transports = [];
  
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
  
  if (transports.length === 0) {
    return http(`https://sepolia.infura.io/v3/a5b92b367ca74b259a2f48df6e8dcfa1`, {
      retryCount: 2,
      retryDelay: 2000,
      timeout: 8_000,
    });
  }
  
  return transports.length === 1 ? transports[0] : fallback(transports);
};

export const networks = [sepolia];

if (typeof window !== 'undefined') {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('phantom') ||
      key.includes('solana') ||
      key.includes('wallet') ||
      key.includes('connector') ||
      key.includes('chain')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('Failed to remove', key);
    }
  });
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  networks: networks,
  transports: {
    [sepolia.id]: createEnhancedTransport(),
  },
  projectId
});

export const config = wagmiAdapter.wagmiConfig;
