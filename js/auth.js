import { supabase } from './app.js';

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');

        errorDiv.style.display = 'none';
        const btn = document.getElementById('login-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
        btn.disabled = true;

        try {
            // 1. Tenter de se connecter
            let { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                // Si erreur de login (ex: compte inexistant), on tente l'inscription automatiquement
                if (error.message.includes('Invalid login credentials')) {
                     const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
                         email, 
                         password 
                     });

                     if (signUpError) {
                         errorDiv.className = "alert alert-danger mt-3 mb-0";
                         errorDiv.textContent = "Erreur d'inscription : " + signUpError.message;
                         errorDiv.style.display = 'block';
                     } else if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
                         errorDiv.className = "alert alert-danger mt-3 mb-0";
                         errorDiv.textContent = "Ce compte existe déjà. Vérifiez vos identifiants.";
                         errorDiv.style.display = 'block';
                     } else if (signUpData.session) {
                          // Connecté directement après inscription
                          window.location.href = 'dashboard.html';
                          return; // empêcher de remettre le bouton actif
                     } else {
                          errorDiv.className = "alert alert-success mt-3 mb-0";
                          errorDiv.textContent = "Compte créé ! Veuillez vérifier votre boîte mail pour confirmer votre inscription.";
                          errorDiv.style.display = 'block';
                     }
                } else {
                    errorDiv.className = "alert alert-danger mt-3 mb-0";
                    errorDiv.textContent = "Erreur de connexion : " + error.message;
                    errorDiv.style.display = 'block';
                }
            } else {
                // Connexion réussie
                window.location.href = 'dashboard.html';
                return; // empêcher de remettre le bouton actif
            }
        } catch (err) {
            errorDiv.className = "alert alert-danger mt-3 mb-0";
            errorDiv.textContent = "Une erreur inattendue est survenue.";
            errorDiv.style.display = 'block';
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Redirection si déjà connecté
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
});
