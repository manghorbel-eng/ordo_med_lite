import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration Supabase
const SUPABASE_URL = 'https://dkxwbfklkyfhaqxcwaiy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreHdiZmtsa3lmaGFxeGN3YWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDg4MDcsImV4cCI6MjA5OTAyNDgwN30.9NlzzK8n2e60truJ8PQhiDmTWr-5wGEgiuRJydFnsOY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Si on n'est pas sur la page de login et qu'il n'y a pas de session, on redirige
    if (!session && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return session;
}
