import React, { useState } from "react";
import ChatWidget from "../../components/ChatWidget";

export default function ChatPlayground() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("workspaceApiKey") || "");

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Chat Playground</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Test your RAG chatbot in a secure sandbox before integrating it into your app.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Active API Key (for testing)</label>
          <input
            type="password"
            className="input"
            style={{ width: "240px", padding: "6px 12px", height: "auto" }}
            placeholder="Enter API Key to enable chat"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("workspaceApiKey", e.target.value); }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "32px" }}>
        <div style={{ flex: 2, background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Instructions</h2>
          <p style={{ color: "#6B7280", lineHeight: 1.6 }}>
            The Chat Playground simulates how your end-users will interact with your chatbot. 
            It uses the <strong>Active API Key</strong> provided above to authenticate requests.
          </p>
          <ul style={{ color: "#6B7280", lineHeight: 1.6, paddingLeft: "20px", marginTop: "12px" }}>
            <li>Generate an API Key in the <strong>API Keys</strong> tab if you haven't already.</li>
            <li>Paste it into the <strong>Active API Key</strong> field.</li>
            <li>Try asking questions based on the documents you uploaded in the <strong>Knowledge Base</strong>.</li>
            <li>The chat widget on the right is a fully functional component identical to what you will embed on your site.</li>
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: "350px", height: "600px", position: "relative" }}>
          {/* The chat widget positions itself absolutely by default, we can override or let it float */}
          <ChatWidget apiKey={apiKey} theme="light" />
        </div>
      </div>
    </div>
  );
}
