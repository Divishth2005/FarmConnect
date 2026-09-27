import { api } from '../api.js';
import { session, homeFor } from '../session.js';
import { navigate } from '../router.js';
import { icon, toast, setLoading, clearErrors, fieldError, showApiError, $ } from '../ui.js';
import { authSide } from '../components.js';

export default function render(view, { query }) {
    view.innerHTML = `
    <div class="auth-wrap">
        ${authSide('Welcome back to the farm', 'Log in to order fresh produce or manage your harvest.',
            ['Buy straight from verified farmers', 'Track every order from placed to delivered', 'Farmers keep what they earn'])}
        <div class="auth-main">
            <div class="auth-card">
                <h1>Log in</h1>
                <p class="sub">Good to see you again.</p>
                <form id="login-form" class="form-grid" novalidate>
                    <div class="form-alert" role="alert"></div>
                    <div class="field">
                        <label for="f-email">Email</label>
                        <input class="input" id="f-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required autofocus>
                        <div class="error"></div>
                    </div>
                    <div class="field">
                        <label for="f-password">Password</label>
                        <div class="input-group">
                            <input class="input" id="f-password" name="password" type="password" autocomplete="current-password" placeholder="Your password" required>
                            <button type="button" class="input-addon" data-reveal aria-label="Show password">${icon.eye}</button>
                        </div>
                        <div class="error"></div>
                    </div>
                    <button class="btn btn-primary btn-lg btn-block mt-2" type="submit">Log in</button>
                </form>
                <p class="switch-link">New to FarmConnect? <a href="#/register">Create an account</a></p>
            </div>
        </div>
    </div>`;

    const form = $('#login-form', view);
    bindReveal(form);
    setTimeout(() => $('#f-email', view)?.focus(), 50);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);
        const email = form.email.value.trim();
        const password = form.password.value;
        let ok = true;
        if (!/^\S+@\S+\.\S+$/.test(email)) { ok = false; fieldError(form, 'email', 'Enter a valid email address.'); }
        if (!password) { ok = false; fieldError(form, 'password', 'Enter your password.'); }
        if (!ok) return form.querySelector('.field.invalid input').focus();

        const btn = form.querySelector('[type="submit"]');
        setLoading(btn, true);
        try {
            const user = await api.login(email, password);
            session.set(user);
            toast(`Welcome back, ${user.name?.split(' ')[0] || 'friend'}!`);
            const next = query.next && query.next.startsWith('#/') && !query.next.startsWith('#/login') ? query.next : homeFor(user.role);
            navigate(next, { replace: true });
        } catch (err) {
            setLoading(btn, false);
            showApiError(form, err);
        }
    });
}

export function bindReveal(root) {
    root.querySelectorAll('[data-reveal]').forEach(btn => btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? icon.eyeOff : icon.eye;
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }));
}
