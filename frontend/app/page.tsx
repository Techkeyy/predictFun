"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import Image from "next/image";

const MOCK_TOP_CALLS = [
  { id: 1, pundit: "0xAb3f...8214", claim: "Mbappe wins the Golden Boot", pot: "44 OKB", accuracy: 82, backPct: 64 },
  { id: 2, pundit: "0xF21a...44CC", claim: "Brazil wins the tournament", pot: "91 OKB", accuracy: 74, backPct: 71 },
  { id: 3, pundit: "0x9Dc2...B301", claim: "No African team reaches the semi-finals", pot: "28 OKB", accuracy: 61, backPct: 38 },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Make a call",
    desc: "State your conviction about a World Cup match, player, or outcome. Stake OKB to back it publicly.",
  },
  {
    step: "02",
    title: "Back or fade",
    desc: "Others agree (back) or disagree (fade) by staking OKB. No house. Pure conviction versus conviction.",
  },
  {
    step: "03",
    title: "Match settles",
    desc: "After the match, the oracle posts the result onchain. The contract distributes the pot to winners.",
  },
  {
    step: "04",
    title: "Build your reputation",
    desc: "Every correct call builds your accuracy score and pundit rank. Share your card. Climb the leaderboard.",
  },
];

const NETWORK_STATS = [
  { label: "Network", value: "X Layer" },
  { label: "Gas token", value: "OKB", note: "Native token of X Layer" },
  { label: "Avg tx fee", value: "~.0005" },
  { label: "Block time", value: "1 second" },
];

export default function Home() {
  const { isConnected, address } = useAccount();

  return (
    <div>

      {/* HERO SECTION */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "72px 24px 64px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "56px",
          alignItems: "center",
        }}>
          {/* Left */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "4px 12px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              marginBottom: "24px",
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--green)",
                display: "inline-block",
              }} />
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted)",
                letterSpacing: "0.07em",
              }}>
                LIVE ON X LAYER TESTNET
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(38px, 4.5vw, 60px)",
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: "22px",
            }}>
              The boldest<br />
              football calls<br />
              <span style={{ color: "var(--green)" }}>go onchain.</span>
            </h1>

            <p style={{
              fontSize: "16px",
              color: "var(--muted)",
              lineHeight: 1.7,
              maxWidth: "400px",
              marginBottom: "36px",
            }}>
              Make a prediction. Stake OKB. Let the world back or
              fade you. Win money. Build your reputation as the
              sharpest pundit on X Layer.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/feed" style={{
                padding: "11px 24px",
                borderRadius: "8px",
                background: "var(--green)",
                color: "#000",
                fontSize: "14px",
                fontWeight: 700,
              }}>
                Browse Calls
              </Link>
              <Link href="/make-call" style={{
                padding: "11px 24px",
                borderRadius: "8px",
                background: "var(--surface2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                fontWeight: 600,
              }}>
                Make a Call
              </Link>
              {isConnected && address && (
                <Link href={`/pundit/${address}`} style={{
                  padding: "11px 24px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}>
                  My Pundit Card
                </Link>
              )}
            </div>
          </div>

          {/* Right — live preview panel */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "13px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
                Hot Calls Right Now
              </span>
              <Link href="/feed" style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
                See all
              </Link>
            </div>

            {MOCK_TOP_CALLS.map((call, i) => (
              <div key={call.id} style={{
                padding: "14px 16px",
                borderBottom: i < MOCK_TOP_CALLS.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}>
                  <p style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                    lineHeight: 1.35,
                    flex: 1,
                    marginRight: "10px",
                  }}>
                    {call.claim}
                  </p>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "var(--green-dim)",
                    color: "var(--green)",
                    flexShrink: 0,
                  }}>
                    {call.pot}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--muted)" }}>
                    {call.pundit}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--green)", fontWeight: 600 }}>
                    {call.accuracy}% acc.
                  </span>
                  <div style={{
                    flex: 1,
                    display: "flex",
                    height: "4px",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{ width: call.backPct + '%', background: "var(--green)" }} />
                    <div style={{ width: (100 - call.backPct) + '%', background: "var(--red)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CINEMATIC WORLD CUP SECTION */}
      <section style={{
        position: "relative",
        width: "100%",
        height: "92vh",
        minHeight: "600px",
        maxHeight: "900px",
        overflow: "hidden",
      }}>
        {/* Background image */}
        <Image
          src="/images/worldcup.jpg"
          alt="FIFA World Cup 2026"
          fill
          style={{ objectFit: "cover", objectPosition: "center top" }}
          priority={false}
          quality={90}
        />

        {/* Gradient overlays — top fade from page bg, bottom fade to page bg */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, var(--bg) 0%, transparent 12%, transparent 40%, rgba(0,0,0,0.7) 65%, var(--bg) 100%)",
          zIndex: 1,
        }} />

        {/* Dark vignette for text readability */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 2,
        }} />

        {/* Content */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          textAlign: "center",
          padding: "0 24px 80px",
        }}>
          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <Link href="/make-call" style={{
              padding: "14px 36px",
              borderRadius: "8px",
              background: "var(--green)",
              color: "#000",
              fontSize: "15px",
              fontWeight: 700,
              boxShadow: "0 0 40px rgba(0,194,120,0.5)",
              letterSpacing: "-0.01em",
            }}>
              Make your first call
            </Link>
            <Link href="/feed" style={{
              padding: "14px 36px",
              borderRadius: "8px",
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: "15px",
              fontWeight: 600,
              backdropFilter: "blur(12px)",
            }}>
              Browse the feed
            </Link>
          </div>
        </div>
      </section>

      {/* NETWORK STATS */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px 0" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1px",
          background: "var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          marginBottom: "72px",
        }}>
          {NETWORK_STATS.map((s) => (
            <div key={s.label} style={{
              background: "var(--surface)",
              padding: "20px 22px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.04em" }}>
                {s.label}
              </div>
              {s.note && (
                <div style={{ fontSize: "10px", color: "var(--green)", marginTop: "2px" }}>
                  {s.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: "72px" }}>
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}>
              How it works
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              Four steps. Fully onchain. No house, no intermediary.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "22px",
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--green)",
                  letterSpacing: "0.08em",
                  fontFamily: "monospace",
                  marginBottom: "12px",
                }}>
                  {item.step}
                </div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "8px",
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA BANNER */}
        <div style={{
          background: "linear-gradient(135deg, #001a0d 0%, #0a1628 100%)",
          border: "1px solid rgba(0,194,120,0.15)",
          borderRadius: "14px",
          padding: "48px 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          marginBottom: "72px",
          flexWrap: "wrap",
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "26px",
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}>
              Ready to make your first call?
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              World Cup 2026 starts June 11. Get your reputation onchain before kickoff.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/make-call" style={{
              padding: "12px 28px",
              borderRadius: "8px",
              background: "var(--green)",
              color: "#000",
              fontSize: "14px",
              fontWeight: 700,
            }}>
              Make a Call
            </Link>
            <Link href="/docs" style={{
              padding: "12px 28px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "14px",
              fontWeight: 500,
            }}>
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
