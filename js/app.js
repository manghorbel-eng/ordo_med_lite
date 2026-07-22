// Configuration Supabase
// Remplacer par vos clés Supabase issues de Project Settings > API
const SUPABASE_URL = 'https://dkxwbfklkyfhaqxcwaiy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreHdiZmtsa3lmaGFxeGN3YWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDg4MDcsImV4cCI6MjA5OTAyNDgwN30.9NlzzK8n2e60truJ8PQhiDmTWr-5wGEgiuRJydFnsOY';

// On attache le client à window pour le rendre global et éviter les redéclarations
if (!window.supabaseClient) {
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Erreur d'initialisation Supabase. Vérifiez les clés dans js/app.js", e);
    }
}

async function checkAuth() {
    if (!window.supabaseClient) return null;
    
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    // Si on n'est pas sur la page de login et qu'il n'y a pas de session, on redirige
    if (!session && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return session;
}
