"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useChainId, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { switchToXLayerTestnet } from "../lib/switchNetwork";
import { formatEther } from "viem";

const TICKER_ITEMS = [
  "WORLD CUP 2026 · BUILT ON X LAYER",
  "MAKE YOUR CALL · STAKE OKB · BUILD YOUR REP",
  "BACK IT OR FADE IT · WINNER TAKES THE POT",
  "WHO IS THE TOP PUNDIT? CHECK THE LEADERBOARD",
  "BRAZIL · FRANCE · ARGENTINA · ENGLAND · WHO WINS?",
  "OKB IS THE NATIVE GAS TOKEN OF X LAYER",
];

const CATEGORY_PILLS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "settled", label: "Settled" },
  { id: "group", label: "Group Stage" },
  { id: "boot", label: "Golden Boot" },
  { id: "winner", label: "Tournament Winner" },
  { id: "cards", label: "🏅 Leaderboard" },
  { id: "potm", label: "Player of the Match" },
];

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [disconnectHover, setDisconnectHover] = useState(false);

  const isCorrectNetwork = chainId === 1952;
  const activeCategory = searchParams.get("cat") || "all";

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address && isConnected },
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleConnect = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // ignore
      }
    }
    connect({ connector: injected() });
  };

  const handleSwitchNetwork = async () => {
    setNetworkSwitching(true);
    try {
      await switchToXLayerTestnet();
    } finally {
      setNetworkSwitching(false);
    }
  };

  const handleCategoryClick = (catId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "all") {
      params.delete("cat");
    } else {
      params.set("cat", catId);
    }
    const query = params.toString();
    router.push(query ? `/feed?${query}` : "/feed");
  };

  const navLinks = [
    { href: "/feed", label: "Feed" },
    { href: "/make-call", label: "Make a Call" },
    { href: "/docs", label: "Docs" },
    ...(isConnected && address ? [{ href: `/pundit/${address}`, label: "My Card" }] : []),
  ];

  const formattedBalance = balance ? parseFloat(formatEther(balance.value)).toFixed(3) : "0.000";
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  if (!mounted) return null;

  return (
    <>
      <div style={{
        background: "var(--green)",
        color: "#000",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        overflow: "hidden",
        height: "26px",
        display: "flex",
        alignItems: "center",
      }}>
        <div className="marquee-inner" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {[0, 1].map((copy) => (
            <span key={copy} style={{ display: "flex", alignItems: "center", gap: "48px", paddingRight: "48px" }}>
              {TICKER_ITEMS.map((item, j) => (
                <span key={j} style={{ display: "flex", alignItems: "center", gap: "48px" }}>
                  <span>{item}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {isConnected && !isCorrectNetwork && (
        <div style={{
          background: "rgba(242,54,69,0.95)",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          <span>Wrong network. Switch to X Layer Testnet to use PredictFun.</span>
          <button
            onClick={handleSwitchNetwork}
            style={{
              padding: "4px 14px",
              borderRadius: "6px",
              background: "#fff",
              color: "#e02020",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {networkSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}

      <nav style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "54px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}>
              <span style={{ color: "var(--green)" }}>PREDICT</span>
              <span style={{ color: "var(--text)" }}>FUN</span>
            </span>
            <span style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "4px",
              background: "var(--green-dim)",
              color: "var(--green)",
              letterSpacing: "0.06em",
              border: "1px solid rgba(0,194,120,0.2)",
            }}>
              X LAYER
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "2px", overflowX: "auto" }}>
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text)" : "var(--muted)",
                  background: active ? "var(--surface2)" : "transparent",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button onClick={toggleTheme} style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {dark ? "☀️" : "🌙"}
            </button>

            {isConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0,194,120,0.08)",
                  border: "1px solid rgba(0,194,120,0.2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--green)",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  X Layer Testnet
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{formattedBalance}</span>
                  <span style={{ color: "var(--muted)", fontWeight: 600 }}>OKB</span>
                </div>

                <Link href={`/pundit/${address}`} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px 4px 4px",
                  borderRadius: "8px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#000",
                    flexShrink: 0,
                  }}>
                    {address ? address.slice(2, 4).toUpperCase() : ""}
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "var(--green)",
                    fontWeight: 600,
                  }}>
                    {short}
                  </span>
                </Link>

                <button onClick={() => disconnect()} onMouseEnter={() => setDisconnectHover(true)} onMouseLeave={() => setDisconnectHover(false)} style={{
                  padding: 0,
                  border: "none",
                  fontSize: "12px",
                  background: "transparent",
                  color: disconnectHover ? "var(--red)" : "var(--muted)",
                  cursor: "pointer",
                }}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} style={{
                padding: "7px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                background: "var(--green)",
                color: "#000",
                border: "none",
                cursor: "pointer",
              }}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {pathname === "/feed" && (
          <div style={{
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            <div style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              gap: "0",
              height: "44px",
              whiteSpace: "nowrap",
              overflowX: "auto",
            }}>
              {CATEGORY_PILLS.map((pill) => {
                const active = activeCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => handleCategoryClick(pill.id)}
                    style={{
                      padding: "8px 14px",
                      border: "none",
                      borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                      borderRadius: 0,
                      fontSize: "13px",
                      fontWeight: active ? 700 : 400,
                      background: "transparent",
                      color: active ? "var(--text)" : "var(--muted)",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
