import React, { useEffect, useState, useCallback } from "react";
import {
  listDocuments,
  ingestDocument,
  deleteDocument,
  getDocumentStatus,
  retryDocument,
  reindexDocument
} from "../services/api";
import type {
  DocumentStatusResponse,
  DocumentStatus,
} from "../services/api";
import { FileText, Trash2, Loader2, CheckCircle, XCircle, Clock, RefreshCcw, RefreshCw } from "lucide-react";

interface DocumentListProps {
  apiKey: string;
  onRefreshUsage?: () => void;
}

const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  switch (status) {
    case "completed":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10B981", fontSize: "12px", fontWeight: 500, background: "#D1FAE5", padding: "2px 8px", borderRadius: "12px" }}>
          <CheckCircle size={14} /> Ready
        </span>
      );
    case "failed":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#EF4444", fontSize: "12px", fontWeight: 500, background: "#FEE2E2", padding: "2px 8px", borderRadius: "12px" }}>
          <XCircle size={14} /> Failed
        </span>
      );
    case "processing":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#3B82F6", fontSize: "12px", fontWeight: 500, background: "#DBEAFE", padding: "2px 8px", borderRadius: "12px" }}>
          <Loader2 size={14} className="animate-spin" /> Processing
        </span>
      );
    default:
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#6B7280", fontSize: "12px", fontWeight: 500, background: "#F3F4F6", padding: "2px 8px", borderRadius: "12px" }}>
          <Clock size={14} /> Pending
        </span>
      );
  }
};

export function DocumentList({ apiKey, onRefreshUsage }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentStatusResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Ingest form state
  const [filename, setFilename] = useState("");
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await listDocuments(apiKey);
      setDocuments(res.items);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Polling logic for pending/processing documents
  useEffect(() => {
    const activeDocs = documents.filter(
      (d) => d.status === "pending" || d.status === "processing"
    );
    if (activeDocs.length === 0) return;

    const interval = setInterval(async () => {
      let changed = false;
      const newDocs = await Promise.all(
        documents.map(async (doc) => {
          if (doc.status === "pending" || doc.status === "processing") {
            try {
              const statusRes = await getDocumentStatus(apiKey, doc.id);
              if (statusRes.status !== doc.status) {
                changed = true;
                return statusRes;
              }
            } catch (e) {
              console.error(e);
            }
          }
          return doc;
        })
      );
      if (changed) {
        setDocuments(newDocs);
        if (onRefreshUsage) onRefreshUsage();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [documents, apiKey, onRefreshUsage]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setIsUploading(true);
    try {
      await ingestDocument(apiKey, filename, text);
      setFilename("");
      setText("");
      await fetchDocuments(); // Refresh list to show new pending document
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(apiKey, id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (onRefreshUsage) onRefreshUsage();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryDocument(apiKey, id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Retry failed");
    }
  };

  const handleReindex = async (id: string) => {
    if (!confirm("Are you sure you want to re-index this document? Old vectors will be replaced.")) return;
    try {
      await reindexDocument(apiKey, id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Re-index failed");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={18} /> Upload New Document
        </h3>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Title</label>
          <input
            required
            className="input"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Document title..."
            disabled={isUploading}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Content</label>
          <textarea
            required
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text content..."
            style={{ height: "120px", resize: "vertical" }}
            disabled={isUploading}
          />
        </div>
        {uploadError && <div style={{ color: "#EF4444", fontSize: "13px" }}>{uploadError}</div>}
        <div>
          <button type="submit" className="btn btn-primary" disabled={isUploading || !apiKey}>
            {isUploading ? "Queuing..." : "Upload & Ingest"}
          </button>
        </div>
      </form>

      {/* Document List */}
      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
          <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <tr>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Document</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Status</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Chunks</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Uploaded</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280", width: "80px" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && documents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>Loading...</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No documents found.</td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>
                    {doc.filename}
                    {doc.error_message && (
                      <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px", fontWeight: 400 }}>
                        {doc.error_message}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}><StatusBadge status={doc.status} /></td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{doc.chunk_count}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      {doc.status === "failed" && (
                        <button
                          onClick={() => handleRetry(doc.id)}
                          style={{ background: "none", border: "none", color: "#F59E0B", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                          title="Retry Ingestion"
                        >
                          <RefreshCcw size={16} /> Retry
                        </button>
                      )}
                      {(doc.status === "completed") && (
                        <button
                          onClick={() => handleReindex(doc.id)}
                          style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                          title="Re-index Document"
                        >
                          <RefreshCw size={16} /> Re-index
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
