import { api } from '../api.js';
import { session } from '../session.js';
import { esc, icon, debounce, skeletonCards, emptyState, errorState, fmtNum, $ } from '../ui.js';
import { cropCard, openCropModal } from '../components.js';

const PAGE = 12;

const SORTS = {
    newest: (a, b) => b.id - a.id,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    stock: (a, b) => b.quantity - a.quantity,
};

export default async function render(view, { query }) {
    const state = { all: [], q: query.q || '', min: '', max: '', sort: 'newest', inStock: true, shown: PAGE };

    view.innerHTML = `
    <section class="page"><div class="container">
        <div class="page-head">
            <div>
                <span class="eyebrow">Marketplace</span>
                <h1>Fresh produce, direct from farmers</h1>
                <p>${session.isBuyer ? 'Tap any crop to see details and order.' : session.user ? 'Browse what other farmers are selling.' : 'Browse freely. Log in as a buyer to order.'}</p>
            </div>
        </div>

        <div class="card market-toolbar" id="toolbar">
            <div class="row">
                <label class="input-icon">
                    <span class="sr-only">Search crops</span>
                    ${icon.search}
                    <input class="input" id="q" type="search" placeholder="Search tomatoes, rice, mangoes..." value="${esc(state.q)}" autocomplete="off">
                </label>
                <button class="btn filter-toggle" id="filter-toggle" type="button" aria-expanded="false" aria-controls="filters">${icon.filter}<span class="hide-sm">Filters</span></button>
            </div>
            <div class="filters" id="filters">
                <div class="field"><label for="min">Min ₹/kg</label><input class="input" id="min" type="number" min="0" inputmode="decimal" placeholder="Min ₹"></div>
                <div class="field"><label for="max">Max ₹/kg</label><input class="input" id="max" type="number" min="0" inputmode="decimal" placeholder="Max ₹"></div>
                <div class="field"><label for="sort">Sort by</label>
                    <select class="select" id="sort">
                        <option value="newest">Newest first</option>
                        <option value="price-asc">Price: low to high</option>
                        <option value="price-desc">Price: high to low</option>
                        <option value="name">Name: A to Z</option>
                        <option value="stock">Most stock</option>
                    </select>
                </div>
                <label class="switch"><input type="checkbox" id="instock" checked><span class="track"></span>In stock only</label>
            </div>
        </div>

        <div class="results-meta"><span id="count" aria-live="polite">Loading produce...</span>
            <button class="btn btn-ghost btn-sm" id="reset" hidden>Clear filters</button></div>
        <div class="crop-grid" id="grid">${skeletonCards(8)}</div>
        <div class="load-more" id="more"></div>
    </div></section>`;

    const grid = $('#grid', view);
    const count = $('#count', view);
    const more = $('#more', view);
    const toolbar = $('#toolbar', view);
    const resetBtn = $('#reset', view);

    function filtered() {
        const q = state.q.trim().toLowerCase();
        const min = state.min === '' ? -Infinity : Number(state.min);
        const max = state.max === '' ? Infinity : Number(state.max);
        return state.all
            .filter(c => !state.inStock || c.quantity > 0)
            .filter(c => !q || [c.name, c.description, c.farmerName, c.farmerDistrict, c.farmerState]
                .some(v => v && v.toLowerCase().includes(q)))
            .filter(c => c.price >= min && c.price <= max)
            .sort(SORTS[state.sort]);
    }

    function draw({ append = false } = {}) {
        const list = filtered();
        const visible = list.slice(0, state.shown);
        const isFiltered = state.q || state.min !== '' || state.max !== '' || !state.inStock || state.sort !== 'newest';
        resetBtn.hidden = !isFiltered;
        $('#filter-toggle', view).innerHTML = `${icon.filter}<span class="hide-sm">Filters</span>${(state.min !== '' || state.max !== '' || !state.inStock) ? '<span class="dot"></span>' : ''}`;

        count.textContent = list.length
            ? `Showing ${fmtNum(visible.length)} of ${fmtNum(list.length)} ${list.length === 1 ? 'crop' : 'crops'}`
            : 'No matches';

        if (!list.length) {
            grid.innerHTML = state.all.length
                ? emptyState({ emoji: '🔍', title: 'Nothing matches that', text: 'Try a different search or widen your price range.', action: '<button class="btn btn-primary" data-reset>Clear filters</button>' })
                : emptyState({ emoji: '🌱', title: 'The marketplace is empty', text: 'No farmer has listed produce yet. Check back soon!' });
            grid.style.display = 'block';
        } else {
            grid.style.display = '';
            if (append) {
                const start = grid.children.length;
                grid.insertAdjacentHTML('beforeend', visible.slice(start).map((c, i) => cropCard(c, i)).join(''));
            } else {
                grid.innerHTML = visible.map(cropCard).join('');
            }
        }
        more.innerHTML = list.length > visible.length
            ? `<button class="btn btn-soft btn-lg" id="load-more">Show more (${fmtNum(list.length - visible.length)} left)</button>` : '';
    }

    function refilter() { state.shown = PAGE; draw(); }

    async function load() {
        grid.style.display = '';
        grid.innerHTML = skeletonCards(8);
        try {
            state.all = await api.crops();
            draw();
        } catch (e) {
            count.textContent = '';
            grid.style.display = 'block';
            grid.innerHTML = errorState(e);
        }
    }

    // Events
    $('#q', view).addEventListener('input', debounce((e) => { state.q = e.target.value; refilter(); }, 180));
    $('#min', view).addEventListener('input', debounce((e) => { state.min = e.target.value; refilter(); }, 250));
    $('#max', view).addEventListener('input', debounce((e) => { state.max = e.target.value; refilter(); }, 250));
    $('#sort', view).addEventListener('change', (e) => { state.sort = e.target.value; refilter(); });
    $('#instock', view).addEventListener('change', (e) => { state.inStock = e.target.checked; refilter(); });
    $('#filter-toggle', view).addEventListener('click', (e) => {
        const open = toolbar.classList.toggle('show-filters');
        e.currentTarget.setAttribute('aria-expanded', String(open));
    });

    function reset() {
        Object.assign(state, { q: '', min: '', max: '', sort: 'newest', inStock: true });
        $('#q', view).value = ''; $('#min', view).value = ''; $('#max', view).value = '';
        $('#sort', view).value = 'newest'; $('#instock', view).checked = true;
        refilter();
    }
    resetBtn.addEventListener('click', reset);

    // Listen on this page's own root, not on #view: #view outlives the page,
    // so listeners on it would pile up with every visit to the marketplace
    view.firstElementChild.addEventListener('click', (e) => {
        if (e.target.closest('[data-reset]')) return reset();
        if (e.target.closest('[data-retry]')) return load();
        if (e.target.closest('#load-more')) { state.shown += PAGE; return draw({ append: true }); }
        const card = e.target.closest('[data-crop]');
        if (card) {
            const crop = state.all.find(c => c.id === Number(card.dataset.crop));
            openCropModal(crop, { onOrdered: load });
        }
    });

    await load();
}
