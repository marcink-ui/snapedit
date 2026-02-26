export interface BlockTemplate {
    name: string;
    thumbnail?: string;
    html: string;
}

export interface BlockCategory {
    title: string;
    blocks: BlockTemplate[];
}

export const PREDEFINED_BLOCKS: BlockCategory[] = [
    {
        title: 'Menu / Header Presets',
        blocks: [
            {
                name: 'Simple Left Navbar',
                html: `<header class="snap-nav-left" style="padding: 20px 40px; background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eaeaea;">
          <div style="font-size: 24px; font-weight: bold; color: #111;">Brand</div>
          <nav style="display: flex; gap: 24px;">
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px;">Home</a>
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px;">About</a>
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px;">Pricing</a>
          </nav>
          <button style="padding: 10px 20px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Get Started</button>
        </header>`
            },
            {
                name: 'Centered Navbar',
                html: `<header class="snap-nav-center" style="padding: 20px 40px; background: #fff; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1px solid #eaeaea;">
          <nav style="display: flex; gap: 24px; justify-content: flex-start;">
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px;">Features</a>
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px;">Company</a>
          </nav>
          <div style="font-size: 24px; font-weight: bold; color: #111; text-align: center;">Brand</div>
          <div style="display: flex; gap: 16px; justify-content: flex-end;">
            <a href="#" style="text-decoration: none; color: #555; font-size: 16px; display: flex; align-items: center;">Login</a>
            <button style="padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Sign Up</button>
          </div>
        </header>`
            },
            {
                name: 'Dark Floating Pill (Glass)',
                html: `<div style="padding: 20px; position: sticky; top: 0; z-index: 50; display: flex; justify-content: center;">
          <header class="snap-nav-pill" style="padding: 12px 24px; background: rgba(17, 17, 17, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 900px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
            <div style="font-size: 20px; font-weight: bold; color: #fff;">Pill UI</div>
            <nav style="display: flex; gap: 32px;">
              <a href="#" style="text-decoration: none; color: #ccc; font-size: 15px; font-weight: 500;">Product</a>
              <a href="#" style="text-decoration: none; color: #ccc; font-size: 15px; font-weight: 500;">Solutions</a>
              <a href="#" style="text-decoration: none; color: #ccc; font-size: 15px; font-weight: 500;">Resources</a>
            </nav>
            <button style="padding: 10px 24px; background: #fff; color: #111; border: none; border-radius: 999px; font-weight: 600; cursor: pointer;">Book Demo</button>
          </header>
        </div>`
            },
            {
                name: 'Minimal Underline Nav',
                html: `<header class="snap-nav-minimal" style="padding: 30px 40px; background: transparent; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 22px; font-weight: 800; color: #111; text-transform: uppercase;">Studio</div>
          <nav style="display: flex; gap: 40px;">
            <a href="#" style="text-decoration: none; color: #111; font-size: 14px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 4px;">Work</a>
            <a href="#" style="text-decoration: none; color: #888; font-size: 14px; font-weight: 600; text-transform: uppercase; padding-bottom: 4px;">About</a>
            <a href="#" style="text-decoration: none; color: #888; font-size: 14px; font-weight: 600; text-transform: uppercase; padding-bottom: 4px;">Contact</a>
          </nav>
        </header>`
            }
        ]
    },
    {
        title: 'Hero Sections',
        blocks: [
            {
                name: 'Hero Left Align',
                html: `<section class="snap-hero-left" style="padding: 100px 5%; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: flex-start; gap: 32px;">
            <h1 style="font-size: 56px; margin: 0; color: #111; line-height: 1.1; font-weight: 800;">Build your next big idea</h1>
            <p style="font-size: 20px; color: #555; max-width: 600px; margin: 0; line-height: 1.6;">SnapEdit helps you design and structure your landing pages with ease. Drag, drop, and export clean HTML.</p>
            <div style="display: flex; gap: 16px;">
              <button style="padding: 16px 32px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Get Started</button>
              <button style="padding: 16px 32px; background: #fff; color: #111; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; font-weight: 600;">Documentation</button>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Hero Centered',
                html: `<section class="snap-hero-center" style="padding: 120px 20px; background: #ffffff; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 24px;">
            <span style="padding: 6px 16px; background: #f1f5f9; color: #0f172a; border-radius: 999px; font-size: 14px; font-weight: 600; border: 1px solid #e2e8f0;">Announcing V2.0</span>
            <h1 style="font-size: 64px; margin: 0; color: #111; line-height: 1.1; font-weight: 800;">The fastest way to build</h1>
            <p style="font-size: 22px; color: #666; margin: 0; line-height: 1.5;">Our powerful visual editor lets you create stunning layouts without writing a single line of code.</p>
            <div style="display: flex; gap: 16px; margin-top: 16px;">
              <button style="padding: 14px 28px; background: #111; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Free</button>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Hero Split Header/Image',
                html: `<section class="snap-hero-split" style="padding: 80px 5%; background: #ffffff;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 24px;">
              <h1 style="font-size: 48px; margin: 0; color: #111; font-weight: 800; line-height: 1.2;">Design at the speed of thought</h1>
              <p style="font-size: 18px; color: #555; margin: 0; line-height: 1.6;">Join thousands of teams building modern websites faster than ever before. Real-time collaboration included.</p>
              <button style="padding: 14px 28px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Try it out</button>
            </div>
            <div style="background: #f1f5f9; border-radius: 16px; height: 500px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 20px; border: 2px dashed #cbd5e1;">
              [Hero Image Placeholder]
            </div>
          </div>
        </section>`
            },
            {
                name: 'Hero Dark Mode',
                html: `<section class="snap-hero-dark" style="padding: 120px 20px; background: #0f172a; color: #ffffff; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 32px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #ec4899); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: -10px;">✨</div>
            <h1 style="font-size: 64px; margin: 0; line-height: 1.1; font-weight: 800; background: -webkit-linear-gradient(#fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Experience the dark side</h1>
            <p style="font-size: 22px; color: #94a3b8; margin: 0; line-height: 1.6;">Sleek, modern, and easy on the eyes. Build your next landing page in dark mode.</p>
            <div style="display: flex; gap: 16px;">
              <button style="padding: 16px 32px; background: #ffffff; color: #0f172a; border: none; border-radius: 8px; font-size: 16px; font-weight: 700;">Get Started</button>
              <button style="padding: 16px 32px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 16px; font-weight: 600;">View Showcase</button>
            </div>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'Features Grid',
        blocks: [
            {
                name: 'Grid 3 Columns (Icons Top)',
                html: `<section class="snap-features-3col" style="padding: 80px 5%; background: #fff;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 60px;">
              <h2 style="font-size: 36px; margin: 0 0 16px 0; color: #111;">Everything you need</h2>
              <p style="font-size: 18px; color: #666; max-width: 600px; margin: 0 auto;">All the tools to launch your ideas, packed into one simple platform.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
              <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 16px;">
                <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🚀</div>
                <h3 style="font-size: 20px; margin: 0; color: #111;">Fast Performance</h3>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.5;">Built on edge infrastructure to deliver lightning fast load times across the globe.</p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 16px;">
                <div style="width: 48px; height: 48px; background: #fdf4ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🔒</div>
                <h3 style="font-size: 20px; margin: 0; color: #111;">Secure by Default</h3>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.5;">Enterprise-grade security built directly into the core platform, keeping data safe.</p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 16px;">
                <div style="width: 48px; height: 48px; background: #f0fdf4; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📈</div>
                <h3 style="font-size: 20px; margin: 0; color: #111;">Analytics Ready</h3>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.5;">Integrate easily with your favorite tracking and analytics tools automatically.</p>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Grid 2x2 (Cards)',
                html: `<section class="snap-features-cards" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div style="background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
               <h3 style="font-size: 24px; margin: 0 0 16px; color: #111;">Visual Editing</h3>
               <p style="font-size: 16px; color: #555; margin: 0 0 24px; line-height: 1.6;">Click anywhere and start typing. Real-time WYSIWYG editing makes content fun.</p>
               <a href="#" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Learn more →</a>
            </div>
            <div style="background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
               <h3 style="font-size: 24px; margin: 0 0 16px; color: #111;">CSS Controls</h3>
               <p style="font-size: 16px; color: #555; margin: 0 0 24px; line-height: 1.6;">Full access to padding, margins, colors and typography in the side panel.</p>
               <a href="#" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Learn more →</a>
            </div>
            <div style="background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
               <h3 style="font-size: 24px; margin: 0 0 16px; color: #111;">Auto-Responsive</h3>
               <p style="font-size: 16px; color: #555; margin: 0 0 24px; line-height: 1.6;">Your site automatically looks great on Mobile, Tablet and Desktop natively.</p>
               <a href="#" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Learn more →</a>
            </div>
            <div style="background: #111; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); color: #fff;">
               <h3 style="font-size: 24px; margin: 0 0 16px; color: #fff;">Export HTML</h3>
               <p style="font-size: 16px; color: #aaa; margin: 0 0 24px; line-height: 1.6;">No lock-in. Export clean HTML/CSS whenever you want and host it your way.</p>
               <a href="#" style="color: #fff; text-decoration: none; font-weight: 600;">Learn more →</a>
            </div>
          </div>
        </section>`
            },
            {
                name: 'List Features (Left Image, Right Text)',
                html: `<section class="snap-features-list" style="padding: 80px 5%; background: #ffffff;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
            <div style="background: #f1f5f9; border-radius: 16px; height: 600px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 20px;">[Large Image or UI Mockup]</div>
            <div style="display: flex; flex-direction: column; gap: 40px;">
              <div>
                <h3 style="font-size: 28px; margin: 0 0 12px; color: #111;">1. Connect your repo</h3>
                <p style="font-size: 18px; color: #666; margin: 0; line-height: 1.6;">Link your GitHub account in one click and give us access to pull your code seamlessly.</p>
              </div>
              <div>
                <h3 style="font-size: 28px; margin: 0 0 12px; color: #111;">2. Configure builds</h3>
                <p style="font-size: 18px; color: #666; margin: 0; line-height: 1.6;">We automatically detect Node, Python, and Go frameworks to set up your build queue.</p>
              </div>
              <div>
                <h3 style="font-size: 28px; margin: 0 0 12px; color: #111;">3. Deploy globally</h3>
                <p style="font-size: 18px; color: #666; margin: 0; line-height: 1.6;">Push to master and we deploy to 300+ edge locations worldwide across our CDN.</p>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Dark Grid 4 Columns',
                html: `<section class="snap-features-dark" style="padding: 100px 5%; background: #111111; color: #fff;">
          <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 40px; margin: 0 0 60px 0; color: #fff;">Built for scale</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: left;">
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">
                <div style="font-size: 24px; margin-bottom: 16px;">⚡️</div>
                <h4 style="font-size: 18px; margin: 0 0 8px; font-weight: 600;">Speed</h4>
                <p style="font-size: 14px; color: #999; margin: 0; line-height: 1.5;">Sub-50ms latency anywhere.</p>
              </div>
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">
                <div style="font-size: 24px; margin-bottom: 16px;">💾</div>
                <h4 style="font-size: 18px; margin: 0 0 8px; font-weight: 600;">Storage</h4>
                <p style="font-size: 14px; color: #999; margin: 0; line-height: 1.5;">Petabytes of scalable blob storage.</p>
              </div>
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">
                <div style="font-size: 24px; margin-bottom: 16px;">🛡️</div>
                <h4 style="font-size: 18px; margin: 0 0 8px; font-weight: 600;">Security</h4>
                <p style="font-size: 14px; color: #999; margin: 0; line-height: 1.5;">DDoS protection baked in.</p>
              </div>
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">
                <div style="font-size: 24px; margin-bottom: 16px;">🌐</div>
                <h4 style="font-size: 18px; margin: 0 0 8px; font-weight: 600;">Global DNS</h4>
                <p style="font-size: 14px; color: #999; margin: 0; line-height: 1.5;">Anycast network resolving fast.</p>
              </div>
            </div>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'Testimonials / Opinions',
        blocks: [
            {
                name: 'Single Large Quote',
                html: `<section class="snap-testimonial-large" style="padding: 100px 5%; background: #fff; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 32px;">
            <div style="font-size: 40px; color: #000; opacity: 0.2; line-height: 0;">❝</div>
            <h2 style="font-size: 32px; font-weight: 400; font-style: italic; color: #111; margin: 0; line-height: 1.5;">"SnapEdit completely changed how our marketing team ships landing pages. What used to take days of engineering back-and-forth now takes exactly 30 minutes."</h2>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 16px;">
              <div style="width: 50px; height: 50px; background: #ddd; border-radius: 50%;"></div>
              <div style="text-align: left;">
                <div style="font-size: 16px; font-weight: 600; color: #111;">Sarah Jenkins</div>
                <div style="font-size: 14px; color: #666;">VP Marketing, TechFlow</div>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Grid 3 Columns Cards',
                html: `<section class="snap-testimonial-grid" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="font-size: 36px; text-align: center; margin: 0 0 60px 0; color: #111;">Loved by modern creators</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
              <div style="background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
                <div style="display: flex; gap: 4px; margin-bottom: 16px; color: #fbbf24; font-size: 20px;">★★★★★</div>
                <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px;">"Incredible attention to detail. The UI feels native and everything just works exactly as you expect it to."</p>
                <div style="font-weight: 600; font-size: 15px; color: #111;">Alex Rivera — Designer</div>
              </div>
              <div style="background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
                <div style="display: flex; gap: 4px; margin-bottom: 16px; color: #fbbf24; font-size: 20px;">★★★★★</div>
                <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px;">"We moved our entire frontend to this platform and decreased our time-to-market by over 40%."</p>
                <div style="font-weight: 600; font-size: 15px; color: #111;">Mike Chen — CTO</div>
              </div>
              <div style="background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
                <div style="display: flex; gap: 4px; margin-bottom: 16px; color: #fbbf24; font-size: 20px;">★★★★★</div>
                <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px;">"The best return on investment we've made this year. It paid for itself in the first 2 weeks of use."</p>
                <div style="font-weight: 600; font-size: 15px; color: #111;">Emma Watson — Founder</div>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Dark Highlight Box',
                html: `<section class="snap-testimonial-dark" style="padding: 100px 5%; background: #111;">
          <div style="max-width: 900px; margin: 0 auto; background: #1a1a1a; padding: 60px; border-radius: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <p style="font-size: 24px; color: #fff; margin: 0 0 40px; line-height: 1.6; font-weight: 500;">"Finally, a tool that understands how developers and designers need to collaborate. The exported HTML is phenomenally clean."</p>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
              <div style="width: 60px; height: 60px; background: #333; border-radius: 50%;"></div>
              <div style="color: #fff; font-weight: 600; font-size: 18px;">David Park</div>
              <div style="color: #666; font-size: 14px;">Lead Developer @ Agency</div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Left Meta, Right Quote',
                html: `<section class="snap-testimonial-split" style="padding: 80px 5%; background: #fff;">
          <div style="max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 40px; align-items: center;">
             <div style="display: flex; flex-direction: column; gap: 12px;">
               <div style="width: 80px; height: 80px; background: #e2e8f0; border-radius: 50%;"></div>
               <div style="font-size: 20px; font-weight: bold; color: #111;">Jordan Lee</div>
               <div style="font-size: 16px; color: #64748b;">CEO, Startup Inc</div>
             </div>
             <div style="font-size: 28px; line-height: 1.5; color: #334155; font-weight: 400;">
               "Building out our documentation site took one afternoon using these blocks. Absolute lifesaver."
             </div>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'FAQ (Accordion & Lists)',
        blocks: [
            {
                name: 'Simple List FAQ',
                html: `<section class="snap-faq-list" style="padding: 80px 5%; background: #ffffff;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 36px; text-align: center; margin: 0 0 60px 0; color: #111;">Frequently Asked Questions</h2>
            <div style="display: flex; flex-direction: column; gap: 32px;">
              <div>
                <h4 style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #111;">Can I cancel my subscription?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">Yes, you can cancel your subscription at any time from your account settings. No questions asked.</p>
              </div>
              <div style="height: 1px; background: #eaeaea;"></div>
              <div>
                <h4 style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #111;">Do you offer a free trial?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">We offer a 14-day free trial on all paid plans. You don't need a credit card to sign up and start testing.</p>
              </div>
              <div style="height: 1px; background: #eaeaea;"></div>
              <div>
                <h4 style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #111;">Can I use this for client work?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">Absolutely. The Pro and Agency plans allow you to export and use the code for commercial projects.</p>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Grid 2 Column FAQ',
                html: `<section class="snap-faq-grid" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="margin-bottom: 60px;">
              <h2 style="font-size: 36px; margin: 0 0 16px 0; color: #111;">Got questions?</h2>
              <p style="font-size: 18px; color: #666; margin: 0;">We've got answers to everything you might need to know.</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div>
                <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #111;">How does billing work?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">Plans are billed annually or monthly. You can switch plans at any point during your cycle.</p>
              </div>
              <div>
                <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #111;">Is there custom enterprise support?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">Yes, enterprise plans include a dedicated Slack channel and an account manager.</p>
              </div>
              <div>
                <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #111;">What is your refund policy?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">If you are unhappy in your first 30 days, we will refund you in full. Just shoot us an email.</p>
              </div>
              <div>
                <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #111;">Do you support dark mode?</h4>
                <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.6;">Yes, all our exported sites include native CSS media queries for dark mode support.</p>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Dark FAQ Stack',
                html: `<section class="snap-faq-dark" style="padding: 100px 5%; background: #111111; color: #fff;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 40px; text-align: center; margin: 0 0 60px 0;">FAQ</h2>
            <div style="display: flex; flex-direction: column; gap: 24px;">
              <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                <h4 style="font-size: 18px; margin: 0 0 12px; font-weight: 600;">How much does it cost?</h4>
                <p style="font-size: 15px; color: #aaa; margin: 0;">It is free for non-profit and open-source projects. For commercial use, it is $29/mo.</p>
              </div>
              <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                <h4 style="font-size: 18px; margin: 0 0 12px; font-weight: 600;">Can I host it anywhere?</h4>
                <p style="font-size: 15px; color: #aaa; margin: 0;">Yes, you can export static HTML/CSS and host it on Vercel, Netlify, AWS, or your own VPS.</p>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Accordion HTML (Native details tag)',
                html: `<section class="snap-faq-accordion" style="padding: 80px 5%; background: #ffffff;">
          <div style="max-width: 700px; margin: 0 auto;">
            <h2 style="font-size: 32px; text-align: center; margin: 0 0 40px; color: #111;">Frequently Asked Questions</h2>
            <style>.snap-faq-accordion details { padding: 20px 0; border-bottom: 1px solid #eee; } .snap-faq-accordion summary { font-size: 18px; font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; } .snap-faq-accordion summary::-webkit-details-marker { display: none; } .snap-faq-accordion summary::after { content: '+'; font-size: 24px; color: #666; font-weight: 300; } .snap-faq-accordion details[open] summary::after { content: '-'; } .snap-faq-accordion p { padding-top: 16px; margin: 0; color: #555; line-height: 1.6; }</style>
            <details>
              <summary>Will I get lifetime updates?</summary>
              <p>Yes, buying a license entitles you to all minor and major updates for the life of the product.</p>
            </details>
            <details>
              <summary>Do I need to know how to code?</summary>
              <p>Not at all! Our visual builder abstracts all the coding away so you can focus purely on design and content layout.</p>
            </details>
            <details>
              <summary>What if I change my mind?</summary>
              <p>We offer a 30-day money back guarantee. Reach out via email within 30 days and we will refund you without any questions.</p>
            </details>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'Objections / Text Blocks',
        blocks: [
            {
                name: 'Large Typography Statement',
                html: `<section class="snap-text-statement" style="padding: 120px 5%; background: #3b82f6; color: #fff; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 48px; font-weight: 800; margin: 0; line-height: 1.2; letter-spacing: -1px;">Stop losing customers to slow, poorly designed landing pages.</h2>
          </div>
        </section>`
            },
            {
                name: 'Left/Right Split Text',
                html: `<section class="snap-text-split" style="padding: 80px 5%; background: #ffffff;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
            <h2 style="font-size: 36px; color: #111; margin: 0; line-height: 1.3;">Most sites bounce 80% of traffic. Here is why we fix that.</h2>
            <div style="font-size: 18px; color: #555; line-height: 1.6;">
              <p style="margin-top:0;">You're spending thousands on ads, but if your page loads in 5 seconds or the mobile layout is broken, your conversion rate tanks.</p>
              <p>SnapEdit guarantees clean, rapid, responsive HTML that passes Google Core Web Vitals out of the box. No bloated JS frameworks.</p>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Objection Handling List',
                html: `<section class="snap-text-objections" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 32px; text-align: center; margin: 0 0 60px; color: #111;">"But I already use WordPress..."</h2>
            <div style="display: flex; flex-direction: column; gap: 32px;">
              <div style="display: flex; gap: 24px;">
                <div style="font-size: 24px; color: #ef4444;">✕</div>
                <div>
                  <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #111;">Plugins break and slow you down</h4>
                  <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.5;">Every WP site ends up with 20 plugins that crash each other and destroy load times.</p>
                </div>
              </div>
              <div style="display: flex; gap: 24px;">
                <div style="font-size: 24px; color: #22c55e;">✓</div>
                <div>
                  <h4 style="font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #111;">Static HTML is invincible</h4>
                  <p style="font-size: 16px; color: #555; margin: 0; line-height: 1.5;">Our exported sites cannot be hacked by WP plugin vulnerabilities, and load instantly from a CDN.</p>
                </div>
              </div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'Simple Centered Text Block',
                html: `<section class="snap-text-center" style="padding: 100px 5%; background: #ffffff; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto;">
            <p style="font-size: 20px; color: #111; font-weight: 600; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px; color: #3b82f6;">Our Mission</p>
            <p style="font-size: 18px; color: #555; line-height: 1.8; margin: 0;">We believe that the web should be accessible, beautiful, and fast. Everyone should be able to create stunning visual experiences without a computer science degree.</p>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'Logo Carousels',
        blocks: [
            {
                name: 'Static Row (5 Logos)',
                html: `<section class="snap-logos-static" style="padding: 60px 5%; background: #ffffff; text-align: center; border-bottom: 1px solid #eee;">
          <p style="font-size: 14px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 32px;">Trusted by innovative teams</p>
          <div style="max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 32px;">
            <div style="font-size: 24px; font-weight: 800; color: #ccc;">Company A</div>
            <div style="font-size: 24px; font-weight: 800; color: #ccc;">Company B</div>
            <div style="font-size: 24px; font-weight: 800; color: #ccc;">Company C</div>
            <div style="font-size: 24px; font-weight: 800; color: #ccc;">Company D</div>
            <div style="font-size: 24px; font-weight: 800; color: #ccc;">Company E</div>
          </div>
        </section>`
            },
            {
                name: 'Dark Background Logos',
                html: `<section class="snap-logos-dark" style="padding: 60px 5%; background: #111; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0 0 32px;">Powering the next generation of startups</p>
          <div style="max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 40px; opacity: 0.5;">
            <div style="width: 120px; height: 40px; background: #fff; border-radius: 4px; display: flex; align-items:center; justify-content:center; color:#111; font-weight:bold;">Logo</div>
            <div style="width: 120px; height: 40px; background: #fff; border-radius: 4px; display: flex; align-items:center; justify-content:center; color:#111; font-weight:bold;">Logo</div>
            <div style="width: 120px; height: 40px; background: #fff; border-radius: 4px; display: flex; align-items:center; justify-content:center; color:#111; font-weight:bold;">Logo</div>
            <div style="width: 120px; height: 40px; background: #fff; border-radius: 4px; display: flex; align-items:center; justify-content:center; color:#111; font-weight:bold;">Logo</div>
          </div>
        </section>`
            },
            {
                name: 'Grid Logos (2x3)',
                html: `<section class="snap-logos-grid" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 24px; color: #111; margin: 0 0 40px;">Backed by the best</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
              <div style="background: #fff; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #eaeaea; font-weight: bold; color: #bbb;">Logo</div>
            </div>
          </div>
        </section>`
            },
            {
                name: 'CSS Auto-Scrolling Marquee',
                html: `<section class="snap-logos-marquee" style="padding: 60px 0; background: #ffffff; overflow: hidden; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
          <style>@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-200px * 5)); } } .snap-marquee-track { display: flex; width: calc(200px * 10); animation: scroll 20s linear infinite; } .snap-marquee-track:hover { animation-play-state: paused; } .snap-marquee-item { width: 200px; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; color: #ccc; }</style>
          <div class="snap-marquee-track">
            <div class="snap-marquee-item">Brand 1</div>
            <div class="snap-marquee-item">Brand 2</div>
            <div class="snap-marquee-item">Brand 3</div>
            <div class="snap-marquee-item">Brand 4</div>
            <div class="snap-marquee-item">Brand 5</div>
            <!-- Duplicated for seamless loop -->
            <div class="snap-marquee-item">Brand 1</div>
            <div class="snap-marquee-item">Brand 2</div>
            <div class="snap-marquee-item">Brand 3</div>
            <div class="snap-marquee-item">Brand 4</div>
            <div class="snap-marquee-item">Brand 5</div>
          </div>
        </section>`
            }
        ]
    },
    {
        title: 'Predefined Footers',
        blocks: [
            {
                name: 'Simple Centered Footer',
                html: `<footer class="snap-footer-center" style="padding: 60px 20px; background: #111; color: #fff; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Brand</div>
          <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 32px;">
            <a href="#" style="color: #aaa; text-decoration: none;">Twitter</a>
            <a href="#" style="color: #aaa; text-decoration: none;">GitHub</a>
            <a href="#" style="color: #aaa; text-decoration: none;">LinkedIn</a>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">© 2026 SnapEdit Inc. All rights reserved.</p>
        </footer>`
            },
            {
                name: '4-Column Mega Footer',
                html: `<footer class="snap-footer-mega" style="padding: 80px 5%; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px;">
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #111; margin-bottom: 16px;">Brand</div>
              <p style="color: #666; line-height: 1.6; max-width: 300px;">Designing the future of the web, one block at a time. The world's fastest editor.</p>
            </div>
            <div>
              <h4 style="font-size: 16px; color: #111; margin: 0 0 16px;">Product</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <a href="#" style="color: #666; text-decoration: none;">Features</a>
                <a href="#" style="color: #666; text-decoration: none;">Pricing</a>
                <a href="#" style="color: #666; text-decoration: none;">Changelog</a>
              </div>
            </div>
            <div>
              <h4 style="font-size: 16px; color: #111; margin: 0 0 16px;">Company</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <a href="#" style="color: #666; text-decoration: none;">About Us</a>
                <a href="#" style="color: #666; text-decoration: none;">Careers</a>
                <a href="#" style="color: #666; text-decoration: none;">Contact</a>
              </div>
            </div>
            <div>
              <h4 style="font-size: 16px; color: #111; margin: 0 0 16px;">Legal</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <a href="#" style="color: #666; text-decoration: none;">Privacy Policy</a>
                <a href="#" style="color: #666; text-decoration: none;">Terms of Service</a>
              </div>
            </div>
          </div>
          <div style="max-width: 1200px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid #eaeaea; color: #999; font-size: 14px; display: flex; justify-content: space-between;">
            <span>© 2026 Company</span>
            <span>Made with SnapEdit</span>
          </div>
        </footer>`
            },
            {
                name: 'Dark Split Footer',
                html: `<footer class="snap-footer-dark" style="padding: 60px 40px; background: #0f172a; color: #fff;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 40px; margin-bottom: 40px;">
            <h2 style="font-size: 32px; margin: 0; font-weight: 700;">Ready to get started?</h2>
            <button style="padding: 12px 24px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600;">Create Account</button>
          </div>
          <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 20px; font-weight: bold;">Brand</div>
            <div style="color: #94a3b8; font-size: 14px;">© 2026 All rights reserved.</div>
            <div style="display: flex; gap: 16px;">
               <a href="#" style="color: #94a3b8; text-decoration: none;">Twitter</a>
               <a href="#" style="color: #94a3b8; text-decoration: none;">Dribbble</a>
            </div>
          </div>
        </footer>`
            },
            {
                name: 'Minimal Underline Links Footer',
                html: `<footer class="snap-footer-minimal" style="padding: 40px 5%; background: #ffffff;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 16px; font-weight: bold; color: #111;">Brand.</div>
            <nav style="display: flex; gap: 32px;">
              <a href="#" style="color: #111; text-decoration: none; font-size: 14px; font-weight: 600; border-bottom: 1px solid #111; padding-bottom: 2px;">Home</a>
              <a href="#" style="color: #111; text-decoration: none; font-size: 14px; font-weight: 600; border-bottom: 1px solid #111; padding-bottom: 2px;">Work</a>
              <a href="#" style="color: #111; text-decoration: none; font-size: 14px; font-weight: 600; border-bottom: 1px solid #111; padding-bottom: 2px;">Contact</a>
            </nav>
            <div style="color: #888; font-size: 13px;">hello@brand.com</div>
          </div>
        </footer>`
            }
        ]
    }
];
