export const DEMO_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0c0e16;
      line-height: 1.6;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }
    img { max-width: 100%; display: block; }

    /* ─── Header ──────────────────────────────────── */
    .header {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .header-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px;
    }
    .logo {
      display: flex; align-items: center; gap: 10px;
      font-size: 20px; font-weight: 800; color: #4361ee;
    }
    .logo svg { width: 32px; height: 32px; }
    .nav { display: flex; align-items: center; gap: 32px; }
    .nav a { font-size: 15px; font-weight: 500; color: #475569; transition: color .2s; }
    .nav a:hover { color: #0c0e16; }
    .header-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px; background: #4361ee; color: #fff;
      font-size: 14px; font-weight: 600; border-radius: 8px;
      transition: background .2s, transform .15s; cursor: pointer; border: none;
    }
    .header-cta:hover { background: #3451d1; transform: translateY(-1px); }

    /* ─── Hero ────────────────────────────────────── */
    .hero {
      padding: 100px 32px 80px;
      text-align: center;
      background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%);
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; margin-bottom: 32px;
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 999px; font-size: 13px; font-weight: 600;
      color: #4361ee; box-shadow: 0 4px 12px rgba(67,97,238,0.08);
    }
    .hero h1 {
      font-size: 64px; font-weight: 900; line-height: 1.05;
      color: #0c0e16; max-width: 820px; margin: 0 auto 24px;
      letter-spacing: -2px;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #4361ee 0%, #7c3aed 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-subtitle {
      font-size: 20px; color: #64748b; max-width: 600px;
      margin: 0 auto 48px; line-height: 1.7; font-weight: 400;
    }
    .hero-buttons { display: flex; justify-content: center; gap: 16px; margin-bottom: 64px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 36px; background: #4361ee; color: #fff;
      font-size: 16px; font-weight: 600; border-radius: 12px; border: none; cursor: pointer;
      box-shadow: 0 8px 24px rgba(67,97,238,0.25); transition: all .2s;
    }
    .btn-primary:hover { background: #3451d1; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(67,97,238,0.35); }
    .btn-primary svg { width: 20px; height: 20px; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 36px; background: #fff; color: #0c0e16;
      font-size: 16px; font-weight: 600; border-radius: 12px;
      border: 1px solid #e2e8f0; cursor: pointer; transition: all .2s;
    }
    .btn-secondary:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .hero-image-wrap {
      max-width: 1100px; margin: 0 auto;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 32px 64px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
    }
    .hero-image-wrap img { width: 100%; }

    /* ─── Logos / Social Proof ────────────────────── */
    .social-proof {
      padding: 64px 32px;
      background: #fafbff;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
    }
    .social-proof-inner {
      max-width: 900px; margin: 0 auto; text-align: center;
    }
    .social-proof-label {
      font-size: 13px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 32px;
    }
    .social-proof-logos {
      display: flex; align-items: center; justify-content: center;
      gap: 48px; flex-wrap: wrap; opacity: 0.5;
    }
    .social-proof-logos span {
      font-size: 22px; font-weight: 800; color: #334155;
      letter-spacing: -0.5px;
    }

    /* ─── Features ────────────────────────────────── */
    .features {
      padding: 120px 32px;
      background: #fff;
    }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-header {
      text-align: center; margin-bottom: 72px;
    }
    .section-header h2 {
      font-size: 44px; font-weight: 800; color: #0c0e16;
      letter-spacing: -1px; margin-bottom: 16px; line-height: 1.15;
    }
    .section-header p {
      font-size: 18px; color: #64748b; max-width: 560px; margin: 0 auto;
    }
    .features-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .feature-card {
      background: #fafbff;
      border: 1px solid #f1f5f9;
      border-radius: 20px; padding: 40px;
      transition: transform .2s, box-shadow .2s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0,0,0,0.06);
    }
    .feature-card-image {
      width: 100%; border-radius: 12px; margin-bottom: 28px;
      background: linear-gradient(135deg, #e0e7ff, #ede9fe);
      height: 220px; display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .feature-card-image img { width: 90%; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .feature-card h3 {
      font-size: 22px; font-weight: 700; color: #0c0e16; margin-bottom: 12px;
    }
    .feature-card p {
      font-size: 15px; color: #64748b; line-height: 1.7;
    }

    /* ─── How It Works ────────────────────────────── */
    .how-it-works {
      padding: 120px 32px;
      background: #0c0e16;
      color: #fff;
    }
    .how-it-works .section-header h2 { color: #fff; }
    .how-it-works .section-header p { color: #94a3b8; }
    .steps-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px;
    }
    .step-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; padding: 40px; text-align: center;
    }
    .step-number {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 800; color: #fff;
      margin-bottom: 24px;
    }
    .step-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .step-card p { font-size: 15px; color: #94a3b8; line-height: 1.7; }

    /* ─── Pricing ─────────────────────────────────── */
    .pricing {
      padding: 120px 32px;
      background: #fafbff;
    }
    .pricing-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
    }
    .pricing-card {
      background: #fff; border: 1px solid #f1f5f9;
      border-radius: 20px; padding: 40px;
      display: flex; flex-direction: column;
    }
    .pricing-card.popular {
      border: 2px solid #4361ee;
      box-shadow: 0 16px 48px rgba(67,97,238,0.12);
      position: relative;
    }
    .pricing-tag {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: #4361ee; color: #fff;
      padding: 6px 20px; border-radius: 999px;
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .pricing-plan { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .pricing-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
    .pricing-price strong { font-size: 48px; font-weight: 800; color: #0c0e16; letter-spacing: -2px; }
    .pricing-price span { font-size: 16px; color: #94a3b8; }
    .pricing-desc { font-size: 15px; color: #64748b; margin-bottom: 32px; line-height: 1.6; }
    .pricing-divider { height: 1px; background: #f1f5f9; margin-bottom: 24px; }
    .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 14px; flex: 1; margin-bottom: 32px; }
    .pricing-features li {
      display: flex; align-items: center; gap: 12px;
      font-size: 14px; color: #475569;
    }
    .pricing-features li svg { width: 18px; height: 18px; color: #4361ee; flex-shrink: 0; }
    .pricing-btn {
      width: 100%; padding: 14px; text-align: center;
      border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all .2s; border: none;
    }
    .pricing-btn.fill { background: #4361ee; color: #fff; }
    .pricing-btn.fill:hover { background: #3451d1; }
    .pricing-btn.outline { background: #fff; color: #0c0e16; border: 1px solid #e2e8f0; }
    .pricing-btn.outline:hover { border-color: #4361ee; color: #4361ee; }

    /* ─── Testimonials ────────────────────────────── */
    .testimonials {
      padding: 120px 32px;
      background: #fff;
    }
    .testimonials-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
    }
    .testimonial-card {
      background: #fafbff; border: 1px solid #f1f5f9;
      border-radius: 20px; padding: 36px;
    }
    .testimonial-stars { display: flex; gap: 4px; margin-bottom: 20px; }
    .testimonial-stars svg { width: 16px; height: 16px; color: #f59e0b; }
    .testimonial-text {
      font-size: 15px; color: #334155; line-height: 1.8;
      margin-bottom: 24px; font-style: italic;
    }
    .testimonial-author { display: flex; align-items: center; gap: 14px; }
    .testimonial-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, #e0e7ff, #c4b5fd);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; color: #4361ee;
    }
    .testimonial-author-name { font-size: 15px; font-weight: 600; color: #0c0e16; }
    .testimonial-author-role { font-size: 13px; color: #94a3b8; }

    /* ─── CTA ─────────────────────────────────────── */
    .cta-section {
      padding: 100px 32px;
      background: linear-gradient(135deg, #4361ee 0%, #7c3aed 100%);
      text-align: center; color: #fff;
    }
    .cta-section h2 {
      font-size: 44px; font-weight: 800; margin-bottom: 16px; letter-spacing: -1px;
    }
    .cta-section p {
      font-size: 18px; opacity: 0.85; max-width: 500px;
      margin: 0 auto 40px; line-height: 1.7;
    }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 18px 40px; background: #fff; color: #4361ee;
      font-size: 16px; font-weight: 700; border-radius: 12px;
      border: none; cursor: pointer; transition: all .2s;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }

    /* ─── Footer ──────────────────────────────────── */
    .footer {
      padding: 64px 32px 40px;
      background: #0c0e16; color: #94a3b8;
    }
    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 48px;
    }
    .footer-brand p { font-size: 14px; line-height: 1.7; margin-top: 16px; max-width: 280px; }
    .footer-col h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fff; margin-bottom: 20px; }
    .footer-col a { display: block; font-size: 14px; color: #94a3b8; margin-bottom: 12px; transition: color .2s; }
    .footer-col a:hover { color: #fff; }
    .footer-bottom {
      max-width: 1200px; margin: 40px auto 0;
      padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px;
    }

    /* ─── Responsive ──────────────────────────────── */
    @media (max-width: 768px) {
      .hero h1 { font-size: 40px; }
      .features-grid, .steps-grid, .pricing-grid, .testimonials-grid { grid-template-columns: 1fr; }
      .footer-inner { grid-template-columns: 1fr 1fr; }
      .nav { display: none; }
    }

    /* ─── Check icon reuse ────────────────────────── */
    .check-icon { width: 18px; height: 18px; color: #4361ee; }
  </style>
</head>
<body>

<!-- ═══ HEADER ═══════════════════════════════════════ -->
<header class="header">
  <div class="header-inner">
    <div class="logo">
      <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#4361ee"/><path d="M10 16l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      SnapEdit
    </div>
    <nav class="nav">
      <a href="#features">Features</a>
      <a href="#how-it-works">How It Works</a>
      <a href="#pricing">Pricing</a>
      <a href="#testimonials">Testimonials</a>
    </nav>
    <button class="header-cta">Get Started Free →</button>
  </div>
</header>

<!-- ═══ HERO ═════════════════════════════════════════ -->
<section class="hero">
  <div class="hero-badge">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4361ee" stroke-width="2.5" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    Trusted by 5,000+ teams worldwide
  </div>
  <h1>Build Stunning Websites <span>Visually</span></h1>
  <p class="hero-subtitle">The modern visual editor for teams. Select elements, style them instantly, and ship production-ready pages — no code required.</p>
  <div class="hero-buttons">
    <button class="btn-primary">
      Get Started Free
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
    <button class="btn-secondary">Watch Demo</button>
  </div>
  <div class="hero-image-wrap">
    <img src="/assets/demo/hero.png" alt="SnapEdit Dashboard" />
  </div>
</section>

<!-- ═══ SOCIAL PROOF ════════════════════════════════ -->
<section class="social-proof">
  <div class="social-proof-inner">
    <div class="social-proof-label">Trusted by industry leaders</div>
    <div class="social-proof-logos">
      <span>Stripe</span>
      <span>Vercel</span>
      <span>Linear</span>
      <span>Notion</span>
      <span>Figma</span>
      <span>Supabase</span>
    </div>
  </div>
</section>

<!-- ═══ FEATURES ════════════════════════════════════ -->
<section class="features" id="features">
  <div class="section-inner">
    <div class="section-header">
      <h2>Everything You Need to Build Faster</h2>
      <p>Powerful tools designed for modern web teams — from quick edits to full page builds.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-card-image">
          <img src="/assets/demo/feature_point_and_click_1772315516027.png" alt="Visual Editing" />
        </div>
        <h3>Point-and-Click Editing</h3>
        <p>Select any element on the page and instantly modify its styles, content, and layout. No need to dig through code — what you see is what you ship.</p>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">
          <img src="/assets/demo/feature_real_time_preview_1772315528708.png" alt="Real-time Preview" />
        </div>
        <h3>Real-Time Preview</h3>
        <p>See every change reflected instantly in the live canvas. Switch between desktop and responsive views to perfect your layouts at any screen size.</p>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">
          <img src="/assets/demo/feature_drag_and_drop_1772315549394.png" alt="Drag and Drop" />
        </div>
        <h3>Drag &amp; Drop Reordering</h3>
        <p>Reorganize entire sections, move elements across containers, and build complex layouts by simply dragging and dropping — works across the full page.</p>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">
          <img src="/assets/demo/feature_clean_export_1772315569082.png" alt="Clean Export" />
        </div>
        <h3>Clean HTML Export</h3>
        <p>When you're done, export production-ready HTML that drops into any framework or CMS. No vendor lock-in, no bloated code — just clean markup.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ HOW IT WORKS ════════════════════════════════ -->
<section class="how-it-works" id="how-it-works">
  <div class="section-inner">
    <div class="section-header">
      <h2>Ship Pages in 3 Simple Steps</h2>
      <p>From blank canvas to production in minutes — not days.</p>
    </div>
    <div class="steps-grid">
      <div class="step-card">
        <div class="step-number">1</div>
        <h3>Load or Paste HTML</h3>
        <p>Import an existing page, paste raw HTML, or start with one of our professionally designed templates.</p>
      </div>
      <div class="step-card">
        <div class="step-number">2</div>
        <h3>Edit Visually</h3>
        <p>Click any element to select it. Change text, colors, spacing, fonts and layout — all through an intuitive property panel.</p>
      </div>
      <div class="step-card">
        <div class="step-number">3</div>
        <h3>Export &amp; Deploy</h3>
        <p>Download your clean HTML or copy it to clipboard. Deploy to Vercel, Netlify, or any hosting in seconds.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ PRICING ═════════════════════════════════════ -->
<section class="pricing" id="pricing">
  <div class="section-inner">
    <div class="section-header">
      <h2>Simple, Transparent Pricing</h2>
      <p>Start free, upgrade when you're ready. No hidden fees.</p>
    </div>
    <div class="pricing-grid">

      <div class="pricing-card">
        <div class="pricing-plan">Starter</div>
        <div class="pricing-price"><strong>$0</strong><span>/month</span></div>
        <div class="pricing-desc">Perfect for individuals exploring visual editing.</div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Unlimited page edits</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> HTML export</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> 5 saved projects</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Community support</li>
        </ul>
        <button class="pricing-btn outline">Get Started</button>
      </div>

      <div class="pricing-card popular">
        <div class="pricing-tag">Most Popular</div>
        <div class="pricing-plan">Pro</div>
        <div class="pricing-price"><strong>$29</strong><span>/month</span></div>
        <div class="pricing-desc">For teams serious about shipping faster.</div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Everything in Starter</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Unlimited projects</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Custom fonts &amp; assets</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Markdown export</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Priority support</li>
        </ul>
        <button class="pricing-btn fill">Start Free Trial</button>
      </div>

      <div class="pricing-card">
        <div class="pricing-plan">Enterprise</div>
        <div class="pricing-price"><strong>Custom</strong></div>
        <div class="pricing-desc">For large teams with custom requirements.</div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Everything in Pro</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> SSO &amp; SAML</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Dedicated account manager</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Custom integrations</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> SLA &amp; 24/7 support</li>
        </ul>
        <button class="pricing-btn outline">Contact Sales</button>
      </div>

    </div>
  </div>
</section>

<!-- ═══ TESTIMONIALS ════════════════════════════════ -->
<section class="testimonials" id="testimonials">
  <div class="section-inner">
    <div class="section-header">
      <h2>Loved by Creators Worldwide</h2>
      <p>See how teams are shipping faster with SnapEdit.</p>
    </div>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="testimonial-stars">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <p class="testimonial-text">"SnapEdit cut our landing page build time by 70%. What used to take a developer a full day now takes 30 minutes. Game changer."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">AK</div>
          <div>
            <div class="testimonial-author-name">Alex Kim</div>
            <div class="testimonial-author-role">CTO at LaunchPad</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-stars">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <p class="testimonial-text">"Our design team can now iterate on live HTML directly, no more back-and-forth with developers for simple text and layout changes."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">SM</div>
          <div>
            <div class="testimonial-author-name">Sarah Martinez</div>
            <div class="testimonial-author-role">Head of Design at FlowUI</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-stars">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <p class="testimonial-text">"The export quality is incredible — clean, semantic HTML ready for production. No cleanup needed. Best visual editor we've tried."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">JR</div>
          <div>
            <div class="testimonial-author-name">James Rodriguez</div>
            <div class="testimonial-author-role">Founder at PageCraft</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ CTA ══════════════════════════════════════════ -->
<section class="cta-section">
  <h2>Ready to Build Faster?</h2>
  <p>Join thousands of teams shipping stunning pages with SnapEdit. Start for free — no credit card required.</p>
  <button class="cta-btn">
    Get Started Free
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </button>
</section>

<!-- ═══ FOOTER ═══════════════════════════════════════ -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="logo" style="color: #fff;">
        <svg viewBox="0 0 32 32" fill="none" width="28" height="28"><rect width="32" height="32" rx="8" fill="#4361ee"/><path d="M10 16l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        SnapEdit
      </div>
      <p>The modern visual editor for teams who want to ship beautiful web pages without writing CSS.</p>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">Templates</a>
      <a href="#">Changelog</a>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <a href="#">Documentation</a>
      <a href="#">Blog</a>
      <a href="#">Community</a>
      <a href="#">Support</a>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="#">About</a>
      <a href="#">Careers</a>
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 SnapEdit. All rights reserved.</span>
    <span>Made with ❤️ for creators</span>
  </div>
</footer>

</body>
</html>
`;
