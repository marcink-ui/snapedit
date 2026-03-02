import { createAuthClient } from 'better-auth/client';
import { showToast, escapeHtml } from '../utils/dom-helpers';

const authClient = createAuthClient();

type AuthUser = { id: string; name: string; email: string } | null;

export class AuthUI {
    private user: AuthUser = null;
    private accountBtn!: HTMLElement;
    private onAuthChange?: (user: AuthUser) => void;

    constructor(onAuthChange?: (user: AuthUser) => void) {
        this.onAuthChange = onAuthChange;
        this.init();
    }

    private async init() {
        this.injectAccountButton();
        await this.checkSession();
    }

    /** Get current user ID (for API calls) */
    getUserId(): string {
        return this.user?.id || localStorage.getItem('snapedit-owner-id') || '';
    }

    getUserName(): string {
        return this.user?.name || this.user?.email || '';
    }

    isLoggedIn(): boolean {
        return this.user !== null;
    }

    /** Check session on load */
    private async checkSession() {
        try {
            const session = await authClient.getSession();
            if (session?.data?.user) {
                this.user = session.data.user as AuthUser;
                this.renderAccountButton();
                this.onAuthChange?.(this.user);
            }
        } catch { /* no session */ }
    }

    /** Inject account button into toolbar-right */
    private injectAccountButton() {
        const toolbarRight = document.querySelector('.toolbar-right');
        if (!toolbarRight) return;

        this.accountBtn = document.createElement('div');
        this.accountBtn.id = 'account-btn-container';
        this.accountBtn.style.cssText = 'position:relative;margin-left:8px;';
        toolbarRight.appendChild(this.accountBtn);
        this.renderAccountButton();
    }

    private renderAccountButton() {
        if (!this.accountBtn) return;

        if (this.user) {
            const initial = (this.user.name || this.user.email || '?')[0].toUpperCase();
            const safeName = escapeHtml(this.user.name || this.user.email);
            const safeEmail = escapeHtml(this.user.email);
            this.accountBtn.innerHTML = `
                <button class="toolbar-btn secondary" id="btn-account" style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;">
                    <span style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#4361ee);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">${initial}</span>
                    <span style="font-size:12px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeName}</span>
                </button>
                <div id="account-dropdown" class="toolbar-dropdown-menu" style="display:none;right:0;left:auto;min-width:180px;">
                    <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <div style="font-weight:600;font-size:12px;">${safeName}</div>
                        <div style="font-size:11px;opacity:0.5;margin-top:2px;">${safeEmail}</div>
                    </div>
                    <button id="btn-signout" style="width:100%;text-align:left;padding:8px 14px;font-size:12px;color:#ef4444;">Sign Out</button>
                </div>
            `;

            const btn = this.accountBtn.querySelector('#btn-account');
            const dropdown = this.accountBtn.querySelector('#account-dropdown') as HTMLElement;
            btn?.addEventListener('click', () => {
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', (e) => {
                if (!this.accountBtn.contains(e.target as Node)) {
                    dropdown.style.display = 'none';
                }
            });

            this.accountBtn.querySelector('#btn-signout')?.addEventListener('click', async () => {
                await authClient.signOut();
                this.user = null;
                this.renderAccountButton();
                this.onAuthChange?.(null);
                showToast('Signed out');
            });
        } else {
            this.accountBtn.innerHTML = `
                <button class="toolbar-btn secondary" id="btn-signin" style="font-size:12px;padding:4px 12px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Sign In
                </button>
            `;
            this.accountBtn.querySelector('#btn-signin')?.addEventListener('click', () => {
                this.showAuthModal();
            });
        }
    }

