/*
LEGACY CORRUPTED ABI CONTENT (commented out to restore build). Kept temporarily for reference.
Original header:
// Minimal curated ABI for PoliDAO unified contract.
// Keep this lean; only add functions/events actually used by the frontend.
export const POLIDAO_ABI = [
  // Clean minimal ABI for PoliDAO unified contract (post-refactor)
  // Only essentials required by current frontend flows.
  export const POLIDAO_ABI = [
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "whitelistedTokens",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawalsPaused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
// END LEGACY CORRUPTED ABI CONTENT
*/

// CLEAN MINIMAL TRANSITIONAL ABI (PoliDAO unified contract)
// Only required functions/events + TEMP legacy summary getters (remove after hook refactor)
// Sections: Errors, Events, Core Reads, TEMP Summaries, Writes, Fees/Ownership
export const POLIDAO_ABI = [
  // ===== Errors =====
  { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
  { inputs: [], name: 'InvalidAmount', type: 'error' },
  { inputs: [], name: 'InvalidEndDate', type: 'error' },
  { inputs: [], name: 'InvalidInput', type: 'error' },
  { inputs: [], name: 'InvalidTitle', type: 'error' },
  // Dodatkowe prawdopodobne custom errors (dodane aby poprawnie dekodować revert przy tworzeniu)
  { inputs: [], name: 'GoalAmountRequired', type: 'error' },
  { inputs: [], name: 'GoalAmountTooLarge', type: 'error' },
  { inputs: [], name: 'TitleTooLong', type: 'error' },
  { inputs: [], name: 'DescriptionTooLong', type: 'error' },
  { inputs: [], name: 'TokenNotWhitelisted', type: 'error' },
  { inputs: [], name: 'FundraiserTypeOutOfRange', type: 'error' },
  // ===== Fundraising Events =====
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'goalAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'endDate', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'isFlexible', type: 'bool' }
    ], name: 'FundraiserCreated', type: 'event' },
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'donor', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ], name: 'DonationMade', type: 'event' },
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'donor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountReturned', type: 'uint256' }
    ], name: 'DonationRefunded', type: 'event' },
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountAfterCommission', type: 'uint256' }
    ], name: 'FundsWithdrawn', type: 'event' },
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newEndDate', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'extensionDays', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'feePaid', type: 'uint256' }
    ], name: 'FundraiserExtended', type: 'event' },
  // ===== Governance Events =====
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'question', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'endTime', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' }
    ], name: 'ProposalCreated', type: 'event' },
  { anonymous: false, inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'support', type: 'bool' }
    ], name: 'Voted', type: 'event' },
  // ===== Core Reads =====
  { inputs: [], name: 'fundraiserCounter', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserCreators', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserTokens', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'fundraisers', outputs: [ { components: [ { internalType: 'uint128', name: 'goalAmount', type: 'uint128' }, { internalType: 'uint128', name: 'raisedAmount', type: 'uint128' }, { internalType: 'uint64', name: 'endDate', type: 'uint64' }, { internalType: 'uint64', name: 'originalEndDate', type: 'uint64' }, { internalType: 'uint32', name: 'id', type: 'uint32' }, { internalType: 'uint32', name: 'suspensionTime', type: 'uint32' }, { internalType: 'uint16', name: 'extensionCount', type: 'uint16' }, { internalType: 'uint8', name: 'fundraiserType', type: 'uint8' }, { internalType: 'uint8', name: 'status', type: 'uint8' }, { internalType: 'bool', name: 'isSuspended', type: 'bool' }, { internalType: 'bool', name: 'fundsWithdrawn', type: 'bool' }, { internalType: 'bool', name: 'isFlexible', type: 'bool' } ], internalType: 'struct IPoliDaoStructs.PackedFundraiserData', name: '', type: 'tuple' } ], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getAllProposalIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], name: 'getProposal', outputs: [ { internalType: 'uint256', name: 'id', type: 'uint256' }, { internalType: 'string', name: 'question', type: 'string' }, { internalType: 'uint256', name: 'yesVotes', type: 'uint256' }, { internalType: 'uint256', name: 'noVotes', type: 'uint256' }, { internalType: 'uint256', name: 'endTime', type: 'uint256' }, { internalType: 'address', name: 'creator', type: 'address' }, { internalType: 'bool', name: 'exists', type: 'bool' }, { internalType: 'bool', name: 'executed', type: 'bool' }, { internalType: 'uint256', name: 'createdAt', type: 'uint256' } ], stateMutability: 'view', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'proposalId', type: 'uint256' }, { internalType: 'address', name: 'voter', type: 'address' } ], name: 'hasVoted', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  // Legacy summary helpers removed after hook refactor.
  // ===== Additional Read Helpers =====
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'isTokenWhitelisted', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  // ===== Writes =====
  // Updated createFundraiser signature with struct FundraiserCreationData
  { inputs: [ { components: [ { internalType: 'string', name: 'title', type: 'string' }, { internalType: 'string', name: 'description', type: 'string' }, { internalType: 'uint256', name: 'endDate', type: 'uint256' }, { internalType: 'uint8', name: 'fundraiserType', type: 'uint8' }, { internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'goalAmount', type: 'uint256' }, { internalType: 'string[]', name: 'initialImages', type: 'string[]' }, { internalType: 'string[]', name: 'initialVideos', type: 'string[]' }, { internalType: 'string', name: 'metadataHash', type: 'string' }, { internalType: 'string', name: 'location', type: 'string' }, { internalType: 'bool', name: 'isFlexible', type: 'bool' } ], internalType: 'struct IPoliDaoStructs.FundraiserCreationData', name: 'data', type: 'tuple' } ], name: 'createFundraiser', outputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }, { internalType: 'uint256', name: 'amount', type: 'uint256' } ], name: 'donate', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'refund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'withdrawFunds', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }, { internalType: 'uint256', name: 'additionalDays', type: 'uint256' } ], name: 'extendFundraiser', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }, { internalType: 'address', name: 'creator', type: 'address' }, { internalType: 'uint256', name: 'fundraiserEndTime', type: 'uint256' } ], name: 'initiateClosure', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'string', name: 'question', type: 'string' }, { internalType: 'uint256', name: 'duration', type: 'uint256' } ], name: 'createProposal', outputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'proposalId', type: 'uint256' }, { internalType: 'bool', name: 'support', type: 'bool' } ], name: 'vote', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [ { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }, { internalType: 'string', name: 'content', type: 'string' }, { internalType: 'address', name: 'author', type: 'address' } ], name: 'postUpdate', outputs: [{ internalType: 'uint256', name: 'updateId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'getFundraiserUpdateCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // ===== Fees / Ownership =====
  { inputs: [], name: 'getFeeInfo', outputs: [ { internalType: 'uint256', name: 'donationCommissionRate', type: 'uint256' }, { internalType: 'uint256', name: 'successCommissionRate', type: 'uint256' }, { internalType: 'uint256', name: 'refundCommissionRate', type: 'uint256' }, { internalType: 'uint256', name: 'extensionFeeAmount', type: 'uint256' }, { internalType: 'address', name: 'feeTokenAddress', type: 'address' }, { internalType: 'address', name: 'commissionWalletAddress', type: 'address' } ], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }
] as const;

export default POLIDAO_ABI;