import { api } from '../api.js';
import { session, homeFor } from '../session.js';
import { money, fmtNum, skeletonCards, emptyState, $ } from '../ui.js';
import { cropCard, openCropModal } from '../components.js';

const STEPS = {
    buyer: [
        ['Browse fresh produce', 'See what farmers near you are harvesting, with honest per-kg prices.'],
        ['Order directly', 'Pick a quantity and place your order straight with the farmer.'],
        ['Get it from the source', 'The farmer confirms and delivers. Call them anytime from your order.'],
    ],
    farmer: [
        ['Create your farm profile', 'Sign up with your PAN and Aadhaar so buyers know you are verified.'],
        ['List your harvest', 'Set your own price and stock. It goes live in the marketplace instantly.'],
        ['Confirm and deliver', 'Accept orders, deliver, and keep 100% of the price you set.'],
    ],
};

const check = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

export default async function render(view) {
    const loggedIn = !!session.user;
    view.innerHTML = `
    <section class="hero">
        <div class="container hero-grid">
            <div>
                <span class="eyebrow">Farm to table, no middlemen</span>
                <h1>Fresh from the farm. <span class="hl">Straight to you.</span></h1>
                <p class="lead">FarmConnect lets farmers sell their harvest directly to buyers. Farmers earn more, buyers pay less, and the produce gets to you fresher.</p>
                <div class="hero-cta">
                    <a class="btn btn-primary btn-lg" href="#/market">Browse the marketplace</a>
                    ${loggedIn
                        ? `<a class="btn btn-lg" href="${homeFor(session.role)}">Go to your ${session.isFarmer ? 'dashboard' : 'orders'}</a>`
                        : '<a class="btn btn-lg" href="#/register?role=FARMER">Sell your harvest</a>'}
                </div>
                <div class="hero-trust">
                    <span>${check}Verified farmers</span>
                    <span>${check}Farmers set their own prices</span>
                    <span>${check}Direct contact with the grower</span>
                </div>
            </div>
            <div class="hero-art" aria-hidden="true">
                <div class="blob"></div>
                <div class="blob-emoji">🧺</div>
                <div class="float-card one"><span class="fc-emoji">🍅</span><div>Tomatoes<small>Picked this morning</small></div></div>
                <div class="float-card two"><span class="fc-emoji">🌾</span><div>Wheat<small>Direct from Punjab</small></div></div>
                <div class="float-card three"><span class="fc-emoji">🥭</span><div>Mangoes<small>No middlemen</small></div></div>
            </div>
        </div>
    </section>

    <section class="container" aria-label="Marketplace at a glance">
        <div class="stats-strip" id="stats">
            ${['🌱 Fresh listings', '🧑‍🌾 Farmers selling', '📦 kg in stock', '💰 Average price / kg'].map(s => {
                const [e, ...l] = s.split(' ');
                return `<div class="card stat"><div class="stat-icon">${e}</div><div class="stat-value"><span class="skeleton sk-line" style="display:block;width:60%;height:28px"></span></div><div class="stat-label">${l.join(' ')}</div></div>`;
            }).join('')}
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="page-head">
                <div><span class="eyebrow">Just harvested</span><h2 style="font-size:clamp(1.6rem,4vw,2.3rem);font-weight:800">Fresh in the marketplace</h2></div>
                <a class="btn btn-soft" href="#/market">See everything →</a>
            </div>
            <div class="crop-grid" id="fresh">${skeletonCards(4)}</div>
        </div>
    </section>

    <section class="section section-alt" id="how">
        <div class="container">
            <div class="section-head center">
                <span class="eyebrow">How it works</span>
                <h2>Simple for everyone</h2>
                <p>Whether you grow it or cook it, it only takes three steps.</p>
            </div>
            <div style="display:flex;justify-content:center">
                <div class="tabs" role="tablist">
                    <button class="tab active" role="tab" aria-selected="true" data-tab="buyer">🛒 For buyers</button>
                    <button class="tab" role="tab" aria-selected="false" data-tab="farmer">🧑‍🌾 For farmers</button>
                </div>
            </div>
            <div class="steps" id="steps"></div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="section-head">
                <span class="eyebrow">Why FarmConnect</span>
                <h2>A fairer way to buy and sell food</h2>
            </div>
            <div class="feature-grid">
                <div class="card feature"><div class="f-icon">🤝</div><h3>No middlemen</h3><p>Every rupee you pay goes to the farmer who grew it, not to agents and traders.</p></div>
                <div class="card feature"><div class="f-icon">🏷️</div><h3>Transparent prices</h3><p>Farmers set their price per kg. What you see is exactly what you pay.</p></div>
                <div class="card feature"><div class="f-icon">🛡️</div><h3>Verified growers</h3><p>Every farmer registers with PAN and Aadhaar, so you know who you are buying from.</p></div>
                <div class="card feature"><div class="f-icon">📞</div><h3>Talk directly</h3><p>Each order shows the farmer's phone number, so you can reach them yourself.</p></div>
            </div>
        </div>
    </section>

    <section class="container" style="padding-bottom:72px">
        <div class="cta-band">
            <div>
                <h2>${session.isFarmer ? 'Got a fresh harvest?' : 'Grow something? Sell it here.'}</h2>
                <p>${session.isFarmer ? 'List it in under a minute and start getting orders.' : 'Join the farmers already selling directly to buyers across India.'}</p>
            </div>
            <a class="btn btn-accent btn-lg" href="${session.isFarmer ? '#/my-crops' : loggedIn ? '#/market' : '#/register?role=FARMER'}">
                ${session.isFarmer ? 'List a crop' : loggedIn ? 'Browse produce' : 'Start selling, free'}
            </a>
        </div>
    </section>`;

    // How-it-works tabs
    const stepsEl = $('#steps', view);
    const showSteps = (who) => {
        stepsEl.innerHTML = STEPS[who].map(([t, d], i) =>
            `<div class="card step" style="animation:card-in .45s ${i * 70}ms both cubic-bezier(.2,.8,.2,1)"><h3>${t}</h3><p>${d}</p></div>`).join('');
    };
    view.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
        view.querySelectorAll('[data-tab]').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
        showSteps(tab.dataset.tab);
    }));
    showSteps('buyer');

    // Live data
    const fresh = $('#fresh', view);
    const stats = $('#stats', view);
    let crops = [];
    try {
        crops = await api.crops();
    } catch (e) {
        fresh.innerHTML = emptyState({ emoji: '🌧️', title: "Couldn't load produce", text: e.message });
        stats.querySelectorAll('.stat-value').forEach(v => { v.textContent = '—'; });
        return;
    }

    const inStock = crops.filter(c => c.quantity > 0);
    const farmers = new Set(inStock.map(c => c.farmerId).filter(Boolean)).size;
    const totalKg = inStock.reduce((s, c) => s + c.quantity, 0);
    const avg = inStock.length ? inStock.reduce((s, c) => s + c.price, 0) / inStock.length : 0;
    const values = [fmtNum(inStock.length), fmtNum(farmers), fmtNum(Math.round(totalKg)), money(avg)];
    stats.querySelectorAll('.stat-value').forEach((v, i) => { v.textContent = values[i]; });

    const latest = [...inStock].sort((a, b) => b.id - a.id).slice(0, 4);
    fresh.innerHTML = latest.length
        ? latest.map(cropCard).join('')
        : emptyState({ emoji: '🌱', title: 'No produce listed yet', text: 'Farmers are getting ready. Check back soon!' });
    fresh.addEventListener('click', (e) => {
        const card = e.target.closest('[data-crop]');
        if (card) openCropModal(crops.find(c => c.id === Number(card.dataset.crop)));
    });
}
