// src/blockchain/storageAbi.ts
// Minimalne ABI PoliDaoStorage – licznik fundraiserów.
export const poliDaoStorageAbi = [
  {
    inputs: [],
    name: 'fundraiserCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export default poliDaoStorageAbi;
