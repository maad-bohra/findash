
const crypto = require('crypto');

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha256';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    return `${salt}:${hash}`;
}


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
