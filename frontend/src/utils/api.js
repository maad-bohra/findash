const BASE = import.meta.env.VITE_API_BASE || '';

const AUTH_KEYS = [
    'authToken',
    'loggedInUser',
    'loggedInUsername',
    'loggedInAvatar',
    'loggedInCurrency',
    'loggedInIsAdmin',
];

function clearAuth() {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
}

// Prevent multiple simultaneous refresh calls
let refreshPromise = null;

async function tryRefresh() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = fetch(`${BASE}/api/auth/refresh`, {
        method:      'POST',
        credentials: 'include',  // sends the httpOnly cookie
    })
    .then(res => res.json())
    .finally(() => { refreshPromise = null; });

    return refreshPromise;
}


export async function authFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${url}`, { ...options, headers, credentials: 'include' });

    if (res.status !== 401) return res;

    // --- 401 received: try to refresh ---
    const refreshData = await tryRefresh();

    if (refreshData?.success && refreshData?.token) {
        // Save the new access token and retry the original request
        localStorage.setItem('authToken', refreshData.token);
        const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${refreshData.token}`,
        };
        return fetch(`${BASE}${url}`, { ...options, headers: retryHeaders, credentials: 'include' });
    }

    // Refresh failed → force logout
    clearAuth();
    setTimeout(() => window.location.reload(), 100);
    return res;
}


export async function logoutRequest() {
    await fetch(`${BASE}/api/auth/logout`, {
        method:      'POST',
        credentials: 'include',
    }).catch(() => {});
    clearAuth();
}