# OmniRAG Landing Page UI Specification

## 1. Product Context

Build a modern SaaS landing page for **OmniRAG**, a RAG platform that lets businesses connect documents, websites, and private data to deploy AI assistants that answer with verified sources and citations.

The landing page must communicate that OmniRAG is not a generic chatbot. It provides **grounded AI answers** based on private company knowledge, with citations, retrieved context, source documents, workspaces, analytics, and enterprise security.

**Tone:** clean, trustworthy, enterprise-ready, modern AI SaaS.

---

## 2. Core Positioning

### Main message

```text
Your Knowledge. Grounded AI Answers.
```

### Supporting message

```text
Connect your documents, websites, and business data. Deploy AI assistants that answer with verified sources and zero guesswork.
```

### Product differentiation

OmniRAG should visually emphasize:

- Grounded answers
- Source citations
- Retrieved context
- Confidence signals
- Private knowledge base
- Workspace isolation
- Enterprise-grade security
- Multi-source ingestion

The page should avoid looking like a generic AI chatbot landing page. The UI should make it obvious that this is a **RAG platform**.

---

## 3. Visual Style

## 3.1 Color Palette

Use a white and very light blue background with blue/purple gradients.

```css
:root {
  --color-bg: #FFFFFF;
  --color-bg-soft: #F8FAFC;
  --color-bg-blue: #F5F8FF;

  --color-text-main: #0F172A;
  --color-text-muted: #64748B;
  --color-text-light: #94A3B8;

  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-purple: #7C3AED;
  --color-indigo: #4F46E5;

  --color-gradient: linear-gradient(90deg, #2563EB 0%, #7C3AED 100%);

  --color-border: #E2E8F0;
  --color-card: #FFFFFF;

  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
}
```

### Color usage rules

- Use blue/purple gradient only for important AI/RAG emphasis, CTA buttons, badges, active states, and final CTA section.
- Do not use too many random icon colors.
- Feature icons may use soft tinted backgrounds, but the brand identity should stay blue/purple.
- Green should represent success or high confidence.
- Yellow should represent warning.
- Red should represent error/destructive states.

---

## 3.2 Typography

Use a modern sans-serif font.

Recommended font stack:

```css
font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Typography scale:

```css
.hero-title {
  font-size: 64px;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.section-title {
  font-size: 40px;
  line-height: 1.18;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.card-title {
  font-size: 17px;
  line-height: 1.3;
  font-weight: 700;
}

.body-text {
  font-size: 16px;
  line-height: 1.65;
  font-weight: 400;
}

.small-label {
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Responsive typography:

```css
@media (max-width: 1024px) {
  .hero-title {
    font-size: 48px;
  }

  .section-title {
    font-size: 34px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 36px;
  }

  .section-title {
    font-size: 28px;
  }
}
```

---

## 3.3 Layout Rules

Use a centered container.

```css
.container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

section {
  padding: 88px 0;
}

@media (max-width: 640px) {
  section {
    padding: 64px 0;
  }
}
```

Card style:

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}
```

Button style:

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(90deg, #2563EB, #7C3AED);
  color: white;
  border-radius: 12px;
  padding: 14px 22px;
  font-weight: 700;
  border: none;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.24);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  color: #0F172A;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 22px;
  font-weight: 700;
}
```

---

## 4. Page Structure

Implement the landing page with these sections:

```text
1. Header / Navbar
2. Hero Section
3. Trusted Logos
4. Problem Chain
5. How OmniRAG Works
6. Trust / Verification Section
7. Platform Capabilities
8. Use Cases
9. Enterprise Security Banner
10. Pricing
11. Final CTA
12. Footer
```

---

# 5. Header / Navbar

## Layout

Sticky top header with translucent white background.

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
}
```

Desktop layout:

```text
[OmniRAG Logo]     Product ▼   Solutions ▼   Resources ▼   Pricing   Docs   Company ▼     Log in   Start Free →
```

Logo requirements:

- Use a hexagon/cube-style icon.
- Brand text: `OmniRAG`.
- Text color: dark navy.
- Icon gradient: blue to purple.

Navigation items:

```text
Product
Solutions
Resources
Pricing
Docs
Company
```

Right buttons:

```text
Log in
Start Free →
```

Mobile behavior:

- Show logo on the left.
- Show hamburger menu on the right.
- Hide full desktop nav.

---

# 6. Hero Section

## Layout

Desktop uses two columns:

```text
Left: copy + CTA
Right: product mockup
```

```css
.hero-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 64px;
  align-items: center;
}

