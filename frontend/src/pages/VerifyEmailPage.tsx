import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle2, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { authVerifyEmail, authResendVerification } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Email can come from navigation state (after register) or from logged-in user
  const email: string = (location.state as any)?.email ?? user?.email ?? "";

  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsVerifying(true);
    try {
      await authVerifyEmail(token.trim());
      // Navigate to workspace creation after successful verification
      navigate("/workspaces/new", { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === "string" ? detail : "Invalid or expired token. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setResendSuccess(false);
    setErrorMsg("");
    try {
      await authResendVerification(email);
      setResendSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === "string" ? detail : "Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
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
        maxWidth: "460px",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Mail size={32} color="#fff" />
        </div>

        {/* Step indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "24px",
        }}>
          {["Verify Email", "Create Workspace", "Done"].map((step, i) => (
            <div key={step} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: i === 0 ? "#3B82F6" : "#E5E7EB",
                color: i === 0 ? "#fff" : "#9CA3AF",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "12px", color: i === 0 ? "#3B82F6" : "#9CA3AF", fontWeight: i === 0 ? 600 : 400 }}>
                {step}
              </span>
              {i < 2 && <div style={{ width: "16px", height: "1px", background: "#E5E7EB" }} />}
            </div>
          ))}
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
          Check your email
        </h1>
        <p style={{ color: "#6B7280", fontSize: "15px", marginBottom: "32px", lineHeight: 1.6 }}>
          We sent a verification token to{" "}
          {email ? (
            <strong style={{ color: "#374151" }}>{email}</strong>
          ) : (
            "your email address"
          )}
          .<br />
          Paste the token below to continue.
        </p>

        <form onSubmit={handleVerify} style={{ textAlign: "left" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
            Verification Token
          </label>
          <input
            required
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your token here…"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              fontSize: "14px",
              fontFamily: "monospace",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "16px",
              transition: "border-color 0.2s",
            }}
          />

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

          {resendSuccess && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#16a34a",
              fontSize: "13px",
              marginBottom: "16px",
            }}>
              <CheckCircle2 size={15} />
              New verification token sent! Check the server console.
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || !token.trim()}
            style={{
              width: "100%",
              padding: "13px",
              background: isVerifying ? "#93C5FD" : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isVerifying ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.2s",
            }}
          >
            {isVerifying ? "Verifying…" : <>Verify Email <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: "24px", borderTop: "1px solid #F3F4F6", paddingTop: "24px" }}>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "12px" }}>
            Didn't receive the token?
          </p>
          <button
            onClick={handleResend}
            disabled={isResending}
            style={{
              background: "none",
              border: "1.5px solid #E5E7EB",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              color: "#374151",
              cursor: isResending ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={isResending ? "spin" : ""} />
            {isResending ? "Sending…" : "Resend token"}
          </button>
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={logout}
              style={{
                background: "none",
                border: "none",
                color: "#9CA3AF",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
