import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { http, fallback, type Transport } from "viem";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

const INFURA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
// Prefer explicit Alchemy RPC url, else build from API key
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || (
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : undefined
);

const createEnhancedTransport = () => {
  const transports: Transport[] = [];
  
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
  
  // Always append public fallbacks as very last resort (lower priority)
  const publicFallbacks = [
    'https://rpc.sepolia.org',
    'https://ethereum-sepolia.publicnode.com',
    'https://rpc2.sepolia.org',
    'https://sepolia.gateway.tenderly.co',
  ];
  for (const url of publicFallbacks) {
    transports.push(
      http(url, {
        retryCount: 2,
        retryDelay: 1500,
        timeout: 8_000,
        batch: true,
      })
    );
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
