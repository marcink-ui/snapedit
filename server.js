import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SnapEdit Locking Server is running\n');
});

const wss = new WebSocketServer({ server });

// Map of project URL to the connection ID that holds the lock
// e.g., { 'client_a/index.html': 'conn-123' }
const activeLocks = new Map();

// Map of connection ID to the project URL it currently holds (for cleanup)
// e.g., { 'conn-123': 'client_a/index.html' }
const connectionLocks = new Map();

wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(`[${connectionId}] New connection established.`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            const { type, projectUrl } = data;

            if (type === 'REQUEST_LOCK') {
                if (!projectUrl) return;

                console.log(`[${connectionId}] Requested lock for ${projectUrl}`);

                // Check if project is already locked by someone else
                if (activeLocks.has(projectUrl) && activeLocks.get(projectUrl) !== connectionId) {
                    console.log(`[${connectionId}] Lock DENIED for ${projectUrl}`);
                    ws.send(JSON.stringify({ type: 'LOCK_DENIED', projectUrl }));
                    return;
                }

                // If the connection already holds a lock for a DIFFERENT project, release it first
                if (connectionLocks.has(connectionId) && connectionLocks.get(connectionId) !== projectUrl) {
                    const oldProject = connectionLocks.get(connectionId);
                    activeLocks.delete(oldProject);
                    // Notify others that the old project is now free? (Optional enhancement)
                }

                // Grant the lock
                activeLocks.set(projectUrl, connectionId);
                connectionLocks.set(connectionId, projectUrl);

                console.log(`[${connectionId}] Lock GRANTED for ${projectUrl}`);
                ws.send(JSON.stringify({ type: 'LOCK_GRANTED', projectUrl }));

                // Notify everyone ELSE that this project is locked
                broadcastToOthers(ws, { type: 'PROJECT_LOCKED', projectUrl });

            } else if (type === 'RELEASE_LOCK') {
                if (connectionLocks.get(connectionId) === projectUrl) {
                    activeLocks.delete(projectUrl);
                    connectionLocks.delete(connectionId);
                    console.log(`[${connectionId}] Lock RELEASED for ${projectUrl}`);
                    ws.send(JSON.stringify({ type: 'LOCK_RELEASED', projectUrl }));

                    // Notify everyone that the project is now free
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'PROJECT_FREED', projectUrl }));
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`[${connectionId}] Error parsing message:`, error);
        }
    });

    ws.on('close', () => {
        console.log(`[${connectionId}] Connection closed.`);
        // Release any locks held by this connection
        if (connectionLocks.has(connectionId)) {
            const projectUrl = connectionLocks.get(connectionId);
            activeLocks.delete(projectUrl);
            connectionLocks.delete(connectionId);
            console.log(`[${connectionId}] Cleaned up lock for ${projectUrl}`);

            // Notify everyone that the project is now free
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'PROJECT_FREED', projectUrl }));
                }
            });
        }
    });
});

function broadcastToOthers(senderWs, message) {
    wss.clients.forEach(client => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`SnapEdit Websocket Locking Server is running on port ${PORT}`);
});
