import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, Code, CheckCircle, ExternalLink } from 'lucide-react';

interface WidgetConfig {
  id: string;
  workspace_id: string;
  public_token: string;
  bot_name: string;
  welcome_message: string;
  placeholder_text: string;
  primary_color: string;
  position: string;
  avatar_url: string | null;
  allowed_domains: string | null;
  is_active: boolean;
}

interface WidgetSettingsProps {
  apiKey: string;
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({ apiKey }) => {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('workspaceId') || '');

  const fetchConfig = useCallback(async () => {
    if (!apiKey || !workspaceId) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/workspaces/${workspaceId}/widget`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      setConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch widget config', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, workspaceId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !apiKey || !workspaceId) return;
    
    try {
      setIsSaving(true);
      const res = await axios.patch(`/api/workspaces/${workspaceId}/widget`, {
        bot_name: config.bot_name,
        welcome_message: config.welcome_message,
        placeholder_text: config.placeholder_text,
        primary_color: config.primary_color,
        position: config.position,
        allowed_domains: config.allowed_domains,
      }, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      setConfig(res.data);
      alert('Widget configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save config', err);
      alert('Error saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!config) return;
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const getEmbedCode = () => {
    if (!config) return '';
    const baseUrl = window.location.origin;
    return `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = "${baseUrl}/widget/${config.public_token}";
    iframe.style.position = "fixed";
    iframe.style[window.innerWidth < 768 ? "bottom" : "${config.position}"] = "20px";
    iframe.style[window.innerWidth < 768 ? "right" : "${config.position}"] = "20px";
    iframe.style.width = "400px";
    iframe.style.height = "700px";
    iframe.style.maxWidth = "90vw";
    iframe.style.maxHeight = "90vh";
    iframe.style.border = "none";
    iframe.style.zIndex = "999999";
    // Tự động thu nhỏ khi widget bị ẩn (cần lắng nghe postMessage từ iframe)
    window.addEventListener("message", function(e) {
      if(e.data && e.data.type === "OMNIRAG_WIDGET_TOGGLE") {
        if(e.data.isOpen) {
          iframe.style.width = "400px";
          iframe.style.height = "700px";
        } else {
          iframe.style.width = "80px";
          iframe.style.height = "80px";
        }
      }
    });
    iframe.style.width = "80px";
    iframe.style.height = "80px"; // Default closed size
    document.body.appendChild(iframe);
  })();
</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!apiKey || !workspaceId) {
    return <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">Please set API Key to view widget settings.</div>;
  }

  if (isLoading) return <div className="p-4">Loading widget configuration...</div>;
  if (!config) return <div className="p-4 text-red-500">Failed to load configuration.</div>;

  return (
    <div className="flex gap-8">
      {/* Settings Form */}
      <div className="flex-1 max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Widget Configuration</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bot Name</label>
            <input name="bot_name" value={config.bot_name} onChange={handleChange} className="input w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Welcome Message</label>
            <input name="welcome_message" value={config.welcome_message} onChange={handleChange} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Placeholder Text</label>
            <input name="placeholder_text" value={config.placeholder_text} onChange={handleChange} className="input w-full" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" name="primary_color" value={config.primary_color} onChange={handleChange} className="h-10 w-10 p-1 border rounded-lg cursor-pointer" />
                <input name="primary_color" value={config.primary_color} onChange={handleChange} className="input flex-1 uppercase" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Position</label>
              <select name="position" value={config.position} onChange={handleChange} className="input w-full bg-white">
                <option value="right">Bottom Right</option>
                <option value="left">Bottom Left</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Allowed Domains (CORS)</label>
            <input name="allowed_domains" value={config.allowed_domains || ''} onChange={handleChange} placeholder="https://example.com, https://shop.example.com" className="input w-full" />
            <span className="text-xs text-gray-500">Leave blank to allow all domains (development only).</span>
          </div>

          <button type="submit" disabled={isSaving} className="btn btn-primary mt-4 w-full flex justify-center items-center gap-2">
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>

      {/* Embed Code Panel */}
      <div className="w-96">
        <h2 className="text-xl font-semibold mb-4">Embed Code</h2>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Copy and paste this code into the <code className="bg-gray-200 px-1 rounded">&lt;head&gt;</code> or <code className="bg-gray-200 px-1 rounded">&lt;body&gt;</code> of your website.</p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              {getEmbedCode()}
            </pre>
            <button 
              onClick={copyToClipboard}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded flex items-center transition-colors"
              title="Copy code"
            >
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Code size={16} />}
            </button>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold mb-2">Public Token</h3>
            <div className="flex gap-2 items-center">
              <code className="text-xs bg-gray-200 p-1.5 rounded flex-1 truncate">{config.public_token}</code>
            </div>
            
            <a 
              href={`/widget/${config.public_token}`} 
              target="_blank" 
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full btn btn-secondary text-sm"
            >
              <ExternalLink size={16} /> Preview Widget
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
