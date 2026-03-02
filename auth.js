import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'snapedit.db');
const db = new Database(DB_PATH);

// ── Ensure better-auth core tables exist ─────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        expiresAt TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL REFERENCES "user"(id)
    );
    CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL REFERENCES "user"(id),
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt TEXT,
        refreshTokenExpiresAt TEXT,
        scope TEXT,
        password TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT
    );
`);
console.log('[Auth] Core tables ensured');
db.close();

// ── Initialize better-auth ───────────────────────────────────
export const auth = betterAuth({
    database: new Database(DB_PATH),
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8081',
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    trustedOrigins: [
        'https://snapedit.syhi.tech',
        'http://localhost:5173',
        'http://localhost:8081',
    ],
});
