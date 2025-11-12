// src/lib/provider.ts
// Centralized helper to obtain a resilient Sepolia provider with fallbacks
import { ethers } from 'ethers'

const PUBLIC_FALLBACKS = [
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia.publicnode.com',
  'https://rpc2.sepolia.org',
  'https://sepolia.gateway.tenderly.co',
]

let cachedUrl: string | null = null

export function getRpcUrls(): string[] {
  const urls: string[] = []
  const primary = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  const alchemyUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || (
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : undefined
  )
  if (alchemyUrl) urls.push(alchemyUrl)
  if (primary) urls.push(primary)
  // de-dup and add public fallbacks at the end
  for (const u of PUBLIC_FALLBACKS) {
    if (!urls.includes(u)) urls.push(u)
  }
  return urls
}

export async function getSmartProvider(): Promise<ethers.JsonRpcProvider> {
  const urls = getRpcUrls()

  // Try cached first
  if (cachedUrl) {
    try {
      const p = new ethers.JsonRpcProvider(cachedUrl)
      // quick health probe
      await Promise.race([
        p.getBlockNumber(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500)),
      ])
      return pinNetwork(p)
    } catch {}
  }

  // Probe candidates
  for (const url of urls) {
    try {
      const p = new ethers.JsonRpcProvider(url)
      await Promise.race([
        p.getBlockNumber(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500)),
      ])
      cachedUrl = url
      return pinNetwork(p)
    } catch {}
  }

  // Fallback to the first url even if probe failed (last resort)
  const fallbackUrl = urls[0] || 'https://rpc.sepolia.org'
  return pinNetwork(new ethers.JsonRpcProvider(fallbackUrl))
}

function pinNetwork<T extends ethers.JsonRpcProvider>(provider: T): T {
  try {
    Object.defineProperty(provider, '_network', {
      value: { chainId: 11155111n, name: 'sepolia' },
      writable: false,
      configurable: false,
    })
  } catch {}
  return provider
}
