// Configuration Supabase
// Remplacer par vos clés Supabase
const SUPABASE_URL = 'https://dkxwbfklkyfhaqxcwaiy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreHdiZmtsa3lmaGFxeGN3YWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDg4MDcsImV4cCI6MjA5OTAyNDgwN30.9NlzzK8n2e60truJ8PQhiDmTWr-5wGEgiuRJydFnsOY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
    }
    return session;
}
