"use client";

import { Suspense, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PUNDITCARD_ABI, PUNDITCARD_ADDRESS, THECALL_ABI, THECALL_ADDRESS } from "../../lib/contracts";
import { CallCard } from "../../components/CallCard";

interface CallData {
  id: number;
  caller: string;
  claim: string;
  stake: bigint;
  backerPool: bigint;
  faderPool: bigint;
  deadline: bigint;
  settled: boolean;
  callerWon: boolean;
}

interface LeaderboardRow {
  address: string;
  wins: bigint;
  losses: bigint;
  totalStaked: bigint;
  biggestPot: bigint;
  streak: bigint;
  accuracy: bigint;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  group: ["group stage", "group", "qualify", "advance", "eliminated before the quarter"],
  boot: ["golden boot", "top scorer", "most goals", "goal scorer"],
  winner: ["win the world cup", "world cup winner", "champion", "lift the trophy", "world cup final", "tournament winner"],
  cards: ["card", "red card", "yellow card", "booked", "sent off"],
  potm: ["player of the match", "man of the match", "potm", "motm"],
};

function FeedInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const publicClient = usePublicClient();
  const activeCat = searchParams.get("cat") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!publicClient) return;

    const load = async () => {
      setLoading(true);
      try {
        const countRaw = await publicClient.readContract({
          address: THECALL_ADDRESS as `0x${string}`,
          abi: THECALL_ABI,
          functionName: "callCount",
        });
        const count = Number(countRaw);
        const fetched: CallData[] = [];

        for (let i = 1; i <= count; i++) {
          try {
            const result = await publicClient.readContract({
              address: THECALL_ADDRESS as `0x${string}`,
              abi: THECALL_ABI,
              functionName: "getCall",
              args: [BigInt(i)],
            }) as [string, string, bigint, bigint, bigint, bigint, boolean, boolean];

            fetched.push({
              id: i,
              caller: result[0],
              claim: result[1],
              stake: result[2],
              backerPool: result[3],
              faderPool: result[4],
              deadline: result[5],
              settled: result[6],
              callerWon: result[7],
            });
          } catch (error) {
            console.error("Failed to fetch call", i, error);
          }
        }

        const aliveCalls = fetched.filter((call) => call.settled || Number(call.deadline) >= Math.floor(Date.now() / 1000));
        setCalls(aliveCalls.reverse());
      } catch (error) {
        console.error("Failed to load feed:", error);
      }
      setLoading(false);
    };

    load();
  }, [publicClient]);

  const now = Math.floor(Date.now() / 1000);
  const passesStatus = (call: CallData) => {
    if (statusFilter === "open") return !call.settled && Number(call.deadline) >= now;
    if (statusFilter === "settled") return call.settled;
    return true;
  };

  const filteredCalls = calls.filter((call) => {
    if (!passesStatus(call)) return false;

    if (activeCat === "all") return true;
    if (activeCat === "open") return !call.settled && Number(call.deadline) >= now;
    if (activeCat === "settled") return call.settled;

    const keywords = CATEGORY_KEYWORDS[activeCat] || [];
    return keywords.some((keyword) => call.claim.toLowerCase().includes(keyword));
  });

  const totalVolume = calls.reduce((sum, call) => sum + call.stake + call.backerPool + call.faderPool, BigInt(0));
  const openMarkets = calls.filter((call) => !call.settled && Number(call.deadline) >= now).length;

  useEffect(() => {
    if (!publicClient || activeCat !== "cards") return;

    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const sourceCalls = calls.filter((call) => passesStatus(call));
        const uniqueAddresses = Array.from(new Set(sourceCalls.map((call) => call.caller.toLowerCase())));

        const rows = await Promise.all(uniqueAddresses.map(async (address) => {
          try {
            const result = await publicClient.readContract({
              address: PUNDITCARD_ADDRESS as `0x${string}`,
              abi: PUNDITCARD_ABI,
              functionName: "getStats",
              args: [address as `0x${string}`],
            }) as [bigint, bigint, bigint, bigint, bigint, bigint];

            return {
              address,
              wins: result[0],
              losses: result[1],
              totalStaked: result[2],
              biggestPot: result[3],
              streak: result[4],
              accuracy: result[5],
            } satisfies LeaderboardRow;
          } catch (error) {
            console.error("Failed to load stats for", address, error);
            return {
              address,
              wins: BigInt(0),
              losses: BigInt(0),
              totalStaked: BigInt(0),
              biggestPot: BigInt(0),
              streak: BigInt(0),
              accuracy: BigInt(0),
            } satisfies LeaderboardRow;
          }
        }));

        rows.sort((a, b) => {
          const winsDelta = Number(b.wins - a.wins);
          if (winsDelta !== 0) return winsDelta;
          return Number(b.accuracy - a.accuracy);
        });
        setLeaderboard(rows);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        setLeaderboard([]);
      }
      setLeaderboardLoading(false);
    };

    loadLeaderboard();
  }, [activeCat, calls, publicClient, statusFilter]);

  const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatOKB = (wei: bigint) => (Number(wei) / 1e18).toFixed(2);
  const openTitle = `${openMarkets} open markets`;

  if (activeCat === "cards") {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px 24px" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "18px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Leaderboard</h1>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>
              Ranked pundits by wins, accuracy, and OKB staked
            </p>
          </div>
          <div style={{
            padding: "10px 14px",
            borderRadius: "999px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            fontSize: "13px",
            fontWeight: 600,
            width: isMobile ? "100%" : "auto",
            textAlign: isMobile ? "center" : "left",
          }}>
            {formatOKB(totalVolume)} OKB Total Volume
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--muted)", fontSize: "13px", fontWeight: 600 }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" }} />
          <span>{openTitle}</span>
        </div>

        {leaderboardLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>No leaderboard data yet.</div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "72px 1.5fr 0.8fr 0.8fr 0.9fr 0.9fr", gap: "12px", padding: "12px 20px", background: "var(--surface2)", color: "var(--muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <span>Rank</span>
              <span>Pundit</span>
              <span>Wins</span>
              <span>Losses</span>
              <span>Accuracy</span>
              <span>OKB Staked</span>
            </div>
            <div style={{ overflowX: isMobile ? "auto" : "visible" }} className="no-scrollbar">
              <div style={{ minWidth: isMobile ? "720px" : "unset" }}>
                {leaderboard.map((row, index) => {
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;
                  const isEven = index % 2 === 0;
                  const accuracy = Number(row.accuracy);
                  const wins = Number(row.wins);
                  const losses = Number(row.losses);
                  const accuracyLabel = accuracy === 0 ? "—" : `${accuracy}%`;
                  const stakedLabel = Number(row.totalStaked) === 0 ? "—" : formatOKB(row.totalStaked);
                  return (
                    <button
                      key={row.address}
                      type="button"
                      onClick={() => router.push(`/pundit/${row.address}`)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "grid",
                        gridTemplateColumns: "72px 1.5fr 0.8fr 0.8fr 0.9fr 0.9fr",
                        gap: "12px",
                        alignItems: "center",
                        padding: "14px 20px",
                        border: "none",
                        background: isEven ? "var(--surface)" : "var(--surface2)",
                        color: "var(--text)",
                        cursor: "pointer",
                        borderBottom: index < leaderboard.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: 800, color: index < 3 ? "var(--text)" : "var(--muted)" }}>{medal}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "var(--green)",
                          color: "#000",
                          border: "1px solid rgba(0,0,0,0.06)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}>
                          {row.address.slice(2, 4).toUpperCase()}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {shortAddress(row.address)}
                        </span>
                      </span>
                      <span style={{ color: "var(--green)", fontWeight: 800 }}>{wins}</span>
                      <span style={{ color: "var(--muted)", fontWeight: 700 }}>{losses}</span>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>{accuracyLabel}</span>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>{stakedLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const setStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    const query = params.toString();
    router.push(query ? `/feed?${query}` : "/feed");
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px 24px" }}>
      <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Hot Takes</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>
            Back or fade the boldest World Cup predictions on X Layer
          </p>
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{
            padding: "10px 14px",
            borderRadius: "999px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            {formatOKB(totalVolume)} OKB Total Volume
          </div>
          <Link href="/make-call" style={{
            padding: "10px 20px", borderRadius: "8px", background: "var(--green)",
            color: "#000", fontSize: "14px", fontWeight: 700, textDecoration: "none",
            textAlign: "center",
          }}>
            + Make a Call
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--muted)", fontSize: "13px", fontWeight: 600 }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)" }} />
        <span>{openTitle}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)", fontSize: "14px" }}>
          Loading calls from X Layer...
        </div>
      ) : filteredCalls.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "16px" }}>
            {statusFilter === "open"
              ? "No open calls right now."
              : statusFilter === "settled"
              ? "No settled calls yet."
              : "No calls yet. Be the first pundit."}
          </p>
          <Link href="/make-call" style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "var(--green)",
            color: "#000",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
          }}>
            Make the first call
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "14px",
        }}>
          {filteredCalls.map((call) => (
            <CallCard key={call.id} {...call} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>Loading...</div>}>
      <FeedInner />
    </Suspense>
  );
}
