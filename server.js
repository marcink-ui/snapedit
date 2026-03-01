import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// ── Paths ────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const DB_PATH = path.join(DATA_DIR, 'snapedit.db');
const DIST_DIR = path.join(__dirname, 'dist');
const MAX_BACKUPS = 10;

// Ensure directories exist
fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// ── SQLite Database ──────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');  // faster concurrent reads

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        createdBy TEXT DEFAULT ''
    )
`);

const stmts = {
    listProjects: db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC'),
    getProject: db.prepare('SELECT * FROM projects WHERE slug = ?'),
    insertProject: db.prepare('INSERT INTO projects (id, slug, name, description, createdAt, updatedAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    updateProject: db.prepare('UPDATE projects SET updatedAt = ? WHERE slug = ?'),
    deleteProject: db.prepare('DELETE FROM projects WHERE slug = ?'),
};

// ── Helper: generate UUID ────────────────────────────────────
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ── Helper: MIME types ───────────────────────────────────────
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
};

function getMime(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

// ── Helper: serve static file ────────────────────────────────
function serveFile(res, filePath, contentType) {
    try {
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        const stat = fs.statSync(filePath);
        res.writeHead(200, {
            'Content-Type': contentType || getMime(filePath),
            'Content-Length': stat.size,
            'Cache-Control': contentType === 'text/html' ? 'no-cache' : 'public, max-age=86400',
        });
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

// ── Helper: read JSON body ───────────────────────────────────
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve(null); }
        });
        req.on('error', reject);
    });
}

// ── Helper: send JSON ────────────────────────────────────────
function sendJSON(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

// ── Helper: safe slug ────────────────────────────────────────
function isValidSlug(slug) {
    return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(slug);
}

// ── Helper: create backup ────────────────────────────────────
function createBackup(slug) {
    const projectDir = path.join(PROJECTS_DIR, slug);
    const indexFile = path.join(projectDir, 'index.html');
    if (!fs.existsSync(indexFile)) return;

    const backupDir = path.join(projectDir, '.backups');
    fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `${timestamp}.html`);
    fs.copyFileSync(indexFile, backupFile);

    // Rotate: keep only MAX_BACKUPS
    const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.html'))
        .sort();
    while (backups.length > MAX_BACKUPS) {
        fs.unlinkSync(path.join(backupDir, backups.shift()));
    }
}

// ── Locking State (in-memory) ────────────────────────────────
const activeLocks = new Map();      // projectSlug → connectionId
const connectionLocks = new Map();  // connectionId → projectSlug
const connectionNames = new Map();  // connectionId → userName
const connectionWs = new Map();     // connectionId → WebSocket

// ── HTTP Server ──────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS headers (for dev)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // ─── API Routes ──────────────────────────────────────────

    // GET /api/projects — list all projects
    if (pathname === '/api/projects' && method === 'GET') {
        const projects = stmts.listProjects.all();
        // Enrich with lock info
        const enriched = projects.map(p => ({
            ...p,
            lockedBy: activeLocks.has(p.slug) ? connectionNames.get(activeLocks.get(p.slug)) || 'Unknown' : null,
        }));
        return sendJSON(res, 200, enriched);
    }

    // POST /api/projects — create project
    if (pathname === '/api/projects' && method === 'POST') {
        const body = await readBody(req);
        if (!body || !body.name || !body.slug) {
            return sendJSON(res, 400, { error: 'name and slug required' });
        }
        const slug = body.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!isValidSlug(slug)) {
            return sendJSON(res, 400, { error: 'Invalid slug. Use lowercase letters, numbers, hyphens.' });
        }
        if (stmts.getProject.get(slug)) {
            return sendJSON(res, 409, { error: 'Project with this slug already exists' });
        }

        const now = new Date().toISOString();
        const id = uuid();
        const projectDir = path.join(PROJECTS_DIR, slug);
        fs.mkdirSync(projectDir, { recursive: true });

        // Create default index.html
        const defaultHTML = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${body.name}</title>
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 40px; background: #fafafa; color: #333; }
        h1 { font-size: 36px; margin-bottom: 16px; }
        p { font-size: 18px; line-height: 1.6; color: #666; }
    </style>
</head>
<body>
    <h1>${body.name}</h1>
    <p>Start editing this page in SnapEdit.</p>
</body>
</html>`;
        fs.writeFileSync(path.join(projectDir, 'index.html'), defaultHTML);

        stmts.insertProject.run(id, slug, body.name, body.description || '', now, now, body.createdBy || '');
        const project = stmts.getProject.get(slug);
        return sendJSON(res, 201, project);
    }

    // DELETE /api/projects/:slug
    const deleteMatch = pathname.match(/^\/api\/projects\/([a-z0-9_-]+)$/);
    if (deleteMatch && method === 'DELETE') {
        const slug = deleteMatch[1];
        const project = stmts.getProject.get(slug);
        if (!project) return sendJSON(res, 404, { error: 'Project not found' });

        // Remove files
        const projectDir = path.join(PROJECTS_DIR, slug);
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
        stmts.deleteProject.run(slug);
        return sendJSON(res, 200, { success: true });
    }

    // POST /api/projects/:slug/save — save HTML content
    const saveMatch = pathname.match(/^\/api\/projects\/([a-z0-9_-]+)\/save$/);
    if (saveMatch && method === 'POST') {
        const slug = saveMatch[1];
        const project = stmts.getProject.get(slug);
        if (!project) return sendJSON(res, 404, { error: 'Project not found' });

        const body = await readBody(req);
        if (!body || !body.html) {
            return sendJSON(res, 400, { error: 'html field required' });
        }

        const projectDir = path.join(PROJECTS_DIR, slug);
        const indexFile = path.join(projectDir, 'index.html');

        // Backup before overwrite
        createBackup(slug);

        // Atomic write: tmp file → rename
        const tmpFile = indexFile + '.tmp';
        fs.writeFileSync(tmpFile, body.html, 'utf-8');
        fs.renameSync(tmpFile, indexFile);

        // Update timestamp
        stmts.updateProject.run(new Date().toISOString(), slug);

        return sendJSON(res, 200, { success: true, updatedAt: new Date().toISOString() });
    }

    // ─── Static: Project Files (/projects/:slug/*) ───────────
    if (pathname.startsWith('/projects/')) {
        const relPath = pathname.replace(/^\/projects\//, '');
        const filePath = path.join(PROJECTS_DIR, relPath);

        // Security: prevent path traversal
        if (!filePath.startsWith(PROJECTS_DIR)) {
            res.writeHead(403); res.end('Forbidden'); return;
        }

        // If directory, serve index.html
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            return serveFile(res, path.join(filePath, 'index.html'), 'text/html');
        }
        return serveFile(res, filePath);
    }

    // ─── Static: SPA (dist/) ────────────────────────────────
    if (pathname.startsWith('/assets/')) {
        return serveFile(res, path.join(DIST_DIR, pathname));
    }

    // Favicon
    if (pathname === '/favicon.svg') {
        return serveFile(res, path.join(DIST_DIR, 'favicon.svg'), 'image/svg+xml');
    }

    // SPA fallback → index.html
    if (method === 'GET' && !pathname.startsWith('/api/')) {
        return serveFile(res, path.join(DIST_DIR, 'index.html'), 'text/html');
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// ── WebSocket Server ─────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    const connectionId = uuid().substring(0, 12);
    connectionWs.set(connectionId, ws);
    console.log(`[${connectionId}] Connected`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            const { type, projectUrl, userName, html } = data;

            // ── IDENTIFY ─────────────────────────────────────
            if (type === 'IDENTIFY') {
                connectionNames.set(connectionId, userName || 'Anonymous');
                console.log(`[${connectionId}] Identified as: ${userName}`);
                return;
            }

            // ── REQUEST_LOCK ─────────────────────────────────
            if (type === 'REQUEST_LOCK') {
                if (!projectUrl) return;
                const slug = extractSlug(projectUrl);
                console.log(`[${connectionId}] Request lock: ${slug}`);

                // Locked by someone else?
                if (activeLocks.has(slug) && activeLocks.get(slug) !== connectionId) {
                    const lockerName = connectionNames.get(activeLocks.get(slug)) || 'Someone';
                    console.log(`[${connectionId}] Lock DENIED for ${slug}`);
                    ws.send(JSON.stringify({ type: 'LOCK_DENIED', projectUrl, lockedByName: lockerName }));
                    return;
                }

                // Release old lock if switching project
                if (connectionLocks.has(connectionId) && connectionLocks.get(connectionId) !== slug) {
                    const oldSlug = connectionLocks.get(connectionId);
                    activeLocks.delete(oldSlug);
                    broadcastToProject(oldSlug, { type: 'PROJECT_FREED', projectUrl: oldSlug }, ws);
                }

                // Grant lock
                activeLocks.set(slug, connectionId);
                connectionLocks.set(connectionId, slug);
                const myName = connectionNames.get(connectionId) || 'Unknown';
                console.log(`[${connectionId}] Lock GRANTED: ${slug}`);
                ws.send(JSON.stringify({ type: 'LOCK_GRANTED', projectUrl }));

                // Notify others
                broadcastToProject(slug, {
                    type: 'PROJECT_LOCKED',
                    projectUrl,
                    lockedByName: myName,
                }, ws);
                return;
            }

            // ── RELEASE_LOCK ─────────────────────────────────
            if (type === 'RELEASE_LOCK') {
                const slug = extractSlug(projectUrl);
                if (connectionLocks.get(connectionId) === slug) {
                    releaseLock(connectionId, slug);
                    ws.send(JSON.stringify({ type: 'LOCK_RELEASED', projectUrl }));
                }
                return;
            }

            // ── SAVE_CONTENT ─────────────────────────────────
            if (type === 'SAVE_CONTENT') {
                const slug = extractSlug(projectUrl);
                if (!html || !slug) return;

                // Only the lock holder can save
                if (activeLocks.get(slug) !== connectionId) {
                    ws.send(JSON.stringify({ type: 'SAVE_ERROR', error: 'Not lock holder' }));
                    return;
                }

                const projectDir = path.join(PROJECTS_DIR, slug);
                const indexFile = path.join(projectDir, 'index.html');

                if (!fs.existsSync(projectDir)) {
                    ws.send(JSON.stringify({ type: 'SAVE_ERROR', error: 'Project directory not found' }));
                    return;
                }

                // Backup + atomic write
                createBackup(slug);
                const tmpFile = indexFile + '.tmp';
                fs.writeFileSync(tmpFile, html, 'utf-8');
                fs.renameSync(tmpFile, indexFile);

                // Update DB timestamp
                stmts.updateProject.run(new Date().toISOString(), slug);

                // Confirm to sender
                ws.send(JSON.stringify({ type: 'SAVE_OK', projectUrl }));

                // Notify others viewing this project
                broadcastToProject(slug, { type: 'CONTENT_UPDATED', projectUrl }, ws);

                console.log(`[${connectionId}] Saved: ${slug}`);
                return;
            }

        } catch (error) {
            console.error(`[${connectionId}] Error:`, error.message);
        }
    });

    ws.on('close', () => {
        console.log(`[${connectionId}] Disconnected`);
        if (connectionLocks.has(connectionId)) {
            const slug = connectionLocks.get(connectionId);
            releaseLock(connectionId, slug);
        }
        connectionNames.delete(connectionId);
        connectionWs.delete(connectionId);
    });
});

// ── WebSocket Helpers ────────────────────────────────────────

function extractSlug(projectUrl) {
    // "/projects/ciarko/index.html" → "ciarko"
    // "/projects/ciarko/" → "ciarko"
    // "ciarko" → "ciarko"
    const match = projectUrl.match(/\/projects\/([a-z0-9_-]+)/);
    return match ? match[1] : projectUrl.replace(/\//g, '');
}

function releaseLock(connectionId, slug) {
    activeLocks.delete(slug);
    connectionLocks.delete(connectionId);
    console.log(`[${connectionId}] Released lock: ${slug}`);
    broadcastToProject(slug, { type: 'PROJECT_FREED', projectUrl: slug });
}

function broadcastToProject(slug, message, excludeWs = null) {
    const msgStr = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(msgStr);
        }
    });
}

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`\n  SnapEdit Server running on http://localhost:${PORT}`);
    console.log(`  Database: ${DB_PATH}`);
    console.log(`  Projects: ${PROJECTS_DIR}\n`);
});
