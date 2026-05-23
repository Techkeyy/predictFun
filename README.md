# PredictFun

**Onchain conviction market for World Cup 2026, built on X Layer.**

Make bold football predictions. Stake OKB. Let the world back or fade you. Win money. Build your reputation as the sharpest pundit on X Layer.

---

## What is PredictFun?

PredictFun is a decentralised prediction market where users make public calls — bold predictions about World Cup 2026 outcomes — and stake OKB on them. Other users can **back** (agree) or **fade** (disagree) each call. After the match, the oracle settles the result onchain and winners claim their share of the pot.

No house edge. Pure conviction versus conviction.

---

## Tech Stack

- **Blockchain:** X Layer (OKB L2 by OKX)
- **Smart Contracts:** Solidity 0.8.24, Hardhat
- **Frontend:** Next.js 14, wagmi v2, viem, TypeScript, Tailwind CSS
- **AI Validation:** DeepSeek API (validates calls before submission)
- **Oracle:** Trusted multi-sig (V1), Chainlink/API3 on roadmap

---

## Contracts (X Layer Testnet)

| Contract | Address |
|----------|---------|
| TheCall.sol | `0x29E7e49b908E36bF16Ad51E5B7C9195B0792370D` |
| PunditCard.sol | `0xfB1F0a8CED01F2352343cea4Bbc70beB225E8493` |

Chain ID: `1952` · RPC: `https://testrpc.xlayer.tech/terigon`

---

## Local Development

### Prerequisites
- Node.js >= 18
- MetaMask with X Layer Testnet configured

### Setup

```bash
# Clone the repo
git clone https://github.com/Techkeyy/predictFun.git
cd predictFun

# Install root dependencies (Hardhat)
npm install

# Install frontend dependencies
cd frontend
npm install

# Copy env template and fill in values
cp .env.example .env.local
```

### Environment Variables

Create `frontend/.env.local`:
NEXT_PUBLIC_THECALL_ADDRESS=0x29E7e49b908E36bF16Ad51E5B7C9195B0792370D
NEXT_PUBLIC_PUNDITCARD_ADDRESS=0xfB1F0a8CED01F2352343cea4Bbc70beB225E8493
NEXT_PUBLIC_CHAIN_ID=1952
NEXT_PUBLIC_RPC_URL=https://testrpc.xlayer.tech/terigon
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_key_here

### Run Frontend

```bash
cd frontend
npx next dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Smart Contract Commands

```bash
# Compile contracts
npm run compile

# Deploy to X Layer Testnet
npm run deploy:testnet

# Seed official markets
npx hardhat run scripts/seedMarkets.js --network xlayer_testnet
```

---

## How It Works

1. **Make a Call** — Write your prediction (validated by DeepSeek AI), select a match, stake OKB minimum 0.01
2. **Back or Fade** — Others stake OKB to agree or disagree
3. **Settlement** — Oracle posts result onchain after match ends
4. **Claim** — Winners pull their proportional share of the pot

---

## Project Structure
predictfun/
├── contracts/
│   ├── TheCall.sol        # Core betting contract
│   └── PunditCard.sol     # Soulbound reputation NFT
├── scripts/
│   ├── deploy.js          # Deploy both contracts
│   └── seedMarkets.js     # Seed official markets
├── frontend/
│   ├── app/               # Next.js app router pages
│   ├── components/        # Navbar, CallCard
│   └── lib/               # Contracts ABI, wagmi config, validation
└── hardhat.config.js

---

## Built For

**X Cup Hackathon 2026** · Track: Prediction Markets · Prize: 14,000 USDT  
Submission deadline: May 28, 23:59 UTC

---

## License

MIT