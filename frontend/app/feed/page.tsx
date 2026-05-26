"use client";

import { Suspense, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { THECALL_ABI, THECALL_ADDRESS } from "../../lib/contracts";
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

        setCalls(fetched.reverse());
      } catch (error) {
        console.error("Failed to load feed:", error);
      }
      setLoading(false);
    };

    load();
  }, [publicClient]);

  const now = Math.floor(Date.now() / 1000);
  const filteredCalls = calls.filter((call) => {
    const lower = call.claim.toLowerCase();

    if (statusFilter === "open") {
      if (call.settled || Number(call.deadline) < now) return false;
    }

    if (statusFilter === "settled") {
      if (!call.settled) return false;
    }

    if (activeCat === "all") return true;
    if (activeCat === "open") return !call.settled && Number(call.deadline) >= now;
    if (activeCat === "settled") return call.settled;

    const keywords = CATEGORY_KEYWORDS[activeCat] || [];
    return keywords.some((keyword) => lower.includes(keyword));
  });

  const setStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    const query = params.toString();
    router.push(query ? `/feed?${query}` : "/feed");
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Hot Takes</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>
            Back or fade the boldest World Cup predictions on X Layer
          </p>
        </div>
        <Link href="/make-call" style={{
          padding: "10px 20px", borderRadius: "8px", background: "var(--green)",
          color: "#000", fontSize: "14px", fontWeight: 700, textDecoration: "none",
        }}>
          + Make a Call
        </Link>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
        {(["all", "open", "settled"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatus(status)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: `1px solid ${statusFilter === status ? "var(--text)" : "var(--border)"}`,
              background: statusFilter === status ? "var(--text)" : "transparent",
              color: statusFilter === status ? "var(--bg)" : "var(--muted)",
              fontSize: "12px",
              fontWeight: statusFilter === status ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} Calls
            {status === "all" && calls.length > 0 && (
              <span style={{
                marginLeft: "6px", fontSize: "10px", padding: "1px 5px", borderRadius: "10px",
                background: "var(--green-dim)", color: "var(--green)",
              }}>
                {calls.length}
              </span>
            )}
          </button>
        ))}
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
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "12px",
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
