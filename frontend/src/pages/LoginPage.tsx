import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authRegister } from "../services/api";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      if (activeTab === "login") {
        await login(email, password);
        // Redirect to where the user originally wanted to go, or /workspaces
        const from = (location.state as any)?.from?.pathname ?? "/workspaces";
        navigate(from, { replace: true });
      } else {
        // Register flow
        await authRegister(email, password, fullName);
        navigate("/verify-email", { state: { email }, replace: true });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === "string" ? detail : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Scope specific styles */}
      <style>{`
        .login-viewport {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        @media (min-width: 768px) {
          .login-viewport {
            max-height: 100vh;
            overflow-y: hidden;
          }
        }
        
        /* Decorative Background Pattern */
        .login-viewport::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 250px;
          height: 250px;
          background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .login-left {
          width: 48%;
          padding: 32px 32px 32px 48px;
          display: flex;
          flex-direction: column;
          z-index: 10;
          justify-content: center;
        }

        .login-right {
          width: 52%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 10;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          text-decoration: none;
          width: fit-content;
        }

        .login-logo-text {
          font-size: 22px;
          font-weight: 700;
          color: #101828;
          letter-spacing: -0.02em;
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          height: 28px;
          padding: 0 12px;
          background: #EEF3FF;
          color: #2F5BFF;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          width: fit-content;
          margin-bottom: 16px;
        }

        .login-hero-heading {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .login-hero-title {
          font-size: 40px;
          font-weight: 800;
          line-height: 1.1;
          color: #101828;
          letter-spacing: -0.04em;
        }

        .login-hero-gradient {
          background: linear-gradient(90deg, #2563EB 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-desc {
          width: 100%;
          max-width: 440px;
          font-size: 14px;
          line-height: 1.5;
          color: #475467;
          margin-bottom: 24px;
        }

        .login-desc-highlight {
          color: #2563EB;
          font-weight: 600;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-feature-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .login-feature-iconbox {
          width: 38px;
          height: 38px;
          background: white;
          border: 1px solid #E4E7EC;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .login-feature-title {
          font-size: 16px;
          font-weight: 700;
          color: #101828;
          margin-bottom: 2px;
          letter-spacing: -0.02em;
        }

        .login-feature-desc {
          font-size: 13px;
          color: #667085;
          line-height: 1.4;
        }

        /* Card Container Styles */
        .login-card {
          width: 100%;
          max-width: 500px;
          background: #FFFFFF;
          border: 1px solid #EAECF0;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(16, 24, 40, 0.08);
        }

        .login-tabs-container {
          display: flex;
          border-bottom: 1px solid #EAECF0;
          margin-bottom: 16px;
          height: 40px;
          position: relative;
        }

        .login-tab-btn {
          flex: 1;
          height: 100%;
          font-size: 15px;
          font-weight: 600;
          color: #667085;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 8px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .login-tab-btn.active {
          color: #2563EB;
        }

        .login-tab-underline {
          position: absolute;
          bottom: 0;
          height: 3px;
          background: #2563EB;
          width: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-card-header {
          margin-bottom: 16px;
        }

        .login-card-title {
          font-size: 28px;
          font-weight: 700;
          color: #101828;
          margin-bottom: 4px;
          letter-spacing: -0.03em;
        }

        .login-card-subtext {
          font-size: 14px;
          color: #667085;
        }

        .login-google-btn {
          width: 100%;
          height: 44px;
          border: 1px solid #D0D5DD;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #344054;
          transition: all 0.2s ease;
          margin-bottom: 12px;
          cursor: pointer;
        }

        .login-google-btn:hover {
          background: #F9FAFB;
          border-color: #BEC3CB;
        }

        .login-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #667085;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #EAECF0;
        }

        .login-divider:not(:empty)::before {
          margin-right: 10px;
        }

        .login-divider:not(:empty)::after {
          margin-left: 10px;
        }

        .login-form-group {
          margin-bottom: 12px;
        }

        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #344054;
          margin-bottom: 4px;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon-left {
          position: absolute;
          left: 14px;
          color: #667085;
        }

        .login-input-icon-right {
          position: absolute;
          right: 14px;
          color: #667085;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-input {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 40px;
          border: 1px solid #D0D5DD;
          border-radius: 10px;
          font-size: 13px;
          color: #101828;
          transition: all 0.2s ease;
        }

        .login-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .login-remember-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 12px;
        }

        .login-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475467;
          font-weight: 500;
          cursor: pointer;
        }

        .login-checkbox {
          width: 13px;
          height: 13px;
          border: 1px solid #D0D5DD;
          border-radius: 3px;
          accent-color: #2563EB;
        }

        .login-forgot-link {
          color: #2563EB;
          font-weight: 600;
          text-decoration: none;
        }

        .login-btn-primary {
          width: 100%;
          height: 44px;
          background: linear-gradient(90deg, #2563EB 0%, #7C3AED 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.12);
          transition: all 0.2s ease;
          margin-bottom: 12px;
          border: none;
          cursor: pointer;
        }

        .login-btn-primary:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18);
        }

        .login-new-label {
          text-align: center;
          color: #667085;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .login-btn-secondary {
          width: 100%;
          height: 44px;
          border: 1px solid #7C3AED;
          color: #7C3AED;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: none;
          cursor: pointer;
        }

        .login-btn-secondary:hover {
          background: rgba(124, 58, 237, 0.04);
        }

        .login-card-footer {
          margin-top: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .login-footer-lock {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #667085;
          font-size: 11px;
        }

        .login-footer-badges {
          font-size: 11px;
          color: #667085;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        /* Responsive Layout Breakpoints */
        @media (max-width: 1279px) {
          .login-left {
            width: 45%;
            padding: 32px;
          }
          .login-right {
            width: 55%;
          }
          .login-hero-title {
            font-size: 38px;
          }
          .login-feature-title {
            font-size: 16px;
          }
          .login-feature-desc {
            font-size: 13px;
          }
        }

        @media (max-width: 767px) {
          .login-viewport {
            overflow-y: auto;
          }
          .login-left {
            display: none;
          }
          .login-right {
            width: 100%;
            padding: 16px;
          }
          .login-card {
            padding: 24px;
            border-radius: 16px;
          }
          .login-card-title {
            font-size: 28px;
          }
          .login-tab-btn {
            font-size: 15px;
          }
        }
      `}</style>

      {/* Left Panel */}
      <div className="login-left">
        <Link to="/" className="login-logo">
          <img src="/logo.svg" alt="OmniRAG Logo" style={{ width: "32px", height: "32px" }} />
          <span className="login-logo-text">OmniRAG</span>
        </Link>

        <div className="login-badge">AI-POWERED RAG PLATFORM</div>

        <div className="login-hero-heading">
          <span className="login-hero-title">Your knowledge.</span>
          <span className="login-hero-title login-hero-gradient">Grounded AI answers.</span>
        </div>

        <p className="login-desc">
          OmniRAG connects your company's data to AI assistants that answer with{" "}
          <span className="login-desc-highlight">verified sources</span> and{" "}
          <span className="login-desc-highlight">zero guesswork</span>.
        </p>

        <div className="login-features">
          <div className="login-feature-item">
            <div className="login-feature-iconbox" style={{ color: "#EF4444" }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 className="login-feature-title">Secure & Private</h3>
              <p className="login-feature-desc">
                Your data stays in your workspace and is never used to train models.
              </p>
            </div>
          </div>

          <div className="login-feature-item">
            <div className="login-feature-iconbox" style={{ color: "#3B82F6" }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="login-feature-title">Verified Answers</h3>
              <p className="login-feature-desc">
                Every answer is grounded in your documents with citations.
              </p>
            </div>
          </div>

          <div className="login-feature-item">
            <div className="login-feature-iconbox" style={{ color: "#7C3AED" }}>
              <Users size={20} />
            </div>
            <div>
              <h3 className="login-feature-title">Team Collaboration</h3>
              <p className="login-feature-desc">
                Work together with roles, permissions, and workspace isolation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-card">
          {/* Form Tabs */}
          <div className="login-tabs-container">
            <button
              className={`login-tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Log in
            </button>
            <button
              className={`login-tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Create account
            </button>
            <div
              className="login-tab-underline"
              style={{
                left: activeTab === "login" ? "0" : "50%",
              }}
            />
          </div>

          {/* Heading */}
          <div className="login-card-header">
            <h2 className="login-card-title">
              {activeTab === "login" ? "Welcome back" : "Get started"}
            </h2>
            <p className="login-card-subtext">
              {activeTab === "login"
                ? "Log in to your OmniRAG workspace"
                : "Create your secure OmniRAG tenant"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Google Login Button */}
            <button type="button" className="login-google-btn">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="login-divider">or continue with email</div>

            {/* Full Name Field — only shown on signup tab */}
            {activeTab === "signup" && (
              <div className="login-form-group">
                <label className="login-label" htmlFor="fullname-input">
                  Full name
                </label>
                <div className="login-input-wrapper">
                  <Users className="login-input-icon-left" size={18} />
                  <input
                    required
                    id="fullname-input"
                    type="text"
                    className="login-input"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="login-form-group">
              <label className="login-label" htmlFor="email-input">
                Email address
              </label>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon-left" size={18} />
                <input
                  required
                  id="email-input"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label className="login-label" htmlFor="password-input">
                Password
              </label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon-left" size={18} />
                <input
                  required
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  placeholder={activeTab === "signup" ? "Minimum 8 characters" : "Enter your password"}
                  minLength={activeTab === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            {activeTab === "login" && (
              <div className="login-remember-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="login-forgot-link">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Error message */}
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
                fontSize: "14px",
              }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Primary Action Button */}
            <button type="submit" className="login-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? (activeTab === "login" ? "Logging in…" : "Creating account…")
                : (activeTab === "login" ? "Log in" : "Create account")}
            </button>

            {/* Switch Tab Helper Button */}
            <div className="login-new-label">
              {activeTab === "login" ? "New to OmniRAG?" : "Already have an account?"}
            </div>

            <button
              type="button"
              className="login-btn-secondary"
              onClick={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
            >
              {activeTab === "login" ? "Create your account" : "Log in to your account"}
            </button>
          </form>

          {/* Security & Compliance Footer */}
          <div className="login-card-footer">
            <div className="login-footer-lock">
              <Lock size={14} />
              Your data is encrypted and protected
            </div>
            <div className="login-footer-badges">
              <span>SOC 2 Type II</span>
              <span>•</span>
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
