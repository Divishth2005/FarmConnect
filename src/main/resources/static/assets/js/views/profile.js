import { api } from '../api.js';
import { session } from '../session.js';
import { navigate } from '../router.js';
import { esc, initials, toast, confirmDialog, setLoading, clearErrors, fieldError, showApiError, field, errorState, $ } from '../ui.js';
import { stateSelect, location } from '../components.js';

export default async function render(view) {
    const farmer = session.isFarmer;
    const id = session.user.id;

    view.innerHTML = `<section class="page"><div class="container">
        <div class="page-head"><div><span class="eyebrow">Account</span><h1>Your profile</h1><p>Keep your contact details up to date so ${farmer ? 'buyers' : 'farmers'} can reach you.</p></div></div>
        <div id="body"><div class="profile-grid">
            <div class="card"><div class="profile-card"><div class="skeleton" style="width:64px;height:64px;border-radius:50%"></div>
                <div class="skeleton sk-line mt-4" style="width:60%;height:18px"></div></div></div>
            <div class="card card-pad"><div class="skeleton sk-line" style="height:46px"></div><div class="skeleton sk-line mt-4" style="height:46px"></div><div class="skeleton sk-line mt-4" style="height:46px"></div></div>
        </div></div>
    </div></section>`;

    const body = $('#body', view);

    let profile;
    try {
        profile = farmer ? await api.farmer(id) : await api.buyer(id);
    } catch (e) {
        body.innerHTML = errorState(e);
        body.querySelector('[data-retry]').onclick = () => render(view);
        return;
    }
    const a = profile.address || {};

    body.innerHTML = `
    <div class="profile-grid">
        <div class="card"><div class="profile-card">
            <span class="avatar lg">${esc(initials(profile.name))}</span>
            <h2 id="p-name">${esc(profile.name)}</h2>
            <span class="badge badge-green">${farmer ? '🧑‍🌾 Farmer' : '🛒 Buyer'}</span>
            ${profile.email ? `<div class="muted">${esc(profile.email)}</div>` : ''}
            <div class="profile-facts">
                <div><span>Mobile</span><span id="p-phone">${esc(profile.phoneNumber)}</span></div>
                <div><span>Location</span><span id="p-loc">${esc(location(a.district, a.state) || '—')}</span></div>
                ${farmer ? '<div><span>Verification</span><span>PAN &amp; Aadhaar ✓</span></div>' : ''}
            </div>
        </div></div>

        <div>
            <form class="card card-pad" id="profile-form" novalidate>
                <h2 style="font-size:1.15rem;margin-bottom:18px">Edit details</h2>
                <div class="form-alert" role="alert"></div>
                <div class="form-grid cols-2">
                    ${field({ name: 'name', label: 'Full name', value: profile.name, attrs: 'autocomplete="name"' })}
                    ${field({ name: 'phoneNumber', label: 'Mobile number', type: 'tel', value: profile.phoneNumber, attrs: 'inputmode="numeric" maxlength="10" autocomplete="tel-national"' })}
                    ${field({ name: 'address.addressLine', label: 'Address', value: a.addressLine, span: true, attrs: 'autocomplete="street-address"' })}
                    ${field({ name: 'address.district', label: 'District', value: a.district })}
                    ${stateSelect('address.state', a.state)}
                    ${field({ name: 'address.pinCode', label: 'PIN code', value: a.pinCode, attrs: 'inputmode="numeric" maxlength="6"' })}
                </div>
                <div class="row-gap mt-6" style="justify-content:flex-end">
                    <button class="btn" type="reset">Discard changes</button>
                    <button class="btn btn-primary" type="submit">Save changes</button>
                </div>
            </form>

            <div class="danger-zone">
                <div><h3>Delete account</h3><p>${farmer ? 'Remove your crop listings first. ' : ''}This permanently deletes your profile and login.</p></div>
                <button class="btn btn-danger-soft" id="delete">Delete account</button>
            </div>
        </div>
    </div>`;

    const form = $('#profile-form', view);
    const original = {
        name: profile.name || '', phoneNumber: profile.phoneNumber || '',
        'address.addressLine': a.addressLine || '', 'address.district': a.district || '',
        'address.state': a.state || '', 'address.pinCode': a.pinCode || '',
    };
    const get = (n) => form.querySelector(`[name="${n}"]`).value.trim();
    ['phoneNumber', 'address.pinCode'].forEach(n => form.querySelector(`[name="${n}"]`)
        .addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
    form.addEventListener('reset', () => setTimeout(() => clearErrors(form)));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);
        const changed = Object.keys(original).filter(k => get(k) !== original[k]);
        if (!changed.length) return toast('Nothing to save. Your details are up to date.', 'info');

        let ok = true;
        const fail = (n, m) => { ok = false; fieldError(form, n, m); };
        if (get('name').length < 2) fail('name', 'Enter your full name.');
        if (!/^[6-9]\d{9}$/.test(get('phoneNumber'))) fail('phoneNumber', 'Enter a 10-digit mobile number.');
        if (!/^\d{6}$/.test(get('address.pinCode'))) fail('address.pinCode', 'PIN code must be 6 digits.');
        for (const n of ['address.addressLine', 'address.district', 'address.state']) if (!get(n)) fail(n, 'This field is required.');
        if (!ok) return form.querySelector('.field.invalid input, .field.invalid select')?.focus();

        // PATCH only what changed
        const patch = {};
        for (const k of changed) {
            if (k.startsWith('address.')) (patch.address ??= {})[k.slice(8)] = get(k);
            else patch[k] = get(k);
        }

        const btn = form.querySelector('[type="submit"]');
        setLoading(btn, true);
        try {
            const updated = farmer ? await api.updateFarmer(id, patch) : await api.updateBuyer(id, patch);
            Object.keys(original).forEach(k => { original[k] = get(k); });
            // "Discard changes" should now reset to the saved values
            form.querySelectorAll('input').forEach(i => { i.defaultValue = i.value; });
            form.querySelectorAll('option').forEach(o => { o.defaultSelected = o.selected; });
            session.update({ name: updated.name });
            $('#p-name', view).textContent = updated.name;
            $('#p-phone', view).textContent = updated.phoneNumber;
            $('#p-loc', view).textContent = location(updated.address?.district, updated.address?.state) || '—';
            view.querySelector('.profile-card .avatar').textContent = initials(updated.name);
            toast('Profile saved');
        } catch (err) {
            showApiError(form, err);
        } finally {
            setLoading(btn, false);
        }
    });

    $('#delete', view).addEventListener('click', async (e) => {
        const yes = await confirmDialog({
            title: 'Delete your account?',
            message: 'Your profile and login will be permanently removed. This cannot be undone.',
            confirmText: 'Delete my account', danger: true,
        });
        if (!yes) return;
        const btn = e.target.closest('button');
        setLoading(btn, true);
        try {
            if (farmer) await api.deleteFarmer(id); else await api.deleteBuyer(id);
            session.clear();
            toast('Your account has been deleted', 'info');
            navigate('#/', { replace: true });
        } catch (err) {
            setLoading(btn, false);
            toast(err.status === 409
                ? (farmer ? 'You still have crop listings or orders linked to your account, so it cannot be deleted yet.'
                          : 'You have orders linked to your account, so it cannot be deleted yet.')
                : err.message, 'error', 6000);
        }
    });
}
