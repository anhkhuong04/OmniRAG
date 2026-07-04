import React from "react";
import { UsageStatsResponse } from "../services/api";

interface UsageStatsCardProps {
  label: string;
  used: number;
  max: number;          // -1 = unlimited
  unit?: string;
  colorUsed?: string;   // CSS color for the progress bar fill
}

/**
 * UsageStatsCard — displays a usage metric as a labeled progress bar.
 *
 * Shows "X / Y unit" with a gradient progress bar that turns orange near
 * 80% usage and red at 95%.
 */
export function UsageStatsCard({
  label,
  used,
  max,
  unit = "",
  colorUsed = "#3B82F6",
}: UsageStatsCardProps) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
  const barColor = pct >= 95 ? "#ef4444" : pct >= 80 ? "#f97316" : colorUsed;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #E5E7EB",
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>
          {label}
        </span>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
          {used.toLocaleString()}
          {isUnlimited ? (
            <span style={{ fontSize: "13px", fontWeight: 400, color: "#9CA3AF" }}>
              {" "}
              / ∞
            </span>
          ) : (
            <span style={{ fontSize: "13px", fontWeight: 400, color: "#9CA3AF" }}>
              {" "}
              / {max.toLocaleString()} {unit}
            </span>
          )}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#F3F4F6",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        {!isUnlimited && (
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: barColor,
              borderRadius: "99px",
              transition: "width 0.4s ease",
            }}
          />
        )}
      </div>
      {!isUnlimited && (
        <div style={{ marginTop: "6px", fontSize: "11px", color: "#9CA3AF" }}>
          {pct.toFixed(1)}% used
        </div>
      )}
    </div>
  );
}

// ─── Overview grid from UsageStatsResponse ────────────────────────────────────

interface UsageOverviewProps {
  stats: UsageStatsResponse;
}

export function UsageOverview({ stats }: UsageOverviewProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "16px",
      }}
    >
      <UsageStatsCard
        label="Documents"
        used={stats.documents_count}
        max={stats.max_documents}
        colorUsed="#6366F1"
      />
      <UsageStatsCard
        label="Queries this month"
        used={stats.queries_used_this_month}
        max={stats.max_queries_per_month}
        colorUsed="#3B82F6"
      />
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          padding: "20px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "6px" }}>
          Cost this month
        </div>
        <div style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
          ${stats.total_cost_usd_this_month.toFixed(4)}
        </div>
        <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
          {stats.total_prompt_tokens.toLocaleString()} prompt +{" "}
          {stats.total_completion_tokens.toLocaleString()} completion tokens
        </div>
      </div>
      <div
        style={{
          background: `linear-gradient(135deg, ${
            stats.plan_tier === "free" ? "#F0FDF4, #D1FAE5" :
            stats.plan_tier === "pro" ? "#EFF6FF, #DBEAFE" : "#F5F3FF, #EDE9FE"
          })`,
          borderRadius: "14px",
          border: `1px solid ${stats.plan_tier === "free" ? "#BBF7D0" : stats.plan_tier === "pro" ? "#BFDBFE" : "#DDD6FE"}`,
          padding: "20px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280", marginBottom: "6px" }}>
          Current Plan
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
          {stats.plan_name}
        </div>
        <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", textTransform: "capitalize" }}>
          {stats.plan_tier} tier
        </div>
      </div>
    </div>
  );
}

// ─── Usage History Chart ──────────────────────────────────────────────────────

import { UsageHistoryResponse } from "../services/api";

export function UsageHistoryChart({ history }: { history: UsageHistoryResponse }) {
  if (!history || !history.history || history.history.length === 0) {
    return <div style={{ color: "#6B7280", fontSize: "14px" }}>No history available.</div>;
  }

  // Reverse to show oldest to newest left to right
  const data = [...history.history].reverse();
  const maxCost = Math.max(...data.map(d => d.cost_usd), 0.01);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "14px",
      border: "1px solid #E5E7EB",
      padding: "24px",
      marginTop: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#111827" }}>Usage History (Last 6 Months)</h3>
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "200px", paddingBottom: "30px", position: "relative" }}>
        {data.map((point, i) => {
          const heightPct = Math.max((point.cost_usd / maxCost) * 100, 2);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative" }}>
              <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px", fontWeight: 500 }}>
                ${point.cost_usd.toFixed(4)}
              </div>
              
              <div style={{
                width: "100%",
                maxWidth: "60px",
                height: `${heightPct}%`,
                background: "#3B82F6",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.3s ease"
              }} />
              
              <div style={{ position: "absolute", bottom: "-25px", fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                {point.month}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
