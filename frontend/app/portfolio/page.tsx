"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, usePublicClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { useRouter } from "next/navigation";
import { formatEther, parseAbiItem, type Address } from "viem";
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

type PositionRole = "Called it" | "Backed" | "Faded";

interface PositionRow {
  callId: number;
  claim: string;
  role: PositionRole;
  stake: bigint;
  settled: boolean;
  callerWon: boolean;
  deadline: bigint;
}

interface SummaryMetrics {
  activeStake: bigint;
  availableToClaim: bigint;
  netOKB: bigint;
  winRate: number;
  lastActivity: Date | null;
}

const BACKED_EVENT = parseAbiItem("event CallBacked(uint256 indexed callId, address indexed backer, uint256 amount)");
const FADED_EVENT = parseAbiItem("event CallFaded(uint256 indexed callId, address indexed fader, uint256 amount)");

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const publicClient = usePublicClient();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLimited, setHistoryLimited] = useState(false);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "backing" | "fading">("positions");
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    activeStake: BigInt(0),
    availableToClaim: BigInt(0),
    netOKB: BigInt(0),
    winRate: 0,
    lastActivity: null,
  });

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const formatOKB = (value: bigint) => `${(Number(value) / 1e18).toFixed(3)}`;
  const isWin = (position: PositionRow) => {
    if (position.role === "Called it") return position.callerWon;
    if (position.role === "Backed") return position.callerWon;
    return !position.callerWon;
  };

  const loadPortfolio = async () => {
    if (!publicClient || !address) return;

    setLoading(true);
    setHistoryLimited(false);

    try {
      const callCountRaw = await publicClient.readContract({
        address: THECALL_ADDRESS as `0x${string}`,
        abi: THECALL_ABI,
        functionName: "callCount",
      });
      const callCount = Number(callCountRaw);
      const calls: CallData[] = [];

      for (let index = 1; index <= callCount; index++) {
        try {
          const call = await publicClient.readContract({
            address: THECALL_ADDRESS as `0x${string}`,
            abi: THECALL_ABI,
            functionName: "getCall",
            args: [BigInt(index)],
          }) as [string, string, bigint, bigint, bigint, bigint, boolean, boolean];

          calls.push({
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
        } catch (error) {
          console.error("Failed to read call", index, error);
        }
      }

      const callMap = new Map(calls.map((call) => [call.id, call]));
      const callerPositions: PositionRow[] = calls
        .filter((call) => call.caller.toLowerCase() === address.toLowerCase())
        .map((call) => ({
          callId: call.id,
          claim: call.claim,
          role: "Called it",
          stake: call.stake,
          settled: call.settled,
          callerWon: call.callerWon,
          deadline: call.deadline,
        }));

      let backerPositions: PositionRow[] = [];
      let faderPositions: PositionRow[] = [];
      let lastActivity: Date | null = null;

      try {
        const [backedLogs, fadedLogs] = await Promise.all([
          publicClient.getLogs({
            address: THECALL_ADDRESS as Address,
            event: BACKED_EVENT,
            args: { backer: address as Address },
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: THECALL_ADDRESS as Address,
            event: FADED_EVENT,
            args: { fader: address as Address },
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
        ]);

        const backerAmounts = new Map<number, bigint>();
        const faderAmounts = new Map<number, bigint>();
        const logBlockNumbers = [...backedLogs, ...fadedLogs]
          .map((log) => log.blockNumber)
          .filter((blockNumber): blockNumber is bigint => blockNumber !== null && blockNumber !== undefined);

        for (const log of backedLogs) {
          const callId = Number(log.args.callId);
          const amount = log.args.amount as bigint;
          backerAmounts.set(callId, (backerAmounts.get(callId) ?? BigInt(0)) + amount);
        }

        for (const log of fadedLogs) {
          const callId = Number(log.args.callId);
          const amount = log.args.amount as bigint;
          faderAmounts.set(callId, (faderAmounts.get(callId) ?? BigInt(0)) + amount);
        }

        backerPositions = Array.from(backerAmounts.entries()).flatMap(([callId, stake]) => {
          const call = callMap.get(callId);
          if (!call) return [];
          return [{
            callId,
            claim: call.claim,
            role: "Backed" as const,
            stake,
            settled: call.settled,
            callerWon: call.callerWon,
            deadline: call.deadline,
          }];
        });

        faderPositions = Array.from(faderAmounts.entries()).flatMap(([callId, stake]) => {
          const call = callMap.get(callId);
          if (!call) return [];
          return [{
            callId,
            claim: call.claim,
            role: "Faded" as const,
            stake,
            settled: call.settled,
            callerWon: call.callerWon,
            deadline: call.deadline,
          }];
        });

        if (logBlockNumbers.length > 0) {
          const latestBlock = logBlockNumbers.reduce((max, value) => (value > max ? value : max), logBlockNumbers[0]);
          const block = await publicClient.getBlock({ blockNumber: latestBlock });
          lastActivity = new Date(Number(block.timestamp) * 1000);
        }
      } catch (error) {
        console.error("Failed to read participation logs:", error);
        setHistoryLimited(true);
      }

      const allPositions = [...callerPositions, ...backerPositions, ...faderPositions];
      setPositions(allPositions);

      const activeStake = allPositions.filter((position) => !position.settled).reduce((sum, position) => sum + position.stake, BigInt(0));
      const availableToClaim = allPositions
        .filter((position) => position.settled && isWin(position))
        .reduce((sum, position) => sum + (position.stake * BigInt(95)) / BigInt(100), BigInt(0));
      const settledWins = allPositions
        .filter((position) => position.settled && isWin(position))
        .reduce((sum, position) => sum + (position.stake * BigInt(95)) / BigInt(100), BigInt(0));
      const settledLosses = allPositions
        .filter((position) => position.settled && !isWin(position))
        .reduce((sum, position) => sum + position.stake, BigInt(0));
      const netOKB = settledWins - settledLosses;
      const winCount = allPositions.filter((position) => position.settled && isWin(position)).length;
      const settledCount = allPositions.filter((position) => position.settled).length;
      const winRate = settledCount > 0 ? Math.round((winCount / settledCount) * 100) : 0;

      setMetrics({
        activeStake,
        availableToClaim,
        netOKB,
        winRate,
        lastActivity: lastActivity ?? (allPositions[0] ? new Date(Number(allPositions[0].deadline) * 1000) : null),
      });
    } catch (error) {
      console.error("Failed to load portfolio:", error);
      setPositions([]);
      setMetrics({ activeStake: BigInt(0), availableToClaim: BigInt(0), netOKB: BigInt(0), winRate: 0, lastActivity: null });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isConnected) {
      loadPortfolio();
    }
  }, [address, isConnected, publicClient]);

  const visiblePositions = useMemo(() => {
    if (activeTab === "backing") return positions.filter((position) => position.role === "Backed");
    if (activeTab === "fading") return positions.filter((position) => position.role === "Faded");
    return positions;
  }, [activeTab, positions]);

  const filteredAndSummarized = visiblePositions;
  const lossRate = 100 - metrics.winRate;

  const truncateMarket = (claim: string) => (claim.length > 40 ? `${claim.slice(0, 40)}...` : claim);
  const getStatusLabel = (position: PositionRow) => {
    const now = Math.floor(Date.now() / 1000);
    if (!position.settled && Number(position.deadline) < now) return "EXPIRED";
    if (!position.settled) return "OPEN";
    return isWin(position) ? "SETTLED WON" : "SETTLED LOST";
  };
  const getStatusStyles = (position: PositionRow) => {
    const now = Math.floor(Date.now() / 1000);
    const expired = !position.settled && Number(position.deadline) < now;
    const won = position.settled && isWin(position);
    const color = position.settled ? (won ? "var(--green)" : "var(--red)") : expired ? "var(--muted)" : "var(--green)";
    const background = position.settled ? (won ? "var(--green-dim)" : "var(--red-dim)") : expired ? "var(--surface2)" : "rgba(0,194,120,0.08)";
    return { color, background };
  };
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
              background: metrics.winRate > 50 ? "var(--green-dim)" : "var(--red-dim)",
              color: metrics.winRate > 50 ? "var(--green)" : "var(--red)",
              fontSize: "11px",
              fontWeight: 700,
            }}>
              {metrics.winRate}% win rate
            </span>
          </div>

          <div style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 800, color: metrics.netOKB >= BigInt(0) ? "var(--green)" : "var(--red)", letterSpacing: "-0.03em" }}>
            {metrics.netOKB >= BigInt(0) ? "+" : ""}{formatOKB(metrics.netOKB)} OKB
          </div>
          <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>
            Last activity: {metrics.lastActivity ? metrics.lastActivity.toLocaleDateString() : "—"}
          </div>

          <div style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "var(--surface2)" }}>
              <div style={{ width: `${metrics.winRate}%`, background: "var(--green)" }} />
              <div style={{ width: `${lossRate}%`, background: "var(--red)" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0", overflowX: "auto", marginBottom: "16px", whiteSpace: "nowrap" }} className="no-scrollbar">
        <button onClick={() => setActiveTab("positions")} style={tabStyle("positions")}>Positions</button>
        <button onClick={() => setActiveTab("backing")} style={tabStyle("backing")}>Backing</button>
        <button onClick={() => setActiveTab("fading")} style={tabStyle("fading")}>Fading</button>
      </div>

      {historyLimited && (
        <div style={{ marginBottom: "12px", color: "var(--muted)", fontSize: "13px" }}>
          Connect to see full position history
        </div>
      )}

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
      ) : filteredAndSummarized.length === 0 ? (
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
              {filteredAndSummarized.map((position, index) => {
                const rowBg = index % 2 === 0 ? "var(--surface)" : "var(--surface2)";
                const sideColor = position.role === "Faded" ? "var(--red)" : "var(--green)";
                const payout = (position.stake * BigInt(95)) / BigInt(100);
                const statusStyles = getStatusStyles(position);
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
                      {truncateMarket(position.claim)}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: sideColor }}>
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
                      {getStatusLabel(position)}
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
      )}
    </div>
  );
}
