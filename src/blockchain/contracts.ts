// src/blockchain/contracts.ts

import { POLIDAO_ABI } from './poliDaoAbi'

// Nowy adres zunifikowanego (unified storage) kontraktu PoliDao (proxy/core)
// Można nadpisać przez zmienną środowiskową NEXT_PUBLIC_POLIDAO_ADDRESS aby łatwiej
// przełączać środowiska bez zmian w kodzie.
// UWAGA: w .env używasz nazwy NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS
// Kod wcześniej oczekiwał NEXT_PUBLIC_POLIDAO_ADDRESS więc zawsze brał fallback
// co skutkowało wywołaniem starego kontraktu bez funkcji createFundraiser(struct)
// => błąd "Function not found" na explorerze.
// Obsługujemy teraz obie nazwy + ostrzeżenie jeśli używany jest fallback.
const _envAddress = (process.env.NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_POLIDAO_ADDRESS || '').trim()

export const POLIDAO_CONTRACT_ADDRESS = (_envAddress !== ''
  ? _envAddress
  : '0xe0Bdda351177EAe152E00Ba20E16BF017aCe4574'
) as `0x${string}`

if (typeof window !== 'undefined') {
  if (!_envAddress) {
    console.warn('[PoliDAO] Używany adres domyślny', POLIDAO_CONTRACT_ADDRESS, '– ustaw NEXT_PUBLIC_POLIDAO_CONTRACT_ADDRESS w .env aby wskazać nowy wdrożony kontrakt.')
  }
}

// Adres kontraktu USDC na Sepolii (jeśli potrzebny)
export const USDC_CONTRACT_ADDRESS =
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const

export const polidaoContractConfig = {
  address: POLIDAO_CONTRACT_ADDRESS,
  abi: POLIDAO_ABI,
} as const

// Podstawowe ABI dla ERC20 (USDC) - jeśli potrzebne
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export const usdcContractConfig = {
  address: USDC_CONTRACT_ADDRESS,
  abi: ERC20_ABI,
} as const