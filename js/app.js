// Configuration Supabase
// Remplacer par vos clés Supabase issues de Project Settings > API
const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'VOTRE_SUPABASE_ANON_KEY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Si on n'est pas sur la page de login et qu'il n'y a pas de session, on redirige
    if (!session && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return session;
}
