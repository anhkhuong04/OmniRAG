import axios from "axios";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const API_BASE_URL = "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── In-memory Access Token Store ────────────────────────────────────────────
// Access token is kept in memory (never localStorage) to reduce XSS risk.
// The AuthContext calls setAccessToken after login / token refresh.

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

// ─── Request Interceptor — auto-attach Bearer token ──────────────────────────

apiClient.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Response Interceptor — silent 401 refresh ───────────────────────────────
// When the access token expires, transparently refresh it and retry the request.
// This prevents the user from being kicked out just because 30 min passed.

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const storedRefreshToken = localStorage.getItem("omnirag_refresh_token");
      if (storedRefreshToken) {
        try {
          const tokens = await authRefresh(storedRefreshToken);
          localStorage.setItem("omnirag_refresh_token", tokens.refresh_token);
          setAccessToken(tokens.access_token);
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear tokens and let the 401 propagate
          localStorage.removeItem("omnirag_refresh_token");
          setAccessToken(null);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Legacy Auth Helpers (API Key & Admin Key) ────────────────────────────────

export const getTenantAuthHeaders = (apiKey: string) => ({
  headers: { Authorization: `Bearer ${apiKey}` },
});

export const getAdminAuthHeaders = (adminKey: string) => ({
  headers: { "X-Admin-Key": adminKey },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  is_system_admin: boolean;
  created_at: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  role: "owner" | "admin" | "member";
}

// ─── Document Types ───────────────────────────────────────────────────────────

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentStatusResponse {
  id: string;
  tenant_id: string;
  filename: string;
  file_type: string;
  status: DocumentStatus;
  chunk_count: number;
  content_hash: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentIngestResponse {
  document_id: string;
  status: string;
  message: string;
}

export interface DocumentListResponse {
  items: DocumentStatusResponse[];
  total: number;
}

// ─── Usage & API Key Types ────────────────────────────────────────────────────

export interface WorkspaceAPIKeyResponse {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface WorkspaceAPIKeyCreateResponse extends WorkspaceAPIKeyResponse {
  raw_key: string;
}

export interface UsageStatsResponse {
  tenant_id: string;
  plan_name: string;
  plan_tier: string;
  documents_count: number;
  max_documents: number;
  queries_used_this_month: number;
  max_queries_per_month: number;
  total_cost_usd_this_month: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  current_period_start: string;
  current_period_end: string | null;
}

export interface MonthlyUsagePoint {
  month: string;
  cost_usd: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface UsageHistoryResponse {
  tenant_id: string;
  history: MonthlyUsagePoint[];
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authRegister = async (
  email: string,
  password: string,
  fullName: string
): Promise<UserProfile> => {
  const { data } = await apiClient.post("/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  return data;
};

export const authLogin = async (
  email: string,
  password: string
): Promise<TokenResponse> => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
};

export const authVerifyEmail = async (token: string): Promise<UserProfile> => {
  const { data } = await apiClient.post("/auth/verify-email", { token });
  return data;
};

export const authResendVerification = async (email: string): Promise<void> => {
  await apiClient.post("/auth/resend-verification", { email });
};

export const authRefresh = async (
  refreshToken: string
): Promise<TokenResponse> => {
  // Direct axios call to avoid interceptor loop
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

export const authMe = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get("/auth/me");
  return data;
};

// ─── Workspace API ────────────────────────────────────────────────────────────

export const createWorkspace = async (
  name: string
): Promise<WorkspaceResponse> => {
  const { data } = await apiClient.post("/workspaces", { name });
  return data;
};

export const getWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  const { data } = await apiClient.get("/workspaces");
  return data;
};

export const getWorkspace = async (id: string): Promise<WorkspaceResponse> => {
  const { data } = await apiClient.get(`/workspaces/${id}`);
  return data;
};

// ─── Admin API (legacy) ───────────────────────────────────────────────────────

export const adminCreateTenant = async (adminKey: string, name: string) => {
  const { data } = await apiClient.post(
    "/admin/tenants",
    { name },
    getAdminAuthHeaders(adminKey)
  );
  return data;
};

export const adminCreateApiKey = async (
  adminKey: string,
  tenantId: string,
  name: string
) => {
  const { data } = await apiClient.post(
    `/admin/tenants/${tenantId}/api-keys`,
    { name },
    getAdminAuthHeaders(adminKey)
  );
  return data;
};

export const adminRevokeApiKey = async (adminKey: string, keyId: string) => {
  const { data } = await apiClient.delete(
    `/admin/api-keys/${keyId}`,
    getAdminAuthHeaders(adminKey)
  );
  return data;
};

// ─── Tenant API (legacy) ──────────────────────────────────────────────────────

export const tenantIngestDocument = async (
  apiKey: string,
  filename: string,
  text: string
) => {
  const { data } = await apiClient.post(
    "/documents/ingest",
    { filename, text },
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

export const tenantQuery = async (
  apiKey: string,
  query: string,
  stream: boolean = false
) => {
  const { data } = await apiClient.post(
    "/chat/query",
    { query, stream },
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

// ─── Document API (API Key auth) ──────────────────────────────────────────────

export const ingestDocument = async (
  apiKey: string,
  filename: string,
  text: string,
  metadata?: Record<string, unknown>
): Promise<DocumentIngestResponse> => {
  const { data } = await apiClient.post(
    "/documents/ingest",
    { filename, text, metadata },
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

export const getDocumentStatus = async (
  apiKey: string,
  documentId: string
): Promise<DocumentStatusResponse> => {
  const { data } = await apiClient.get(
    `/documents/${documentId}/status`,
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

export const listDocuments = async (
  apiKey: string,
  skip = 0,
  limit = 50
): Promise<DocumentListResponse> => {
  const { data } = await apiClient.get(
    `/documents/?skip=${skip}&limit=${limit}`,
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

export const deleteDocument = async (
  apiKey: string,
  documentId: string
): Promise<void> => {
  await apiClient.delete(
    `/documents/${documentId}`,
    getTenantAuthHeaders(apiKey)
  );
};

export const retryDocument = async (
  apiKey: string,
  documentId: string
): Promise<DocumentStatusResponse> => {
  const { data } = await apiClient.post(
    `/documents/${documentId}/retry`,
    {},
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

export const reindexDocument = async (
  apiKey: string,
  documentId: string
): Promise<DocumentStatusResponse> => {
  const { data } = await apiClient.post(
    `/documents/${documentId}/reindex`,
    {},
    getTenantAuthHeaders(apiKey)
  );
  return data;
};

// ─── Workspace API Key Management (JWT auth) ──────────────────────────────────

export const createWorkspaceApiKey = async (
  workspaceId: string,
  name: string
): Promise<WorkspaceAPIKeyCreateResponse> => {
  const { data } = await apiClient.post(
    `/workspaces/${workspaceId}/api-keys`,
    { name }
  );
  return data;
};

export const listWorkspaceApiKeys = async (
  workspaceId: string
): Promise<WorkspaceAPIKeyResponse[]> => {
  const { data } = await apiClient.get(`/workspaces/${workspaceId}/api-keys`);
  return data;
};

export const revokeWorkspaceApiKey = async (
  workspaceId: string,
  keyId: string
): Promise<void> => {
  await apiClient.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`);
};

export const getWorkspaceUsage = async (
  workspaceId: string
): Promise<UsageStatsResponse> => {
  const { data } = await apiClient.get(
    `/workspaces/${workspaceId}/api-keys/usage`
  );
  return data;
};

export const getWorkspaceUsageHistory = async (
  workspaceId: string
): Promise<UsageHistoryResponse> => {
  const { data } = await apiClient.get(
    `/workspaces/${workspaceId}/api-keys/usage/history`
  );
  return data;
};

// ─── System Admin API ─────────────────────────────────────────────────────────

export interface AdminSystemUsage {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost_usd: number;
  total_operations: number;
}

export interface AdminAuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json: any;
  created_at: string;
}

export const adminGetTenants = async (skip = 0, limit = 50) => {
  const { data } = await apiClient.get(`/admin/system/tenants?skip=${skip}&limit=${limit}`);
  return data;
};

export const adminDisableTenant = async (tenantId: string) => {
  const { data } = await apiClient.post(`/admin/system/tenants/${tenantId}/disable`);
  return data;
};

export const adminEnableTenant = async (tenantId: string) => {
  const { data } = await apiClient.post(`/admin/system/tenants/${tenantId}/enable`);
  return data;
};

export const adminGetSystemUsage = async (): Promise<AdminSystemUsage> => {
  const { data } = await apiClient.get(`/admin/system/usage-summary`);
  return data;
};

export const adminGetFailedJobs = async (skip = 0, limit = 50) => {
  const { data } = await apiClient.get(`/admin/system/ingestion/failed-jobs?skip=${skip}&limit=${limit}`);
  return data;
};

export const adminRetryFailedJob = async (documentId: string) => {
  const { data } = await apiClient.post(`/admin/system/ingestion/${documentId}/retry`);
  return data;
};

export const adminGetAuditLogs = async (skip = 0, limit = 50): Promise<AdminAuditLog[]> => {
  const { data } = await apiClient.get(`/admin/system/audit-logs?skip=${skip}&limit=${limit}`);
  return data;
};

