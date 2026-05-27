"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";
import { THECALL_ADDRESS, THECALL_ABI } from "../../lib/contracts";
import { switchToXLayerTestnet } from "../../lib/switchNetwork";
import { validateClaimWithAI } from "../../lib/validateClaim";

const WORLD_CUP_MATCHES = [
  { id: "wc_final", label: "World Cup 2026 — Final", deadline: new Date("2026-07-19T20:00:00Z") },
  { id: "wc_sf1", label: "World Cup 2026 — Semi Final 1", deadline: new Date("2026-07-14T20:00:00Z") },
  { id: "wc_sf2", label: "World Cup 2026 — Semi Final 2", deadline: new Date("2026-07-15T20:00:00Z") },
  { id: "wc_gs1", label: "World Cup 2026 — Group Stage Day 1", deadline: new Date("2026-06-11T20:00:00Z") },
  { id: "wc_topscorer", label: "World Cup 2026 — Golden Boot", deadline: new Date("2026-07-19T20:00:00Z") },
  { id: "wc_winner", label: "World Cup 2026 — Tournament Winner", deadline: new Date("2026-07-19T20:00:00Z") },
];

const QUALIFIED_TEAMS = [
  "argentina", "france", "brazil", "england", "spain", "germany",
  "portugal", "netherlands", "belgium", "croatia", "morocco", "senegal",
  "japan", "south korea", "usa", "mexico", "canada", "ecuador",
  "uruguay", "colombia", "chile", "peru", "nigeria", "ghana",
  "cameroon", "ivory coast", "egypt", "algeria", "saudi arabia",
  "iran", "australia", "new zealand", "poland", "czech republic",
  "switzerland", "denmark", "sweden", "austria", "turkey", "ukraine",
  "serbia", "hungary", "scotland", "wales", "ireland",
];

function validateClaim(claim: string): { valid: boolean; reason: string } {
  if (claim.trim().length < 10) {
    return { valid: false, reason: "Your call is too short. Be more specific." };
  }

  const lower = claim.toLowerCase();

  const unqualifiedMentions = [
    "tanzania", "zimbabwe", "kenya", "ethiopia", "uganda", "rwanda",
    "somalia", "sudan", "chad", "niger", "mali", "burkina",
    "india", "pakistan", "bangladesh", "nepal", "sri lanka",
    "china", "thailand", "vietnam", "indonesia", "malaysia",
    "russia", "north korea", "cuba", "haiti",
  ];

  for (const team of unqualifiedMentions) {
    if (lower.includes(team)) {
      return {
        valid: false,
        reason: `${team.charAt(0).toUpperCase() + team.slice(1)} did not qualify for World Cup 2026. Please make a valid call.`,
      };
    }
  }

  const spamWords = ["test", "asdf", "hello", "hi ", "lol", "haha", "random"];
  for (const word of spamWords) {
    if (lower.includes(word)) {
      return { valid: false, reason: "This doesn't look like a real football call. Make a genuine prediction." };
    }
  }

  return { valid: true, reason: "" };
}

