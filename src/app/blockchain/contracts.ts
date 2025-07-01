// src/blockchain/contracts.ts

import { POLIDAO_ABI } from './poliDaoAbi'
import { USDC_ABI } from './usdcContractAbi'

// Adres kontraktu PoliDao (zastępuje wcześniejszy Crowdfund)
export const POLIDAO_CONTRACT_ADDRESS =
  '0x3cfB9cbcc49F19E15F7fbf5E1dfC23A5E2f671bC' as const

// Adres kontraktu USDC na Sepolii
export const USDC_CONTRACT_ADDRESS =
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const

export const polidaoContractConfig = {
  address: POLIDAO_CONTRACT_ADDRESS,
  abi: POLIDAO_ABI,
} as const

export const usdcContractConfig = {
  address: USDC_CONTRACT_ADDRESS,
  abi: USDC_ABI,
} as const
