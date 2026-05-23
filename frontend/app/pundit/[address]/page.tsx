"use client";

import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { PUNDITCARD_ADDRESS, PUNDITCARD_ABI } from "../../../lib/contracts";
import Link from "next/link";

export default function PunditPage() {
  const params = useParams();
  const address = params.address as string;

  const { data: stats, isLoading } = useReadContract({
    address: PUNDITCARD_ADDRESS as `0x${string}`,
    abi: PUNDITCARD_ABI,
    functionName: "getStats",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  const { data: hasProfile } = useReadContract({
    address: PUNDITCARD_ADDRESS as `0x${string}`,
    abi: PUNDITCARD_ABI,
    functionName: "hasProfile",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  const shortAddress = address
    ? address.slice(0, 6) + "..." + address.slice(-4)
    : "";

  const initials = address ? address.slice(2, 4).toUpperCase() : "??";

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
        Loading pundit card...
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--muted)", marginBottom: "16px", fontSize: "15px" }}>
          This address hasn't made a call yet.
        </p>
        <Link
          href="/make-call"
          style={{
            background: "var(--green)",
            color: "#000",
            padding: "10px 24px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Make your first call
        </Link>
      </div>
    );
  }

  const s = stats as unknown as bigint[] | undefined;
  const [wins = BigInt(0), losses = BigInt(0), totalStaked = BigInt(0), biggestPot = BigInt(0), streak = BigInt(0), accuracy = BigInt(0)] = s ?? [];

  const total = Number(wins) + Number(losses);
  const accuracyNum = Number(accuracy);
  const winsNum = Number(wins);
  const lossesNum = Number(losses);
  const streakNum = Number(streak);

  const getRank = (acc: number, total: number) => {
    if (total < 3) return { label: "Rookie", color: "var(--muted)" };
    if (acc >= 80) return { label: "Elite Pundit", color: "#FFD700" };
    if (acc >= 65) return { label: "Sharp", color: "var(--green)" };
    if (acc >= 50) return { label: "Decent", color: "var(--blue)" };
    return { label: "Fading Fast", color: "var(--red)" };
  };

  const rank = getRank(accuracyNum, total);

  const shareText = `I'm a ${rank.label} on PredictFun 🔥\n${accuracyNum}% accuracy | ${winsNum}W ${lossesNum}L | ${streakNum} streak\n\nCan you beat my record?\nthecall.xyz/pundit/${address}\n\n#PredictFun #WorldCup2026 #XLayer @XLayerOfficial`;

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>

      {/* Card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d2818 0%, #0d1a2e 100%)",
            padding: "28px 24px 20px",
            position: "relative",
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em" }}>
              PREDICTFUN
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
              X Layer · World Cup 2026
            </span>
          </div>

          {/* Avatar + identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--green), var(--blue))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
                color: "#000",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontFamily: "monospace", color: "rgba(255,255,255,0.9)", marginBottom: "4px" }}>
                {shortAddress}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.1)",
                  color: rank.color,
                }}
              >
                {rank.label}
              </span>
            </div>
          </div>

          {/* Big accuracy */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              {accuracyNum}%
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
              accuracy
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            background: "var(--border)",
          }}
        >
          {[
            { label: "Calls Won", value: winsNum.toString(), color: "var(--green)" },
            { label: "Calls Lost", value: lossesNum.toString(), color: "var(--red)" },
            { label: "Hot Streak", value: `${streakNum} 🔥`, color: "var(--text)" },
            { label: "Total Calls", value: total.toString(), color: "var(--text)" },
            { label: "Total Staked", value: `${formatEther(totalStaked)} OKB`, color: "var(--text)" },
            { label: "Biggest Pot", value: `${formatEther(biggestPot)} OKB`, color: "#FFD700" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface)",
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Share button */}
        <div style={{ padding: "16px 20px" }}>
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "var(--green)",
              color: "#000",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Share my card on X 𝕏
          </button>
        </div>
      </div>

      {/* Back to feed */}
      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Link
          href="/feed"
          style={{ fontSize: "13px", color: "var(--muted)" }}
        >
          ← Back to feed
        </Link>
      </div>
    </div>
  );
}
