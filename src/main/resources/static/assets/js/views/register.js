import { api } from '../api.js';
import { session, homeFor } from '../session.js';
import { navigate } from '../router.js';
import { icon, toast, setLoading, clearErrors, fieldError, showApiError, field, $ } from '../ui.js';
import { authSide, stateSelect } from '../components.js';
import { bindReveal } from './login.js';

const RULES = {
    name: [v => v.trim().length >= 2, 'Enter your full name.'],
    email: [v => /^\S+@\S+\.\S+$/.test(v.trim()), 'Enter a valid email address.'],
    password: [v => v.length >= 6, 'Use at least 6 characters.'],
    phoneNumber: [v => /^[6-9]\d{9}$/.test(v), 'Enter a 10-digit mobile number.'],
    'address.addressLine': [v => v.trim().length > 0, 'Enter your street address or village.'],
    'address.district': [v => v.trim().length > 0, 'Enter your district.'],
    'address.state': [v => v.length > 0, 'Choose your state.'],
    'address.pinCode': [v => /^\d{6}$/.test(v), 'PIN code must be 6 digits.'],
    panNo: [v => /^[A-Z]{5}\d{4}[A-Z]$/.test(v), 'PAN looks like ABCDE1234F.'],
    aadhaarNo: [v => /^\d{12}$/.test(v), 'Aadhaar must be 12 digits.'],
};

