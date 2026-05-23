"use client";

import { useState } from "react";
import { useReadContracts } from "wagmi";
import { THECALL_ADDRESS, THECALL_ABI } from "../../lib/contracts";
import { CallCard } from "../../components/CallCard";
import Link from "next/link";

type FilterType = "all" | "open" | "settled";

export default function FeedPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const callIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const results = useReadContracts({
    contracts: callIds.map((id) => ({
      address: THECALL_ADDRESS as `0x${string}`,
      abi: THECALL_ABI as any,
      functionName: "getCall" as const,
      args: [BigInt(id)] as const,
    })),
  });

  const calls = (results.data ?? [])
    .map((result, i) => {
      if (result.status !== "success" || !result.result) return null;
      const [caller, claim, stake, backerPool, faderPool, deadline, settled, callerWon] =
        result.result as [string, string, bigint, bigint, bigint, bigint, boolean, boolean];
      if (!caller || caller === "0x0000000000000000000000000000000000000000") return null;
      return { id: i, caller, claim, stake, backerPool, faderPool, deadline, settled, callerWon };
    })
    .filter(Boolean) as any[];

  const filtered = calls.filter((c) => {
    if (filter === "open") return !c.settled && Date.now() / 1000 < Number(c.deadline);
    if (filter === "settled") return c.settled;
    return true;
  });

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all", label: "All Calls" },
    { id: "open", label: "Open" },
    { id: "settled", label: "Settled" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}>
            Hot Takes
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Back or fade the boldest World Cup predictions on X Layer
          </p>
        </div>
        <Link href="/make-call" style={{
          padding: "9px 20px",
          borderRadius: "8px",
          background: "var(--green)",
          color: "#000",
          fontSize: "13px",
          fontWeight: 700,
        }}>
          + Make a Call
        </Link>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: `1px solid ${filter === f.id ? "var(--text)" : "var(--border)"}`,
              background: filter === f.id ? "var(--text)" : "transparent",
              color: filter === f.id ? "var(--bg)" : "var(--muted)",
              fontSize: "12px",
              fontWeight: filter === f.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.label}
            {f.id === "all" && calls.length > 0 && (
              <span style={{
                marginLeft: "6px",
                fontSize: "10px",
                padding: "1px 5px",
                borderRadius: "10px",
                background: "var(--green-dim)",
                color: "var(--green)",
              }}>
                {calls.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {results.isLoading ? (
        <div style={{
          textAlign: "center",
          padding: "80px 0",
          color: "var(--muted)",
          fontSize: "14px",
        }}>
          Loading calls from X Layer...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "16px" }}>
            {filter === "open"
              ? "No open calls right now."
              : filter === "settled"
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
          {filtered.map((call: any) => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
