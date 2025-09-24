// src/blockchain/coreAbi.ts
// Minimalne ABI PoliDaoCore potrzebne do listowania fundraiserów (modular architecture)
export const poliDaoCoreAbi = [
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getFundraiserDetails',
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'endDate', type: 'uint256' },
      { name: 'fundraiserType', type: 'uint8' },
      { name: 'status', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'goalAmount', type: 'uint256' },
      { name: 'raisedAmount', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'extensionCount', type: 'uint256' },
      { name: 'isSuspended', type: 'bool' },
      { name: 'suspensionReason', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export default poliDaoCoreAbi;
