import { supabase } from './app.js';

// --- Bascule entre les onglets Connexion / Créer un compte ---
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMsg = document.getElementById('auth-msg');

function showMessage(text, type = 'danger') {
    if (!authMsg) return;
    authMsg.className = `alert alert-${type} mt-3 mb-0`;
    authMsg.textContent = text;
    authMsg.style.display = 'block';
}

function hideMessage() {
    if (!authMsg) return;
    authMsg.style.display = 'none';
}

if (tabLogin && tabSignup && loginForm && signupForm) {
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('btn-primary');
        tabLogin.classList.remove('btn-outline-primary');
        tabSignup.classList.add('btn-outline-primary');
        tabSignup.classList.remove('btn-primary');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        hideMessage();
    });

    tabSignup.addEventListener('click', () => {
        tabSignup.classList.add('btn-primary');
        tabSignup.classList.remove('btn-outline-primary');
        tabLogin.classList.add('btn-outline-primary');
        tabLogin.classList.remove('btn-primary');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        hideMessage();
    });
}

// --- Connexion ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connexion...';
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showMessage("Erreur de connexion : " + error.message);
            } else if (data.session) {
                window.location.href = 'dashboard.html';
                return; // ne pas réactiver le bouton
            }
        } catch (err) {
            showMessage("Une erreur inattendue est survenue.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// --- Création de compte ---
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const password2 = document.getElementById('signup-password2').value;
        const btn = document.getElementById('signup-btn');

        if (password !== password2) {
            showMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Création...';
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                showMessage("Erreur d'inscription : " + error.message);
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                showMessage("Ce compte existe déjà. Essayez de vous connecter.");
            } else if (data.session) {
                window.location.href = 'dashboard.html';
                return; // ne pas réactiver le bouton
            } else {
                showMessage("Compte créé ! Vérifiez votre boîte mail pour confirmer votre inscription.", 'success');
            }
        } catch (err) {
            showMessage("Une erreur inattendue est survenue.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// --- Redirection si déjà connecté ---
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
});
