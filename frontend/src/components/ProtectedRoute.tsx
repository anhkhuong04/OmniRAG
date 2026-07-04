import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, redirect to /verify-email when user has not verified their email. */
  requireVerified?: boolean;
}

/**
 * ProtectedRoute wraps routes that require authentication.
 *
 * Behaviour:
 *  1. While auth state is being restored (page refresh), render a full-screen
 *     loading spinner so we don't flash the login page unnecessarily.
 *  2. If the user is not logged in, redirect to /login, preserving the
 *     original URL so we can send them back after a successful login.
 *  3. If requireVerified=true and the user hasn't verified their email,
 *     redirect to /verify-email.
 */
export default function ProtectedRoute({
  children,
  requireVerified = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While restoring session from stored refresh token
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          flexDirection: "column",
          gap: "var(--spacing-md)",
        }}
      >
        <div className="spinner" aria-label="Loading..." />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Restoring session…
        </p>
      </div>
    );
  }

  // Not authenticated — send to /login, remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but email not verified
  if (requireVerified && !user.is_verified) {
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
  }

  return <>{children}</>;
}
