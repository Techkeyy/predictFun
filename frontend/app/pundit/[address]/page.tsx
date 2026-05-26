"use client";

import { useParams } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { PUNDITCARD_ABI, PUNDITCARD_ADDRESS, THECALL_ABI, THECALL_ADDRESS } from "../../../lib/contracts";

interface PunditStats {
  wins: bigint;
  losses: bigint;
  totalStaked: bigint;
  biggestPot: bigint;
  streak: bigint;
  accuracy: bigint;
}

interface CallData {
  id: number;
  claim: string;
  stake: bigint;
  settled: boolean;
  callerWon: boolean;
  deadline: bigint;
}

export default function PunditPage() {
  const params = useParams();
  const rawAddress = params.address as string;
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [stats, setStats] = useState<PunditStats>({
    wins: BigInt(0),
    losses: BigInt(0),
    totalStaked: BigInt(0),
    biggestPot: BigInt(0),
    streak: BigInt(0),
    accuracy: BigInt(0),
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [myCalls, setMyCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnCard = connectedAddress?.toLowerCase() === rawAddress?.toLowerCase();
  const shortAddress = rawAddress ? `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}` : "";

  useEffect(() => {
    if (!publicClient || !rawAddress) return;

    const load = async () => {
      setLoading(true);

      try {
        const result = await publicClient.readContract({
          address: PUNDITCARD_ADDRESS as `0x${string}`,
          abi: PUNDITCARD_ABI,
          functionName: "getStats",
          args: [rawAddress as `0x${string}`],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint];

        setStats({
          wins: result[0],
          losses: result[1],
          totalStaked: result[2],
          biggestPot: result[3],
          streak: result[4],
          accuracy: result[5],
        });
      } catch (error) {
        console.error("Failed to read stats:", error);
        setStats({ wins: BigInt(0), losses: BigInt(0), totalStaked: BigInt(0), biggestPot: BigInt(0), streak: BigInt(0), accuracy: BigInt(0) });
      }

      try {
        const profile = await publicClient.readContract({
          address: PUNDITCARD_ADDRESS as `0x${string}`,
          abi: PUNDITCARD_ABI,
          functionName: "hasProfile",
          args: [rawAddress as `0x${string}`],
        }) as boolean;
        setHasProfile(profile);
      } catch (error) {
        console.error("Failed to read profile:", error);
        setHasProfile(false);
      }

      try {
        const countRaw = await publicClient.readContract({
          address: THECALL_ADDRESS as `0x${string}`,
          abi: THECALL_ABI,
          functionName: "callCount",
        });
        const count = Number(countRaw);
        const calls: CallData[] = [];

        for (let i = 1; i <= count; i++) {
          try {
            const call = await publicClient.readContract({
              address: THECALL_ADDRESS as `0x${string}`,
              abi: THECALL_ABI,
              functionName: "getCall",
              args: [BigInt(i)],
            }) as [string, string, bigint, bigint, bigint, bigint, boolean, boolean];

            if (call[0].toLowerCase() === rawAddress.toLowerCase()) {
              calls.push({
                id: i,
                claim: call[1],
                stake: call[2],
                settled: call[6],
                callerWon: call[7],
                deadline: call[5],
              });
            }
          } catch (error) {
            console.error("Failed to fetch call", i, error);
          }
        }

        setMyCalls(calls.reverse());
      } catch (error) {
        console.error("Failed to load calls:", error);
        setMyCalls([]);
      }

      setLoading(false);
    };

    load();
  }, [publicClient, rawAddress]);

  const totalCalls = Number(stats.wins) + Number(stats.losses);
  const accuracy = totalCalls > 0 ? Math.round((Number(stats.wins) / totalCalls) * 100) : 0;
  const wins = Number(stats.wins);
  const losses = Number(stats.losses);
  const rank = useMemo(() => {
    if (wins >= 20) return "🏆 Elite Pundit";
    if (wins >= 10) return "⚡ Sharp Caller";
    if (wins >= 5) return "🔥 Rising Pundit";
    if (wins >= 1) return "📈 On the Board";
    return "🌱 New Pundit";
  }, [wins]);

  const formatOKB = (wei: bigint) => formatEther(wei);

  if (loading) {
    return (
      <div style={{ maxWidth: "700px", margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: "14px" }}>Loading pundit card...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 24px" }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #00c278 0%, #00956b 100%)",
          padding: "32px 28px",
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "#000", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "22px", fontWeight: 800,
              color: "#00c278", border: "3px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}>
              {rawAddress ? rawAddress.slice(2, 4).toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#000" }}>{rank}</div>
              <div style={{ fontSize: "13px", fontFamily: "monospace", color: "rgba(0,0,0,0.7)", marginTop: "4px" }}>
                {shortAddress}
              </div>
              {!hasProfile && totalCalls === 0 && (
                <div style={{
                  marginTop: "6px", fontSize: "11px", fontWeight: 600,
                  color: "rgba(0,0,0,0.6)", background: "rgba(0,0,0,0.1)",
                  padding: "2px 8px", borderRadius: "4px", display: "inline-block",
                }}>
                  New to the arena — make your first call!
                </div>
              )}
            </div>
          </div>
          <div style={{
            position: "absolute", top: "16px", right: "20px",
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
            color: "rgba(0,0,0,0.5)",
          }}>
            PREDICTFUN · X LAYER
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "1px solid var(--border)",
        }}>
          {[
            { label: "Calls Made", value: String(myCalls.length) },
            { label: "Settled", value: String(totalCalls) },
            { label: "Accuracy", value: `${accuracy}%` },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "20px 16px", textAlign: "center",
              borderRight: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { label: "Wins", value: String(wins), color: "var(--green)" },
            { label: "Losses", value: String(losses), color: "var(--red)" },
            { label: "OKB Staked", value: formatOKB(stats.totalStaked), color: "var(--text)" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "20px 16px", textAlign: "center",
              borderRight: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
          {isOwnCard ? "Your Calls" : "Their Calls"}
          <span style={{
            marginLeft: "8px", background: "var(--surface2)", padding: "2px 8px",
            borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: "var(--muted)",
          }}>
            {myCalls.length}
          </span>
        </h2>

        {myCalls.length === 0 ? (
          <div style={{
            padding: "40px", textAlign: "center",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "12px",
          }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
              {isOwnCard
                ? "No calls yet. Make your first prediction and stake your reputation."
                : "This pundit hasn't made any calls yet."}
            </p>
            {isOwnCard && (
              <Link href="/make-call" style={{
                display: "inline-block", marginTop: "14px", padding: "9px 22px",
                background: "var(--green)", color: "#000", borderRadius: "8px",
                fontWeight: 700, textDecoration: "none", fontSize: "13px",
              }}>
                Make Your First Call
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {myCalls.map((call) => {
              const now = Math.floor(Date.now() / 1000);
              const isOpen = !call.settled && Number(call.deadline) > now;
              const status = call.settled ? (call.callerWon ? "WON" : "LOST") : isOpen ? "OPEN" : "EXPIRED";
              const statusColor = call.settled ? (call.callerWon ? "var(--green)" : "var(--red)") : isOpen ? "var(--green)" : "var(--muted)";
              const statusBg = call.settled ? (call.callerWon ? "var(--green-dim)" : "var(--red-dim)") : isOpen ? "rgba(0,194,120,0.08)" : "var(--surface2)";

              return (
                <div key={call.id} style={{
                  padding: "16px 18px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "10px", display: "flex",
                  alignItems: "center", justifyContent: "space-between", gap: "12px",
                }}>
                  <span style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.4 }}>
                    {call.claim}
                  </span>
                  <span style={{
                    flexShrink: 0, fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                    borderRadius: "4px", background: statusBg, color: statusColor,
                  }}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
