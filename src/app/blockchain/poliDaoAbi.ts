// src/blockchain/poliDaoAbi.ts
export const POLIDAO_ABI = [
    {
        inputs: [
            { internalType: "address", name: "initialOwner", type: "address" },
            { internalType: "address", name: "_commissionWallet", type: "address" }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            { internalType: "uint256", name: "requested", type: "uint256" },
            { internalType: "uint256", name: "limit", type: "uint256" }
        ],
        name: "DailyLimitExceeded",
        type: "error"
    },
    { inputs: [], name: "EmptyQuestion", type: "error" },
    { inputs: [], name: "EnforcedPause", type: "error" },
    { inputs: [], name: "ExpectedPause", type: "error" },
    {
        inputs: [{ internalType: "uint256", name: "duration", type: "uint256" }],
        name: "InvalidDuration",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "recipient", type: "address" }],
        name: "InvalidRecipient",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "token", type: "address" }],
        name: "InvalidToken",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "token", type: "address" }],
        name: "NotAContract",
        type: "error"
    },
    { inputs: [], name: "NotAuthorized", type: "error" },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "OwnableInvalidOwner",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "OwnableUnauthorizedAccount",
        type: "error"
    },
    {
        inputs: [
            { internalType: "uint256", name: "offset", type: "uint256" },
            { internalType: "uint256", name: "total", type: "uint256" }
        ],
        name: "PaginationError",
        type: "error"
    },
    {
        inputs: [{ internalType: "uint256", name: "length", type: "uint256" }],
        name: "QuestionTooLong",
        type: "error"
    },
    { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
    { inputs: [], name: "TransferFailed", type: "error" },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "reclaimDeadline", type: "uint256" }
        ],
        name: "ClosureInitiated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "oldWallet", type: "address" },
            { indexed: true, internalType: "address", name: "newWallet", type: "address" }
        ],
        name: "CommissionWalletChanged",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "uint256", name: "newCommission", type: "uint256" }],
        name: "DonationCommissionSet",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "donor", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "DonationMade",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "donor", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountReturned", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "commissionTaken", type: "uint256" }
        ],
        name: "DonationRefunded",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "bool", name: "paused", type: "bool" }],
        name: "DonationsPauseToggled",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "token", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "EmergencyWithdraw",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "creator", type: "address" },
            { indexed: false, internalType: "address", name: "token", type: "address" },
            { indexed: false, internalType: "uint256", name: "target", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" },
            { indexed: false, internalType: "bool", name: "isFlexible", type: "bool" }
        ],
        name: "FundraiserCreated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "creator", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountAfterCommission", type: "uint256" }
        ],
        name: "FundsWithdrawn",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "uint256", name: "newLimit", type: "uint256" }],
        name: "MaxDailyDonationsSet",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
        ],
        name: "OwnershipTransferred",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
        name: "Paused",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "string", name: "question", type: "string" },
            { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" },
            { indexed: true, internalType: "address", name: "creator", type: "address" }
        ],
        name: "ProposalCreated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "proposer", type: "address" }],
        name: "ProposerAuthorized",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "proposer", type: "address" }],
        name: "ProposerRevoked",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "uint256", name: "newCommission", type: "uint256" }],
        name: "RefundCommissionSet",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "uint256", name: "newCommission", type: "uint256" }],
        name: "SuccessCommissionSet",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "token", type: "address" }],
        name: "TokenRemoved",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "address", name: "token", type: "address" }],
        name: "TokenWhitelisted",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
        name: "Unpaused",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "voter", type: "address" },
            { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
            { indexed: false, internalType: "bool", name: "support", type: "bool" }
        ],
        name: "Voted",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "bool", name: "paused", type: "bool" }],
        name: "VotingPauseToggled",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: false, internalType: "bool", name: "paused", type: "bool" }],
        name: "WithdrawalsPauseToggled",
        type: "event"
    },
    {
        inputs: [],
        name: "MAX_DONORS_BATCH",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "MAX_DURATION",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "MAX_QUESTION_LENGTH",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "RECLAIM_PERIOD",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "proposer", type: "address" }],
        name: "authorizeProposer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "authorizedProposers",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "proposer", type: "address" }],
        name: "canPropose",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "commissionWallet",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "target", type: "uint256" },
            { internalType: "uint256", name: "duration", type: "uint256" },
            { internalType: "bool", name: "isFlexible", type: "bool" }
        ],
        name: "createFundraiser",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "string", name: "question", type: "string" },
            { internalType: "uint256", name: "duration", type: "uint256" }
        ],
        name: "createProposal",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "dailyDonationCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "donate",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "donationCommission",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "donor", type: "address" }
        ],
        name: "donationOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "donationsPaused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "emergencyWithdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "fundraiserCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getAllFundraiserIds",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getAllProposalIds",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "day", type: "uint256" }],
        name: "getDailyDonationCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "getDonors",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "getDonorsCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "uint256", name: "offset", type: "uint256" },
            { internalType: "uint256", name: "limit", type: "uint256" }
        ],
        name: "getDonorsPaginated",
        outputs: [
            { internalType: "address[]", name: "donors", type: "address[]" },
            { internalType: "uint256", name: "total", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "getFundraiser",
        outputs: [
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "address", name: "", type: "address" },
            { internalType: "address", name: "", type: "address" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "bool", name: "", type: "bool" },
            { internalType: "bool", name: "", type: "bool" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "bool", name: "", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getFundraiserCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "getFundraiserSummary",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "id", type: "uint256" },
                    { internalType: "address", name: "creator", type: "address" },
                    { internalType: "address", name: "token", type: "address" },
                    { internalType: "uint256", name: "target", type: "uint256" },
                    { internalType: "uint256", name: "raised", type: "uint256" },
                    { internalType: "uint256", name: "endTime", type: "uint256" },
                    { internalType: "bool", name: "isFlexible", type: "bool" },
                    { internalType: "bool", name: "closureInitiated", type: "bool" }
                ],
                internalType: "struct PoliDAO.FundraiserSummary",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "getProposal",
        outputs: [
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "string", name: "", type: "string" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "uint256", name: "", type: "uint256" },
            { internalType: "bool", name: "", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getProposalCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
        name: "getProposalCreator",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
        name: "getProposalSummary",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "id", type: "uint256" },
                    { internalType: "string", name: "question", type: "string" },
                    { internalType: "uint256", name: "yesVotes", type: "uint256" },
                    { internalType: "uint256", name: "noVotes", type: "uint256" },
                    { internalType: "uint256", name: "endTime", type: "uint256" },
                    { internalType: "address", name: "creator", type: "address" }
                ],
                internalType: "struct PoliDAO.ProposalSummary",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getTodayDonationCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getWhitelistedTokens",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "donor", type: "address" }
        ],
        name: "hasRefunded",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "proposalId", type: "uint256" },
            { internalType: "address", name: "voter", type: "address" }
        ],
        name: "hasVoted",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "initiateClosure",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "isTokenWhitelisted",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "maxDailyDonations",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "", type: "address" },
            { internalType: "uint256", name: "", type: "uint256" }
        ],
        name: "monthlyRefundCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "paused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "proposalCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "refund",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "refundCommission",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "token", type: "address" }],
        name: "removeWhitelistToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "proposer", type: "address" }],
        name: "revokeProposer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "newWallet", type: "address" }],
        name: "setCommissionWallet",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "bps", type: "uint256" }],
        name: "setDonationCommission",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "newLimit", type: "uint256" }],
        name: "setMaxDailyDonations",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "bps", type: "uint256" }],
        name: "setRefundCommission",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "bps", type: "uint256" }],
        name: "setSuccessCommission",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "successCommission",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "timeLeftOnFundraiser",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
        name: "timeLeftOnProposal",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "toggleDonationsPause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "toggleVotingPause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "toggleWithdrawalsPause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "proposalId", type: "uint256" },
            { internalType: "bool", name: "support", type: "bool" }
        ],
        name: "vote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "votingPaused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "token", type: "address" }],
        name: "whitelistToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "whitelistedTokens",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "withdrawalsPaused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        stateMutability: "payable",
        type: "receive"
    }
] as const;