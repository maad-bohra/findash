/**
 * Password hashing using Node.js built-in crypto (PBKDF2-SHA256).
 * No external dependencies required.
 */
const crypto = require('crypto');

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha256';

/**
 * Hash a plain-text password.
 * @returns {string} "salt:hash" string suitable for storage
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    return `${salt}:${hash}`;
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} password - plain text
 * @param {string} stored   - "salt:hash" string from DB
 * @returns {boolean}
 */
function comparePassword(password, stored) {
    // Support legacy plain-text passwords during migration (remove in production)
    if (!stored || !stored.includes(':')) {
        return password === stored; // plain-text fallback (issue #1 migration)
    }
    const [salt, hash] = stored.split(':');
    const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    // Constant-time comparison
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

module.exports = { hashPassword, comparePassword };
