import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, User, X, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

// Interface for config
interface WidgetConfig {
  bot_name: str;
  welcome_message: string;
  placeholder_text: string;
  primary_color: string;
  position: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

const WidgetPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`/api/public/widgets/${token}/config`);
        setConfig(response.data);
        if (response.data.welcome_message) {
          setMessages([
            { id: 'welcome', sender: 'assistant', content: response.data.welcome_message }
          ]);
        }
      } catch (err: any) {
        setError("Không thể tải cấu hình Widget. Có thể token không hợp lệ hoặc Widget đã bị tắt.");
        console.error(err);
      }
    };
    if (token) {
      fetchConfig();
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !config || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMsg: Message = { id: Date.now().toString(), sender: 'user', content: userMessage };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);
    
    // Add temporary assistant message for streaming
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, sender: 'assistant', content: '' }]);

    try {
      // Setup SSE for streaming response
      const response = await fetch(`/api/public/widgets/${token}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage, stream: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiContent = '';

      while (reader && !done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                // Check previous line for event type
                const eventLine = i > 0 ? lines[i - 1] : '';
                if (eventLine === 'event: token') {
                  aiContent += data;
                  setMessages(prev => 
                    prev.map(m => m.id === assistantMsgId ? { ...m, content: aiContent } : m)
                  );
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => 
        prev.map(m => m.id === assistantMsgId ? { ...m, content: "Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng thử lại sau." } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWidget = () => {
    // Notify parent window (the host website) to resize the iframe
    const newState = !isOpen;
    setIsOpen(newState);
    if (window.parent) {
      window.parent.postMessage({ type: 'OMNIRAG_WIDGET_TOGGLE', isOpen: newState }, '*');
    }
  };

  if (error) {
    return <div className="text-red-500 text-sm p-4 bg-white rounded-lg shadow">{error}</div>;
  }

  if (!config) {
    return null; // Don't render anything until config is loaded
  }

  return (
    <div className={`fixed ${config.position === 'left' ? 'left-4' : 'right-4'} bottom-4 z-50 font-sans flex flex-col items-end`}>
      
      {/* Main Chat Panel */}
      {isOpen && (
        <div 
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 border border-gray-100 transition-all duration-300 transform origin-bottom-right"
          style={{ width: '380px', height: '600px', maxHeight: '80vh' }}
        >
          {/* Header */}
          <div 
            className="p-4 text-white flex justify-between items-center shrink-0"
            style={{ backgroundColor: config.primary_color }}
          >
            <div className="flex items-center gap-3">
              {config.avatar_url ? (
                <img src={config.avatar_url} alt="Bot" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm m-0">{config.bot_name}</h3>
                <span className="text-xs opacity-80">Powered by OmniRAG</span>
              </div>
            </div>
            <button onClick={toggleWidget} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'text-white'}`}
                       style={msg.sender === 'assistant' ? { backgroundColor: config.primary_color } : {}}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-gray-100 text-gray-800 rounded-tr-none' : 'bg-white shadow-sm border border-gray-100 rounded-tl-none'}`}>
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 pr-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={config.placeholder_text}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-2 text-sm text-gray-700"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-8 w-8"
                style={{ backgroundColor: config.primary_color }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={toggleWidget}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
        style={{ backgroundColor: config.primary_color }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
};

export default WidgetPage;
