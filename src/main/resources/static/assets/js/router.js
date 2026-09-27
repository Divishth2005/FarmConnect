// Hash router with role guards and animated view transitions.
import { session, homeFor } from './session.js';
import { errorState } from './ui.js';

const ROUTES = {
    '/':          { load: () => import('./views/landing.js'),   title: 'Fresh from the farm' },
    '/market':    { load: () => import('./views/market.js'),    title: 'Marketplace' },
    '/login':     { load: () => import('./views/login.js'),     title: 'Log in', guestOnly: true },
    '/register':  { load: () => import('./views/register.js'),  title: 'Create account', guestOnly: true },
    '/orders':    { load: () => import('./views/orders.js'),    title: 'Orders', roles: ['BUYER', 'FARMER'] },
    '/dashboard': { load: () => import('./views/dashboard.js'), title: 'Dashboard', roles: ['FARMER'] },
    '/my-crops':  { load: () => import('./views/my-crops.js'),  title: 'My crops', roles: ['FARMER'] },
    '/profile':   { load: () => import('./views/profile.js'),   title: 'Profile', roles: ['BUYER', 'FARMER'] },
};

const view = document.getElementById('view');
const listeners = new Set();
let navId = 0;
let cleanup = null;

export function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs = ''] = raw.split('?');
    return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function navigate(hash, { replace = false } = {}) {
    if (replace) {
        history.replaceState(null, '', hash);
        render();
    } else if (location.hash === hash) {
        render();
    } else {
        location.hash = hash;
    }
}

export function onRoute(fn) { listeners.add(fn); }

async function render() {
    const id = ++navId;
    const { path, query } = parseHash();
    const route = ROUTES[path];

    if (route?.roles && !route.roles.includes(session.role)) {
        return navigate(session.user ? homeFor(session.role) : `#/login?next=${encodeURIComponent(location.hash)}`, { replace: true });
    }
    if (route?.guestOnly && session.user) {
        return navigate(homeFor(session.role), { replace: true });
    }

    listeners.forEach(fn => fn(path));
    document.title = `${route?.title || 'Not found'} · FarmConnect`;

    // Fade the old view out while the next module loads
    const hadContent = view.childElementCount > 0;
    if (hadContent) view.classList.add('leaving');
    const [mod] = await Promise.all([
        route ? route.load().catch(e => ({ error: e })) : null,
        hadContent ? new Promise(r => setTimeout(r, 150)) : null,
    ]);
    if (id !== navId) return; // a newer navigation won

    try { cleanup?.(); } catch { /* ignore */ }
    cleanup = null;
    view.classList.remove('leaving');
    view.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (!route) {
        view.innerHTML = `<section class="container not-found"><div class="nf-emoji">🥕</div>
            <h1>This field is empty</h1><p class="muted">The page you're looking for doesn't exist.</p>
            <a class="btn btn-primary mt-6" href="#/">Back home</a></section>`;
        return;
    }
    if (mod.error) {
        view.innerHTML = `<section class="container page">${errorState({ message: 'Could not load this page. Check your connection.' }, 'Reload')}</section>`;
        view.querySelector('[data-retry]').onclick = () => location.reload();
        return;
    }

    const result = await mod.default(view, { query, isCurrent: () => id === navId });
    if (id === navId && typeof result === 'function') cleanup = result;
    view.focus({ preventScroll: true });
}

export function startRouter() {
    window.addEventListener('hashchange', render);
    render();
}
