import { type Abi } from "viem";

export const THECALL_ADDRESS = "0x58696fAc56e3d16794e07b19B03111C10d4ebce5";
export const PUNDITCARD_ADDRESS = "0x45341a0B1b1748E5E6f63643898179cC1E9E6395";

export const THECALL_ABI = [
  {
    type: "function",
    name: "makeCall",
    stateMutability: "payable",
    inputs: [
      { name: "_claim", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "backCall",
    stateMutability: "payable",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "fadeCall",
    stateMutability: "payable",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "callId", type: "uint256" },
      { name: "_callerWon", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getCall",
    stateMutability: "view",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [
      { name: "caller", type: "address" },
      { name: "claim", type: "string" },
      { name: "stake", type: "uint256" },
      { name: "backerPool", type: "uint256" },
      { name: "faderPool", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "settled", type: "bool" },
      { name: "callerWon", type: "bool" },
    ],
  },
  {
    name: "getBackerAmount",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "callId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getFaderAmount",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "callId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getBackers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getFaders",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "callId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "callCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MIN_STAKE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "CallCreated",
    inputs: [
      { indexed: true, name: "callId", type: "uint256" },
      { indexed: true, name: "caller", type: "address" },
      { name: "claim", type: "string" },
      { name: "stake", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "CallBacked",
    inputs: [
      { indexed: true, name: "callId", type: "uint256" },
      { indexed: true, name: "backer", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "CallFaded",
    inputs: [
      { indexed: true, name: "callId", type: "uint256" },
      { indexed: true, name: "fader", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "CallSettled",
    inputs: [
      { indexed: true, name: "callId", type: "uint256" },
      { name: "callerWon", type: "bool" },
      { name: "winnerPool", type: "uint256" },
      { name: "loserPool", type: "uint256" },
    ],
  },
] as const satisfies Abi;

export const PUNDITCARD_ABI = [
  {
    type: "function",
    name: "getStats",
    stateMutability: "view",
    inputs: [{ name: "pundit", type: "address" }],
    outputs: [
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
      { name: "totalStaked", type: "uint256" },
      { name: "biggestPot", type: "uint256" },
      { name: "streak", type: "uint256" },
      { name: "accuracy", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "hasProfile",
    stateMutability: "view",
    inputs: [{ name: "pundit", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "recordResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pundit", type: "address" },
      { name: "won", type: "bool" },
      { name: "stakeAmount", type: "uint256" },
      { name: "potSize", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "StatUpdated",
    inputs: [
      { indexed: true, name: "pundit", type: "address" },
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
      { name: "streak", type: "uint256" },
    ],
  },
] as const satisfies Abi;

export const XLAYER_TESTNET = {
  id: 1952,
  name: "X Layer Testnet",
  network: "xlayer-testnet",
  nativeCurrency: { decimals: 18, name: "OKB", symbol: "OKB" },
  rpcUrls: {
    public: { http: ["https://testrpc.xlayer.tech/terigon"] },
    default: { http: ["https://testrpc.xlayer.tech/terigon"] },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer-test",
    },
  },
} as const;

export const XLAYER_MAINNET = {
  id: 196,
  name: "X Layer",
  network: "xlayer",
  nativeCurrency: { decimals: 18, name: "OKB", symbol: "OKB" },
  rpcUrls: {
    public: { http: ["https://rpc.xlayer.tech"] },
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: {
      name: "OKX Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer",
    },
  },
} as const;
