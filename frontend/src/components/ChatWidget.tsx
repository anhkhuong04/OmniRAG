import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, FileText } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

interface ChatWidgetProps {
  apiKey: string;
}

export default function ChatWidget({ apiKey }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add empty assistant message that we will stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

    try {
      // Using standard fetch to consume SSE with custom Authorization header
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ query: userMessage, stream: true })
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Invalid API Key");
        throw new Error("Network error");
      }

      if (!response.body) throw new Error("ReadableStream not yet supported in this browser.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          let eventName = '';
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('event:')) {
              eventName = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const dataStr = line.replace('data:', '').trim();
              if (dataStr && dataStr !== '[DONE]') {
                const dataObj = JSON.parse(dataStr);
                
                if (eventName === 'token') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.content += dataObj;
                    return newMessages;
                  });
                } else if (eventName === 'sources') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.sources = dataObj;
                    return newMessages;
                  });
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        lastMsg.content = `**Error:** ${err.message}`;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Chat Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: apiKey ? 'var(--accent-primary)' : '#cbd5e1' }}></div>
        <h3 style={{ margin: 0, fontSize: '16px' }}>OmniRAG Assistant</h3>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-body)', marginTop: 'auto', marginBottom: 'auto' }}>
            <p>Xin chào! Hãy đặt câu hỏi về dữ liệu của bạn.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : '#f8fafc',
                color: msg.role === 'user' ? '#fff' : 'var(--text-header)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                lineHeight: 1.5,
                fontSize: '15px'
              }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p style={{ margin: '0 0 10px 0' }} {...props} />,
                      ul: ({node, ...props}) => <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }} {...props} />,
                      li: ({node, ...props}) => <li style={{ marginBottom: '4px' }} {...props} />,
                      a: ({node, ...props}) => <a style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }} {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              
              {/* Show sources if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {msg.sources.map((src, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-body)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <FileText size={12} />
                      {src.metadata?.filename || 'Unknown'} (score: {src.score?.toFixed(2)})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input"
            style={{ borderRadius: '24px', padding: '12px 20px', backgroundColor: 'var(--bg-secondary)', border: 'none' }}
            placeholder={apiKey ? "Ask a question..." : "Please enter an API Key above first."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!apiKey || isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || !apiKey || isLoading}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              backgroundColor: (!input.trim() || !apiKey || isLoading) ? '#e2e8f0' : 'var(--accent-primary)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.2s',
              cursor: (!input.trim() || !apiKey || isLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? <Loader2 size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
