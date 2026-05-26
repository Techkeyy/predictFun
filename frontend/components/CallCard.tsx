"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
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
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("0.01");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const deadlineNum = Number(deadline);
  const isExpired = now > deadlineNum;

  if (isExpired && !settled) return null;

  const totalPool = stake + backerPool + faderPool;
  const backerPct = totalPool > BigInt(0) ? Math.round((Number(backerPool + stake) / Number(totalPool)) * 100) : 100;
  const faderPct = 100 - backerPct;
  const daysLeft = Math.max(0, Math.ceil((deadlineNum - now) / 86400));
  const formatOKB = (wei: bigint) => (Number(wei) / 1e18).toFixed(3);
  const backingValue = backerPool + stake;
  const fadingValue = faderPool;

  const getCategoryIcon = () => {
    const lower = claim.toLowerCase();
    if (lower.includes("golden boot") || lower.includes("top scorer") || lower.includes("goal scorer") || lower.includes("most goals")) return "👟";
    if (lower.includes("card") || lower.includes("yellow") || lower.includes("red")) return "🟨";
    if (lower.includes("africa") || lower.includes("african") || lower.includes("ghana") || lower.includes("nigeria") || lower.includes("morocco") || lower.includes("senegal") || lower.includes("egypt") || lower.includes("tunisia") || lower.includes("cameroon") || lower.includes("ivory coast")) return "🌍";
    if (lower.includes("winner") || lower.includes("champion") || lower.includes("trophy") || lower.includes("title") || lower.includes("cup")) return "🏆";
    return "⚽";
  };

  const goToPundit = () => {
    router.push(`/pundit/${caller}`);
  };

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
  const actionButtonStyle = {
    width: isMobile ? "100%" : "84px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "none",
    fontSize: "12px",
    fontWeight: 800,
    cursor: isPending ? "not-allowed" : "pointer",
    letterSpacing: "0.02em",
  };

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "18px",
      padding: isMobile ? "14px" : "16px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0 }}>
          <button
            type="button"
            onClick={goToPundit}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {caller.slice(2, 4).toUpperCase()}
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: isMobile ? "18px" : "20px" }}>{getCategoryIcon()}</span>
              <button
                type="button"
                onClick={goToPundit}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  textAlign: "left",
                  fontSize: isMobile ? "15px" : "16px",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.25,
                  cursor: "pointer",
                }}
              >
                {claim}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {isExpired ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: callerWon ? "var(--green)" : "var(--red)" }}>
                  {settled ? (callerWon ? "Settled winner" : "Settled loser") : "Closed"}
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "var(--green)" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)" }} />
                  LIVE
                </span>
              )}

              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                {daysLeft}d left
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Bookmark market"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Bookmark size={15} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Stake</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={isPending}
            style={{
              width: "90px",
              padding: "7px 8px",
              borderRadius: "999px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "12px",
              fontWeight: 700,
              outline: "none",
              textAlign: "right",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>OKB</span>
        </div>

        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)" }}>Back it</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{backerPct}%</span>
            <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {formatOKB(backingValue)} OKB staked
            </span>
          </div>

          <button
            onClick={handleBack}
            disabled={isPending}
            style={{
              ...actionButtonStyle,
              background: "var(--green)",
              color: "#000",
            }}
          >
            Back it
          </button>
        </div>

        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--red)" }}>Fade it</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{faderPct}%</span>
            <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {formatOKB(fadingValue)} OKB staked
            </span>
          </div>

          <button
            onClick={handleFade}
            disabled={isPending}
            style={{
              ...actionButtonStyle,
              background: "var(--red)",
              color: "#fff",
            }}
          >
            Fade it
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", paddingTop: "2px" }}>
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
          {formatOKB(totalPool)} OKB Vol · World Cup 2026
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {settled ? (
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              color: callerWon ? "var(--green)" : "var(--red)",
              padding: "4px 8px",
              borderRadius: "999px",
              background: callerWon ? "var(--green-dim)" : "var(--red-dim)",
            }}>
              {callerWon ? "CALLER WON" : "FADERS WON"}
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "var(--green)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)" }} />
              LIVE
            </span>
          )}
        </div>
      </div>

      {txStatus === "success" && (
        <div style={{
          padding: "8px 12px",
          borderRadius: "8px",
          background: "var(--green-dim)",
          border: "1px solid rgba(59,130,246,0.3)",
          fontSize: "12px",
          color: "var(--green)",
          fontWeight: 600,
        }}>
          Transaction submitted! Check your wallet for confirmation.
        </div>
      )}
      {txStatus === "error" && (
        <div style={{
          padding: "8px 12px",
          borderRadius: "8px",
          background: "var(--red-dim)",
          border: "1px solid rgba(242,54,69,0.3)",
          fontSize: "12px",
          color: "var(--red)",
          fontWeight: 600,
        }}>
          Transaction failed. Check MetaMask and make sure you're on X Layer Testnet.
        </div>
      )}
    </div>
  );
}
