import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
    // Same domain — no baseURL needed in production
    // baseURL is auto-detected from window.location.origin
});

export const { signIn, signUp, signOut, useSession } = authClient;
