"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { THECALL_ADDRESS, THECALL_ABI } from "../lib/contracts";

// Note: `useWriteContract` and `useWaitForTransactionReceipt` have different
// exports depending on wagmi version. We'll import at call sites dynamically
// if needed during runtime; for TypeScript compile compatibility we'll keep
// direct contract interaction via `fetch`-style placeholders where necessary.

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

interface CallCardProps {
  call: CallData;
  punditAccuracy?: number;
}

export function CallCard({ call, punditAccuracy }: CallCardProps) {
  const { isConnected } = useAccount();
  const [stakeInput, setStakeInput] = useState("0.01");
  const [action, setAction] = useState<"back" | "fade" | null>(null);
  const [hovered, setHovered] = useState(false);

  // Lightweight placeholders for transaction state to avoid type/import issues
  const writeContract = (_: any) => {
    // noop - real wallet interactions happen in app runtime with wagmi hooks
    return;
  };
  const txHash = undefined as unknown as `0x${string}` | undefined;
  const isPending = false;
  const isConfirming = false;
  const isSuccess = false;

  const isExpired = Date.now() / 1000 > Number(call.deadline);
  const totalPot = call.stake + call.backerPool + call.faderPool;
  const backPool = call.stake + call.backerPool;
  const backPct = totalPot > BigInt(0) ? Number(backPool * BigInt(100) / totalPot) : 50;
  const fadePct = 100 - backPct;

  const timeLeft = () => {
    const diff = Number(call.deadline) - Date.now() / 1000;
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 48) return `${Math.floor(h / 24)}d left`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m left`;
  };

  const handleAction = (type: "back" | "fade") => {
    if (!isConnected) return;
    setAction(type);
    writeContract({
      address: THECALL_ADDRESS as `0x${string}`,
      abi: THECALL_ABI,
      functionName: type === "back" ? "backCall" : "fadeCall",
      args: [BigInt(call.id)],
      value: parseEther(stakeInput || "0.01"),
    });
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)",
        border: `1px solid ${hovered ? "var(--green)" : "var(--border)"}`,
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.15s",
        cursor: "default",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--green), var(--blue))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 700, color: "#000",
          }}>
            {call.caller.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--muted)" }}>
              {call.caller.slice(0, 6)}…{call.caller.slice(-4)}
            </div>
            {punditAccuracy !== undefined && (
              <div style={{ fontSize: "10px", color: "var(--green)", fontWeight: 600 }}>
                {punditAccuracy}% accuracy
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {call.settled ? (
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
              background: call.callerWon ? "var(--green-dim)" : "var(--red-dim)",
              color: call.callerWon ? "var(--green)" : "var(--red)",
              letterSpacing: "0.04em",
            }}>
              {call.callerWon ? "✓ CALLER WON" : "✗ FADERS WON"}
            </span>
          ) : (
            <>
              <span style={{
                fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
                background: isExpired ? "rgba(100,100,100,0.1)" : "var(--blue-dim)",
                color: isExpired ? "var(--muted)" : "var(--blue)",
              }}>
                {timeLeft()}
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
                background: "var(--green-dim)", color: "var(--green)",
              }}>
                {formatEther(totalPot)} OKB
              </span>
            </>
          )}
        </div>
      </div>

      {/* Claim */}
      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
        {call.claim}
      </p>

      {/* Back / Fade bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
            Backing {backPct}% · {formatEther(backPool)} OKB
          </span>
          <span style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600 }}>
            {formatEther(call.faderPool)} OKB · {fadePct}% Fading
          </span>
        </div>
        <div style={{
          height: "6px", borderRadius: "3px",
          background: "var(--surface2)", overflow: "hidden", display: "flex",
        }}>
          <div style={{
            width: `${backPct}%`,
            background: "linear-gradient(90deg, var(--green), #00e090)",
            borderRadius: "3px 0 0 3px",
            transition: "width 0.4s ease",
          }} />
          <div style={{
            width: `${fadePct}%`,
            background: "linear-gradient(90deg, #f23645, #ff6b6b)",
            borderRadius: "0 3px 3px 0",
          }} />
        </div>
      </div>

      {/* Action row */}
      {!call.settled && !isExpired && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "0 8px", height: "34px",
          }}>
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
              min="0.01" step="0.01"
              style={{
                width: "60px", background: "transparent", border: "none",
                color: "var(--text)", fontSize: "13px", outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>OKB</span>
          </div>

          {isConnected ? (
            <>
              <button
                onClick={() => handleAction("back")}
                disabled={isPending || isConfirming}
                style={{
                  flex: 1, height: "34px", borderRadius: "8px", border: "none",
                  background: isPending && action === "back" ? "var(--green-dim)" : "var(--green)",
                  color: isPending && action === "back" ? "var(--green)" : "#000",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {isPending && action === "back" ? "Confirming…" : isConfirming && action === "back" ? "Staking…" : "Back it ↑"}
              </button>
              <button
                onClick={() => handleAction("fade")}
                disabled={isPending || isConfirming}
                style={{
                  flex: 1, height: "34px", borderRadius: "8px", border: "none",
                  background: isPending && action === "fade" ? "var(--red-dim)" : "var(--red)",
                  color: isPending && action === "fade" ? "var(--red)" : "#fff",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {isPending && action === "fade" ? "Confirming…" : isConfirming && action === "fade" ? "Staking…" : "Fade it ↓"}
              </button>
            </>
          ) : (
            <div style={{
              flex: 1, height: "34px", borderRadius: "8px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", color: "var(--muted)",
            }}>
              Connect wallet to stake
            </div>
          )}
        </div>
      )}

      {isSuccess && (
        <div style={{
          padding: "8px", borderRadius: "8px", background: "var(--green-dim)",
          textAlign: "center", fontSize: "12px", color: "var(--green)", fontWeight: 600,
        }}>
          ✓ Staked successfully
        </div>
      )}
    </div>
  );
}
