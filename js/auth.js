const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const formLogin = document.getElementById('login-form');
const formSignup = document.getElementById('signup-form');
const msgDiv = document.getElementById('auth-msg');

function showMsg(text, type = 'info') {
    msgDiv.className = `alert alert-${type} mt-3 mb-0`;
    msgDiv.textContent = text;
    msgDiv.style.display = 'block';
}
function hideMsg() {
    msgDiv.style.display = 'none';
}

tabLogin.addEventListener('click', () => {
    tabLogin.classList.replace('btn-outline-primary', 'btn-primary');
    tabSignup.classList.replace('btn-primary', 'btn-outline-primary');
    formLogin.style.display = 'block';
    formSignup.style.display = 'none';
    hideMsg();
});
tabSignup.addEventListener('click', () => {
    tabSignup.classList.replace('btn-outline-primary', 'btn-primary');
    tabLogin.classList.replace('btn-primary', 'btn-outline-primary');
    formSignup.style.display = 'block';
    formLogin.style.display = 'none';
    hideMsg();
});

function checkConfig() {
    if (!supabase) {
        showMsg("Erreur : impossible d'initialiser Supabase. Vérifiez que js/app.js est bien accessible (ouvrez la console du navigateur avec F12 pour voir l'erreur exacte).", 'danger');
        return false;
    }
    return true;
}

// --- Connexion ---
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkConfig()) return;
    hideMsg();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('login-btn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connexion...';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.innerHTML = original;

    if (error) {
        if (error.message.includes('Email not confirmed')) {
            showMsg("Votre email n'est pas encore confirmé. Vérifiez votre boîte mail (et vos spams) pour le lien de confirmation envoyé lors de l'inscription.", 'warning');
        } else if (error.message.includes('Invalid login credentials')) {
            showMsg("Email ou mot de passe incorrect. Si vous n'avez pas encore de compte, utilisez l'onglet \"Créer un compte\".", 'danger');
        } else {
            showMsg("Erreur de connexion : " + error.message, 'danger');
        }
        return;
    }

    window.location.href = 'dashboard.html';
});

// --- Création de compte ---
formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkConfig()) return;
    hideMsg();

    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const password2 = document.getElementById('signup-password2').value;

    if (password !== password2) {
        showMsg("Les mots de passe ne correspondent pas.", 'danger');
        return;
    }

    const btn = document.getElementById('signup-btn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Création...';

    // emailRedirectTo : où Supabase renvoie l'utilisateur après avoir cliqué
    // sur le lien de confirmation reçu par email. Doit correspondre à une
    // URL autorisée dans Supabase > Authentication > URL Configuration.
    const redirectBase = window.location.href.replace(/index\.html.*$/, '');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectBase + 'index.html' }
    });

    btn.disabled = false;
    btn.innerHTML = original;

    if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            showMsg("Un compte existe déjà avec cet email. Utilisez l'onglet \"Connexion\".", 'warning');
        } else if (error.message.toLowerCase().includes('rate limit')) {
            showMsg("Trop de tentatives d'inscription en peu de temps (limite Supabase). Réessayez dans quelques minutes.", 'warning');
        } else {
            showMsg("Erreur d'inscription : " + error.message, 'danger');
        }
        return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Cas Supabase : email déjà utilisé par un compte confirmé.
        showMsg("Un compte existe déjà avec cet email. Utilisez l'onglet \"Connexion\".", 'warning');
        return;
    }

    if (data.session) {
        // La confirmation par email est désactivée côté Supabase : le compte est actif immédiatement.
        window.location.href = 'dashboard.html';
        return;
    }

    showMsg("Compte créé ! Vérifiez votre boîte mail (et vos spams) pour confirmer votre inscription avant de pouvoir vous connecter.", 'success');
    formSignup.reset();
});

// --- Redirection si déjà connecté ---
if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) window.location.href = 'dashboard.html';
    });
}
