# PredictFun

**Onchain conviction markets for World Cup 2026, built on X Layer.**

Back or fade bold football predictions with OKB. Winner takes the pool. Every pundit builds an onchain reputation.

🌐 [predict-fun-five.vercel.app](https://predict-fun-five.vercel.app) · 📦 [GitHub](https://github.com/Techkeyy/predictFun) · ⛓ X Layer Testnet

---

## How It Works

1. **Make a Call** — Stake OKB on a World Cup prediction. AI validates it before it goes onchain.
2. **Back it** — Agree with the caller. Add OKB to the backing pool.
3. **Fade it** — Disagree. Add OKB to the fading pool.
4. **Settlement** — After the result, the winning side splits the entire pool proportionally.
5. **Reputation** — Every settled call updates your onchain PunditCard.

---

## Contracts

| Contract | Address |
|---|---|
| TheCall.sol | `0x29E7e49b908E36bF16Ad51E5B7C9195B0792370D` |
| PunditCard.sol | `0xfB1F0a8CED01f2352343cea4Bbc70beB225E8493` |

Network: X Layer Testnet · Chain ID: 1952 · Gas token: OKB  
Explorer: [okx.com/web3/explorer/xlayer-test](https://www.okx.com/web3/explorer/xlayer-test)

---

## Features

- Live prediction feed with Back/Fade pools
- AI claim validation (DeepSeek) against 48 qualified World Cup teams
- Pundit leaderboard ranked by wins and accuracy
- Downloadable PunditCard per wallet
- Portfolio dashboard — positions, backings, fadings
- Network guard — auto-prompts switch to X Layer Testnet
- Built-in faucet link for OKB testnet tokens
- Mobile responsive, dark/light mode

---

## Tech Stack

- **Contracts**: Solidity, Hardhat
- **Frontend**: Next.js 14, TypeScript, wagmi v2, viem
- **AI**: DeepSeek API
- **Network**: X Layer Testnet (Chain ID 1952)
- **Deployment**: Vercel

---

## Local Setup

```bash
git clone https://github.com/Techkeyy/predictFun.git
cd predictFun && npm install
cd frontend && npm install
cp .env.example .env.local   # add contract addresses + DEEPSEEK_API_KEY
npm run dev
```

Add X Layer Testnet to MetaMask:
- RPC: `https://testrpc.xlayer.tech/terigon`
- Chain ID: `1952` · Symbol: `OKB`
- Faucet: [web3.okx.com/xlayer/faucet](https://web3.okx.com/xlayer/faucet)

---

## Roadmap

PredictFun is designed to migrate to [Exchange OS](https://web3.okx.com/whitepaper/okx-exchange-os.pdf) Outcome Markets infrastructure when it launches — replacing the current manual settlement model with protocol-level oracle resolution, and enabling unified accounts across X Layer's full market network.

---

## Hackathon

X Cup Hackathon · OKX / X Layer · Prediction Markets track · May 2026

---

## Built For

**X Cup Hackathon 2026** · Track: Prediction Markets · Prize: 14,000 USDT  
Submission deadline: May 28, 23:59 UTC

---

## License

MIT