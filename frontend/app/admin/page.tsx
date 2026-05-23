"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { THECALL_ADDRESS, THECALL_ABI } from "../../lib/contracts";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [callId, setCallId] = useState("");
  const [callerWon, setCallerWon] = useState(true);

  const { data: callCount } = useReadContract({
    address: THECALL_ADDRESS as `0x${string}`,
    abi: THECALL_ABI,
    functionName: "callCount",
  });

  const { data: callData } = useReadContract({
    address: THECALL_ADDRESS as `0x${string}`,
    abi: THECALL_ABI,
    functionName: "getCall",
    args: [BigInt(callId || "0")],
    query: { enabled: !!callId },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const callCountText = callCount ? callCount.toString() : "...";

  const handleSettle = () => {
    if (!callId) return;
    writeContract({
      address: THECALL_ADDRESS as `0x${string}`,
      abi: THECALL_ABI,
      functionName: "settle",
      args: [BigInt(callId), callerWon],
    });
  };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
        Admin — Settle Calls
      </h1>
      <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "28px" }}>
        Oracle wallet only. Settle calls after match results are confirmed.
      </p>

      {!isConnected ? (
        <p style={{ color: "var(--muted)" }}>Connect your oracle wallet to continue.</p>
      ) : (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            Total calls on contract: <strong style={{ color: "var(--text)" }}>{callCountText}</strong>
          </div>

          {/* Call ID */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
              CALL ID
            </label>
            <input
              type="number"
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              placeholder="0"
              min="0"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Call preview */}
          {!!callData && (
            <div style={{
              background: "var(--surface2)",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "13px",
              color: "var(--text)",
            }}>
              <p><strong>Claim:</strong> {(callData as any)[1]}</p>
              <p style={{ marginTop: "4px", color: "var(--muted)" }}>
                <strong>Settled:</strong> {(callData as any)[6] ? "Yes" : "No"}
              </p>
            </div>
          )}

          {/* Outcome */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted)", display: "block", marginBottom: "8px" }}>
              OUTCOME
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setCallerWon(true)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${callerWon ? "var(--green)" : "var(--border)"}`,
                  background: callerWon ? "rgba(0,194,120,0.15)" : "transparent",
                  color: callerWon ? "var(--green)" : "var(--muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Caller Won ✓
              </button>
              <button
                onClick={() => setCallerWon(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${!callerWon ? "var(--red)" : "var(--border)"}`,
                  background: !callerWon ? "rgba(242,54,69,0.15)" : "transparent",
                  color: !callerWon ? "var(--red)" : "var(--muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Faders Won ✗
              </button>
            </div>
          </div>

          {/* Settle button */}
          <button
            onClick={handleSettle}
            disabled={!callId || isPending || isConfirming}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: !callId ? "var(--surface2)" : "var(--blue)",
              color: !callId ? "var(--muted)" : "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: !callId ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Settling..." : isSuccess ? "✓ Settled!" : "Settle Call"}
          </button>

          {isSuccess && (
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--green)" }}>
              Call settled successfully.
            </p>
          )}
        </div>
      )}
    </div>
  );
}