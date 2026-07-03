import { useState } from 'react';
import { adminCreateTenant, adminCreateApiKey, adminRevokeApiKey } from '../services/api';
import { Key, Building, Trash2, Copy, Check } from 'lucide-react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  
  // Tenant Form
  const [tenantName, setTenantName] = useState('');
  const [tenantId, setTenantId] = useState(''); // Just to store current for API key generation
  
  // API Key Form
  const [keyName, setKeyName] = useState('');
  
  // Result states
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [revokeKeyId, setRevokeKeyId] = useState('');

  const handleAdminKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAdminKey(val);
    localStorage.setItem('adminKey', val);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(''); setError('');
      const res = await adminCreateTenant(adminKey, tenantName);
      setMessage(`Tenant "${res.name}" created successfully! ID: ${res.id}`);
      setTenantId(res.id); // Auto-fill for convenience
      setTenantName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create tenant');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(''); setError(''); setCreatedApiKey(''); setCopied(false);
      const res = await adminCreateApiKey(adminKey, tenantId, keyName);
      setMessage(`API Key "${res.name}" created successfully!`);
      setCreatedApiKey(res.raw_key);
      setKeyName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(''); setError('');
      await adminRevokeApiKey(adminKey, revokeKeyId);
      setMessage(`API Key ${revokeKeyId} revoked successfully.`);
      setRevokeKeyId('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revoke key');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="flex flex-col gap-lg">
        
        <div className="card">
          <h2 className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
            <Key size={24} color="var(--accent-primary)" />
            Admin Authentication
          </h2>
          <p style={{ marginBottom: 'var(--spacing-sm)', fontSize: '14px' }}>Enter your `ADMIN_SECRET_KEY` from the backend `.env` file.</p>
          <input
            type="password"
            className="input"
            placeholder="ADMIN_SECRET_KEY..."
            value={adminKey}
            onChange={handleAdminKeyChange}
          />
        </div>

        {error && <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#fef2f2', color: 'var(--danger-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid #fca5a5' }}>{error}</div>}
        {message && <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>{message}</div>}

        {createdApiKey && (
          <div className="card" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
            <h3 style={{ color: '#b45309', marginBottom: 'var(--spacing-sm)' }}>Important: Save your new API Key</h3>
            <p style={{ fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>This raw key will only be shown once. Copy it and store it securely.</p>
            <div className="flex items-center gap-sm" style={{ backgroundColor: '#fff', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #fcd34d' }}>
              <code style={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>{createdApiKey}</code>
              <button className="btn btn-primary hover-lift" onClick={copyToClipboard}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          {/* Create Tenant Form */}
          <div className="card">
            <h3 className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
              <Building size={20} />
              1. Create New Tenant
            </h3>
            <form onSubmit={handleCreateTenant} className="flex flex-col gap-md">
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Tenant Name</label>
                <input required type="text" className="input" placeholder="e.g. Acme Corp" value={tenantName} onChange={e => setTenantName(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-outline hover-lift" style={{ width: '100%' }}>Create Tenant</button>
            </form>
          </div>

          {/* Create API Key Form */}
          <div className="card">
            <h3 className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
              <Key size={20} />
              2. Generate API Key
            </h3>
            <form onSubmit={handleCreateApiKey} className="flex flex-col gap-md">
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>Target Tenant ID</label>
                <input required type="text" className="input" placeholder="UUID format" value={tenantId} onChange={e => setTenantId(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>API Key Name</label>
                <input required type="text" className="input" placeholder="e.g. Prod Chatbot" value={keyName} onChange={e => setKeyName(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary hover-lift" style={{ width: '100%' }}>Generate Key</button>
            </form>
          </div>
        </div>

        {/* Revoke API Key Form */}
        <div className="card" style={{ borderLeft: '4px solid var(--danger-primary)' }}>
          <h3 className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)', color: 'var(--danger-primary)' }}>
            <Trash2 size={20} />
            Revoke API Key
          </h3>
          <p style={{ fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>Instantly disable an API key. This action cannot be easily reversed.</p>
          <form onSubmit={handleRevokeKey} className="flex items-center gap-sm">
            <input required type="text" className="input" placeholder="API Key ID (UUID) to revoke..." value={revokeKeyId} onChange={e => setRevokeKeyId(e.target.value)} />
            <button type="submit" className="btn btn-danger hover-lift" style={{ whiteSpace: 'nowrap' }}>Revoke</button>
          </form>
        </div>

      </div>
    </div>
  );
}
