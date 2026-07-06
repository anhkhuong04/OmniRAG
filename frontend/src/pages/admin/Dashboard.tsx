import React, { useEffect, useState } from "react";
import { adminGetSystemKpis } from "../../services/api";
import type { AdminSystemKpis } from "../../services/api";
import {
  Users,
  Activity,
  DollarSign,
  FileText,
  Briefcase
} from "lucide-react";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminSystemKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadKpis() {
      try {
        const data = await adminGetSystemKpis();
        setKpis(data);
      } catch (err) {
        setError("Failed to load System KPIs.");
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", color: "var(--danger)" }}>
        {error}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 24px", color: "var(--text-heading)" }}>
        Platform Overview
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "24px",
        marginBottom: "32px"
      }}>
        <KpiCard
          title="Total Workspaces"
          value={kpis.total_workspaces}
          subValue={`${kpis.active_workspaces} active`}
          icon={<Briefcase size={24} />}
          color="#3B82F6"
        />
        <KpiCard
          title="Total Users"
          value={kpis.total_users}
          subValue={`${kpis.active_users} active`}
          icon={<Users size={24} />}
          color="#10B981"
        />
        <KpiCard
          title="Total Documents"
          value={kpis.total_documents}
          subValue="Ingested"
          icon={<FileText size={24} />}
          color="#8B5CF6"
        />
        <KpiCard
          title="Monthly Recurring Revenue"
          value={`$${kpis.mrr_usd.toFixed(2)}`}
          subValue="Active Subscriptions"
          icon={<DollarSign size={24} />}
          color="#F59E0B"
        />
        <KpiCard
          title="Total AI Cost"
          value={`$${kpis.total_ai_cost_usd.toFixed(4)}`}
          subValue="OpenAI / LLM API"
          icon={<Activity size={24} />}
          color="#EF4444"
        />
      </div>
      
      <style>{`
        .admin-kpi-card {
          background: var(--color-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .admin-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.2);
        }
        .admin-kpi-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 100%;
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function KpiCard({ title, value, subValue, icon, color }: { title: string, value: string | number, subValue: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="admin-kpi-card">
      <div style={{
        background: `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`,
        color: color,
        padding: "16px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${color}33`,
        boxShadow: `0 0 20px ${color}15`
      }}>
        {icon}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title}
        </h3>
        <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 8px", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-light)", display: "flex", alignItems: "center", gap: "6px" }}>
          {subValue}
        </div>
      </div>
    </div>
  );
}
