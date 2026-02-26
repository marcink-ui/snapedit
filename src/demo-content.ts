export const DEMO_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 40px 48px;
      background: #ffffff;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #4361ee;
      margin-bottom: 16px;
    }
    h2 {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a2e;
      margin-top: 24px;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-left: 3px solid #4361ee;
      background: #f7f7ff;
    }
    p {
      font-size: 15px;
      margin-bottom: 16px;
      color: #333;
    }
    .btn {
      display: inline-block;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #4361ee;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 8px;
    }
    .btn:hover {
      background: #3651d4;
    }
    ul {
      margin: 12px 0 20px 24px;
      font-size: 15px;
      color: #444;
    }
    ul li {
      margin-bottom: 6px;
    }
    .card {
      background: #f8f9ff;
      border: 1px solid #e0e3f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .card h3 {
      font-size: 17px;
      font-weight: 600;
      color: #4361ee;
      margin-bottom: 8px;
    }
    .card p {
      font-size: 14px;
      color: #555;
      margin-bottom: 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e0e3f0;
      font-size: 13px;
      color: #888;
    }
  </style>
</head>
<body>
  <h1>Hello, Vibe Coder</h1>
  <p>This is a demo page. Once you activate SnapEdit, try hovering over these elements.</p>

  <h2>A Sub-section</h2>
  <p>Click any element to select it and modify its styles using the panel on the right. Double-click text to edit it inline.</p>

  <ul>
    <li>Select elements by clicking</li>
    <li>Edit text inline by double-clicking</li>
    <li>Change colors, typography, and spacing</li>
    <li>Load your own HTML or export the result</li>
  </ul>

  <div class="card">
    <h3>Feature Card</h3>
    <p>This is a card component. Try selecting it and changing its background color, padding, or border radius.</p>
  </div>

  <button class="btn">Click Me</button>

  <div class="footer">
    <p>Built with SnapEdit — a visual HTML editor for developers and designers.</p>
  </div>
</body>
</html>
`;
