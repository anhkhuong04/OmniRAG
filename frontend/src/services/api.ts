import axios from 'axios';

// The Vite proxy redirects /api/... to http://localhost:8000/...
const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for requests requiring Tenant API Key
export const getTenantAuthHeaders = (apiKey: string) => ({
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

// Helper for requests requiring Admin Key
export const getAdminAuthHeaders = (adminKey: string) => ({
  headers: {
    'X-Admin-Key': adminKey,
  },
});

// --- Admin API ---

export const adminCreateTenant = async (adminKey: string, name: string) => {
  const response = await apiClient.post(
    '/admin/tenants',
    { name },
    getAdminAuthHeaders(adminKey)
  );
  return response.data;
};

export const adminCreateApiKey = async (adminKey: string, tenantId: string, name: string) => {
  const response = await apiClient.post(
    `/admin/tenants/${tenantId}/api-keys`,
    { name },
    getAdminAuthHeaders(adminKey)
  );
  return response.data;
};

export const adminRevokeApiKey = async (adminKey: string, keyId: string) => {
  const response = await apiClient.delete(
    `/admin/api-keys/${keyId}`,
    getAdminAuthHeaders(adminKey)
  );
  return response.data;
};

// --- Tenant API ---

export const tenantIngestDocument = async (apiKey: string, filename: string, text: string) => {
  const response = await apiClient.post(
    '/documents/ingest',
    { filename, text },
    getTenantAuthHeaders(apiKey)
  );
  return response.data;
};

export const tenantQuery = async (apiKey: string, query: string, stream: boolean = false) => {
  const response = await apiClient.post(
    '/chat/query',
    { query, stream },
    getTenantAuthHeaders(apiKey)
  );
  return response.data;
};
