import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authLogin,
  authMe,
  authRefresh,
  setAccessToken as apiSetAccessToken,
} from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  is_system_admin: boolean;
  created_at: string;
}

interface AuthContextValue {
  /** Currently authenticated user, or null if not logged in. */
  user: UserProfile | null;
  /** True while the context is verifying a stored refresh token on mount. */
  isLoading: boolean;
  /** The ID of the currently selected workspace. Persisted to localStorage. */
  currentWorkspaceId: string | null;
  /** Authenticate with email/password. Throws on invalid credentials. Returns user profile. */
  login: (email: string, password: string) => Promise<UserProfile>;
  /** Clears all auth state and redirects to /login. */
  logout: () => void;
  /** Switch the active workspace in the session. */
  setCurrentWorkspace: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_TOKEN_KEY = "omnirag_refresh_token";
const WORKSPACE_KEY = "omnirag_current_workspace";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(
    () => localStorage.getItem(WORKSPACE_KEY)
  );

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      // 1. Check for active impersonation in sessionStorage
      const impersonationToken = sessionStorage.getItem("impersonate_token");
      if (impersonationToken) {
        try {
          apiSetAccessToken(impersonationToken);
          const profile = await authMe();
          setUser(profile);
          // Set workspace from query param or session storage if needed,
          // but usually it's set by the URL that opened the tab.
        } catch {
          sessionStorage.removeItem("impersonate_token");
          apiSetAccessToken(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 2. Normal restore flow
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const tokens = await authRefresh(storedRefreshToken);
        // Store new refresh token (rotation)
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        // Set in-memory access token for axios interceptor
        apiSetAccessToken(tokens.access_token);
        // Fetch user profile
        const profile = await authMe();
        setUser(profile);
      } catch {
        // Refresh token invalid or expired — clear storage
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        apiSetAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authLogin(email, password);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    apiSetAccessToken(tokens.access_token);
    const profile = await authMe();
    setUser(profile);
    return profile;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    apiSetAccessToken(null);
    setUser(null);
    setCurrentWorkspaceIdState(null);
    // Redirect to login
    window.location.href = "/login";
  }, []);

  // ── Workspace selection ──────────────────────────────────────────────────
  const setCurrentWorkspace = useCallback((id: string) => {
    localStorage.setItem(WORKSPACE_KEY, id);
    setCurrentWorkspaceIdState(id);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, currentWorkspaceId, login, logout, setCurrentWorkspace }),
    [user, isLoading, currentWorkspaceId, login, logout, setCurrentWorkspace]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
