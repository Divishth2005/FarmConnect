// App shell: header navigation, mobile drawer, theme, session events.
import { session } from './session.js';
import { startRouter, onRoute, navigate, parseHash } from './router.js';
import { esc, initials, icon, toast } from './ui.js';

const nav = document.getElementById('main-nav');
const headerAuth = document.getElementById('header-auth');
const drawer = document.getElementById('mobile-drawer');
const backdrop = document.getElementById('drawer-backdrop');
const menuBtn = document.getElementById('menu-btn');
const header = document.getElementById('site-header');

function links() {
    if (session.isFarmer) {
        return [['#/dashboard', 'Dashboard'], ['#/my-crops', 'My crops'], ['#/orders', 'Orders'], ['#/market', 'Marketplace']];
    }
    if (session.isBuyer) {
        return [['#/market', 'Marketplace'], ['#/orders', 'My orders']];
    }
    return [['#/', 'Home'], ['#/market', 'Marketplace']];
}

function renderNav() {
    const items = links();
    const linkHtml = items.map(([href, label]) => `<a class="nav-link" href="${href}" data-path="${href.slice(1)}">${label}</a>`).join('');
    nav.innerHTML = linkHtml;

    const user = session.user;
    const roleLabel = session.isFarmer ? 'Farmer' : 'Buyer';

    headerAuth.innerHTML = user
        ? `<a class="user-chip" href="#/profile" title="Your profile"><span class="avatar">${esc(initials(user.name))}</span>${esc(user.name?.split(' ')[0] || 'Profile')}</a>
           <button class="icon-btn" data-logout aria-label="Log out" title="Log out">${icon.logout}</button>`
        : `<a class="btn btn-ghost btn-sm" href="#/login">Log in</a><a class="btn btn-primary btn-sm" href="#/register">Sign up</a>`;

    drawer.innerHTML = `
        ${user ? `<div class="drawer-user"><span class="avatar">${esc(initials(user.name))}</span>
            <div><strong>${esc(user.name)}</strong><small>${roleLabel} account</small></div></div>` : ''}
        ${linkHtml}
        ${user ? '<a class="nav-link" href="#/profile" data-path="/profile">Profile</a>' : ''}
        <div class="drawer-actions">
            ${user
                ? '<button class="btn btn-danger-soft btn-block" data-logout>Log out</button>'
                : '<a class="btn btn-primary btn-block" href="#/register">Create account</a><a class="btn btn-block" href="#/login">Log in</a>'}
        </div>`;

    document.getElementById('footer-account').innerHTML = user
        ? `<h4>Account</h4><a href="#/profile">Profile</a><a href="#/orders">${session.isFarmer ? 'Orders' : 'My orders'}</a>`
        : '<h4>Account</h4><a href="#/login">Log in</a><a href="#/register">Create account</a>';

    highlight(parseHash().path);
}

function highlight(path) {
    document.querySelectorAll('.nav-link').forEach(a => {
        a.classList.toggle('active', a.dataset.path === path);
        if (a.dataset.path === path) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
}

// ---------- Mobile drawer ----------
function setDrawer(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    drawer.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
    document.body.classList.toggle('drawer-open', open);
    if (open) {
        backdrop.hidden = false;
        requestAnimationFrame(() => backdrop.classList.add('open'));
    } else {
        backdrop.classList.remove('open');
        setTimeout(() => { if (!drawer.classList.contains('open')) backdrop.hidden = true; }, 300);
    }
}
menuBtn.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
backdrop.addEventListener('click', () => setDrawer(false));
drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });
matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setDrawer(false); });

// ---------- Logout ----------
document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-logout]')) return;
    setDrawer(false);
    session.clear();
    toast('You have been logged out', 'info');
    navigate('#/');
});

window.addEventListener('fc:session-expired', () => {
    toast('Your session expired. Please log in again.', 'info');
    navigate(`#/login?next=${encodeURIComponent(location.hash)}`);
});

// ---------- Theme ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    const root = document.documentElement;
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('fc.theme', next); } catch { /* ignore */ }
    document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#0f1612' : '#2e7d4f';
});

// ---------- Header shadow on scroll ----------
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 4);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

document.getElementById('year').textContent = new Date().getFullYear();

session.onChange(renderNav);
onRoute((path) => { highlight(path); if (drawer.classList.contains('open')) setDrawer(false); });
renderNav();
startRouter();
