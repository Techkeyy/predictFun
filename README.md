# PredictFun — Onchain Conviction Market for World Cup 2026

> **Back it or fade it. Winner takes the pot.**  
> Built on X Layer · Powered by OKB · Submitted to X Cup Hackathon 2026

🌐 **Live App**: https://predict-fun-five.vercel.app  
📦 **Repo**: https://github.com/Techkeyy/predictFun  
🔗 **Network**: X Layer Testnet (Chain ID: 1952)

---

## What is PredictFun?

PredictFun is a social conviction market where users stake OKB on bold World Cup 2026 predictions — called **Calls**. Anyone can **Back** (agree) or **Fade** (disagree) any call. When the match result is known, the winning side splits the entire pool.

Every pundit builds an onchain reputation tracked by a downloadable **PunditCard** NFT — showing wins, losses, accuracy, and OKB staked.

---

## How It Works

1. **Make a Call** — Stake OKB on a World Cup prediction. AI validates your claim before it goes onchain.
2. **Back it** — Agree with the caller. Add OKB to the backing pool.
3. **Fade it** — Disagree. Add OKB to the fading pool.
4. **Settlement** — After the match, admin calls `settle(callId, callerWon)`. Winners split the full pool proportionally.
5. **Reputation** — Every settled call updates your PunditCard stats onchain.

---

## Contracts (X Layer Testnet)

| Contract | Address |
|---|---|
| TheCall.sol | `0x29E7e49b908E36bF16Ad51E5B7C9195B0792370D` |
| PunditCard.sol | `0xfB1F0a8CED01f2352343cea4Bbc70beB225E8493` |

**Deployer**: `0x7fc04ed9B67340b80aE6Bd16E62d32BEA70EBeea`  
**Explorer**: https://www.okx.com/web3/explorer/xlayer-test

---

## Seeded Markets

| # | Prediction | Deadline |
|---|---|---|
| 1 | Argentina will win the 2026 FIFA World Cup | July 19, 2026 |
| 2 | Kylian Mbappe will win the Golden Boot | July 19, 2026 |
| 3 | The 2026 World Cup final will be between Brazil and France | July 19, 2026 |
| 4 | At least one African team will reach the semi-finals | July 9, 2026 |
| 5 | England will be eliminated before the quarter-finals | July 4, 2026 |
| 6 | The tournament top scorer will score more than 8 goals | July 19, 2026 |

---

## Features

- ⚽ **Live prediction feed** — Polymarket-style cards with Back/Fade pools
- 🤖 **AI validation** — DeepSeek API validates calls against 48 qualified teams and real World Cup facts before submission
- 🏅 **Leaderboard** — Ranked pundit table by wins, accuracy, and OKB staked
- 👤 **PunditCard** — Onchain reputation card, downloadable as PNG
- 💼 **Portfolio** — Track your positions, backings, and fadings in one dashboard
- 🌓 **Dark/Light mode** — Full theme support
- 📱 **Mobile responsive** — Works on all screen sizes
- 🔗 **Network guard** — Auto-detects wrong network, prompts switch to X Layer Testnet
- 🚰 **Faucet link** — One-click access to OKB testnet faucet

---

## Tech Stack

| Layer | Tech |
|---|---|
| Smart Contracts | Solidity, Hardhat |
| Frontend | Next.js 14, TypeScript, wagmi v2, viem |
| Wallet | MetaMask / any injected provider |
| AI Validation | DeepSeek API |
| Network | X Layer Testnet (Chain ID 1952, OKB gas) |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MetaMask with X Layer Testnet added
- OKB testnet tokens from https://web3.okx.com/xlayer/faucet

### Install & Run

```bash
# Clone
git clone https://github.com/Techkeyy/predictFun.git
cd predictFun

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Set environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_THECALL_ADDRESS, NEXT_PUBLIC_PUNDITCARD_ADDRESS, DEEPSEEK_API_KEY

# Run dev server
npm run dev
```

Open http://localhost:3000

### Deploy Contracts

```bash
# From project root
cp .env.example .env
# Fill in PRIVATE_KEY

npx hardhat compile
npx hardhat run scripts/deploy.js --network xlayer_testnet
npx hardhat run scripts/seedMarkets.js --network xlayer_testnet
```

---

## X Layer Testnet Config

| Field | Value |
|---|---|
| Network Name | X Layer Testnet |
| RPC URL | https://testrpc.xlayer.tech/terigon |
| Chain ID | 1952 |
| Symbol | OKB |
| Explorer | https://www.okx.com/web3/explorer/xlayer-test |

---

## Project Structure

```
predictfun/
├── contracts/
│   ├── TheCall.sol          # Core betting contract
│   └── PunditCard.sol       # Soulbound reputation NFT
├── scripts/
│   ├── deploy.js
│   └── seedMarkets.js
├── hardhat.config.js
└── frontend/
	├── app/
	│   ├── page.tsx          # Homepage
	│   ├── feed/             # Market feed
	│   ├── make-call/        # Submit a prediction
	│   ├── portfolio/        # User positions dashboard
	│   ├── pundit/[address]/ # Pundit card page
	│   ├── admin/            # Settlement interface
	│   └── docs/             # How it works
	├── components/
	│   ├── Navbar.tsx
	│   ├── CallCard.tsx
	│   └── NetworkModal.tsx
	└── lib/
		├── contracts.ts      # ABIs + addresses
		├── wagmi.ts
		├── switchNetwork.ts
		└── validateClaim.ts  # AI validation
```

---

## Hackathon Submission

- **Event**: X Cup Hackathon by OKX / X Layer
- **Track**: Prediction Markets
- **Prize Pool**: 14,000 USDT
- **Deadline**: May 28, 2026 23:59 UTC
- **Submission**: Google Form

---

## License

MIT

---

## Built For

**X Cup Hackathon 2026** · Track: Prediction Markets · Prize: 14,000 USDT  
Submission deadline: May 28, 23:59 UTC

---

## License

MIT