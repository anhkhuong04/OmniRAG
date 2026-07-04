import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createWorkspace } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function WorkspaceCreatePage() {
  const navigate = useNavigate();
  const { setCurrentWorkspace } = useAuth();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const workspace = await createWorkspace(name.trim());
      setCurrentWorkspace(workspace.id);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === "string" ? detail : "Failed to create workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "480px",
      }}>
        {/* Icon */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}>
          <Layers size={32} color="#fff" />
        </div>

        {/* Step indicator */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
          alignItems: "center",
        }}>
          {["Verify Email", "Create Workspace", "Done"].map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: i === 0 ? "#D1FAE5" : i === 1 ? "#3B82F6" : "#E5E7EB",
                color: i === 0 ? "#059669" : i === 1 ? "#fff" : "#9CA3AF",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {i === 0 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: "12px", color: i === 1 ? "#3B82F6" : "#9CA3AF", fontWeight: i === 1 ? 600 : 400 }}>
                {step}
              </span>
              {i < 2 && <div style={{ width: "16px", height: "1px", background: "#E5E7EB" }} />}
            </div>
          ))}
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
          Create your workspace
        </h1>
        <p style={{ color: "#6B7280", fontSize: "15px", marginBottom: "32px", lineHeight: 1.6 }}>
          A workspace is your private space for your knowledge base, API keys, and team members.
          You can rename it later.
        </p>

        <form onSubmit={handleCreate}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "8px",
          }}>
            Workspace name
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corp, My Store, Personal Project"
            minLength={2}
            maxLength={100}
            style={{
              width: "100%",
              padding: "13px 16px",
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              fontSize: "15px",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "24px",
              transition: "border-color 0.2s",
              fontFamily: "inherit",
            }}
          />

          {/* Plan info badge */}
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#15803D" }}>
                Free Trial — auto-assigned
              </div>
              <div style={{ fontSize: "12px", color: "#16a34a" }}>
                20 documents · 500 queries/month · 10MB file limit
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
            }}>
              <AlertCircle size={15} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length < 2}
            style={{
              width: "100%",
              padding: "14px",
              background: isSubmitting || name.trim().length < 2
                ? "#93C5FD"
                : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isSubmitting || name.trim().length < 2 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.2s",
            }}
          >
            {isSubmitting ? "Creating workspace…" : <>Create Workspace <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
