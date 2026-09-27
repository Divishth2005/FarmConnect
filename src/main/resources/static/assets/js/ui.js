// Shared UI helpers: escaping, formatting, toasts, modals, form errors.

export function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- Formatting ----------
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export const money = (v) => inr.format(Number(v) || 0);
export const kg = (v) => `${num.format(Number(v) || 0)} kg`;
export const fmtNum = (v) => num.format(Number(v) || 0);

export function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
}

export function debounce(fn, ms = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ---------- Crop visuals (no images in the API, so derive a friendly tile) ----------
const CROP_EMOJI = [
    [/wheat|atta|barley|oat/, '🌾'], [/rice|paddy|basmati/, '🍚'], [/corn|maize|makka/, '🌽'],
    [/tomato/, '🍅'], [/potato|aloo/, '🥔'], [/onion|pyaz/, '🧅'], [/garlic|lahsun/, '🧄'],
    [/carrot|gajar/, '🥕'], [/chil+i|mirch|pepper|capsicum/, '🌶️'], [/brinjal|eggplant|baingan/, '🍆'],
    [/cucumber|kheera/, '🥒'], [/spinach|palak|lettuce|cabbage|greens|methi|leaf/, '🥬'],
    [/broccoli|cauliflower|gobi/, '🥦'], [/mushroom/, '🍄'], [/sweet ?potato|yam/, '🍠'],
    [/apple|seb/, '🍎'], [/banana|kela/, '🍌'], [/mango|aam/, '🥭'], [/grape|angoor/, '🍇'],
    [/orange|kinnow|santra/, '🍊'], [/lemon|lime|nimbu/, '🍋'], [/watermelon|tarbooz/, '🍉'],
    [/melon/, '🍈'], [/pineapple/, '🍍'], [/coconut|nariyal/, '🥥'], [/strawberr/, '🍓'],
    [/cherr/, '🍒'], [/peach/, '🍑'], [/pear/, '🍐'], [/kiwi/, '🥝'], [/avocado/, '🥑'],
    [/peanut|groundnut|moongphali/, '🥜'], [/dal|lentil|bean|chana|gram|pulse|rajma|moong|soy/, '🫘'],
    [/pea|matar/, '🫛'], [/ginger|adrak|turmeric|haldi/, '🫚'], [/coffee/, '☕'], [/tea|chai/, '🍵'],
    [/honey/, '🍯'], [/milk|dairy/, '🥛'], [/egg/, '🥚'], [/cotton/, '☁️'], [/sugar ?cane|ganna/, '🎋'],
    [/sunflower|mustard|sarson/, '🌻'], [/olive/, '🫒'], [/herb|mint|pudina|coriander|dhania|tulsi/, '🌿'],
];

export function cropEmoji(name) {
    const n = String(name || '').toLowerCase();
    for (const [re, e] of CROP_EMOJI) if (re.test(n)) return e;
    return '🌱';
}

export function cropTint(name) {
    let h = 0;
    for (const c of String(name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const hue = [95, 130, 150, 35, 20, 45, 170, 0, 280][h % 9];
    return `color-mix(in srgb, hsl(${hue} 70% 55%) 17%, var(--surface))`;
}

// ---------- Icons ----------
export const icon = {
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M17.9 17.9A10 10 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 5.2A9 9 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    mapHome: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/></svg>',
};

// ---------- Toasts ----------
export function toast(message, type = 'success', ms = 3800) {
    const stack = document.getElementById('toast-stack');
    const sym = { success: '✓', error: '!', info: 'i' }[type] || 'i';
    const node = el(`<div class="toast ${type}" role="${type === 'error' ? 'alert' : 'status'}">
        <span class="t-icon">${sym}</span><span>${esc(message)}</span>
        <button class="t-close" aria-label="Dismiss">×</button></div>`);
    const dismiss = () => {
        if (!node.isConnected || node.classList.contains('out')) return;
        node.classList.add('out');
        node.addEventListener('animationend', () => node.remove(), { once: true });
        setTimeout(() => node.remove(), 400);
    };
    node.querySelector('.t-close').onclick = dismiss;
    stack.appendChild(node);
    setTimeout(dismiss, ms);
    while (stack.children.length > 4) stack.firstElementChild.remove();
}

// ---------- Modals (bottom sheet on phones, dialog on larger screens) ----------
let openCount = 0;

export function openModal({ title, subtitle = '', body = '', footer = '', wide = false, onClose } = {}) {
    const root = document.getElementById('modal-root');
    const lastFocus = document.activeElement;
    const backdrop = el(`<div class="modal-backdrop">
        <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-head">
                <div><h2 id="modal-title">${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
                <button class="icon-btn modal-close" aria-label="Close">${icon.close}</button>
            </div>
            <div class="modal-body"></div>
            ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
        </div></div>`);
    const modal = backdrop.querySelector('.modal');
    const bodyEl = backdrop.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);

    let closed = false;
    function close(result) {
        if (closed) return;
        closed = true;
        backdrop.classList.remove('open');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => {
            backdrop.remove();
            if (--openCount === 0) document.body.classList.remove('no-scroll');
            lastFocus?.focus?.({ preventScroll: true });
        }, 320);
        onClose?.(result);
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') { // keep focus inside the dialog
            const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
                .filter(n => !n.disabled && n.offsetParent !== null);
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
            else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
    }

    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.modal-close').onclick = () => close();
    document.addEventListener('keydown', onKey);

    root.appendChild(backdrop);
    openCount++;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
    setTimeout(() => {
        const target = modal.querySelector('[autofocus]') || modal.querySelector('.modal-close');
        target?.focus({ preventScroll: true });
    }, 60);

    return { el: modal, body: bodyEl, close };
}

export function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
        let result = false;
        const m = openModal({
            title,
            body: `<p class="muted">${esc(message)}</p>`,
            footer: `<button class="btn" data-act="no">Cancel</button>
                     <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="yes">${esc(confirmText)}</button>`,
            onClose: () => resolve(result),
        });
        m.el.querySelector('[data-act="no"]').onclick = () => m.close();
        m.el.querySelector('[data-act="yes"]').onclick = () => { result = true; m.close(); };
        setTimeout(() => m.el.querySelector('[data-act="yes"]').focus(), 80);
    });
}

