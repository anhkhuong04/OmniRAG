import React, { useEffect, useState, useCallback } from "react";
import { getWorkspaceUsage, getWorkspaceUsageHistory } from "../../services/api";
import type { UsageStatsResponse, UsageHistoryResponse } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { UsageOverview, UsageHistoryChart } from "../../components/UsageStatsCard";

export default function Overview() {
  const { currentWorkspaceId } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryResponse | null>(null);

  const refreshUsage = useCallback(async () => {
    if (!currentWorkspaceId) return;
    try {
      const stats = await getWorkspaceUsage(currentWorkspaceId);
      setUsageStats(stats);
      
      const history = await getWorkspaceUsageHistory(currentWorkspaceId);
      setUsageHistory(history);
    } catch (err) {
      console.error("Failed to load usage stats or history", err);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Overview</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Monitor your workspace usage and limits.</p>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Usage & Quotas</h2>
      {usageStats ? <UsageOverview stats={usageStats} /> : <div style={{ color: "var(--text-muted)" }}>Loading stats...</div>}
      
      {usageHistory && <UsageHistoryChart history={usageHistory} />}
    </div>
  );
}