export default function MakeCallPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [claim, setClaim] = useState("");
  const [stake, setStake] = useState("0.01");
  const [selectedMatch, setSelectedMatch] = useState(WORLD_CUP_MATCHES[0]);
  const [validationError, setValidationError] = useState("");
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [validating, setValidating] = useState(false);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isCorrectNetwork = chainId === 1952;

  const handleSubmit = async () => {
    if (!claim.trim() || !isConnected) return;

    setValidating(true);
    const validation = await validateClaimWithAI(claim);
    setValidating(false);

    if (!validation.valid) {
      setValidationError(validation.reason);
      return;
    }
    setValidationError("");

    if (!isCorrectNetwork) {
      setNetworkSwitching(true);
      const switched = await switchToXLayerTestnet();
      setNetworkSwitching(false);
      if (!switched) return;
    }

    const deadline = BigInt(Math.floor(selectedMatch.deadline.getTime() / 1000));
    writeContract({
      address: THECALL_ADDRESS as `0x${string}`,
      abi: THECALL_ABI,
      functionName: "makeCall",
      args: [claim, deadline],
      value: parseEther(stake || "0.01"),
    });
  };

  if (isSuccess) {
    setTimeout(() => router.push("/feed"), 2000);
  }

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "22px",
        fontWeight: 700,
        color: "var(--text)",
        marginBottom: "6px",
        letterSpacing: "-0.02em",
      }}>
        Make a Call
      </h1>
      <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "28px" }}>
        State your conviction. Stake OKB. Let the world back or fade you.
      </p>

      {!isConnected ? (
        <div style={{
          padding: "32px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: "14px",
        }}>
          Connect your wallet to make a call
        </div>
      ) : (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>

          {/* Network warning */}
          {!isCorrectNetwork && (
            <div style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(0,194,120,0.1)",
              border: "1px solid rgba(0,194,120,0.3)",
              fontSize: "13px",
              color: "var(--green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}>
              <span>Wrong network. Switch to X Layer Testnet to continue.</span>
              <button
                onClick={async () => {
                  setNetworkSwitching(true);
                  await switchToXLayerTestnet();
                  setNetworkSwitching(false);
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  background: "var(--green)",
                  color: "#000",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {networkSwitching ? "Switching..." : "Switch Network"}
              </button>
            </div>
          )}

          {/* Claim input */}
          <div>
            <label style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted)",
              display: "block",
              marginBottom: "6px",
              letterSpacing: "0.06em",
            }}>
              YOUR TAKE
            </label>
            <textarea
              value={claim}
              onChange={(e) => {
                setClaim(e.target.value);
                setValidationError("");
              }}
              placeholder="e.g. Mbappe wins the Golden Boot"
              maxLength={140}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: `1px solid ${validationError ? "var(--red)" : "var(--border)"}`,
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: "14px",
                resize: "none",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
            }}>
              {validationError ? (
                <span style={{ fontSize: "11px", color: "var(--red)" }}>
                  {validationError}
                </span>
              ) : (
                <span />
              )}
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                {claim.length}/140
              </span>
            </div>
          </div>

          {/* Match selector */}
          <div>
            <label style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted)",
              display: "block",
              marginBottom: "6px",
              letterSpacing: "0.06em",
            }}>
              MATCH / EVENT
            </label>
            <select
              value={selectedMatch.id}
              onChange={(e) => {
                const match = WORLD_CUP_MATCHES.find((m) => m.id === e.target.value);
                if (match) setSelectedMatch(match);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
              }}
            >
              {WORLD_CUP_MATCHES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Stake input */}
          <div>
            <label style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted)",
              display: "block",
              marginBottom: "6px",
              letterSpacing: "0.06em",
            }}>
              YOUR STAKE
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                min="0.01"
                step="0.01"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>OKB</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
              Minimum 0.01 OKB. Locked until match settles.
            </p>
          </div>

          {/* Write error */}
          {writeError && (
            <div style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--red-dim)",
              fontSize: "12px",
              color: "var(--red)",
            }}>
              {writeError.message?.slice(0, 120)}...
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!claim.trim() || isPending || isConfirming || isSuccess || networkSwitching || validating}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "none",
              background: !claim.trim() || !isCorrectNetwork ? "var(--surface2)" : "var(--green)",
              color: !claim.trim() || !isCorrectNetwork ? "var(--muted)" : "#000",
              fontSize: "15px",
              fontWeight: 700,
              cursor: !claim.trim() || !isCorrectNetwork ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {validating
              ? "Validating call..."
              : networkSwitching
              ? "Switching network..."
              : isPending
              ? "Confirm in wallet..."
              : isConfirming
              ? "Locking stake..."
              : isSuccess
              ? "Call locked in!"
              : "Lock it in"}
          </button>

          {isSuccess && (
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--green)" }}>
              Your call is live. Redirecting to feed...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
