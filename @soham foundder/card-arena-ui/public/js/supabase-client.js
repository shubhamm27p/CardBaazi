// Initialize Supabase Client for Vanilla JS
const SUPABASE_URL = 'https://ygomwqpiyyynkqyxwtza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DRvsVVr5ZSvCOR4FYKQR3w_-PWc9VXT';

// Ensure the Supabase JS SDK is loaded
if (typeof supabase === 'undefined') {
    console.error('Supabase library is not loaded. Please include the CDN script.');
} else {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully!');
    
    // Example test function to verify connection
    window.testSupabaseConnection = async () => {
        try {
            // A simple query to test if the connection works (even if it hits RLS)
            const { data, error } = await supabaseClient.from('test_table_check').select('*').limit(1);
            if (error && error.code !== '42P01') {
                console.log('Supabase connection works, but returned an error:', error.message);
            } else {
                console.log('Supabase is connected and ready to query!');
            }
        } catch (err) {
            console.error('Supabase connection test failed:', err);
        }
    };
    
    // Run the connection test on load
    testSupabaseConnection();
}
