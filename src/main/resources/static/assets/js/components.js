// Reusable pieces shared by several views.
import { api } from './api.js';
import { session } from './session.js';
import {
    esc, el, money, kg, fmtNum, fmtDate, cropEmoji, cropTint, icon, toast, openModal, confirmDialog,
    setLoading, clearErrors, fieldError, showApiError, field,
} from './ui.js';

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export function stateSelect(name, value = '', label = 'State') {
    const opts = INDIAN_STATES.map(s => `<option ${s === value ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const custom = value && !INDIAN_STATES.includes(value) ? `<option selected>${esc(value)}</option>` : '';
    return `<div class="field"><label for="f-${name}">${esc(label)}</label>
        <select class="select" id="f-${name}" name="${name}"><option value="">Select state</option>${custom}${opts}</select>
        <div class="error"></div></div>`;
}

export function location(district, state) {
    return [district, state].filter(Boolean).join(', ');
}

// ---------- Crop card (marketplace grid) ----------
export function cropCard(crop, index = 0) {
    const soldOut = !(crop.quantity > 0);
    const loc = location(crop.farmerDistrict, crop.farmerState);
    return `<button class="card crop-card" data-crop="${crop.id}" style="animation-delay:${Math.min(index, 11) * 35}ms"
            aria-label="${esc(crop.name)}, ${esc(money(crop.price))} per kg">
        <div class="crop-art" style="--art-bg:${cropTint(crop.name)}">
            <span class="emoji" aria-hidden="true">${cropEmoji(crop.name)}</span>
            ${soldOut ? '<div class="soldout">Sold out</div>' : ''}
        </div>
        <div class="crop-body">
            <h3>${esc(crop.name)}</h3>
            <div class="crop-farmer">${icon.user}<span>${esc(crop.farmerName || 'Local farmer')}</span></div>
            ${loc ? `<div class="crop-farmer">${icon.pin}<span>${esc(loc)}</span></div>` : ''}
            <div class="crop-foot">
                <div class="price">${money(crop.price)}<small> /kg</small></div>
                <div class="stock">${soldOut ? 'Out of stock' : `${fmtNum(crop.quantity)} kg left`}</div>
            </div>
        </div>
    </button>`;
}

// ---------- Crop detail + order sheet ----------
export function openCropModal(crop, { onOrdered } = {}) {
    const soldOut = !(crop.quantity > 0);
    const loc = location(crop.farmerDistrict, crop.farmerState);
    const isOwn = session.isFarmer && crop.farmerId === session.user.id;
    const startQty = Math.min(1, crop.quantity) || 0;

    let action = '';
    if (soldOut) {
        action = '<button class="btn btn-block" disabled>Sold out</button>';
    } else if (!session.user) {
        action = `<a class="btn btn-primary btn-block" href="#/login?next=${encodeURIComponent('#/market')}">Log in to order</a>`;
    } else if (session.isBuyer) {
        action = '<button class="btn btn-primary btn-block" data-order>Place order</button>';
    } else if (isOwn) {
        action = '<a class="btn btn-soft btn-block" href="#/my-crops">Manage this listing</a>';
    } else {
        action = '<p class="muted" style="width:100%;text-align:center">Log in with a buyer account to order.</p>';
    }

    const qtyBlock = session.isBuyer && !soldOut ? `
        <div class="qty-row">
            <div>
                <div class="muted" style="font-size:.8rem;font-weight:600;margin-bottom:6px">Quantity (kg)</div>
                <div class="stepper">
                    <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
                    <input type="number" inputmode="decimal" min="0.1" step="0.1" max="${crop.quantity}" value="${startQty}" aria-label="Quantity in kg">
                    <button type="button" data-step="1" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <div class="total-line"><small>Total</small><strong data-total>${money(crop.price * startQty)}</strong></div>
        </div>
        <div class="error" data-qty-error style="color:var(--danger);font-size:.85rem;margin-top:8px"></div>` : '';

    const m = openModal({
        title: crop.name,
        subtitle: `Sold directly by ${crop.farmerName || 'a local farmer'}`,
        body: `
            <div class="crop-art detail-art" style="--art-bg:${cropTint(crop.name)}"><span class="emoji">${cropEmoji(crop.name)}</span></div>
            <div class="detail-meta">
                <div class="meta-box"><small>Price</small><strong>${money(crop.price)}</strong> <span class="muted">/kg</span></div>
                <div class="meta-box"><small>Available</small><strong>${soldOut ? 'Sold out' : kg(crop.quantity)}</strong></div>
                <div class="meta-box"><small>Farmer</small><strong>${esc(crop.farmerName || '—')}</strong></div>
                <div class="meta-box"><small>Grown in</small><strong>${esc(loc || '—')}</strong></div>
            </div>
            ${crop.description ? `<p class="detail-desc">${esc(crop.description)}</p>` : ''}
            ${qtyBlock}`,
        footer: action,
    });

    if (!(session.isBuyer && !soldOut)) {
        m.el.querySelector('a.btn')?.addEventListener('click', () => m.close());
        return;
    }

    const input = m.el.querySelector('.stepper input');
    const total = m.el.querySelector('[data-total]');
    const err = m.el.querySelector('[data-qty-error]');
    const [minus, plus] = m.el.querySelectorAll('[data-step]');
    const orderBtn = m.el.querySelector('[data-order]');

    const round = (v) => Math.round(v * 100) / 100;
    function sync() {
        const q = Number(input.value);
        const valid = q > 0 && q <= crop.quantity;
        total.textContent = money(valid ? crop.price * q : 0);
        minus.disabled = !(q > 1);
        plus.disabled = q + 1 > crop.quantity;
        err.textContent = !input.value ? '' : q <= 0 ? 'Enter a quantity above 0.' :
            q > crop.quantity ? `Only ${kg(crop.quantity)} available.` : '';
        orderBtn.disabled = !valid;
    }
    m.el.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
        input.value = round(Math.min(crop.quantity, Math.max(0.1, (Number(input.value) || 0) + Number(b.dataset.step))));
        sync();
    }));
    input.addEventListener('input', sync);
    sync();

    orderBtn.addEventListener('click', async () => {
        const q = round(Number(input.value));
        setLoading(orderBtn, true);
        try {
            const order = await api.placeOrder(crop.id, q);
            m.close();
            toast(`Order placed for ${kg(q)} of ${crop.name} · ${money(order.totalPrice)}`);
            onOrdered?.(order);
        } catch (e) {
            err.textContent = e.message;
            setLoading(orderBtn, false);
        }
    });
}

// ---------- Orders ----------
const STATUS_LABEL = { PENDING: 'Pending', CONFIRMED: 'Confirmed', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };

export function statusBadge(status) {
    return `<span class="badge badge-${String(status).toLowerCase()}">${STATUS_LABEL[status] || esc(status)}</span>`;
}

function progress(status) {
    if (status === 'CANCELLED') return '';
    const level = { PENDING: 1, CONFIRMED: 2, DELIVERED: 3 }[status] || 0;
    return `<div class="progress" aria-hidden="true">
            ${[1, 2, 3].map(i => `<div class="p-step ${i <= level ? 'done' : ''}"></div>`).join('')}
        </div>
        <div class="progress-labels" aria-hidden="true"><span>Placed</span><span>Confirmed</span><span>Delivered</span></div>`;
}

export function orderActions(order) {
    if (session.isBuyer && order.status === 'PENDING') {
        return `<button class="btn btn-danger-soft btn-sm" data-act="cancel" data-id="${order.id}">Cancel order</button>`;
    }
    if (session.isFarmer && order.status === 'PENDING') {
        return `<button class="btn btn-primary btn-sm" data-act="confirm" data-id="${order.id}">Confirm order</button>`;
    }
    if (session.isFarmer && order.status === 'CONFIRMED') {
        return `<button class="btn btn-primary btn-sm" data-act="deliver" data-id="${order.id}">Mark delivered</button>`;
    }
    return '';
}

export function orderCard(order, index = 0) {
    const perKg = order.quantity ? order.totalPrice / order.quantity : 0;
    let party;
    if (session.isFarmer) {
        const a = order.buyerAddress;
        const addr = a ? [a.addressLine, location(a.district, a.state), a.pinCode].filter(Boolean).join(', ') : '';
        party = `<span>${icon.user}${esc(order.buyerName || 'Buyer')}</span>
            ${order.buyerPhone ? `<span>${icon.phone}<a href="tel:${esc(order.buyerPhone)}">${esc(order.buyerPhone)}</a></span>` : ''}
            ${addr ? `<span>${icon.mapHome}${esc(addr)}</span>` : ''}`;
    } else {
        party = `<span>${icon.user}From ${esc(order.farmerName || 'farmer')}</span>
            ${order.farmerPhone ? `<span>${icon.phone}<a href="tel:${esc(order.farmerPhone)}">${esc(order.farmerPhone)}</a></span>` : ''}`;
    }
    const actions = orderActions(order);
    return `<article class="card order-card" style="animation-delay:${Math.min(index, 10) * 40}ms">
        <div class="order-top">
            <div class="li-art" style="--art-bg:${cropTint(order.cropName)}" aria-hidden="true">${cropEmoji(order.cropName)}</div>
            <div class="order-info">
                <div class="title-row"><h3>${esc(order.cropName)}</h3>${statusBadge(order.status)}</div>
                <div class="meta">Order #${order.id} · ${esc(fmtDate(order.orderDate))}</div>
                <div class="order-party">${party}</div>
                ${progress(order.status)}
            </div>
        </div>
        <div class="order-side">
            <div class="order-total">${money(order.totalPrice)}<small>${kg(order.quantity)} × ${money(perKg)}</small></div>
            ${actions ? `<div class="order-actions">${actions}</div>` : ''}
        </div>
    </article>`;
}

const ACTION_COPY = {
    cancel: { fn: 'cancelOrder', title: 'Cancel this order?', msg: 'The stock goes back to the farmer. This cannot be undone.', btn: 'Cancel order', danger: true, done: 'Order cancelled' },
    confirm: { fn: 'confirmOrder', title: 'Confirm this order?', msg: 'Let the buyer know you will fulfil it.', btn: 'Confirm order', done: 'Order confirmed. The buyer can see it now.' },
    deliver: { fn: 'deliverOrder', title: 'Mark as delivered?', msg: 'Only do this once the buyer has received the produce.', btn: 'Mark delivered', done: 'Marked as delivered. Nice work!' },
};

// Wire order action buttons inside `root`; calls onChange() after a successful update
export function bindOrderActions(root, onChange) {
    root.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn || !ACTION_COPY[btn.dataset.act]) return;
        const a = ACTION_COPY[btn.dataset.act];
        if (!(await confirmDialog({ title: a.title, message: a.msg, confirmText: a.btn, danger: a.danger }))) return;
        setLoading(btn, true);
        try {
            await api[a.fn](Number(btn.dataset.id));
            toast(a.done);
            await onChange?.();
        } catch (err) {
            toast(err.message, 'error');
            setLoading(btn, false);
        }
    });
}

// ---------- Crop create / edit form (farmers) ----------
export function openCropForm({ crop = null, onSaved } = {}) {
    const editing = !!crop;
    const form = el(`<form novalidate>
        <div class="form-alert" role="alert"></div>
        <div class="form-grid cols-2">
            ${field({ name: 'name', label: 'Crop name', value: crop?.name, placeholder: 'e.g. Basmati Rice', attrs: 'required maxlength="80" autofocus', span: true })}
            ${field({ name: 'price', label: 'Price per kg (₹)', type: 'number', value: crop?.price ?? '', placeholder: '45', attrs: 'required min="0.01" step="0.01" inputmode="decimal"' })}
            ${field({ name: 'quantity', label: 'Available stock (kg)', type: 'number', value: crop?.quantity ?? '', placeholder: '500', attrs: `required min="${editing ? 0 : 0.1}" step="0.1" inputmode="decimal"`, hint: editing ? 'Set to 0 to stop selling.' : '' })}
            <div class="field span-2">
                <label for="f-description">Description <span class="muted">(optional)</span></label>
                <textarea class="textarea" id="f-description" name="description" maxlength="500" placeholder="How it was grown, harvest date, quality...">${esc(crop?.description || '')}</textarea>
                <div class="error"></div>
            </div>
        </div>
        <button type="submit" hidden></button>
    </form>`);

    const m = openModal({
        title: editing ? 'Edit listing' : 'List a new crop',
        subtitle: editing ? crop.name : 'Buyers will see this in the marketplace right away.',
        body: form,
        footer: `<button class="btn" data-cancel>Cancel</button><button class="btn btn-primary" data-save>${editing ? 'Save changes' : 'Publish listing'}</button>`,
    });
    const saveBtn = m.el.querySelector('[data-save]');
    m.el.querySelector('[data-cancel]').onclick = () => m.close();
    saveBtn.onclick = () => form.requestSubmit();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);
        const data = Object.fromEntries(new FormData(form));
        const body = {
            name: data.name.trim(),
            price: Number(data.price),
            quantity: Number(data.quantity),
            description: data.description.trim() || null,
        };
        let ok = true;
        const fail = (name, msg) => { ok = false; fieldError(form, name, msg); };
        if (!body.name) fail('name', 'Give your crop a name.');
        if (!(body.price > 0)) fail('price', 'Price must be more than ₹0.');
        if (data.quantity === '' || body.quantity < 0 || (!editing && body.quantity <= 0)) {
            fail('quantity', editing ? 'Stock cannot be negative.' : 'Add how many kg you have.');
        }
        if (!ok) { form.querySelector('.field.invalid input')?.focus(); return; }

        setLoading(saveBtn, true);
        try {
            const saved = editing ? await api.updateCrop(crop.id, body) : await api.createCrop(body);
            m.close();
            toast(editing ? 'Listing updated' : `${body.name} is now live in the marketplace`);
            onSaved?.(saved);
        } catch (err) {
            showApiError(form, err);
            setLoading(saveBtn, false);
        }
    });
}

// ---------- Auth side panel ----------
export function authSide(title, text, points, emoji = '🌾') {
    return `<aside class="auth-side">
        <span class="big-emoji" aria-hidden="true">${emoji}</span>
        <h2>${esc(title)}</h2><p>${esc(text)}</p>
        <ul>${points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    </aside>`;
}
