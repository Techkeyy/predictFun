"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { id: "cards", label: "Cards" },
  { id: "potm", label: "Player of the Match" },
];

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const pathname = usePathname();

  const isCorrectNetwork = chainId === 1952;

  const { data: balance } = useBalance({
    address: address,
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

  const short = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : "";

  const handleConnect = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (e) {}
    }
    connect({ connector: injected() });
  };

  const handleSwitchNetwork = async () => {
    setNetworkSwitching(true);
    await switchToXLayerTestnet();
    setNetworkSwitching(false);
  };

  const navLinks = [
    { href: "/feed", label: "Feed" },
    { href: "/make-call", label: "Make a Call" },
    { href: "/docs", label: "Docs" },
    ...(isConnected && address
      ? [{ href: `/pundit/${address}`, label: "My Card" }]
      : []),
  ];

  const formattedBalance = balance
    ? parseFloat(formatEther(balance.value)).toFixed(3)
    : "0.000";

  if (!mounted) return null;

  return (
    <>
      {/* Ticker */}
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

      {/* Wrong network banner */}
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
        }}>
          <span>Wrong network detected. Switch to X Layer Testnet to use PredictFun.</span>
          <button
            onClick={handleSwitchNetwork}
            style={{
              padding: "4px 14px",
              borderRadius: "6px",
              background: "#fff",
              color: "var(--red)",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {networkSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}

      {/* Main nav */}
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
          {/* Logo */}
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

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
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
                }}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

            {/* Theme toggle */}
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
              {dark ? "L" : "D"}
            </button>

            {isConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

                {/* Network indicator + switcher */}
                <button
                  onClick={handleSwitchNetwork}
                  title="Click to switch network"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    background: isCorrectNetwork ? "rgba(0,194,120,0.08)" : "var(--red-dim)",
                    border: `1px solid ${isCorrectNetwork ? "rgba(0,194,120,0.2)" : "rgba(242,54,69,0.3)"}`,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isCorrectNetwork ? "var(--green)" : "var(--red)",
                  }}
                >
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isCorrectNetwork ? "var(--green)" : "var(--red)",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  {isCorrectNetwork ? "X Layer Testnet" : "Wrong Network"}
                </button>

                {/* OKB Balance */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}>
                  <span>{formattedBalance}</span>
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>OKB</span>
                </div>

                {/* Wallet address — links to pundit card */}
                <Link href={`/pundit/${address}`} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  background: "var(--green-dim)",
                  border: "1px solid rgba(0,194,120,0.25)",
                  textDecoration: "none",
                }}>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
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

                <button onClick={() => disconnect()} style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
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

        {/* Category pills - feed only */}
        {pathname === "/feed" && (
          <div style={{
            borderTop: "1px solid var(--border)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            <div style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              height: "40px",
              whiteSpace: "nowrap",
            }}>
              {CATEGORY_PILLS.map((pill) => {
                const active = activeCategory === pill.id;
                return (
                  <button key={pill.id} onClick={() => setActiveCategory(pill.id)} style={{
                    padding: "4px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--text)" : "transparent",
                    color: active ? "var(--bg)" : "var(--muted)",
                    border: `1px solid ${active ? "var(--text)" : "var(--border)"}`,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}>
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
