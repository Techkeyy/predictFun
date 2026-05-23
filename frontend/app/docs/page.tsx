export default function DocsPage() {
  const sections = [
    {
      title: "What is PredictFun?",
      content: `PredictFun is an onchain conviction market for World Cup 2026, built on X Layer. Instead of betting against a faceless pool, you make a bold public prediction — a "call" — and stake OKB on it. Other users can either back you (agree) or fade you (disagree) by staking their own OKB. After the match, the smart contract automatically settles the outcome and distributes winnings to the correct side.`,
    },
    {
      title: "What is OKB?",
      content: `OKB is the native gas token of X Layer, the same way ETH is the native token of Ethereum. You use OKB to pay for transactions and to stake on calls. X Layer is built by OKX and uses OKB as its core currency. Average transaction fees on X Layer are approximately $0.0005, making it extremely cheap to interact with PredictFun.`,
    },
    {
      title: "How to get testnet OKB",
      content: `To use PredictFun on testnet, you need testnet OKB. Visit the X Layer testnet faucet at https://www.okx.com/web3/faucet and request testnet OKB. Add the X Layer testnet network to your wallet: Chain ID 1952, RPC https://testrpc.xlayer.tech/terigon, Symbol OKB. Your wallet will then show a testnet OKB balance you can use to stake on calls.`,
    },
    {
      title: "Making a call",
      content: `Go to Make a Call, connect your wallet, write your prediction (up to 140 characters), select the match or event it relates to, and set your stake in OKB (minimum 0.01 OKB). When you click Lock it in, your stake is held in the smart contract until the call is settled. If nobody takes the other side before the match deadline, you can refund your stake.`,
    },
    {
      title: "Backing a call",
      content: `If you agree with someone's call, you can Back it. Enter your stake amount and confirm the transaction. Your OKB is added to the backer pool. If the call is correct, you and the caller split the total pot (caller stake + backer pool + fader pool) proportionally to how much each of you staked. A 1% protocol fee is deducted from the total pot before distribution.`,
    },
    {
      title: "Fading a call",
      content: `If you disagree with a call, you can Fade it. Enter your stake and confirm. Your OKB is added to the fader pool. If the call is wrong, faders split the entire pot proportionally to their individual stakes. This is pure conviction: you are publicly betting the pundit is wrong.`,
    },
    {
      title: "Settlement and the oracle",
      content: `After each match, the PredictFun oracle (a multi-signature wallet controlled by the team) posts the result onchain by calling the settle() function with the callId and outcome. The contract then calculates proportional payouts and makes them claimable. You call the claim() function to withdraw your winnings. This is a trusted oracle model for the hackathon — decentralised oracle integration (Chainlink or API3) is on the roadmap.`,
    },
    {
      title: "Pundit reputation",
      content: `Every call you make is tracked by the PunditCard contract, a soulbound (non-transferable) NFT that records your wins, losses, total staked, biggest pot, and current hot streak. Your accuracy score is calculated as wins divided by total calls. The higher your accuracy and the more you stake, the higher you rank on the leaderboard. Share your pundit card on X to prove your record.`,
    },
    {
      title: "Contract addresses",
      content: `TheCall.sol and PunditCard.sol are deployed on X Layer testnet (Chain ID 1952). Contract addresses will be shown here after deployment. All contract code is open source. The contracts use the checks-effects-interactions pattern, no unbounded loops, and pull payment mechanics to prevent reentrancy.`,
    },
    {
      title: "Network details",
      content: `Network: X Layer Testnet. Chain ID: 1952. RPC: https://testrpc.xlayer.tech/terigon. Explorer: https://www.okx.com/web3/explorer/xlayer-test. Gas token: OKB. Block time: approximately 1 second. Average transaction cost: approximately $0.0005.`,
    },
  ];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ marginBottom: "48px" }}>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--green)",
          letterSpacing: "0.08em",
          marginBottom: "12px",
        }}>
          DOCUMENTATION
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "32px",
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          marginBottom: "12px",
        }}>
          How PredictFun works
        </h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.7 }}>
          Everything you need to know about making calls, staking OKB,
          settling markets, and building your pundit reputation on X Layer.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              borderTop: "1px solid var(--border)",
              padding: "24px 0",
            }}
          >
            <h2 style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "10px",
            }}>
              {section.title}
            </h2>
            <p style={{
              fontSize: "14px",
              color: "var(--muted)",
              lineHeight: 1.75,
            }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "48px",
        padding: "24px",
        borderRadius: "12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
          Built for X Cup Hackathon 2026
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
          PredictFun was built in 10 days for the X Cup Hackathon on X Layer.
          Track: Prediction Markets. Prize pool: 14,000 USDT.
          Submission deadline: May 28, 23:59 UTC.
        </p>
      </div>
    </div>
  );
}