    /** Show login/register modal */
    showAuthModal(mode: 'login' | 'register' = 'login') {
        // Remove existing
        document.getElementById('auth-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-backdrop"></div>
            <div class="auth-card">
                <button class="auth-close">&times;</button>
                <div class="auth-logo">
                    <svg width="32" height="32" viewBox="0 0 32 32">
                        <defs><linearGradient id="alg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#4361ee"/>
                        </linearGradient></defs>
                        <rect width="32" height="32" rx="7" fill="url(#alg)"/>
                        <path d="M10 10h5v5h-5z M17 10h5v5h-5z M10 17h5v5h-5z" fill="rgba(255,255,255,0.95)"/>
                        <path d="M17 17h5v5h-5z" fill="rgba(255,255,255,0.4)"/>
                        <rect x="18" y="18" width="3" height="3" rx="0.5" fill="#fff"/>
                    </svg>
                </div>
                <h2 class="auth-title" id="auth-title">${mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                <p class="auth-subtitle" id="auth-subtitle">${mode === 'login' ? 'Sign in to your SnapEdit account' : 'Start building with SnapEdit'}</p>

                <form id="auth-form" class="auth-form">
                    <div id="auth-name-field" class="auth-field" style="display:${mode === 'register' ? 'block' : 'none'};">
                        <label>Name</label>
                        <input type="text" id="auth-name" placeholder="Your name" autocomplete="name"/>
                    </div>
                    <div class="auth-field">
                        <label>Email</label>
                        <input type="email" id="auth-email" placeholder="you@example.com" required autocomplete="email"/>
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" id="auth-password" placeholder="••••••••" required autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="8"/>
                    </div>
                    <div id="auth-error" class="auth-error" style="display:none;"></div>
                    <button type="submit" class="auth-submit" id="auth-submit">
                        ${mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div class="auth-switch">
                    ${mode === 'login'
                ? `Don't have an account? <a href="#" id="auth-switch-link">Sign up</a>`
                : `Already have an account? <a href="#" id="auth-switch-link">Sign in</a>`
            }
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Style
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            #auth-modal { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; }
            .auth-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); }
            .auth-card { position:relative; background:#1a1b2e; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:32px; width:380px; max-width:90vw; box-shadow:0 24px 48px rgba(0,0,0,0.4); animation:authSlideUp .3s ease; }
            @keyframes authSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            .auth-close { position:absolute; top:12px; right:12px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:20px; cursor:pointer; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
            .auth-close:hover { background:rgba(255,255,255,0.06); color:#fff; }
            .auth-logo { text-align:center; margin-bottom:16px; }
            .auth-title { text-align:center; font-size:20px; font-weight:700; color:#fff; margin:0 0 4px; }
            .auth-subtitle { text-align:center; font-size:13px; color:rgba(255,255,255,0.5); margin:0 0 24px; }
            .auth-form { display:flex; flex-direction:column; gap:14px; }
            .auth-field label { display:block; font-size:12px; font-weight:500; color:rgba(255,255,255,0.6); margin-bottom:6px; }
            .auth-field input { width:100%; padding:10px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background:rgba(255,255,255,0.04); color:#fff; font-size:14px; outline:none; transition:border .2s; box-sizing:border-box; }
            .auth-field input:focus { border-color:#818cf8; }
            .auth-error { font-size:12px; color:#ef4444; padding:8px 12px; background:rgba(239,68,68,0.1); border-radius:8px; }
            .auth-submit { width:100%; padding:11px; border:none; border-radius:10px; background:linear-gradient(135deg,#818cf8,#4361ee); color:#fff; font-size:14px; font-weight:600; cursor:pointer; transition:opacity .2s; }
            .auth-submit:hover { opacity:0.9; }
            .auth-submit:disabled { opacity:0.5; cursor:not-allowed; }
            .auth-switch { text-align:center; margin-top:16px; font-size:12px; color:rgba(255,255,255,0.4); }
            .auth-switch a { color:#818cf8; text-decoration:none; }
            .auth-switch a:hover { text-decoration:underline; }
        `;
        document.head.appendChild(style);

        // Events
        const closeModal = () => {
            modal.remove();
            document.getElementById('auth-modal-styles')?.remove();
        };
        modal.querySelector('.auth-backdrop')?.addEventListener('click', closeModal);
        modal.querySelector('.auth-close')?.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); }, { once: true });

        // Switch mode
        modal.querySelector('#auth-switch-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
            this.showAuthModal(mode === 'login' ? 'register' : 'login');
        });

        // Submit
        const form = modal.querySelector('#auth-form') as HTMLFormElement;
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (modal.querySelector('#auth-email') as HTMLInputElement).value;
            const password = (modal.querySelector('#auth-password') as HTMLInputElement).value;
            const name = (modal.querySelector('#auth-name') as HTMLInputElement)?.value || '';
            const submitBtn = modal.querySelector('#auth-submit') as HTMLButtonElement;
            const errorDiv = modal.querySelector('#auth-error') as HTMLElement;

            submitBtn.disabled = true;
            submitBtn.textContent = mode === 'login' ? 'Signing in...' : 'Creating account...';
            errorDiv.style.display = 'none';

            try {
                let result: any;
                if (mode === 'login') {
                    result = await authClient.signIn.email({ email, password });
                } else {
                    result = await authClient.signUp.email({ email, password, name });
                }

                if (result.error) {
                    throw new Error(result.error.message || 'Authentication failed');
                }

                // Success
                await this.checkSession();
                closeModal();
                showToast(mode === 'login' ? `Welcome back, ${this.user?.name || 'User'}!` : 'Account created! Welcome to SnapEdit 🎉');
            } catch (err: any) {
                errorDiv.textContent = err.message || 'Something went wrong';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
            }
        });

        // Auto-focus
        setTimeout(() => {
            if (mode === 'register') {
                (modal.querySelector('#auth-name') as HTMLInputElement)?.focus();
            } else {
                (modal.querySelector('#auth-email') as HTMLInputElement)?.focus();
            }
        }, 100);
    }
}
