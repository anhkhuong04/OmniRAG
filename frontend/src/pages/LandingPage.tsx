import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Menu,
  CheckCircle2,
  FileText,
  MessageSquare,
  BarChart,
  Settings,
  User,
  Send,
  Database,
  Search,
  BrainCircuit,
  ShieldCheck,
  UploadCloud,
  Globe,
  Layers,
  Bot,
  Braces,
  Layout,
  Lock,
  LineChart,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('Customer Support');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      
      {/* 1. Header / Navbar */}
      <nav className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.svg" alt="OmniRAG Logo" style={{ width: '32px', height: '32px' }} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-main)' }}>OmniRAG</span>
          </div>

          <div style={{ display: 'flex', gap: '32px', color: 'var(--color-text-main)', fontWeight: 500, fontSize: '14px' }} className="hidden-mobile">
            <a href="#product">Product ▼</a>
            <a href="#solutions">Solutions ▼</a>
            <a href="#resources">Resources ▼</a>
            <a href="#pricing">Pricing</a>
            <a href="#docs">Docs</a>
            <a href="#company">Company ▼</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="hidden-mobile">
            <Link to="/login" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>Log in</Link>
            <Link to="/login" className="btn-primary" style={{ padding: '10px 16px', fontSize: '14px' }}>
              Start Free &rarr;
            </Link>
          </div>

          <div className="mobile-menu-btn" style={{ display: 'none' }}>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu />
            </button>
          </div>
          
        </div>
      </nav>
      
      {/* 2. Hero Section */}
      <section className="section" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div className="container hero-grid">
          <div>
            <div className="small-label">AI-POWERED RAG PLATFORM</div>
            <h1 className="hero-title" style={{ marginBottom: '24px' }}>
              Your Knowledge.<br/>
              <span className="text-gradient">Grounded</span> AI Answers.
            </h1>
            <p className="body-text" style={{ marginBottom: '40px', maxWidth: '500px' }}>
              Connect your documents, websites, and business data. Deploy AI assistants that answer with verified sources and zero guesswork.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn-primary">
                Start Free &rarr;
              </Link>
              <button className="btn-secondary">
                Book a Demo
              </button>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} color="var(--color-text-main)"/> No credit card</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} color="var(--color-text-main)"/> Setup in minutes</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} color="var(--color-text-main)"/> Cancel anytime</span>
            </div>
          </div>

          {/* Hero Product Mockup */}
          <div className="mockup" style={{ display: 'flex', height: '480px' }}>
            {/* Sidebar */}
            <div className="hidden-mobile" style={{ width: '160px', backgroundColor: '#F8FAFC', borderRight: '1px solid var(--color-border)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '24px' }}>Acme Corp &darr;</div>
              <button style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
                + New Chat
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: '#EFF6FF', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={14} /> Chat
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} /> Sources
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={14} /> Datasets
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart size={14} /> Analytics
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={14} /> Settings
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12}/></div>
                <div style={{ fontSize: '11px', lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600 }}>Jane Doe</div>
                  <div style={{ color: 'var(--color-text-light)' }}>Admin</div>
                </div>
              </div>
            </div>
            
            {/* Main Chat Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: 'white' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'hidden' }}>
                <div style={{ alignSelf: 'flex-end', backgroundColor: '#F1F5F9', padding: '12px 16px', borderRadius: '12px 12px 0 12px', fontSize: '13px', fontWeight: 500 }}>
                  What is the refund policy for enterprise plans?
                </div>
                <div style={{ alignSelf: 'flex-start', fontSize: '13px', lineHeight: 1.6, maxWidth: '90%' }}>
                  Enterprise customers are eligible for a full refund within 30 days of purchase, provided they have not exceeded 80% of their monthly usage limit.
                  
                  <div style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '12px' }}>Sources (3)</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}><FileText size={14}/> Refund Policy - Acme Corp.pdf</div>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '11px' }}><span>p. 3</span> <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>96%</span></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}><FileText size={14}/> Terms of Service - Acme Corp.pdf</div>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '11px' }}><span>p. 7</span> <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>87%</span></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}><FileText size={14}/> Enterprise Agreement.docx</div>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '11px' }}><span>p. 12</span> <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>81%</span></div>
                    </div>
                    
                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
                      View retrieved chunks &rarr;
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', marginTop: '16px' }}>
                <input type="text" placeholder="Ask a follow-up question..." disabled style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '13px', backgroundColor: '#F8FAFC' }} />
                <Send size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: '16px', top: '14px' }} />
              </div>
            </div>
            
            {/* Right Details Panel */}
            <div className="hidden-mobile" style={{ width: '200px', backgroundColor: '#F8FAFC', borderLeft: '1px solid var(--color-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>Answer details</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Sources used</span>
                  <span style={{ fontWeight: 600 }}>3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Chunks retrieved</span>
                  <span style={{ fontWeight: 600 }}>8</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'6px', height:'6px', borderRadius:'3px', backgroundColor:'var(--color-success)'}}></div> High</span>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '11px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Grounded in your data</div>
                <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>
                  AI answers are generated only from your connected knowledge sources.
                </div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Learn more &rarr;</div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 3. Trusted Logos */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '24px' }}>Trusted by teams at</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 64px)', flexWrap: 'wrap', filter: 'grayscale(100%)', opacity: 0.6, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-main)' }}>
            <span>Linear</span>
            <span>▲ Vercel</span>
            <span>Notion</span>
            <span>Lark</span>
            <span>Retool</span>
            <span>Scale</span>
            <span>Brex</span>
          </div>
        </div>
      </section>

      {/* 4. Problem Chain */}
      <section className="section" style={{ backgroundColor: 'var(--color-bg-soft)', textAlign: 'center' }}>
        <div className="container">
          <div className="small-label">THE PROBLEM</div>
          <h2 className="section-title" style={{ marginBottom: '64px' }}>
            Knowledge is <span className="text-gradient">everywhere</span>, answers are not.
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'stretch', overflowX: 'auto', paddingBottom: '16px' }} className="problem-chain-mobile">
            {/* Mobile Stack adjustment could be done via grid in CSS, but flex wrap works ok if space is tight. For pure horizontal scroll, flex-row is fine. */}
            <div className="card" style={{ flex: '1', minWidth: '240px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><Database size={24}/></div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Scattered data</h3>
              <p className="body-text">Information lives in drives, wikis, emails, and databases.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-light)' }} className="hidden-mobile">&rarr;</div>
            
            <div className="card" style={{ flex: '1', minWidth: '240px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFF7ED', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><Search size={24}/></div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Hard to find</h3>
              <p className="body-text">Teams waste time searching instead of getting work done.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-light)' }} className="hidden-mobile">&rarr;</div>
            
            <div className="card" style={{ flex: '1', minWidth: '240px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F3E8FF', color: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><BrainCircuit size={24}/></div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>AI doesn't know</h3>
              <p className="body-text">LLMs don't have access to your private, up-to-date data.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-light)' }} className="hidden-mobile">&rarr;</div>
            
            <div className="card" style={{ flex: '1', minWidth: '240px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><ShieldCheck size={24}/></div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Unreliable answers</h3>
              <p className="body-text">Without sources and context, answers can't be trusted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How OmniRAG Works */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div className="small-label">HOW OMNIRAG WORKS</div>
          <h2 className="section-title" style={{ marginBottom: '64px' }}>From any source to <span className="text-gradient">trusted answers</span>.</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px', position: 'relative', overflowX: 'auto', paddingBottom: '16px' }}>
            {/* Background dashed line */}
            <div className="hidden-mobile" style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', borderTop: '2px dashed var(--color-border)', zIndex: 0 }}></div>
            
            <div style={{ flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'var(--color-bg)', minWidth: '200px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#EFF6FF', border: '2px solid var(--color-bg)', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 700, fontSize: '14px' }}>01</div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Ingest</h3>
              <p className="body-text" style={{ fontSize: '14px' }}>Upload files, connect apps, or crawl websites.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', color: 'var(--color-text-muted)' }}>
                <div style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>PDF</div>
                <div style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>DOCX</div>
                <div style={{ backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>API</div>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'var(--color-bg)', minWidth: '200px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#EFF6FF', border: '2px solid var(--color-bg)', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 700, fontSize: '14px' }}>02</div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Process</h3>
              <p className="body-text" style={{ fontSize: '14px' }}>We chunk, embed, and index your data securely.</p>
            </div>
            
            <div style={{ flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'var(--color-bg)', minWidth: '200px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#EFF6FF', border: '2px solid var(--color-bg)', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 700, fontSize: '14px' }}>03</div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Ask</h3>
              <p className="body-text" style={{ fontSize: '14px' }}>Ask anything in natural language.</p>
            </div>
            
            <div style={{ flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'var(--color-bg)', minWidth: '200px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#EFF6FF', border: '2px solid var(--color-bg)', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 700, fontSize: '14px' }}>04</div>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Get answers</h3>
              <p className="body-text" style={{ fontSize: '14px' }}>AI replies with accurate answers and citations.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 6. Trust / Verification */}
      <section className="section trust-section">
        <div className="container hero-grid">
          <div>
            <div className="small-label" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>BUILT FOR TRUST</div>
            <h2 className="section-title" style={{ marginBottom: '24px', color: 'white' }}>
              AI answers you can <span style={{ color: '#A78BFA' }}>verify.</span>
            </h2>
            <p className="body-text" style={{ marginBottom: '40px', color: '#94A3B8', fontSize: '18px' }}>
              Every answer is grounded in your knowledge and linked back to its original source.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#A78BFA' }}><FileText size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'white' }}>Source citations</h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px' }}>See exactly where the answer comes from.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#A78BFA' }}><ShieldCheck size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'white' }}>Grounded retrieval</h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px' }}>Answers are generated only from retrieved context.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#A78BFA' }}><Lock size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'white' }}>Workspace isolation</h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px' }}>Your data is private, secure, and always yours.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust Mockup */}
          <div style={{ position: 'relative' }}>
            <div className="mockup" style={{ backgroundColor: 'white', padding: '24px', color: 'var(--color-text-main)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>AI Answer</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Employees receive 20 days of annual leave. <span style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>[1]</span>
              </div>
              
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Sources</div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>[1]</span>
                  <span>Employee Handbook.pdf</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                  <span>Page 24</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>94%</span>
                </div>
              </div>
              
              {/* Floating Context Panel */}
              <div className="hidden-mobile" style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '280px', backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text-main)' }}>Retrieved context</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '16px' }}>
                  "Full-time employees are entitled to 20 days of paid annual leave per calendar year, in addition to public holidays..."
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Chunk 2 of 8</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>View all sources &rarr;</span>
                </div>
              </div>
            </div>
            
            <div className="hidden-mobile" style={{ position: 'absolute', top: '-20px', left: '-20px', backgroundColor: 'var(--color-primary)', color: 'white', width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(37,99,235,0.3)' }}>
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Platform Capabilities */}
      <section className="section" style={{ backgroundColor: 'var(--color-bg-soft)', textAlign: 'center' }}>
        <div className="container">
          <div className="small-label">POWERFUL CAPABILITIES</div>
          <h2 className="section-title" style={{ marginBottom: '64px' }}>Everything you need for a <span className="text-gradient">modern</span> RAG platform.</h2>
          
          <div className="capabilities-grid text-left">
            {/* Group 1 */}
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-main)', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>Knowledge Ingestion</div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: 'var(--color-primary)' }}><UploadCloud size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Document Upload</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>PDF, DOCX, TXT, CSV and more.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: 'var(--color-primary)' }}><Globe size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Website Crawler</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Crawl and extract content from any website.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--color-primary)' }}><Layers size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Smart Processing</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Chunk, embed, and index for high-quality retrieval.</p>
                </div>
              </div>
            </div>
            
            {/* Group 2 */}
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-main)', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>AI & Retrieval</div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: 'var(--color-purple)' }}><Bot size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>AI Chat with Citations</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Get answers with sources from your data.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: 'var(--color-purple)' }}><Database size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Advanced Retrieval</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Hybrid search, reranking, and metadata filtering.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--color-purple)' }}><Braces size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>API Access</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Integrate with your apps using our REST API.</p>
                </div>
              </div>
            </div>
            
            {/* Group 3 */}
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-main)', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>Enterprise Ready</div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: '#F59E0B' }}><Layout size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Multi-workspace</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Organize knowledge bases for teams and projects.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ color: '#F59E0B' }}><Lock size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Security & Privacy</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Your data is encrypted and never used for training.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: '#F59E0B' }}><LineChart size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Analytics Dashboard</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Track usage, popular queries, and answer performance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Use Cases Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="small-label">USE CASES</div>
          <h2 className="section-title" style={{ marginBottom: '40px' }}>Built for teams across every industry.</h2>
          
          <div className="use-case-tabs" role="tablist" aria-label="Use cases">
            {['Customer Support', 'HR & People Ops', 'Legal', 'Education', 'Sales Enablement', 'Internal Knowledge'].map((tab) => (
              <button 
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`use-case-tab ${activeTab === tab ? 'active-tab' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Active Tab Content */}
          <div className="card" style={{ display: 'flex', gap: '48px', padding: '48px', textAlign: 'left', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 className="section-title" style={{ fontSize: '32px', marginBottom: '16px' }}>
                {activeTab === 'Customer Support' ? 'Resolve customer questions faster' :
                 activeTab === 'HR & People Ops' ? 'Answer employee policy questions instantly' :
                 activeTab === 'Legal' ? 'Search contracts with confidence' :
                 activeTab === 'Education' ? 'Empower students with instant answers' :
                 activeTab === 'Sales Enablement' ? 'Find product details fast' :
                 'Centralize company knowledge'
                }
              </h3>
              <p className="body-text" style={{ marginBottom: '32px' }}>
                {activeTab === 'Customer Support' ? 'Enable your support team with instant answers from docs, policies, and product guides.' :
                 activeTab === 'HR & People Ops' ? 'Use handbooks, onboarding guides, and HR documents as the source of truth.' :
                 activeTab === 'Legal' ? 'Search contracts, NDAs, and legal documents with confidence.' :
                 activeTab === 'Education' ? 'Help students and teachers find answers from course materials.' :
                 activeTab === 'Sales Enablement' ? 'Help sales teams find product details, competitive intel, and pitch content fast.' :
                 'Centralize company knowledge and improve team productivity.'
                }
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontWeight: 500 }}><Check size={18} color="var(--color-primary)"/> {activeTab === 'Customer Support' ? 'Reduce repetitive tickets' : 'Increase efficiency'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontWeight: 500 }}><Check size={18} color="var(--color-primary)"/> {activeTab === 'Customer Support' ? 'Provide 24/7 self-service' : 'Accurate citations'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontWeight: 500 }}><Check size={18} color="var(--color-primary)"/> {activeTab === 'Customer Support' ? 'Cite official documentation' : 'Secure and private'}</div>
              </div>
            </div>
            
            <div style={{ flex: '1 1 400px', backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16}/></div>
                <div style={{ backgroundColor: 'white', padding: '10px 16px', borderRadius: '16px 16px 16px 0', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid var(--color-border)' }}>
                  {activeTab === 'Customer Support' ? 'What is your return policy?' : 'What is the PTO policy?'}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--color-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Bot size={16}/></div>
                <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px 16px 16px 0', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', flex: 1 }}>
                  {activeTab === 'Customer Support' ? 'You can return items within 30 days of purchase.' : 'Employees get 20 days of PTO.'} <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>[1]</span>
                  
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} color="var(--color-primary)"/> {activeTab === 'Customer Support' ? 'Return Policy.pdf' : 'Handbook.pdf'}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>p.3</span>
                  </div>
                </div>
              </div>
              
              {/* Analytics Mini-Card */}
              <div style={{ position: 'absolute', bottom: '24px', right: '-24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)' }} className="hidden-mobile">
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {activeTab === 'Customer Support' ? 'Tickets resolved' : 'Time saved'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-main)' }}>+38%</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>vs last month</div>
                <svg width="100" height="30" style={{ marginTop: '8px' }}>
                  <polyline points="0,25 20,15 40,20 60,5 80,10 100,2" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Enterprise Security Banner */}
      <section style={{ padding: '0 24px' }}>
        <div className="container security-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <ShieldCheck size={32} color="#A78BFA" />
              <h3 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, color: "white" }}>Enterprise-grade security<br/>for your most important data.</h3>
            </div>
          </div>
          <div style={{ flex: '1 1 500px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><ShieldCheck size={18} color="#A78BFA"/></div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>SOC 2 Type II<br/>Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Lock size={18} color="#A78BFA"/></div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Encryption<br/>At Rest & In Transit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Layout size={18} color="#A78BFA"/></div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Private Workspaces<br/>& Access Control</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Search size={18} color="#A78BFA"/></div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Audit Logs<br/>& Monitoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section className="section" id="pricing">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="small-label">PRICING</div>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>Simple, <span className="text-gradient">transparent</span> pricing.</h2>
          
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg-soft)', borderRadius: '12px', padding: '4px', marginBottom: '64px', border: '1px solid var(--color-border)' }}>
            <button style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)' }}>Monthly</button>
            <button style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: 'var(--color-text-main)' }}>Yearly <span style={{ color: 'var(--color-success)', fontSize: '12px', marginLeft: '4px' }}>Save 20%</span></button>
          </div>
          
          <div className="pricing-grid text-left">
            {/* Free Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Free</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', minHeight: '40px' }}>For individuals getting started</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>$0</span><span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}> /month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1, fontSize: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> 1 Workspace</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> 50 Documents</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> 100 Questions / month</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> Basic AI Models</li>
              </ul>
              <button className="btn-secondary" style={{ width: '100%' }}>Get Started</button>
            </div>
            
            {/* Pro Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '2px solid var(--color-purple)', position: 'relative', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.1)' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-purple)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Popular</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Pro</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', minHeight: '40px' }}>For small teams</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>$29</span><span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}> /month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1, fontSize: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-purple)"/> 3 Workspaces</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-purple)"/> 5,000 Documents</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-purple)"/> 10,000 Questions / month</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-purple)"/> Advanced AI Models</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-purple)"/> Priority Support</li>
              </ul>
              <button className="btn-primary" style={{ width: '100%' }}>Start Free Trial</button>
            </div>
            
            {/* Business Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Business</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', minHeight: '40px' }}>For growing companies</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>$99</span><span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}> /month</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1, fontSize: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> Unlimited Workspaces</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> 25,000 Documents</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> 50,000 Questions / month</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> API Access</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> Analytics Dashboard</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-primary)"/> Team Management</li>
              </ul>
              <button className="btn-secondary" style={{ width: '100%' }}>Start Free Trial</button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Enterprise</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', minHeight: '40px' }}>For large organizations</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>Custom</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1, fontSize: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-text-main)"/> Everything in Business</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-text-main)"/> SSO / SAML</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-text-main)"/> Private Deployment</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-text-main)"/> Dedicated Support</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--color-text-main)"/> Custom SLAs</li>
              </ul>
              <button className="btn-secondary" style={{ width: '100%' }}>Contact Sales</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '32px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14}/> 14-day free trial</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14}/> No credit card required</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14}/> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="section" style={{ padding: '0 24px 80px' }}>
        <div className="container final-cta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px', color: 'white' }}>Ready to turn your knowledge into answers?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px' }}>Start building your AI knowledge assistant today.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ backgroundColor: 'white', color: 'var(--color-primary)', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Start Free &rarr;
            </Link>
            <button style={{ backgroundColor: 'transparent', color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', border: '1px solid rgba(255,255,255,0.3)' }}>
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', paddingTop: '64px', paddingBottom: '32px' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'space-between', marginBottom: '64px' }}>
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <img src="/logo.svg" alt="OmniRAG Logo" style={{ width: '32px', height: '32px' }} />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-main)' }}>OmniRAG</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              The RAG platform that connects your data with AI to deliver accurate, trusted answers.
            </p>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)' }}>
              <a href="#" style={{ color: 'inherit' }}>Twitter / X</a>
              <a href="#" style={{ color: 'inherit' }}>LinkedIn</a>
              <a href="#" style={{ color: 'inherit' }}>GitHub</a>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '120px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '4px' }}>Product</div>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Features</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Use Cases</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Pricing</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Changelog</a>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '120px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '4px' }}>Resources</div>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Documentation</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Blog</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Help Center</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Community</a>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '120px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '4px' }}>Company</div>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>About Us</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Careers</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Contact</a>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '120px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '4px' }}>Legal</div>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Privacy Policy</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Terms of Service</a>
              <a href="#" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Security</a>
            </div>
          </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '32px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '14px' }}>
          &copy; 2026 OmniRAG. All rights reserved.
        </div>
      </footer>

    </div>
  );
}