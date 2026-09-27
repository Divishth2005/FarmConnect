import { api } from '../api.js';
import { session } from '../session.js';
import { icon, emptyState, errorState, $ } from '../ui.js';
import { orderCard, bindOrderActions } from '../components.js';

const TABS = [
    ['ALL', 'All'], ['PENDING', 'Pending'], ['CONFIRMED', 'Confirmed'], ['DELIVERED', 'Delivered'], ['CANCELLED', 'Cancelled'],
];

function skeleton(n = 3) {
    return Array.from({ length: n }, () => `<div class="card order-card"><div class="order-top">
        <div class="skeleton" style="width:56px;height:56px;border-radius:14px"></div>
        <div style="flex:1;display:grid;gap:10px"><div class="skeleton sk-line" style="width:40%;height:16px"></div>
        <div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line" style="width:30%"></div></div></div></div>`).join('');
}

export default async function render(view, { query }) {
    const farmer = session.isFarmer;
    const state = { orders: [], tab: TABS.some(([k]) => k === query.status) ? query.status : 'ALL' };

    view.innerHTML = `
    <section class="page"><div class="container">
        <div class="page-head">
            <div>
                <span class="eyebrow">${farmer ? 'Sales' : 'Purchases'}</span>
                <h1>${farmer ? 'Orders for your crops' : 'My orders'}</h1>
                <p>${farmer ? 'Confirm new orders and mark them delivered once handed over.' : 'Track your orders and contact farmers directly.'}</p>
            </div>
            <button class="btn" id="refresh">${icon.refresh}Refresh</button>
        </div>
        <div class="orders-toolbar"><div class="tabs" role="tablist" id="tabs"></div></div>
        <div class="order-list" id="list">${skeleton()}</div>
    </div></section>`;

    const list = $('#list', view);
    const tabs = $('#tabs', view);

    function draw() {
        const counts = Object.fromEntries(TABS.map(([k]) => [k, k === 'ALL' ? state.orders.length : state.orders.filter(o => o.status === k).length]));
        tabs.innerHTML = TABS.map(([k, label]) =>
            `<button class="tab ${state.tab === k ? 'active' : ''}" role="tab" aria-selected="${state.tab === k}" data-tab="${k}">
                ${label}${counts[k] ? `<span class="count">${counts[k]}</span>` : ''}</button>`).join('');

        const shown = state.orders.filter(o => state.tab === 'ALL' || o.status === state.tab);
        if (!state.orders.length) {
            list.innerHTML = farmer
                ? emptyState({ emoji: '📦', title: 'No orders yet', text: 'When buyers order your crops, they show up here.', action: '<a class="btn btn-primary" href="#/my-crops">Manage your listings</a>' })
                : emptyState({ emoji: '🧺', title: 'No orders yet', text: 'Find something fresh in the marketplace.', action: '<a class="btn btn-primary" href="#/market">Browse the marketplace</a>' });
        } else if (!shown.length) {
            list.innerHTML = emptyState({ emoji: '🍃', title: `No ${state.tab.toLowerCase()} orders`, text: 'Try another tab.' });
        } else {
            list.innerHTML = shown.map(orderCard).join('');
        }
    }

    async function load() {
        try {
            const orders = await api.orders();
            state.orders = orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate) || b.id - a.id);
            draw();
        } catch (e) {
            list.innerHTML = errorState(e);
        }
    }

    tabs.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (!t) return;
        state.tab = t.dataset.tab;
        history.replaceState(null, '', state.tab === 'ALL' ? '#/orders' : `#/orders?status=${state.tab}`);
        draw();
    });
    $('#refresh', view).addEventListener('click', async (e) => {
        const svg = e.currentTarget.querySelector('svg');
        svg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 600, easing: 'ease-in-out' });
        await load();
    });
    list.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(); });
    bindOrderActions(list, load);

    await load();
}
