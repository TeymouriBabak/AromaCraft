type SessionEntry = { userId: string; role?: string; expiresAt: number };

const store = new Map<string, SessionEntry>();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function genSessionId(length = 24) {
  // Try Web Crypto first (works in Edge runtime and modern Node)
  const globalCrypto =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    globalCrypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }
  // Fallback: use Math.random (not cryptographically secure, fine for dev)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  }
  return result;
}

export function createSession(
  userId: string,
  ttlSeconds = 60 * 60 * 24 * 7,
  role?: string
) {
  const sessionId = genSessionId(24);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(sessionId, { userId, role, expiresAt });
  return { sessionId, expiresAt };
}

export function getSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(sessionId);
    return null;
  }
  return entry;
}

export function deleteSession(sessionId: string | undefined) {
  if (!sessionId) return false;
  return store.delete(sessionId);
}

export function devListSessions() {
  return Array.from(store.entries()).map(([k, v]) => ({ sessionId: k, ...v }));
}
