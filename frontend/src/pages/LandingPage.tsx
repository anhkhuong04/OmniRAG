import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  UploadCloud, 
  Settings, 
  MessageSquare, 
  FileText, 
  Globe, 
  Layers, 
  Lock, 
  Users, 
  BarChart, 
  CheckCircle2,
  FileDigit,
  SearchX,
  Bot,
  AlertTriangle,
  File,
  FileSpreadsheet
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Navbar */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 50, 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '1180px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold'
            }}>O</div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-header)' }}>OmniRAG</span>
          </div>

          <div style={{ display: 'none', gap: '32px', color: 'var(--text-body)', fontWeight: 500, fontSize: '14px' }} className="nav-links">
            <a href="#features" className="hover-lift">Product</a>
            <a href="#features" className="hover-lift">Features</a>
            <a href="#use-cases" className="hover-lift">Use Cases</a>
            <a href="#pricing" className="hover-lift">Pricing</a>
            <a href="#" className="hover-lift">Docs</a>
            <a href="#" className="hover-lift">Blog</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/dashboard" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-body)' }}>Log in</Link>
            <Link to="/dashboard" className="btn bg-gradient hover-lift" style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, border: 'none' }}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>
      
      <style>{`
        @media (min-width: 768px) { .nav-links { display: flex !important; } }
        .hero-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
        @media (min-width: 992px) { .hero-grid { grid-template-columns: 1fr 1fr; gap: 60px; } }
        .grid-4 { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 768px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .grid-4 { grid-template-columns: repeat(4, 1fr); } }
        .grid-3 { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 768px) { .grid-3 { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      {/* Main Content Wrapper */}
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px' }}>

        {/* 2. Hero Section */}
        <section className="hero-grid" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
          <div>
            <div className="badge-pill" style={{ marginBottom: '24px' }}>✨ AI POWERED RAG PLATFORM</div>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Turn Your Documents Into an <br className="hidden-mobile" />
              <span className="text-gradient">AI Knowledge</span> Assistant
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-body)', marginBottom: '40px', maxWidth: '500px', lineHeight: 1.6 }}>
              Upload your docs, connect data sources, and let AI answer questions based on your data with accurate citations.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn bg-gradient hover-lift" style={{ padding: '14px 28px', fontSize: '16px', border: 'none', borderRadius: '8px' }}>
                Start Free <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </Link>
              <button className="btn btn-outline hover-lift" style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '8px' }}>
                Book a Demo
              </button>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-body)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981"/> No credit card</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981"/> Setup in minutes</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#10b981"/> Cancel anytime</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="glass-card" style={{ padding: '24px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', gap: '16px', height: '400px' }}>
                {/* Mock Sidebar */}
                <div style={{ width: '140px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-header)' }}>Acme Corp KB</div>
                  <button style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>+ New Chat</button>
                  <div style={{ fontSize: '10px', color: 'var(--text-body)', marginTop: '8px' }}>Today</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-primary)', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '4px' }}>Refund policy</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-body)', padding: '4px 8px' }}>SLA agreement</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-body)', padding: '4px 8px' }}>Product roadmap</div>
                </div>
                {/* Mock Main Chat */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ alignSelf: 'flex-end', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px 12px 0 12px', fontSize: '13px', maxWidth: '80%' }}>
                      What is the refund policy for enterprise plans?
                    </div>
                    <div style={{ alignSelf: 'flex-start', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '12px 12px 12px 0', fontSize: '13px', maxWidth: '90%' }}>
                      Customers on Enterprise plans are eligible for a full refund within 30 days of purchase, provided they have not exceeded 50% of their monthly usage limit.<br/><br/>
                      <span style={{ fontSize: '11px', color: 'var(--text-body)', fontWeight: 600 }}>Sources:</span><br/>
                      <div style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '4px', marginTop: '4px', border: '1px solid #e2e8f0' }}>1. Refund Policy - Acme Corp.pdf (p. 2)</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', position: 'relative' }}>
                    <input type="text" disabled placeholder="Ask a follow-up question..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }} />
                    <SendIcon style={{ position: 'absolute', right: '12px', top: '10px', color: '#3b82f6', width: '16px' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Icons */}
            <div style={{ position: 'absolute', right: '-20px', top: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="glass-card" style={{ padding: '12px', color: '#ef4444' }}><File size={24} /></div>
              <div className="glass-card" style={{ padding: '12px', color: '#3b82f6' }}><FileText size={24} /></div>
              <div className="glass-card" style={{ padding: '12px', color: '#10b981' }}><FileSpreadsheet size={24} /></div>
            </div>
          </div>
        </section>

        {/* 3. Trusted By */}
        <section style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-body)', marginBottom: '32px', fontWeight: 500 }}>Trusted by modern teams at</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', opacity: 0.6, filter: 'grayscale(100%)' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px' }}>Linear</span>
            <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px' }}>▲ Vercel</span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>Notion</span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>Lark</span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>Retool</span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>Scale</span>
          </div>
        </section>

        {/* 4. Problem Section */}
        <section style={{ padding: '100px 0', textAlign: 'center' }}>
          <div className="badge-pill" style={{ marginBottom: '16px' }}>THE PROBLEM</div>
          <h2 style={{ fontSize: '36px', marginBottom: '48px' }}>Knowledge is <span className="text-gradient">everywhere</span>,<br/>answers are not.</h2>
          <div className="grid-4 text-left">
            <div className="feature-card">
              <div style={{ backgroundColor: '#fef2f2', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#ef4444' }}><FileDigit size={24} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Scattered data</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>Documents live in drives, wikis, emails, and databases.</p>
            </div>
            <div className="feature-card">
              <div style={{ backgroundColor: '#fff7ed', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#f97316' }}><SearchX size={24} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Hard to find</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>Teams waste time searching instead of getting work done.</p>
            </div>
            <div className="feature-card">
              <div style={{ backgroundColor: '#f3e8ff', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#a855f7' }}><Bot size={24} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>AI doesn't know</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>ChatGPT and others don't have access to your private data.</p>
            </div>
            <div className="feature-card">
              <div style={{ backgroundColor: '#f1f5f9', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#64748b' }}><AlertTriangle size={24} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>No reliable source</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>Answers without citations lead to mistakes and risk.</p>
            </div>
          </div>
        </section>

        {/* 5. Solution Section */}
        <section style={{ padding: '60px 0 100px', textAlign: 'center' }}>
          <div className="badge-pill" style={{ marginBottom: '16px' }}>THE SOLUTION</div>
          <h2 style={{ fontSize: '36px', marginBottom: '64px' }}>Your data. <span className="text-gradient">AI answers.</span><br/>Accurate and trusted.</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexWrap: 'wrap', gap: '32px' }}>
            {/* Dotted line for desktop */}
            <div style={{ position: 'absolute', top: '32px', left: '10%', right: '10%', height: '2px', borderTop: '2px dashed #cbd5e1', zIndex: 0 }} className="hidden-mobile"></div>
            
            <div style={{ flex: '1 1 200px', position: 'relative', zIndex: 1, backgroundColor: '#fafafa', padding: '0 16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #bfdbfe' }}><UploadCloud size={32} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Ingest</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '14px' }}>Upload files or connect any data source.</p>
            </div>
            
            <div style={{ flex: '1 1 200px', position: 'relative', zIndex: 1, backgroundColor: '#fafafa', padding: '0 16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #bfdbfe' }}><Layers size={32} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Process</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '14px' }}>We chunk, embed, and index your data.</p>
            </div>

            <div style={{ flex: '1 1 200px', position: 'relative', zIndex: 1, backgroundColor: '#fafafa', padding: '0 16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #bfdbfe' }}><MessageSquare size={32} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Ask</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '14px' }}>Ask anything in natural language.</p>
            </div>

            <div style={{ flex: '1 1 200px', position: 'relative', zIndex: 1, backgroundColor: '#fafafa', padding: '0 16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #bfdbfe' }}><FileText size={32} /></div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>4. Get answers</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '14px' }}>AI replies with accurate answers and citations.</p>
            </div>
          </div>
        </section>

        {/* 6. Features Section */}
        <section id="features" style={{ padding: '100px 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="badge-pill" style={{ marginBottom: '16px' }}>FEATURES</div>
            <h2 style={{ fontSize: '36px' }}>Everything you need for a <span className="text-gradient">powerful</span><br/>RAG experience</h2>
          </div>
          
          <div className="grid-4">
            <FeatureItem icon={<FileText size={20}/>} title="Document Upload" desc="Import PDF, DOCX, TXT, CSV and more." color="#3b82f6" />
            <FeatureItem icon={<Globe size={20}/>} title="Website Crawler" desc="Crawl and extract content from any website." color="#10b981" />
            <FeatureItem icon={<MessageSquare size={20}/>} title="AI Chat with Citations" desc="Get answers with sources from your documents." color="#8b5cf6" />
            <FeatureItem icon={<Layers size={20}/>} title="Multi-workspace" desc="Organize knowledge bases for teams and projects." color="#f43f5e" />
            <FeatureItem icon={<Settings size={20}/>} title="API Access" desc="Integrate with your apps using our REST API." color="#f59e0b" />
            <FeatureItem icon={<Lock size={20}/>} title="Security & Privacy" desc="Your data is encrypted and never used for training." color="#14b8a6" />
            <FeatureItem icon={<Users size={20}/>} title="Team Collaboration" desc="Invite members and set roles & permissions." color="#0ea5e9" />
            <FeatureItem icon={<BarChart size={20}/>} title="Analytics Dashboard" desc="Track usage, popular questions and more." color="#d946ef" />
          </div>
        </section>

        {/* 7. Use Cases Section */}
        <section id="use-cases" style={{ padding: '100px 0', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
          <div className="badge-pill" style={{ marginBottom: '16px' }}>USE CASES</div>
          <h2 style={{ fontSize: '36px', marginBottom: '48px' }}><span className="text-gradient">Built</span> for every team and industry</h2>
          
          <div className="grid-3 text-left">
            <UseCaseCard title="Customer Support" desc="Answer customer questions from help docs in seconds." icon="🎧" />
            <UseCaseCard title="HR & People Ops" desc="Instantly find policies, handbooks, and HR information." icon="👥" />
            <UseCaseCard title="Legal" desc="Search contracts, NDAs, and legal documents with confidence." icon="⚖️" />
            <UseCaseCard title="Education" desc="Help students and teachers get answers from course materials." icon="📚" />
            <UseCaseCard title="Sales Enablement" desc="Find product info, competitive intel, and pitch docs fast." icon="💼" />
            <UseCaseCard title="Internal Knowledge" desc="Centralize company knowledge and boost team productivity." icon="🧠" />
          </div>
          <div style={{ marginTop: '32px' }}>
            <a href="#" style={{ color: '#3b82f6', fontWeight: 500 }}>Explore all use cases →</a>
          </div>
        </section>

        {/* 8. Pricing Section */}
        <section id="pricing" style={{ padding: '100px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div className="badge-pill" style={{ marginBottom: '16px' }}>PRICING</div>
          <h2 style={{ fontSize: '36px', marginBottom: '24px' }}>Simple, <span className="text-gradient">transparent</span> pricing</h2>
          
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '48px' }}>
            <button style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-body)' }}>Monthly</button>
            <button style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, backgroundColor: 'white', color: '#3b82f6', boxShadow: 'var(--shadow-sm)' }}>Yearly <span style={{ color: '#10b981', fontSize: '12px' }}>Save 20%</span></button>
          </div>

          <div className="grid-4 text-left">
            <PricingCard title="Free" subtitle="For individuals getting started" price="$0" features={["1 Workspace", "50 Documents", "100 Questions / month", "Basic AI Models"]} cta="Get Started" outline />
            <PricingCard title="Pro" subtitle="For small teams" price="$29" features={["3 Workspaces", "5,000 Documents", "10,000 Questions / month", "Advanced AI Models", "Priority Support"]} cta="Start Free Trial" isPro />
            <PricingCard title="Business" subtitle="For growing companies" price="$99" features={["Unlimited Workspaces", "25,000 Documents", "50,000 Questions / month", "API Access", "Analytics Dashboard", "Team Management"]} cta="Start Free Trial" outline />
            <PricingCard title="Enterprise" subtitle="For large organizations" price="Custom" isCustom features={["Everything in Business", "SSO / SAML", "Private Deployment", "Dedicated Support", "Custom SLAs"]} cta="Contact Sales" outline />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px', fontSize: '14px', color: 'var(--text-body)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#cbd5e1"/> No credit card required</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#cbd5e1"/> 14-day free trial</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="#cbd5e1"/> Cancel anytime</span>
          </div>
        </section>

      </main>

      {/* 9. Final CTA */}
      <section className="bg-gradient" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>Ready to transform your knowledge into answers?</h2>
        <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px' }}>Start building your AI knowledge assistant today.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn hover-lift" style={{ backgroundColor: 'white', color: '#3b82f6', padding: '14px 28px', fontSize: '16px', borderRadius: '8px' }}>
            Start Free <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Link>
          <button className="btn hover-lift" style={{ border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: 'white', padding: '14px 28px', fontSize: '16px', borderRadius: '8px' }}>
            Book a Demo
          </button>
        </div>
      </section>

      {/* 10. Footer */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid var(--border-color)', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>O</div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-header)' }}>OmniRAG</span>
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              The RAG platform that connects your data with AI to deliver accurate, trusted answers.
            </p>
            <div style={{ display: 'flex', gap: '16px', color: '#94a3b8' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}></div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}></div>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}></div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
            <FooterCol title="Product" links={['Features', 'Use Cases', 'Pricing', 'Changelog']} />
            <FooterCol title="Resources" links={['Documentation', 'Blog', 'Help Center', 'Community']} />
            <FooterCol title="Company" links={['About Us', 'Careers', 'Contact']} />
            <FooterCol title="Legal" links={['Privacy Policy', 'Terms of Service', 'Security']} />
          </div>
        </div>
      </footer>
      
      <style>{`
        .hidden-mobile { display: block; }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function FeatureItem({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  return (
    <div className="feature-card">
      <div style={{ backgroundColor: `${color}15`, color: color, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-body)' }}>{desc}</p>
    </div>
  );
}

function UseCaseCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div className="feature-card" style={{ display: 'flex', gap: '16px', padding: '20px' }}>
      <div style={{ fontSize: '24px', backgroundColor: '#f8fafc', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-body)' }}>{desc}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, subtitle, price, isCustom, features, cta, isPro }: any) {
  return (
    <div className={`pricing-card ${isPro ? 'pro' : ''}`}>
      {isPro && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6366f1', color: 'white', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>Popular</div>}
      <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-body)', marginBottom: '24px' }}>{subtitle}</p>
      
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '40px', fontWeight: 800 }}>{price}</span>
        {!isCustom && <span style={{ color: 'var(--text-body)' }}>/month</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
        {features.map((f: string, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-body)' }}>
            <CheckCircle2 size={16} color={isPro ? "#6366f1" : "#10b981"} />
            {f}
          </div>
        ))}
      </div>

      <button className={`btn hover-lift ${isPro ? 'bg-gradient' : 'btn-outline'}`} style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', border: isPro ? 'none' : '' }}>
        {cta}
      </button>
    </div>
  );
}

function FooterCol({ title, links }: { title: string, links: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {links.map((link, i) => (
          <a key={i} href="#" style={{ color: 'var(--text-body)', fontSize: '14px' }} className="transition-colors hover-lift">{link}</a>
        ))}
      </div>
    </div>
  );
}

// Simple dummy icon for input box
function SendIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );
}