// ---------- Buttons & forms ----------
export function setLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
    btn.setAttribute('aria-busy', String(loading));
}

export function clearErrors(form) {
    $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
    $$('.field .error', form).forEach(e => { e.textContent = ''; });
    const alert = $('.form-alert', form);
    if (alert) { alert.classList.remove('show'); alert.textContent = ''; }
}

export function fieldError(form, name, message) {
    const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
    const field = input?.closest('.field');
    if (!field) return false;
    field.classList.add('invalid');
    let err = field.querySelector('.error');
    if (!err) { err = document.createElement('div'); err.className = 'error'; field.appendChild(err); }
    err.textContent = message;
    return true;
}

export function formAlert(form, message) {
    const alert = $('.form-alert', form);
    if (!alert) { toast(message, 'error'); return; }
    alert.textContent = message;
    alert.classList.remove('show');
    void alert.offsetWidth; // restart shake animation
    alert.classList.add('show');
}

// Show an ApiError on a form: field errors next to inputs, anything else in the alert box
export function showApiError(form, err) {
    let placed = false;
    if (err.fields) {
        for (const [name, msg] of Object.entries(err.fields)) {
            placed = fieldError(form, name, msg) || placed;
        }
    }
    if (!placed) formAlert(form, err.message);
    const firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
    firstBad?.focus();
}

export function field({ name, label, type = 'text', value = '', placeholder = '', hint = '', attrs = '', span = false }) {
    return `<div class="field${span ? ' span-2' : ''}">
        <label for="f-${name}">${esc(label)}</label>
        <input class="input" id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs}>
        ${hint ? `<div class="hint">${esc(hint)}</div>` : ''}
        <div class="error"></div>
    </div>`;
}

// ---------- Placeholders ----------
export function skeletonCards(n = 8) {
    return Array.from({ length: n }, () => `<div class="sk-card"><div class="skeleton art"></div>
        <div class="lines"><div class="skeleton sk-line" style="width:70%"></div>
        <div class="skeleton sk-line" style="width:45%"></div><div class="skeleton sk-line" style="width:55%;height:18px"></div></div></div>`).join('');
}

export function emptyState({ emoji = '🌱', title, text = '', action = '' }) {
    return `<div class="empty"><div class="e-icon">${emoji}</div><h3>${esc(title)}</h3>
        ${text ? `<p>${esc(text)}</p>` : ''}${action}</div>`;
}

export function errorState(err, retryLabel = 'Try again') {
    return `<div class="empty"><div class="e-icon">🌧️</div><h3>Couldn't load this</h3>
        <p>${esc(err.message)}</p><button class="btn btn-primary" data-retry>${esc(retryLabel)}</button></div>`;
}
