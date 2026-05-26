"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, usePublicClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import { THECALL_ABI, THECALL_ADDRESS } from "../../lib/contracts";

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

type PositionRole = "Called it";

interface PositionRow {
  callId: number;
  claim: string;
  role: PositionRole;
  stake: bigint;
  settled: boolean;
  callerWon: boolean;
  deadline: bigint;
  backerPool: bigint;
}

interface SummaryMetrics {
  activeStake: bigint;
  availableToClaim: bigint;
  netOKB: bigint;
  winRate: number;
  lastActivity: string;
  settledCount: number;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const publicClient = usePublicClient();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "backing" | "fading">("positions");
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    activeStake: BigInt(0),
    availableToClaim: BigInt(0),
    netOKB: BigInt(0),
    winRate: 0,
    lastActivity: "No activity yet",
    settledCount: 0,
  });

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const formatOKB = (value: bigint) => formatEther(value);

  const isWin = (position: PositionRow) => position.callerWon;

  const loadPortfolio = useCallback(async () => {
    if (!publicClient || !address) return;

    setLoading(true);

    try {
      const callCountRaw = await publicClient.readContract({
        address: THECALL_ADDRESS as `0x${string}`,
        abi: THECALL_ABI,
        functionName: "callCount",
      });
      const callCount = Number(callCountRaw);
      const callerAddress = address.toLowerCase();
      const callerCalls: CallData[] = [];

      for (let index = 1; index <= callCount; index++) {
        try {
          const call = await publicClient.readContract({
            address: THECALL_ADDRESS as `0x${string}`,
            abi: THECALL_ABI,
            functionName: "getCall",
            args: [BigInt(index)],
          }) as [string, string, bigint, bigint, bigint, bigint, boolean, boolean];

          if (call[0].toLowerCase() === callerAddress) {
            callerCalls.push({
              id: index,
              caller: call[0],
              claim: call[1],
              stake: call[2],
              backerPool: call[3],
              faderPool: call[4],
              deadline: call[5],
              settled: call[6],
              callerWon: call[7],
            });
          }
        } catch (error) {
          console.error("Failed to read call", index, error);
        }
      }

      const orderedCalls = callerCalls.reverse();
      const nextPositions = orderedCalls.map((call) => ({
        callId: call.id,
        claim: call.claim,
        role: "Called it" as const,
        stake: call.stake,
        settled: call.settled,
        callerWon: call.callerWon,
        deadline: call.deadline,
        backerPool: call.backerPool,
      }));

      const activeStake = orderedCalls
        .filter((call) => !call.settled)
        .reduce((sum, call) => sum + call.stake, BigInt(0));

      const availableToClaim = orderedCalls
        .filter((call) => call.settled && call.callerWon)
        .reduce((sum, call) => sum + call.stake + call.backerPool, BigInt(0));

      const settledWins = orderedCalls
        .filter((call) => call.settled && call.callerWon)
        .reduce((sum, call) => sum + call.stake, BigInt(0));

      const settledLosses = orderedCalls
        .filter((call) => call.settled && !call.callerWon)
        .reduce((sum, call) => sum + call.stake, BigInt(0));

      const settledCount = orderedCalls.filter((call) => call.settled).length;
      const wonCount = orderedCalls.filter((call) => call.settled && call.callerWon).length;
      const winRate = settledCount > 0 ? Math.round((wonCount / settledCount) * 100) : 0;
      const latestDeadline = orderedCalls.reduce((latest, call) => {
        const deadlineMs = Number(call.deadline) * 1000;
        return deadlineMs > latest ? deadlineMs : latest;
      }, 0);

      setPositions(nextPositions);
      setMetrics({
        activeStake,
        availableToClaim,
        netOKB: settledWins - settledLosses,
        winRate,
        lastActivity: latestDeadline > 0 ? new Date(latestDeadline).toLocaleDateString() : "No activity yet",
        settledCount,
      });
    } catch (error) {
      console.error("Failed to load portfolio:", error);
      setPositions([]);
      setMetrics({
        activeStake: BigInt(0),
        availableToClaim: BigInt(0),
        netOKB: BigInt(0),
        winRate: 0,
        lastActivity: "No activity yet",
        settledCount: 0,
      });
    }

    setLoading(false);
  }, [address, publicClient]);

  useEffect(() => {
    if (!publicClient || !address) return;
    void loadPortfolio();
  }, [publicClient, address, loadPortfolio]);

  const visiblePositions = useMemo(() => {
    if (activeTab === "positions") return positions;
    return [];
  }, [activeTab, positions]);

  const lossRate = metrics.settledCount > 0 ? 100 - metrics.winRate : 0;
  const profitLossIsPositive = metrics.netOKB >= BigInt(0);

  const tabStyle = (tab: "positions" | "backing" | "fading") => ({
    padding: "8px 14px",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid var(--text)" : "2px solid transparent",
    background: "transparent",
    color: activeTab === tab ? "var(--text)" : "var(--muted)",
    fontSize: "13px",
    fontWeight: activeTab === tab ? 700 : 400,
    cursor: "pointer",
  });

  const renderEmptyTab = (tab: "backing" | "fading") => {
    const copy = tab === "backing"
      ? "Backing history coming soon. Back a call on the Feed to get started."
      : "Fading history coming soon. Fade a call on the Feed to get started.";

    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        color: "var(--muted)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
      }}>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>{copy}</p>
        <button
          type="button"
          onClick={() => router.push("/feed")}
          style={{
            marginTop: "14px",
            padding: "10px 18px",
            borderRadius: "8px",
            background: "var(--green)",
            color: "#000",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Feed →
        </button>
      </div>
    );
  };

  if (!isConnected || !address) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: isMobile ? "16px" : "40px 24px", textAlign: "center" }}>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px 24px",
        }}>
          <p style={{ color: "var(--muted)", marginBottom: "16px" }}>Connect your wallet to view your portfolio</p>
          <button
            type="button"
            onClick={() => connect({ connector: injected() })}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "var(--green)",
              color: "#000",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px" : "32px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: isMobile ? "18px" : "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Portfolio</h2>
            <button
              type="button"
              onClick={loadPortfolio}
              aria-label="Refresh portfolio"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                cursor: "pointer",
              }}
            >
              🔄
            </button>
          </div>

          <div style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
            {formatOKB(metrics.activeStake)} OKB
          </div>
          <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>
            Available to claim: {formatOKB(metrics.availableToClaim)} OKB
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => window.open("https://www.okx.com/web3/faucet", "_blank")}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(0,194,120,0.2)",
                background: "rgba(0,194,120,0.08)",
                color: "var(--green)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🚰 Get OKB
            </button>
            <button
              type="button"
              onClick={() => router.push(`/pundit/${address}`)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📤 Share Card
            </button>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: isMobile ? "18px" : "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Profit/Loss</h2>
            <span style={{
              padding: "4px 10px",
              borderRadius: "999px",
              background: metrics.settledCount > 0 ? (metrics.winRate > 50 ? "var(--green-dim)" : "var(--red-dim)") : "var(--surface2)",
              color: metrics.settledCount > 0 ? (metrics.winRate > 50 ? "var(--green)" : "var(--red)") : "var(--muted)",
              fontSize: "11px",
              fontWeight: 700,
            }}>
              {metrics.settledCount > 0 ? `${metrics.winRate}% win rate` : "No settled calls yet"}
            </span>
          </div>

          <div style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 800, color: profitLossIsPositive ? "var(--green)" : "var(--red)", letterSpacing: "-0.03em" }}>
            {profitLossIsPositive ? "+" : ""}{formatOKB(metrics.netOKB)} OKB
          </div>
          <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>
            Last activity: {metrics.lastActivity}
          </div>

          <div style={{ marginTop: "18px" }}>
            {metrics.settledCount === 0 ? (
              <div style={{
                height: "6px",
                borderRadius: "3px",
                background: "var(--surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "11px",
                fontWeight: 600,
                padding: "10px 12px",
              }}>
                No settled calls yet
              </div>
            ) : (
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "var(--surface2)" }}>
                <div style={{ width: `${metrics.winRate}%`, background: "var(--green)" }} />
                <div style={{ width: `${lossRate}%`, background: "var(--red)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0", overflowX: "auto", marginBottom: "16px", whiteSpace: "nowrap" }} className="no-scrollbar">
        <button onClick={() => setActiveTab("positions")} style={tabStyle("positions")}>Positions</button>
        <button onClick={() => setActiveTab("backing")} style={tabStyle("backing")}>Backing</button>
        <button onClick={() => setActiveTab("fading")} style={tabStyle("fading")}>Fading</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[0, 1, 2].map((index) => (
            <div key={index} className="pulse-skeleton" style={{
              height: "56px",
              borderRadius: "10px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              opacity: 0.55,
            }} />
          ))}
        </div>
      ) : activeTab === "positions" ? (
        visiblePositions.length === 0 ? (
          <div style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--muted)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}>
            No positions found.
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 0.8fr 0.9fr 0.9fr", gap: "12px", padding: "12px 16px", background: "var(--surface2)", color: "var(--muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <span>MARKET</span>
              <span>SIDE</span>
              <span>STAKED</span>
              <span>STATUS</span>
              <span>TO WIN</span>
            </div>
            <div style={{ overflowX: isMobile ? "auto" : "visible" }} className="no-scrollbar">
              <div style={{ minWidth: isMobile ? "760px" : "unset" }}>
                {visiblePositions.map((position, index) => {
                  const rowBg = index % 2 === 0 ? "var(--surface)" : "var(--surface2)";
                  const now = Math.floor(Date.now() / 1000);
                  const expired = !position.settled && Number(position.deadline) < now;
                  const won = position.settled && isWin(position);
                  const statusLabel = position.settled ? (won ? "SETTLED WON" : "SETTLED LOST") : expired ? "EXPIRED" : "OPEN";
                  const statusStyles = {
                    color: position.settled ? (won ? "var(--green)" : "var(--red)") : expired ? "var(--muted)" : "var(--green)",
                    background: position.settled ? (won ? "var(--green-dim)" : "var(--red-dim)") : expired ? "var(--surface2)" : "rgba(0,194,120,0.08)",
                  };
                  const payout = position.settled && position.callerWon ? position.stake + position.backerPool : position.stake;
                  return (
                    <div key={`${position.callId}-${position.role}-${index}`} style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 0.9fr 0.8fr 0.9fr 0.9fr",
                      gap: "12px",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: rowBg,
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                        {position.claim.length > 40 ? `${position.claim.slice(0, 40)}...` : position.claim}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)" }}>
                        {position.role}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                        {formatOKB(position.stake)}
                      </span>
                      <span style={{
                        flexShrink: 0,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "4px",
                        background: statusStyles.background,
                        color: statusStyles.color,
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                        ~{formatOKB(payout)} OKB
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : activeTab === "backing" ? (
        renderEmptyTab("backing")
      ) : (
        renderEmptyTab("fading")
      )}
    </div>
  );
}
