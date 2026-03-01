import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'snapedit.db');

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
            maxAge: 5 * 60, // 5 min cache
        },
    },
    trustedOrigins: [
        'https://snapedit.syhi.tech',
        'http://localhost:5173',
        'http://localhost:8081',
    ],
});
