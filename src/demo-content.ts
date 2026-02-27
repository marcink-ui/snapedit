export const DEMO_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      background: #f8fafc;
      padding: 0;
    }
    
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 100px 24px;
      background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    
    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #ffffff;
      color: #4361ee;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.15);
    }
    
    .hero h1 {
      font-size: 56px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      max-width: 800px;
      margin-bottom: 24px;
      letter-spacing: -1px;
    }
    
    .hero p {
      font-size: 20px;
      color: #475569;
      max-width: 600px;
      margin-bottom: 40px;
    }
    
    .hero-buttons {
      display: flex;
      gap: 16px;
    }
    
    .btn-primary {
      padding: 14px 32px;
      background: #4361ee;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(67, 97, 238, 0.25);
      transition: transform 0.2s, background 0.2s;
    }
    
    .btn-secondary {
      padding: 14px 32px;
      background: #ffffff;
      color: #0f172a;
      font-size: 16px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .features {
      padding: 80px 48px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .features h2 {
      text-align: center;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 64px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 32px;
    }
    
    .feature-card {
      background: #ffffff;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .feature-icon {
      font-size: 40px;
      color: #4361ee;
      margin-bottom: 20px;
      display: inline-block;
      line-height: 1;
    }
    
    .feature-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #0f172a;
    }
    
    .feature-card p {
      font-size: 15px;
      color: #64748b;
    }
    
    .image-showcase {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      background: #0f172a;
      color: white;
      text-align: center;
    }
    
    .image-showcase h2 {
      font-size: 32px;
      margin-bottom: 16px;
    }
    
    .image-showcase img {
      width: 100%;
      max-width: 900px;
      border-radius: 12px;
      margin-top: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      object-fit: cover;
      height: 400px;
    }

    /* Media queries to keep things responsive in editor but layout can be forced in desktop mode */
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 40px; }
    }
  </style>
</head>
<body>

  <div class="hero">
    <div class="hero-badge">🚀 Welcome to Vibe Coder</div>
    <h1>Build stunning web pages visually.</h1>
    <p>Select elements, style them instantly, and build responsive layouts using powerful Flexbox and Grid controls without writing a single line of CSS.</p>
    <div class="hero-buttons">
      <button class="btn-primary">Get Started</button>
      <button class="btn-secondary">View Documentation</button>
    </div>
  </div>

  <div class="features">
    <h2>Powerful Capabilities</h2>
    <div class="grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
        <h3>Layout Engine</h3>
        <p>Take full control of positioning with an intuitive Flexbox and CSS Grid visual editor. Align components perfectly.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h3>Dynamic Typography</h3>
        <p>Edit text inline and apply premium Google Fonts instantly. Control weight, line-height, and spacing precisely.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        </div>
        <h3>Export Anywhere</h3>
        <p>When you're done, download production-ready, clean HTML that drops into any framework effortlessly.</p>
      </div>
    </div>
  </div>

  <div class="image-showcase">
    <h2>Enrich Your Media</h2>
    <p>Apply stunning CSS filters, shadows, and rounded corners directly to images.</p>
    <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b" alt="Tech Setup" />
  </div>

</body>
</html>
`;
