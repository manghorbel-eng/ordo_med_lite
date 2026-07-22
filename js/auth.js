document.getElementById('login-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('auth-error');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } else {
        window.location.href = 'dashboard.html';
    }
});

document.getElementById('signup-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('auth-error');

    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } else {
        alert('Compte créé ! Vérifiez votre email ou connectez-vous.');
    }
});

// Redirection si déjà connecté
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = 'dashboard.html';
    }
});
