// Logged-in user ({ id, name, role, token }) persisted in localStorage.
const KEY = 'fc.session';
const listeners = new Set();

function decodeExp(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload)).exp * 1000;
    } catch {
        return 0;
    }
}

function isExpired(token) {
    return !token || decodeExp(token) <= Date.now();
}

function load() {
    try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (s && !isExpired(s.token)) return s;
        localStorage.removeItem(KEY);
    } catch { /* storage unavailable */ }
    return null;
}

let current = load();

function persist() {
    try {
        if (current) localStorage.setItem(KEY, JSON.stringify(current));
        else localStorage.removeItem(KEY);
    } catch { /* storage unavailable: session lives in memory only */ }
    listeners.forEach(fn => fn(current));
}

export const session = {
    get user() { return current; },
    get token() { return current?.token ?? null; },
    get role() { return current?.role ?? null; },
    get isFarmer() { return current?.role === 'FARMER'; },
    get isBuyer() { return current?.role === 'BUYER'; },
    get isExpired() { return !!current && isExpired(current.token); },

    set(user) { current = { id: user.id, name: user.name, role: user.role, token: user.token }; persist(); },
    update(patch) { if (current) { current = { ...current, ...patch }; persist(); } },
    clear() { current = null; persist(); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function homeFor(role) {
    return role === 'FARMER' ? '#/dashboard' : '#/market';
}
