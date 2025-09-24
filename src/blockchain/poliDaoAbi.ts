/*
LEGACY CORRUPTED ABI CONTENT (commented out to restore build). Kept temporarily for reference.
Original header:
// Minimal curated ABI for PoliDAO unified contract.
// Keep this lean; only add functions/events actually used by the frontend.
export const POLIDAO_ABI = [
  // Custom errors (surface friendly messages client-side)
  { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
  { inputs: [], name: 'InvalidAmount', type: 'error' },
  { inputs: [], name: 'InvalidEndDate', type: 'error' },
  { inputs: [], name: 'InvalidInput', type: 'error' },
  { inputs: [], name: 'InvalidTitle', type: 'error' },

  // Fundraising events
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

  // Governance events
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

  // Core read functions
  { inputs: [], name: 'fundraiserCounter', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserCreators', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserTokens', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'fundraisers', outputs: [
      { components: [
          { internalType: 'uint128', name: 'goalAmount', type: 'uint128' },
          { internalType: 'uint128', name: 'raisedAmount', type: 'uint128' },
          { internalType: 'uint64', name: 'endDate', type: 'uint64' },
          { internalType: 'uint64', name: 'originalEndDate', type: 'uint64' },
          { internalType: 'uint32', name: 'id', type: 'uint32' },
          // CLEAN REPLACEMENT: Entire previous file was corrupted with stray JSON after the export.
          // This is a minimal + transitional ABI. Legacy summary getters are included TEMPORARILY
          // so current hooks compile; they should be removed after refactoring hooks to new pattern.

          export const POLIDAO_ABI = [
            // ===== Errors =====
            { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
            { inputs: [], name: 'InvalidAmount', type: 'error' },
            { inputs: [], name: 'InvalidEndDate', type: 'error' },
            { inputs: [], name: 'InvalidInput', type: 'error' },
            { inputs: [], name: 'InvalidTitle', type: 'error' },

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
            { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'fundraisers', outputs: [
                { components: [
                    { internalType: 'uint128', name: 'goalAmount', type: 'uint128' },
                    { internalType: 'uint128', name: 'raisedAmount', type: 'uint128' },
                    { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                    { internalType: 'uint64', name: 'originalEndDate', type: 'uint64' },
                    { internalType: 'uint32', name: 'id', type: 'uint32' },
                    { internalType: 'uint32', name: 'suspensionTime', type: 'uint32' },
                    { internalType: 'uint16', name: 'extensionCount', type: 'uint16' },
                    { internalType: 'uint8', name: 'fundraiserType', type: 'uint8' },
                    // CLEAN TRANSITIONAL ABI (minimal + needed legacy summaries)
                    export const POLIDAO_ABI = [
                      // Errors
                      { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
                      { inputs: [], name: 'InvalidAmount', type: 'error' },
                      { inputs: [], name: 'InvalidEndDate', type: 'error' },
                      { inputs: [], name: 'InvalidInput', type: 'error' },
                      { inputs: [], name: 'InvalidTitle', type: 'error' },

                      // Events
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

                      // Core reads
                      { inputs: [], name: 'fundraiserCounter', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserCreators', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserTokens', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'fundraisers', outputs: [
                          { components: [
                              { internalType: 'uint128', name: 'goalAmount', type: 'uint128' },
                              { internalType: 'uint128', name: 'raisedAmount', type: 'uint128' },
                              { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                              { internalType: 'uint64', name: 'originalEndDate', type: 'uint64' },
                              { internalType: 'uint32', name: 'id', type: 'uint32' },
                              { internalType: 'uint32', name: 'suspensionTime', type: 'uint32' },
                              { internalType: 'uint16', name: 'extensionCount', type: 'uint16' },
                              { internalType: 'uint8', name: 'fundraiserType', type: 'uint8' },
                              { internalType: 'uint8', name: 'status', type: 'uint8' },
                              { internalType: 'bool', name: 'isSuspended', type: 'bool' },
                              { internalType: 'bool', name: 'fundsWithdrawn', type: 'bool' },
                              { internalType: 'bool', name: 'isFlexible', type: 'bool' }
                            ], internalType: 'struct IPoliDaoStructs.PackedFundraiserData', name: '', type: 'tuple' }
                        ], stateMutability: 'view', type: 'function' },
                      { inputs: [], name: 'getAllProposalIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], name: 'getProposal', outputs: [
                          { internalType: 'uint256', name: 'id', type: 'uint256' },
                          { internalType: 'string', name: 'question', type: 'string' },
                          { internalType: 'uint256', name: 'yesVotes', type: 'uint256' },
                          { internalType: 'uint256', name: 'noVotes', type: 'uint256' },
                          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                          { internalType: 'address', name: 'creator', type: 'address' },
                          { internalType: 'bool', name: 'exists', type: 'bool' },
                          { internalType: 'bool', name: 'executed', type: 'bool' },
                          { internalType: 'uint256', name: 'createdAt', type: 'uint256' }
                        ], stateMutability: 'view', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                          { internalType: 'address', name: 'voter', type: 'address' }
                        ], name: 'hasVoted', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },

                      // Legacy summary getters (TEMP – for existing hooks)
                      { inputs: [], name: 'getAllFundraiserIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getFundraiserSummary', outputs: [
                          { internalType: 'uint256', name: 'id', type: 'uint256' },
                          { internalType: 'address', name: 'creator', type: 'address' },
                          { internalType: 'address', name: 'token', type: 'address' },
                          { internalType: 'uint256', name: 'target', type: 'uint256' },
                          { internalType: 'uint256', name: 'raised', type: 'uint256' },
                          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                          { internalType: 'bool', name: 'isFlexible', type: 'bool' },
                          { internalType: 'bool', name: 'closureInitiated', type: 'bool' }
                        ], stateMutability: 'view', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getProposalSummary', outputs: [
                          { internalType: 'uint256', name: 'id', type: 'uint256' },
                          { internalType: 'string', name: 'question', type: 'string' },
                          { internalType: 'uint256', name: 'yesVotes', type: 'uint256' },
                          { internalType: 'uint256', name: 'noVotes', type: 'uint256' },
                          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                          { internalType: 'address', name: 'creator', type: 'address' }
                        ], stateMutability: 'view', type: 'function' },

                      // Writes
                      { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'createFundraiser', outputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                          { internalType: 'uint256', name: 'amount', type: 'uint256' }
                        ], name: 'donate', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'refund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'withdrawFunds', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                          { internalType: 'uint256', name: 'additionalDays', type: 'uint256' }
                        ], name: 'extendFundraiser', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                          { internalType: 'address', name: 'creator', type: 'address' },
                          { internalType: 'uint256', name: 'fundraiserEndTime', type: 'uint256' }
                        ], name: 'initiateClosure', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'string', name: 'question', type: 'string' },
                          { internalType: 'uint256', name: 'duration', type: 'uint256' }
                        ], name: 'createProposal', outputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                          { internalType: 'bool', name: 'support', type: 'bool' }
                        ], name: 'vote', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [
                          { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                          { internalType: 'string', name: 'content', type: 'string' },
                          { internalType: 'address', name: 'author', type: 'address' }
                        ], name: 'postUpdate', outputs: [{ internalType: 'uint256', name: 'updateId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                      { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'getFundraiserUpdateCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },

                      // Fees / ownership
                      { inputs: [], name: 'getFeeInfo', outputs: [
                          // PoliDAO Unified Contract - Minimal Transitional ABI (CLEAN)
                          // Only required interfaces + TEMP legacy summary getters (remove after hook refactor)
                          export const POLIDAO_ABI = [
                            // Errors
                            { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
                            { inputs: [], name: 'InvalidAmount', type: 'error' },
                            { inputs: [], name: 'InvalidEndDate', type: 'error' },
                            { inputs: [], name: 'InvalidInput', type: 'error' },
                            { inputs: [], name: 'InvalidTitle', type: 'error' },

                            // Events
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

                            // Core reads
                            { inputs: [], name: 'fundraiserCounter', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserCreators', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'fundraiserTokens', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'fundraisers', outputs: [
                                { components: [
                                    { internalType: 'uint128', name: 'goalAmount', type: 'uint128' },
                                    { internalType: 'uint128', name: 'raisedAmount', type: 'uint128' },
                                    { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                                    { internalType: 'uint64', name: 'originalEndDate', type: 'uint64' },
                                    { internalType: 'uint32', name: 'id', type: 'uint32' },
                                    { internalType: 'uint32', name: 'suspensionTime', type: 'uint32' },
                                    { internalType: 'uint16', name: 'extensionCount', type: 'uint16' },
                                    { internalType: 'uint8', name: 'fundraiserType', type: 'uint8' },
                                    { internalType: 'uint8', name: 'status', type: 'uint8' },
                                    { internalType: 'bool', name: 'isSuspended', type: 'bool' },
                                    { internalType: 'bool', name: 'fundsWithdrawn', type: 'bool' },
                                    { internalType: 'bool', name: 'isFlexible', type: 'bool' }
                                  ], internalType: 'struct IPoliDaoStructs.PackedFundraiserData', name: '', type: 'tuple' }
                              ], stateMutability: 'view', type: 'function' },
                            { inputs: [], name: 'getAllProposalIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], name: 'getProposal', outputs: [
                                { internalType: 'uint256', name: 'id', type: 'uint256' },
                                { internalType: 'string', name: 'question', type: 'string' },
                                { internalType: 'uint256', name: 'yesVotes', type: 'uint256' },
                                { internalType: 'uint256', name: 'noVotes', type: 'uint256' },
                                { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                                { internalType: 'address', name: 'creator', type: 'address' },
                                { internalType: 'bool', name: 'exists', type: 'bool' },
                                { internalType: 'bool', name: 'executed', type: 'bool' },
                                { internalType: 'uint256', name: 'createdAt', type: 'uint256' }
                              ], stateMutability: 'view', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                                { internalType: 'address', name: 'voter', type: 'address' }
                              ], name: 'hasVoted', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },

                            // TEMP legacy summary helpers
                            { inputs: [], name: 'getAllFundraiserIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getFundraiserSummary', outputs: [
                                { internalType: 'uint256', name: 'id', type: 'uint256' },
                                { internalType: 'address', name: 'creator', type: 'address' },
                                { internalType: 'address', name: 'token', type: 'address' },
                                { internalType: 'uint256', name: 'target', type: 'uint256' },
                                { internalType: 'uint256', name: 'raised', type: 'uint256' },
                                { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                                { internalType: 'bool', name: 'isFlexible', type: 'bool' },
                                { internalType: 'bool', name: 'closureInitiated', type: 'bool' }
                              ], stateMutability: 'view', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getProposalSummary', outputs: [
                                { internalType: 'uint256', name: 'id', type: 'uint256' },
                                { internalType: 'string', name: 'question', type: 'string' },
                                { internalType: 'uint256', name: 'yesVotes', type: 'uint256' },
                                { internalType: 'uint256', name: 'noVotes', type: 'uint256' },
                                { internalType: 'uint256', name: 'endTime', type: 'uint256' },
                                { internalType: 'address', name: 'creator', type: 'address' }
                              ], stateMutability: 'view', type: 'function' },

                            // Writes
                            { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'createFundraiser', outputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                                { internalType: 'uint256', name: 'amount', type: 'uint256' }
                              ], name: 'donate', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'refund', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'withdrawFunds', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                                { internalType: 'uint256', name: 'additionalDays', type: 'uint256' }
                              ], name: 'extendFundraiser', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                                { internalType: 'address', name: 'creator', type: 'address' },
                                { internalType: 'uint256', name: 'fundraiserEndTime', type: 'uint256' }
                              ], name: 'initiateClosure', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'string', name: 'question', type: 'string' },
                                { internalType: 'uint256', name: 'duration', type: 'uint256' }
                              ], name: 'createProposal', outputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                                { internalType: 'bool', name: 'support', type: 'bool' }
                              ], name: 'vote', outputs: [], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [
                                { internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
                                { internalType: 'string', name: 'content', type: 'string' },
                                { internalType: 'address', name: 'author', type: 'address' }
                              ], name: 'postUpdate', outputs: [{ internalType: 'uint256', name: 'updateId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
                            { inputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], name: 'getFundraiserUpdateCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },

                            // Fees / ownership
                            { inputs: [], name: 'getFeeInfo', outputs: [
                                { internalType: 'uint256', name: 'donationCommissionRate', type: 'uint256' },
                                { internalType: 'uint256', name: 'successCommissionRate', type: 'uint256' },
                                { internalType: 'uint256', name: 'refundCommissionRate', type: 'uint256' },
                                { internalType: 'uint256', name: 'extensionFeeAmount', type: 'uint256' },
                                { internalType: 'address', name: 'feeTokenAddress', type: 'address' },
                                { internalType: 'address', name: 'commissionWalletAddress', type: 'address' }
                              ], stateMutability: 'view', type: 'function' },
                            { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
                            { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }
                          ] as const;

                          export default POLIDAO_ABI;
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isTokenWhitelisted",
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
    "inputs": [],
    "name": "maxDailyDonations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mediaPaused",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "mediaTypeCounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "monthlyRefundCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
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
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "updateId",
        "type": "uint256"
      }
    ],
    "name": "pinUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      }
    ],
    "name": "postUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "mediaType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "filename",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "fileSize",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "uploadTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "uploader",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          }
        ],
        "internalType": "struct PoliDAO.MediaItem[]",
        "name": "attachments",
        "type": "tuple[]"
      }
    ],
    "name": "postUpdateWithMultimedia",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
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
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "refundCommission",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "mediaIndex",
        "type": "uint256"
      }
    ],
    "name": "removeMediaFromFundraiser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "removeWhitelistToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "manager",
        "type": "address"
      }
    ],
    "name": "revokeMediaManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "proposer",
        "type": "address"
      }
    ],
    "name": "revokeProposer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "updater",
        "type": "address"
      }
    ],
    "name": "revokeUpdater",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      }
    ],
    "name": "setCommissionWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bps",
        "type": "uint256"
      }
    ],
    "name": "setDonationCommission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newLimit",
        "type": "uint256"
      }
    ],
    "name": "setMaxDailyDonations",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bps",
        "type": "uint256"
      }
    ],
    "name": "setRefundCommission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bps",
        "type": "uint256"
      }
    ],
    "name": "setSuccessCommission",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "successCommission",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
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
    "name": "timeLeftOnFundraiser",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "timeLeftOnProposal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "toggleDonationsPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "toggleMediaPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "toggleVotingPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "toggleWithdrawalsPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fundraiserId",
        "type": "uint256"
      }
    ],
    "name": "unpinUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updateCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updatesPaused",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "support",
        "type": "bool"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingPaused",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "whitelistToken",
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
  // ===== TEMP Legacy Summary Helpers =====
  { inputs: [], name: 'getAllFundraiserIds', outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getFundraiserSummary', outputs: [ { internalType: 'uint256', name: 'id', type: 'uint256' }, { internalType: 'address', name: 'creator', type: 'address' }, { internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'target', type: 'uint256' }, { internalType: 'uint256', name: 'raised', type: 'uint256' }, { internalType: 'uint256', name: 'endTime', type: 'uint256' }, { internalType: 'bool', name: 'isFlexible', type: 'bool' }, { internalType: 'bool', name: 'closureInitiated', type: 'bool' } ], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }], name: 'getProposalSummary', outputs: [ { internalType: 'uint256', name: 'id', type: 'uint256' }, { internalType: 'string', name: 'question', type: 'string' }, { internalType: 'uint256', name: 'yesVotes', type: 'uint256' }, { internalType: 'uint256', name: 'noVotes', type: 'uint256' }, { internalType: 'uint256', name: 'endTime', type: 'uint256' }, { internalType: 'address', name: 'creator', type: 'address' } ], stateMutability: 'view', type: 'function' },
  // ===== Writes =====
  { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'createFundraiser', outputs: [{ internalType: 'uint256', name: 'fundraiserId', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
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