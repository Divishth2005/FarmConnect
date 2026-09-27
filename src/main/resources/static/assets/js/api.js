// Thin client for the FarmConnect REST API.
// Served from the same Spring Boot app, so paths are relative by default.
// Set window.FC_API_BASE (e.g. "http://localhost:8081") to host the frontend elsewhere.
import { session } from './session.js';

const BASE = (window.FC_API_BASE || '').replace(/\/$/, '');

export class ApiError extends Error {
    constructor(status, message, fields = null) {
        super(message);
        this.status = status;
        this.fields = fields; // { fieldName: message } for validation errors
    }
}

const FALLBACK = {
    400: 'Please check the details you entered.',
    401: 'Please log in to continue.',
    403: "You don't have permission to do that.",
    404: "We couldn't find what you were looking for.",
    405: 'That action is not supported.',
    409: 'That conflicts with existing data.',
    500: 'Something went wrong on our side. Please try again.',
};

async function request(method, path, body) {
    const headers = { Accept: 'application/json' };
    if (session.token) headers.Authorization = `Bearer ${session.token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let res;
    try {
        res = await fetch(BASE + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(0, "Can't reach the server. Check your connection and that the backend is running.");
    }

    const text = await res.text();
    let data = text;
    if (text) {
        try { data = JSON.parse(text); } catch { /* plain-text body */ }
    } else {
        data = null;
    }

    if (res.ok) return data;

    // Spring Security answers a missing/expired token with an empty 403
    if ((res.status === 401 || res.status === 403) && !text && session.user && session.isExpired) {
        session.clear();
        window.dispatchEvent(new CustomEvent('fc:session-expired'));
        throw new ApiError(401, 'Your session has expired. Please log in again.');
    }

    if (data && typeof data === 'object') {
        const first = Object.values(data)[0];
        throw new ApiError(res.status, typeof first === 'string' ? first : FALLBACK[res.status] || FALLBACK[500], data);
    }
    throw new ApiError(res.status, (typeof data === 'string' && data) || FALLBACK[res.status] || FALLBACK[500]);
}

export const api = {
    // Auth
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    register: (payload) => request('POST', '/auth/register', payload),

    // Crops
    crops: () => request('GET', '/crop'),
    crop: (id) => request('GET', `/crop/${id}`),
    createCrop: (crop) => request('POST', '/crop', crop),
    updateCrop: (id, crop) => request('PUT', `/crop/${id}`, crop),
    deleteCrop: (id) => request('DELETE', `/crop/${id}`),

    // Orders (server returns only the caller's orders)
    orders: () => request('GET', '/orders'),
    placeOrder: (cropId, quantity) => request('POST', '/orders', { cropId, quantity }),
    cancelOrder: (id) => request('PATCH', `/orders/${id}/cancel`),
    confirmOrder: (id) => request('PATCH', `/orders/${id}/confirm`),
    deliverOrder: (id) => request('PATCH', `/orders/${id}/deliver`),

    // Profiles
    farmer: (id) => request('GET', `/farmer/${id}`),
    updateFarmer: (id, patch) => request('PATCH', `/farmer/${id}`, patch),
    deleteFarmer: (id) => request('DELETE', `/farmer/${id}`),
    buyer: (id) => request('GET', `/buyer/${id}`),
    updateBuyer: (id, patch) => request('PATCH', `/buyer/${id}`, patch),
    deleteBuyer: (id) => request('DELETE', `/buyer/${id}`),
};
