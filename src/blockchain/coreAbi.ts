// src/blockchain/coreAbi.ts
// Minimalne ABI PoliDaoCore potrzebne do listowania fundraiserów (modular architecture)
export const poliDaoCoreAbi = [
  // Event (minimal) used to capture created fundraiser ID
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'fundraiserId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'token', type: 'address' }
    ],
    name: 'FundraiserCreated',
    type: 'event'
  },
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
  },
  // Minimal write function for creating fundraiser without multimedia logic (images/videos arrays allowed empty)
  {
    inputs: [
      {
        components: [
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'endDate', type: 'uint256' },
          { name: 'fundraiserType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'goalAmount', type: 'uint256' },
          { name: 'initialImages', type: 'string[]' },
          { name: 'initialVideos', type: 'string[]' },
          { name: 'metadataHash', type: 'string' },
          { name: 'location', type: 'string' },
          { name: 'isFlexible', type: 'bool' }
        ],
        name: 'data',
        type: 'tuple'
      }
    ],
    name: 'createFundraiser',
    outputs: [{ name: 'fundraiserId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export default poliDaoCoreAbi;