export default function render(view, { query }) {
    const initialRole = query.role === 'FARMER' ? 'FARMER' : 'BUYER';

    view.innerHTML = `
    <div class="auth-wrap">
        ${authSide('Join the farm-to-table movement', 'One account, whether you grow food or buy it.',
            ['Free to join, no commission', 'Farmers set their own prices', 'Buyers get fresher produce for less'], '🌻')}
        <div class="auth-main">
            <div class="auth-card">
                <h1>Create your account</h1>
                <p class="sub">It only takes a minute.</p>
                <form id="reg-form" novalidate>
                    <div class="role-pick" role="radiogroup" aria-label="I want to">
                        <div class="role-opt">
                            <input type="radio" name="role" id="role-buyer" value="BUYER" ${initialRole === 'BUYER' ? 'checked' : ''}>
                            <label for="role-buyer"><span class="r-emoji">🛒</span><strong>I'm buying</strong><small>Order fresh produce from farmers</small></label>
                        </div>
                        <div class="role-opt">
                            <input type="radio" name="role" id="role-farmer" value="FARMER" ${initialRole === 'FARMER' ? 'checked' : ''}>
                            <label for="role-farmer"><span class="r-emoji">🧑‍🌾</span><strong>I'm farming</strong><small>Sell my harvest directly</small></label>
                        </div>
                    </div>

                    <div class="form-alert" role="alert"></div>

                    <div class="form-grid cols-2">
                        ${field({ name: 'name', label: 'Full name', placeholder: 'Ramesh Kumar', attrs: 'autocomplete="name" required', span: true })}
                        ${field({ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', attrs: 'autocomplete="email" required' })}
                        ${field({ name: 'phoneNumber', label: 'Mobile number', type: 'tel', placeholder: '9876543210', attrs: 'autocomplete="tel-national" inputmode="numeric" maxlength="10" required' })}
                        <div class="field span-2">
                            <label for="f-password">Password</label>
                            <div class="input-group">
                                <input class="input" id="f-password" name="password" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
                                <button type="button" class="input-addon" data-reveal aria-label="Show password">${icon.eye}</button>
                            </div>
                            <div class="error"></div>
                        </div>
                    </div>

                    <fieldset class="group mt-6">
                        <legend>📍 ${initialRole === 'FARMER' ? 'Farm address' : 'Delivery address'}</legend>
                        <div class="form-grid cols-2">
                            ${field({ name: 'address.addressLine', label: 'Address', placeholder: 'House / street / village', attrs: 'autocomplete="street-address"', span: true })}
                            ${field({ name: 'address.district', label: 'District', placeholder: 'Ludhiana', attrs: 'autocomplete="address-level2"' })}
                            ${stateSelect('address.state')}
                            ${field({ name: 'address.pinCode', label: 'PIN code', placeholder: '141001', attrs: 'inputmode="numeric" maxlength="6" autocomplete="postal-code"' })}
                        </div>
                    </fieldset>

                    <div class="collapse ${initialRole === 'FARMER' ? 'open' : ''}" id="farmer-fields">
                        <div>
                            <fieldset class="group mt-6">
                                <legend>🛡️ Verification</legend>
                                <p class="muted" style="font-size:.88rem;margin-top:-8px">Buyers trust verified farmers. These are never shown publicly.</p>
                                <div class="form-grid cols-2">
                                    ${field({ name: 'panNo', label: 'PAN number', placeholder: 'ABCDE1234F', attrs: 'maxlength="10" autocapitalize="characters" style="text-transform:uppercase"' })}
                                    ${field({ name: 'aadhaarNo', label: 'Aadhaar number', placeholder: '12-digit number', attrs: 'inputmode="numeric" maxlength="12"' })}
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-lg btn-block mt-6" type="submit">Create account</button>
                </form>
                <p class="switch-link">Already have an account? <a href="#/login">Log in</a></p>
            </div>
        </div>
    </div>`;

    const form = $('#reg-form', view);
    const farmerFields = $('#farmer-fields', view);
    const legend = form.querySelector('fieldset legend');
    bindReveal(form);

    const role = () => form.querySelector('[name="role"]:checked').value;
    form.querySelectorAll('[name="role"]').forEach(r => r.addEventListener('change', () => {
        const farmer = role() === 'FARMER';
        farmerFields.classList.toggle('open', farmer);
        legend.textContent = farmer ? '📍 Farm address' : '📍 Delivery address';
    }));

    // Keep numeric fields numeric and PAN uppercase as the user types
    const digitsOnly = (name) => form.querySelector(`[name="${name}"]`).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
    ['phoneNumber', 'address.pinCode', 'aadhaarNo'].forEach(digitsOnly);
    form.querySelector('[name="panNo"]').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });

    // Validate a field when the user leaves it
    form.addEventListener('focusout', (e) => {
        const name = e.target.name;
        if (!RULES[name] || !e.target.value) return;
        const f = e.target.closest('.field');
        f.classList.remove('invalid');
        f.querySelector('.error').textContent = '';
        if (!RULES[name][0](e.target.value)) fieldError(form, name, RULES[name][1]);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);
        const get = (n) => form.querySelector(`[name="${n}"]`).value;
        const isFarmer = role() === 'FARMER';

        let ok = true;
        for (const [name, [test, msg]] of Object.entries(RULES)) {
            if (!isFarmer && (name === 'panNo' || name === 'aadhaarNo')) continue;
            if (!test(get(name))) { ok = false; fieldError(form, name, msg); }
        }
        if (!ok) {
            form.querySelector('.field.invalid input, .field.invalid select')?.focus();
            return;
        }

        const payload = {
            name: get('name').trim(),
            email: get('email').trim().toLowerCase(),
            password: get('password'),
            role: role(),
            phoneNumber: get('phoneNumber'),
            address: {
                addressLine: get('address.addressLine').trim(),
                district: get('address.district').trim(),
                state: get('address.state'),
                pinCode: get('address.pinCode'),
            },
            ...(isFarmer ? { panNo: get('panNo'), aadhaarNo: get('aadhaarNo') } : {}),
        };

        const btn = form.querySelector('[type="submit"]');
        setLoading(btn, true);
        try {
            await api.register(payload);
            const user = await api.login(payload.email, payload.password);
            session.set(user);
            toast(`Welcome to FarmConnect, ${payload.name.split(' ')[0]}!`);
            navigate(homeFor(user.role), { replace: true });
        } catch (err) {
            setLoading(btn, false);
            showApiError(form, err);
        }
    });
}
