/**
 * WebSocket service for G-Rider real-time communication.
 * Handles connection, reconnection, and message routing.
 */

const API_BASE_URL = 'http://3.95.226.54:3001';
const WS_URL = API_BASE_URL.replace('http', 'ws');

let socket = null;
let reconnectTimer = null;
let pingTimer = null;
const listeners = new Map(); // type -> Set<callback>

function getWsUrl(role, token) {
    return `${WS_URL}/ws/${role}?token=${encodeURIComponent(token)}`;
}

export function connect(role, token) {
    disconnect(); // clean up any existing connection

    const url = getWsUrl(role, token);
    socket = new WebSocket(url);

    socket.onopen = () => {
        console.log(`[WS] Connected as ${role}`);
        emit('CONNECTION_STATUS', { connected: true, role });
        startPing();
    };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            emit(msg.type, msg);
        } catch { /* ignore bad data */ }
    };

    socket.onclose = (e) => {
        console.log(`[WS] Disconnected (code: ${e.code})`);
        emit('CONNECTION_STATUS', { connected: false });
        stopPing();
        // Auto-reconnect after 3s unless intentionally closed
        if (e.code !== 1000) {
            reconnectTimer = setTimeout(() => connect(role, token), 3000);
        }
    };

    socket.onerror = (err) => {
        console.log('[WS] Error:', err.message || 'unknown');
    };
}

export function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    stopPing();
    if (socket) {
        socket.onclose = null; // prevent auto-reconnect
        socket.close(1000);
        socket = null;
    }
    emit('CONNECTION_STATUS', { connected: false });
}

export function send(type, payload = {}) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, ...payload }));
    }
}

function startPing() {
    stopPing();
    pingTimer = setInterval(() => send('PING'), 25000);
}

function stopPing() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
}

/** Subscribe to a message type. Returns unsubscribe function. */
export function on(type, callback) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(callback);
    return () => listeners.get(type)?.delete(callback);
}

function emit(type, data) {
    const cbs = listeners.get(type);
    if (cbs) cbs.forEach(cb => cb(data));
    // Also emit to wildcard listeners
    const all = listeners.get('*');
    if (all) all.forEach(cb => cb({ type, ...data }));
}

export function isConnected() {
    return socket && socket.readyState === WebSocket.OPEN;
}
