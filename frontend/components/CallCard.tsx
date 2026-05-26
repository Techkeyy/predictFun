"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { THECALL_ADDRESS, THECALL_ABI } from "../lib/contracts";

interface CallCardProps {
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

export function CallCard({
  id,
  caller,
  claim,
  stake,
  backerPool,
  faderPool,
  deadline,
  settled,
  callerWon,
}: CallCardProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("0.01");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const totalPool = stake + backerPool + faderPool;
  const backerPct = totalPool > BigInt(0) ? Math.round(Number((backerPool + stake) * BigInt(100)) / Number(totalPool)) : 100;
  const faderPct = 100 - backerPct;
  const now = Math.floor(Date.now() / 1000);
  const deadlineNum = Number(deadline);
  const daysLeft = Math.max(0, Math.ceil((deadlineNum - now) / 86400));
  const isExpired = now > deadlineNum;

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatOKB = (wei: bigint) => (Number(wei) / 1e18).toFixed(3);

  const clearStatus = () => {
    window.setTimeout(() => setTxStatus("idle"), 3000);
  };

  const handleBack = async () => {
    if (!address) return alert("Connect your wallet first");
    if (isExpired) return alert("This call has expired");
    if (settled) return alert("This call is already settled");
    if (Number.parseFloat(amount) < 0.01) return alert("Minimum stake is 0.01 OKB");

    try {
      setTxStatus("pending");
      await writeContractAsync({
        address: THECALL_ADDRESS as `0x${string}`,
        abi: THECALL_ABI,
        functionName: "backCall",
        args: [BigInt(id)],
        value: parseEther(amount),
      });
      setTxStatus("success");
      clearStatus();
    } catch (error) {
      console.error("Back failed:", error);
      setTxStatus("error");
      clearStatus();
    }
  };

  const handleFade = async () => {
    if (!address) return alert("Connect your wallet first");
    if (isExpired) return alert("This call has expired");
    if (settled) return alert("This call is already settled");
    if (Number.parseFloat(amount) < 0.01) return alert("Minimum stake is 0.01 OKB");

    try {
      setTxStatus("pending");
      await writeContractAsync({
        address: THECALL_ADDRESS as `0x${string}`,
        abi: THECALL_ABI,
        functionName: "fadeCall",
        args: [BigInt(id)],
        value: parseEther(amount),
      });
      setTxStatus("success");
      clearStatus();
    } catch (error) {
      console.error("Fade failed:", error);
      setTxStatus("error");
      clearStatus();
    }
  };

  const isPending = txStatus === "pending";

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "50%",
            background: "var(--green)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#000",
          }}>
            {caller.slice(2, 4).toUpperCase()}
          </div>
          <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--muted)" }}>
            {shortAddr(caller)}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {settled ? (
            <span style={{
              fontSize: "11px", fontWeight: 700,
              color: callerWon ? "var(--green)" : "var(--red)",
              padding: "2px 8px", borderRadius: "4px",
              background: callerWon ? "var(--green-dim)" : "var(--red-dim)",
            }}>
              {callerWon ? "CALLER WON" : "FADERS WON"}
            </span>
          ) : isExpired ? (
            <span style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600 }}>Expired</span>
          ) : (
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{daysLeft}d left</span>
          )}
          <span style={{
            fontSize: "11px", fontWeight: 600, color: "var(--green)",
            padding: "2px 8px", borderRadius: "4px", background: "var(--green-dim)",
          }}>
            {formatOKB(stake)} OKB
          </span>
        </div>
      </div>

      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", lineHeight: 1.4, margin: 0 }}>
        {claim}
      </p>

      <div>
        <div style={{
          height: "6px", borderRadius: "3px", background: "var(--surface2)",
          overflow: "hidden", display: "flex",
        }}>
          <div style={{ width: `${backerPct}%`, background: "var(--green)", transition: "width 0.3s ease" }} />
          <div style={{ width: `${faderPct}%`, background: "var(--red)", transition: "width 0.3s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>
            Backing {backerPct}% · {formatOKB(backerPool + stake)} OKB
          </span>
          <span style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600 }}>
            {formatOKB(faderPool)} OKB · {faderPct}% Fading
          </span>
        </div>
      </div>

      {!settled && !isExpired && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={isPending}
            style={{
              width: "80px", padding: "8px 10px", borderRadius: "8px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: "13px", fontWeight: 600,
              outline: "none", textAlign: "right",
            }}
          />
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>OKB</span>

          <button
            onClick={handleBack}
            disabled={isPending}
            style={{
              flex: 1, minWidth: "110px", padding: "9px 0", borderRadius: "8px", fontSize: "13px",
              fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
              background: isPending ? "var(--surface2)" : "var(--green)",
              color: isPending ? "var(--muted)" : "#000", border: "none",
            }}
          >
            {isPending ? "Pending..." : "Back it ↑"}
          </button>

          <button
            onClick={handleFade}
            disabled={isPending}
            style={{
              flex: 1, minWidth: "110px", padding: "9px 0", borderRadius: "8px", fontSize: "13px",
              fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
              background: isPending ? "var(--surface2)" : "var(--red)",
              color: isPending ? "var(--muted)" : "#fff", border: "none",
            }}
          >
            {isPending ? "Pending..." : "Fade it ↓"}
          </button>
        </div>
      )}

      {txStatus === "success" && (
        <div style={{
          padding: "8px 12px", borderRadius: "8px", background: "var(--green-dim)",
          border: "1px solid rgba(0,194,120,0.3)", fontSize: "12px",
          color: "var(--green)", fontWeight: 600,
        }}>
          Transaction submitted! Check your wallet for confirmation.
        </div>
      )}
      {txStatus === "error" && (
        <div style={{
          padding: "8px 12px", borderRadius: "8px", background: "var(--red-dim)",
          border: "1px solid rgba(242,54,69,0.3)", fontSize: "12px",
          color: "var(--red)", fontWeight: 600,
        }}>
          Transaction failed. Check MetaMask and make sure you're on X Layer Testnet.
        </div>
      )}
    </div>
  );
}
