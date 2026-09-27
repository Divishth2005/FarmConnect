import { api } from '../api.js';
import { session } from '../session.js';
import { esc, money, kg, fmtNum, cropArt, cropTint, errorState, $ } from '../ui.js';
import { statusBadge, orderActions, bindOrderActions, openCropForm } from '../components.js';

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default async function render(view) {
    const first = session.user.name?.split(' ')[0] || 'farmer';

    view.innerHTML = `
    <section class="page"><div class="container">
        <div class="welcome">
            <div><h1>${greeting()}, ${esc(first)} 👋</h1><p>Here's how your farm is doing on FarmConnect.</p></div>
            <button class="btn btn-primary" id="new-crop">+ List a new crop</button>
        </div>
        <div class="stats-strip" id="stats">
            ${[['🌱', 'Active listings'], ['⏳', 'Orders to handle'], ['💰', 'Earned (delivered)'], ['📦', 'Stock available']].map(([e, l]) =>
                `<div class="card stat"><div class="stat-icon">${e}</div><div class="stat-value"><span class="skeleton sk-line" style="display:block;width:55%;height:28px"></span></div><div class="stat-label">${l}</div></div>`).join('')}
        </div>
        <div class="dash-grid mt-6">
            <div class="card">
                <div class="panel-head"><h2>Orders needing action</h2><a href="#/orders" class="btn btn-ghost btn-sm">View all</a></div>
                <div class="panel-body" id="todo"><div class="skeleton sk-line mt-4" style="height:46px"></div><div class="skeleton sk-line mt-4" style="height:46px"></div></div>
            </div>
            <div class="card">
                <div class="panel-head"><h2>Your listings</h2><a href="#/my-crops" class="btn btn-ghost btn-sm">Manage</a></div>
                <div class="panel-body" id="listings"><div class="skeleton sk-line mt-4" style="height:46px"></div><div class="skeleton sk-line mt-4" style="height:46px"></div></div>
            </div>
        </div>
    </div></section>`;

    const statsEl = $('#stats', view);
    const todo = $('#todo', view);
    const listings = $('#listings', view);

    async function load() {
        let crops, orders;
        try {
            [crops, orders] = await Promise.all([api.crops(), api.orders()]);
        } catch (e) {
            todo.innerHTML = errorState(e);
            listings.innerHTML = '';
            return;
        }
        const mine = crops.filter(c => c.farmerId === session.user.id).sort((a, b) => b.id - a.id);
        const open = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
            .sort((a, b) => (a.status === 'PENDING' ? -1 : 1) - (b.status === 'PENDING' ? -1 : 1) || new Date(b.orderDate) - new Date(a.orderDate));
        const earned = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.totalPrice, 0);
        const stock = mine.reduce((s, c) => s + c.quantity, 0);

        const values = [fmtNum(mine.filter(c => c.quantity > 0).length), fmtNum(open.length), money(earned), kg(stock)];
        statsEl.querySelectorAll('.stat-value').forEach((v, i) => { v.textContent = values[i]; });

        todo.innerHTML = open.length
            ? open.slice(0, 6).map(o => `<div class="list-row">
                <div class="li-art" style="--art-bg:${cropTint(o.cropName)}">${cropArt(o.cropName, o.cropImageUrl)}</div>
                <div class="li-main"><strong>${esc(o.cropName)} · ${kg(o.quantity)}</strong>
                    <small>${esc(o.buyerName || 'Buyer')} · ${money(o.totalPrice)}</small></div>
                <div class="li-end">${statusBadge(o.status)}${orderActions(o)}</div>
              </div>`).join('')
            : `<div class="empty" style="margin-top:12px"><div class="e-icon">✅</div><h3>All caught up</h3><p>New orders from buyers will appear here.</p></div>`;

        listings.innerHTML = mine.length
            ? mine.slice(0, 6).map(c => `<div class="list-row">
                <div class="li-art" style="--art-bg:${cropTint(c.name)}">${cropArt(c.name, c.imageUrl)}</div>
                <div class="li-main"><strong>${esc(c.name)}</strong><small>${money(c.price)}/kg</small></div>
                <div class="li-end">${c.quantity > 0 ? `<span class="badge badge-green plain">${kg(c.quantity)}</span>` : '<span class="badge plain">Sold out</span>'}</div>
              </div>`).join('')
            : `<div class="empty" style="margin-top:12px"><div class="e-icon">🌱</div><h3>No listings yet</h3><p>List your first crop to start selling.</p></div>`;
    }

    $('#new-crop', view).addEventListener('click', () => openCropForm({ onSaved: load }));
    todo.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(); });
    bindOrderActions(todo, load);

    await load();
}
