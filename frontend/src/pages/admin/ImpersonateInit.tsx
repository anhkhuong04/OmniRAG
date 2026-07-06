import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAccessToken } from "../../services/api";

export default function ImpersonateInit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const tenantId = searchParams.get("tenant_id");

    if (token && tenantId) {
      // Store in session storage (isolated to this tab)
      sessionStorage.setItem("impersonate_token", token);
      
      // Override current workspace
      localStorage.setItem("omnirag_current_workspace", tenantId);
      
      // We don't want to interfere with the admin's refresh token
      // so we leave localStorage REFRESH_TOKEN alone. 
      // The AuthContext will pick up impersonate_token from sessionStorage first.
      
      // Force reload to let AuthContext initialize with the new session token
      window.location.href = "/app/overview";
    } else {
      navigate("/admin/dashboard");
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <div className="spinner" style={{ marginBottom: "16px" }} />
        <p>Switching to Workspace View...</p>
      </div>
    </div>
  );
}
