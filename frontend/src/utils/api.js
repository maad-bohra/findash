const BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Authenticated fetch wrapper.
 * Reads the JWT from localStorage and adds it as a Bearer token.
 */
export function authFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${BASE}${url}`, { ...options, headers });
}