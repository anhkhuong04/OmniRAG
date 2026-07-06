import React, { useEffect, useState, useCallback } from "react";
import { adminGetPlans, adminUpdatePlan } from "../../services/api";

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminGetPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleEditClick = (plan: any) => {
    setEditingId(plan.id);
    setEditForm({
      display_name: plan.display_name,
      price_usd_monthly: plan.price_usd_monthly,
      max_documents: plan.max_documents,
      max_queries_per_month: plan.max_queries_per_month,
      max_file_size_mb: plan.max_file_size_mb
    });
  };

  const handleSave = async (id: string) => {
    try {
      await adminUpdatePlan(id, editForm);
      setEditingId(null);
      fetchPlans();
    } catch (err) {
      alert("Failed to update plan");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Manage Plans</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "15px", margin: 0 }}>Configure billing tiers and usage quotas for Workspaces.</p>
        </div>
      </div>

      <div className="admin-glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Display Name</th>
              <th>Price ($)</th>
              <th>Max Docs</th>
              <th>Max Queries</th>
              <th>Max File Size (MB)</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-main)" }}>
                  {p.tier}
                  {p.tier === "pro" && <span style={{ marginLeft: "8px", color: "var(--color-primary)" }}>✦</span>}
                </td>
                
                {editingId === p.id ? (
                  <>
                    <td style={{ padding: "12px 24px" }}><input className="admin-input" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} /></td>
                    <td style={{ padding: "12px 24px" }}><input type="number" className="admin-input" value={editForm.price_usd_monthly} onChange={e => setEditForm({...editForm, price_usd_monthly: Number(e.target.value)})} /></td>
                    <td style={{ padding: "12px 24px" }}><input type="number" className="admin-input" value={editForm.max_documents} onChange={e => setEditForm({...editForm, max_documents: Number(e.target.value)})} /></td>
                    <td style={{ padding: "12px 24px" }}><input type="number" className="admin-input" value={editForm.max_queries_per_month} onChange={e => setEditForm({...editForm, max_queries_per_month: Number(e.target.value)})} /></td>
                    <td style={{ padding: "12px 24px" }}><input type="number" className="admin-input" value={editForm.max_file_size_mb} onChange={e => setEditForm({...editForm, max_file_size_mb: Number(e.target.value)})} /></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleSave(p.id)} className="admin-btn admin-btn-primary">Save</button>
                        <button onClick={() => setEditingId(null)} className="admin-btn admin-btn-outline">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ color: "var(--color-text-main)" }}>{p.display_name}</td>
                    <td style={{ color: "var(--color-text-main)", fontWeight: 600 }}>${p.price_usd_monthly}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{p.max_documents === -1 ? 'Unlimited' : p.max_documents}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{p.max_queries_per_month === -1 ? 'Unlimited' : p.max_queries_per_month}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{p.max_file_size_mb} MB</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => handleEditClick(p)} className="admin-btn admin-btn-outline">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
