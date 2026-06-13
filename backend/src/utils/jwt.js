/**
 * Minimal HS256 JWT implementation using Node.js built-in crypto.
 * Drop-in replacement for jsonwebtoken sign/verify.
 */
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

function base64urlEncode(buf) {
    return Buffer.from(buf)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64urlDecode(str) {
    // Pad to multiple of 4
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64');
}

/**
 * Sign a payload and return a JWT string.
 * @param {object} payload
 * @param {number} [expiresIn] - seconds until expiry
 */
function sign(payload, expiresIn = DEFAULT_EXPIRES_IN) {
    const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + expiresIn };
    const body = base64urlEncode(JSON.stringify(fullPayload));
    const signingInput = `${header}.${body}`;
    const sig = base64urlEncode(
        crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest()
    );
    return `${signingInput}.${sig}`;
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if invalid or expired.
 */
function verify(token) {
    if (!token) throw new Error('No token provided');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const [header, body, sig] = parts;
    const signingInput = `${header}.${body}`;
    const expectedSig = base64urlEncode(
        crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest()
    );
    // Constant-time comparison
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new Error('Invalid token signature');
    }
    const payload = JSON.parse(base64urlDecode(body).toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        throw new Error('Token expired');
    }
    return payload;
}

module.exports = { sign, verify };