@media (max-width: 960px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
```

## Hero Copy

Badge:

```text
AI-POWERED RAG PLATFORM
```

Headline:

```text
Your Knowledge.
Grounded AI Answers.
```

Highlight `Grounded AI Answers` with blue/purple gradient text.

Subheadline:

```text
Connect your documents, websites, and business data. Deploy AI assistants that answer with verified sources and zero guesswork.
```

CTA row:

```text
[Start Free →] [Book a Demo]
```

Trust microcopy row:

```text
✓ No credit card
✓ Setup in minutes
✓ Cancel anytime
```

---

## Hero Product Mockup

Create a large SaaS dashboard mockup card.

```css
.mockup {
  border-radius: 28px;
  background: white;
  border: 1px solid #E2E8F0;
  box-shadow: 0 30px 80px rgba(37, 99, 235, 0.16);
  overflow: hidden;
}
```

Mockup has 3 internal columns:

```text
Sidebar | Chat Area | Answer Details Panel
```

### Left Sidebar

Approximate width: `160px`.

Content:

```text
Acme Corp ▼

+ New Chat

Chat
Sources
Datasets
Analytics
Settings

Jane Doe
Admin
```

Active item: `Chat`, with soft blue background.

### Main Chat Panel

Top user question bubble:

```text
What is the refund policy for enterprise plans?
```

AI answer card:

```text
Enterprise customers are eligible for a full refund within 30 days of purchase, provided they have not exceeded 80% of their monthly usage limit.
```

Sources block:

```text
Sources (3)

1. Refund Policy – Acme Corp.pdf     p.3     96%
2. Terms of Service – Acme Corp.pdf  p.7     87%
3. Enterprise Agreement.docx         p.12    81%

View retrieved chunks →
```

Input box:

```text
Ask a follow-up question...
```

### Right Details Panel

Content:

```text
Answer details

Sources used      3
Chunks retrieved  8
Confidence        High
```

Small card:

```text
Grounded in your data

AI answers are generated only from your connected knowledge sources.

Learn more →
```

Design note: this right panel is important because it visually proves OmniRAG is a RAG product, not just a chatbot.

---

# 7. Trusted Logos Section

Small centered text:

```text
Trusted by teams at
```

Logo row:

```text
Linear
Vercel
Notion
Lark
Retool
Scale
Brex
```

Use grayscale/black logos or text-only placeholders. Keep logo height around `24px–32px`.

---

# 8. Problem Chain Section

Background: very light blue/gray.

Small label:

```text
THE PROBLEM
```

Headline:

```text
Knowledge is everywhere, answers are not.
```

Show 4 cards connected by arrows.

Desktop:

```text
[Scattered data] → [Hard to find] → [AI doesn't know] → [Unreliable answers]
```

Mobile:

```text
[Scattered data]
       ↓
[Hard to find]
       ↓
[AI doesn't know]
       ↓
[Unreliable answers]
```

Cards:

## Card 1

Title:

```text
Scattered data
```

Description:

```text
Information lives in drives, wikis, emails, and databases.
```

Icon: document/database icon.

## Card 2

Title:

```text
Hard to find
```

Description:

```text
Teams waste time searching instead of getting work done.
```

Icon: search icon.

## Card 3

Title:

```text
AI doesn't know
```

Description:

```text
LLMs don't have access to your private, up-to-date data.
```

Icon: brain/AI icon.

## Card 4

Title:

```text
Unreliable answers
```

Description:

```text
Without sources and context, answers can't be trusted.
```

Icon: shield/check icon.

---

# 9. How OmniRAG Works Section

Small label:

```text
HOW OMNIRAG WORKS
```

Headline:

```text
From any source to trusted answers.
```

Display a horizontal 4-step process.

```text
01 Ingest → 02 Process → 03 Ask → 04 Get answers
```

Connector lines should be visible, not too faint.

## Step 1: Ingest

Description:

```text
Upload files, connect apps, and add websites.
```

Small source icons:

```text
PDF, DOCX, TXT, CSV, Drive, Notion, Website, API
```

## Step 2: Process

Description:

```text
We chunk, embed, and index your data securely.
```

## Step 3: Ask

Description:

```text
Ask anything in natural language.
```

## Step 4: Get answers

Description:

```text
AI replies with accurate answers and citations.
```

---

# 10. Trust / Verification Section

This is a key section. Use a dark navy background with blue/purple glow.

```css
.trust-section {
  background:
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.35), transparent 35%),
    linear-gradient(135deg, #020617, #0F172A);
  color: white;
}
```

Layout:

```text
Left: trust copy + bullet benefits
Right: answer verification mockup
```

Label:

```text
BUILT FOR TRUST
```

Headline:

```text
AI answers you can verify.
```

Highlight `verify` in gradient or light purple.

Description:

```text
Every answer is grounded in your knowledge and linked back to its original source.
```

Benefits:

```text
Source citations
See exactly where the answer comes from.

Grounded retrieval
Answers are generated only from retrieved context.

Workspace isolation
Your data is private, secure, and always yours.
```

Right mockup:

```text
AI Answer

Employees receive 20 days of annual leave. [1]

Sources

[1] Employee Handbook.pdf      Page 24      94%
```

Retrieved context panel:

```text
Retrieved context

"Full-time employees are entitled to 20 days of paid annual leave per calendar year, in addition to public holidays..."

Chunk 2 of 8

View all sources →
```

Add a floating shield icon near the mockup.

---

# 11. Platform Capabilities Section

Small label:

```text
POWERFUL CAPABILITIES
```

Headline:

```text
Everything you need for a modern RAG platform.
```

Instead of 8 equal cards, group features into 3 large cards.

```css
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .capabilities-grid {
    grid-template-columns: 1fr;
  }
}
```

## Group 1: Knowledge Ingestion

Items:

```text
Document Upload
PDF, DOCX, TXT, CSV and more.

Website Crawler
Crawl and extract content from any website.

Smart Processing
Chunk, embed, and index for high-quality retrieval.
```

## Group 2: AI & Retrieval

Items:

```text
AI Chat with Citations
Get answers with sources from your data.

Advanced Retrieval
Hybrid search, reranking, and metadata filtering.

API Access
Integrate with your apps using our REST API.
```

## Group 3: Enterprise Ready

Items:

```text
Multi-workspace
Organize knowledge bases for teams and projects.

Security & Privacy
Your data is encrypted and never used for training.

Analytics Dashboard
Track usage, popular queries, and answer performance.
```

---

# 12. Use Cases Section

Small label:

```text
USE CASES
```

Headline:

```text
Built for teams across every industry.
```

Use tabs instead of tiny equal cards.

Tab list:

```text
Customer Support | HR & People Ops | Legal | Education | Sales Enablement | Internal Knowledge
```

Default active tab: `Customer Support`.

## Customer Support tab content

Left content:

```text
Resolve customer questions faster

Enable your support team with instant answers from docs, policies, and product guides.

✓ Reduce repetitive tickets
✓ Provide 24/7 self-service
✓ Cite official documentation
```

Right mockup:

```text
User question:
What is your return policy?

AI answer:
You can return items within 30 days of purchase. [1]

Source:
Return Policy.pdf     p.3
```

Analytics mini-card:

```text
Tickets resolved
38%
vs last month
```

## Other tabs

The implementation may reuse the same layout and change the text.

### HR & People Ops

```text
Answer employee policy questions instantly.
Use handbooks, onboarding guides, and HR documents as the source of truth.
```

### Legal

```text
Search contracts, NDAs, and legal documents with confidence.
```

### Education

```text
Help students and teachers find answers from course materials.
```

### Sales Enablement

```text
Help sales teams find product details, competitive intel, and pitch content fast.
```

### Internal Knowledge

```text
Centralize company knowledge and improve team productivity.
```

---

# 13. Enterprise Security Banner

Create a full-width dark card before pricing.

```css
.security-banner {
  background: linear-gradient(90deg, #020617, #1E1B4B, #312E81);
  border-radius: 24px;
  color: white;
  padding: 32px;
}
```

Content:

```text
Enterprise-grade security for your most important data.
```

Security items:

```text
SOC 2 Type II Compliant
Encryption At Rest & In Transit
Private Workspaces & Access Control
Audit Logs & Monitoring
```

Use shield/lock icons.

---

# 14. Pricing Section

Small label:

```text
PRICING
```

Headline:

```text
Simple, transparent pricing.
```

Billing toggle:

```text
Monthly | Yearly | Save 20%
```

Use 4 pricing cards.

Desktop grid:

```css
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
```

## Free Plan

```text
Free
For individuals getting started

$0 /month

✓ 1 Workspace
✓ 50 Documents
✓ 100 Questions / month
✓ Basic AI Models

Button: Get Started
```

## Pro Plan

Highlight this card as popular.

```text
Pro
For small teams

$29 /month

✓ 3 Workspaces
✓ 5,000 Documents
✓ 10,000 Questions / month
✓ Advanced AI Models
✓ Priority Support

Button: Start Free Trial
```

Add badge:

```text
Popular
```

## Business Plan

```text
Business
For growing companies

$99 /month

✓ Unlimited Workspaces
✓ 25,000 Documents
✓ 50,000 Questions / month
✓ API Access
✓ Analytics Dashboard
✓ Team Management

Button: Start Free Trial
```

## Enterprise Plan

```text
Enterprise
For large organizations

Custom

✓ Everything in Business
✓ SSO / SAML
✓ Private Deployment
✓ Dedicated Support
✓ Custom SLAs

Button: Contact Sales
```

Pricing microcopy row:

```text
✓ 14-day free trial
✓ No credit card required
✓ Cancel anytime
```

---

# 15. Final CTA Section

Use a blue/purple gradient background.

```css
.final-cta {
  background: linear-gradient(90deg, #2563EB, #7C3AED);
  color: white;
  border-radius: 28px;
  padding: 40px;
}
```

Content:

```text
Ready to turn your knowledge into answers?
Start building your AI knowledge assistant today.
```

Buttons:

```text
[Start Free →] [Book a Demo]
```

The secondary button should be white with dark text.

---

# 16. Footer

Layout: 5 columns.

## Column 1: Brand

```text
OmniRAG

The RAG platform that connects your data with AI to deliver accurate, trusted answers.
```

Social icons:

```text
Twitter / X
LinkedIn
GitHub
```

## Column 2: Product

```text
Features
Use Cases
Pricing
Changelog
```

## Column 3: Resources

```text
Documentation
Blog
Help Center
Community
```

## Column 4: Company

```text
About Us
Careers
Contact
```

## Column 5: Legal

```text
Privacy Policy
Terms of Service
Security
```

Footer bottom:

```text
© 2026 OmniRAG. All rights reserved.
```

---

# 17. Responsive Behavior

## Desktop

- Full navbar visible.
- Hero is two columns.
- Problem cards are horizontal.
- How-it-works process is horizontal.
- Capabilities are 3 columns.
- Pricing is 4 columns.

## Tablet

- Hero can remain two columns if space allows, otherwise stack.
- Pricing becomes 2 columns.
- Capabilities can become 1 or 2 columns.

## Mobile

- Header shows logo and hamburger.
- Hero stacks vertically.
- Product mockup can be simplified:
  - hide right answer details panel, or move it below.
  - sidebar can be hidden.
- Problem chain becomes vertical.
- How-it-works becomes vertical.
- Capabilities become 1 column.
- Use case tabs can become horizontally scrollable.
- Pricing becomes 1 column.

---

# 18. Interaction Requirements

## Buttons

All buttons should have hover and active states.

Primary button hover:

```css
transform: translateY(-1px);
box-shadow: 0 16px 32px rgba(37, 99, 235, 0.28);
```

Secondary button hover:

```css
border-color: #CBD5E1;
background: #F8FAFC;
```

## Tabs

Use case tabs should update active content.

Active tab style:

```css
.active-tab {
  color: #2563EB;
  border-bottom: 2px solid #2563EB;
}
```

## Pricing toggle

The monthly/yearly toggle can be visual only in the first version. If implemented, yearly should show discounted pricing.

Example:

```text
Pro monthly: $29
Pro yearly: $23/month billed yearly
Business monthly: $99
Business yearly: $79/month billed yearly
```

---

# 19. Accessibility Requirements

- Use semantic HTML: `header`, `nav`, `main`, `section`, `footer`.
- All buttons must be keyboard-focusable.
- Use visible focus states.
- Text contrast must meet WCAG AA where practical.
- Icons should be decorative unless they carry meaning.
- Use `aria-label` for icon-only buttons.
- Tabs should use proper ARIA roles if implemented interactively.

Example:

```html
<div role="tablist" aria-label="Use cases">
  <button role="tab" aria-selected="true">Customer Support</button>
  <button role="tab" aria-selected="false">HR & People Ops</button>
</div>
```

---

# 20. Animation Guidelines

Use subtle animations only.

Recommended:

- Fade-up on section enter.
- Slight hover lift on cards.
- Soft gradient glow in hero and trust section.
- No aggressive parallax.
- No distracting infinite animations.

Card hover:

```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
}
```

Transition:

```css
transition: all 0.2s ease;
```

---

# 21. Implementation Priority

Build in this order:

1. Global layout, colors, typography
2. Header
3. Hero + product mockup
4. Trusted logos
5. Problem chain
6. How-it-works
7. Trust/verification section
8. Capabilities
9. Use cases with tabs
10. Security banner
11. Pricing
12. Final CTA
13. Footer
14. Responsive polish
15. Accessibility checks

---

# 22. Quality Bar

The finished UI should feel:

- More enterprise-ready than a generic AI chatbot site.
- More RAG-specific through citations, retrieved chunks, confidence, and source panels.
- Clean, bright, trustworthy, and modern.
- Easy to scan from top to bottom.
- Clear about business value, not only technical features.

Avoid:

- Overusing random pastel colors.
- Making all cards visually equal.
- Hiding the RAG differentiation inside small feature text.
- Repeating the same section pattern too many times.
- Making the product look like just another ChatGPT wrapper.
