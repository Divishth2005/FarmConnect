import { api } from '../api.js';
import { session } from '../session.js';
import { esc, money, kg, cropEmoji, cropTint, emptyState, errorState, skeletonCards, toast, confirmDialog, setLoading, $ } from '../ui.js';
import { openCropForm } from '../components.js';

export default async function render(view) {
    let mine = [];

    view.innerHTML = `
    <section class="page"><div class="container">
        <div class="page-head">
            <div><span class="eyebrow">Your farm</span><h1>My crops</h1><p>Add, update and remove what you're selling.</p></div>
            <button class="btn btn-primary" id="add">+ List a new crop</button>
        </div>
        <div class="crop-grid" id="grid">${skeletonCards(4)}</div>
    </div></section>`;

    const grid = $('#grid', view);

    function draw() {
        if (!mine.length) {
            grid.style.display = 'block';
            grid.innerHTML = emptyState({ emoji: '🌱', title: "You haven't listed anything yet", text: 'List your first crop and buyers can start ordering right away.', action: '<button class="btn btn-primary" data-add>List your first crop</button>' });
            return;
        }
        grid.style.display = '';
        const maxQty = Math.max(...mine.map(c => c.quantity), 1);
        grid.innerHTML = mine.map((c, i) => `
            <article class="card my-crop-card" style="animation-delay:${Math.min(i, 11) * 35}ms">
                <div class="crop-art" style="--art-bg:${cropTint(c.name)}"><span class="emoji">${cropEmoji(c.name)}</span>
                    ${c.quantity > 0 ? '<span class="badge badge-green">Live</span>' : '<span class="badge">Sold out</span>'}</div>
                <div class="crop-body">
                    <h3>${esc(c.name)}</h3>
                    <div class="crop-foot" style="padding-top:0">
                        <div class="price">${money(c.price)}<small> /kg</small></div>
                        <div class="stock">${kg(c.quantity)} left</div>
                    </div>
                    <div class="stock-bar" aria-hidden="true"><span style="width:${(c.quantity / maxQty) * 100}%"></span></div>
                    ${c.description ? `<p class="muted" style="font-size:.85rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(c.description)}</p>` : ''}
                    <div class="actions">
                        <button class="btn btn-soft btn-sm" data-edit="${c.id}">Edit</button>
                        <button class="btn btn-danger-soft btn-sm" data-delete="${c.id}">Delete</button>
                    </div>
                </div>
            </article>`).join('');
    }

    async function load() {
        try {
            const crops = await api.crops();
            mine = crops.filter(c => c.farmerId === session.user.id).sort((a, b) => b.id - a.id);
            draw();
        } catch (e) {
            grid.style.display = 'block';
            grid.innerHTML = errorState(e);
        }
    }

    $('#add', view).addEventListener('click', () => openCropForm({ onSaved: load }));

    grid.addEventListener('click', async (e) => {
        if (e.target.closest('[data-add]')) return openCropForm({ onSaved: load });
        if (e.target.closest('[data-retry]')) return load();

        const edit = e.target.closest('[data-edit]');
        if (edit) return openCropForm({ crop: mine.find(c => c.id === Number(edit.dataset.edit)), onSaved: load });

        const del = e.target.closest('[data-delete]');
        if (del) {
            const crop = mine.find(c => c.id === Number(del.dataset.delete));
            const yes = await confirmDialog({ title: `Delete ${crop.name}?`, message: 'It will be removed from the marketplace for good.', confirmText: 'Delete', danger: true });
            if (!yes) return;
            setLoading(del, true);
            try {
                await api.deleteCrop(crop.id);
                toast(`${crop.name} removed`);
                const card = del.closest('.my-crop-card');
                card.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.95)' }], { duration: 220, easing: 'ease-in' }).onfinish = load;
            } catch (err) {
                setLoading(del, false);
                toast(err.status === 409
                    ? `${crop.name} has orders, so it can't be deleted. Edit it and set stock to 0 to stop selling.`
                    : err.message, 'error', 6000);
            }
        }
    });

    await load();
}
