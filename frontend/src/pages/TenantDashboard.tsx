import { useState } from 'react';
import ChatWidget from '../components/ChatWidget';
import { tenantIngestDocument } from '../services/api';
import { FileText, Key, CheckCircle } from 'lucide-react';

export default function TenantDashboard() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('tenantApiKey') || '');
  
  // Ingest form
  const [filename, setFilename] = useState('');
  const [text, setText] = useState('');
  const [ingestStatus, setIngestStatus] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('tenantApiKey', val);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setIngestStatus('Error: Please enter your API Key first.');
      return;
    }
    
    setIsIngesting(true);
    setIngestStatus('Uploading and processing...');
    
    try {
      const res = await tenantIngestDocument(apiKey, filename, text);
      setIngestStatus(`Success! Document ingested into ${res.chunk_count} chunks.`);
      setFilename('');
      setText('');
    } catch (err: any) {
      setIngestStatus(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
      
      {/* Auth Banner */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
          <Key size={24} color="var(--accent-primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '4px' }}>Tenant API Key</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-body)' }}>Enter your API key to interact with your specific knowledge base.</p>
        </div>
        <div style={{ width: '400px' }}>
          <input
            type="password"
            className="input"
            placeholder="omni_xxxxxxxx..."
            value={apiKey}
            onChange={handleApiKeyChange}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-section)' }}>
        
        {/* Left Side: Document Ingestion */}
        <div className="flex flex-col gap-lg">
          <div>
            <h2 className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
              <FileText size={24} color="var(--text-header)" />
              Knowledge Base
            </h2>
            <p>Upload text documents to your secure tenant space.</p>
          </div>

          <form onSubmit={handleIngest} className="card flex flex-col gap-md">
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Document Title</label>
              <input 
                required 
                type="text" 
                className="input" 
                placeholder="e.g. Employee Handbook 2026" 
                value={filename} 
                onChange={e => setFilename(e.target.value)} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Document Content</label>
              <textarea 
                required 
                className="input" 
                style={{ height: '200px', resize: 'vertical' }}
                placeholder="Paste the raw text content here..." 
                value={text} 
                onChange={e => setText(e.target.value)} 
              />
            </div>
            
            {ingestStatus && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: ingestStatus.includes('Error') ? '#fef2f2' : '#f0fdf4', 
                color: ingestStatus.includes('Error') ? 'var(--danger-primary)' : 'var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {!ingestStatus.includes('Error') && !isIngesting && <CheckCircle size={16} />}
                {ingestStatus}
              </div>
            )}

            <button type="submit" className="btn btn-primary hover-lift" disabled={isIngesting || !apiKey}>
              {isIngesting ? 'Processing...' : 'Upload to Knowledge Base'}
            </button>
          </form>
        </div>

        {/* Right Side: Chat Widget */}
        <div style={{ height: '600px' }}>
          <ChatWidget apiKey={apiKey} />
        </div>

      </div>
    </div>
  );
}
