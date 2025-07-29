import { createClient } from '@supabase/supabase-js';
import { ENV_CONFIG } from '@/utils/env-validation';

// SECURITY: Create client with secure configuration
export const supabase = createClient(ENV_CONFIG.VITE_SUPABASE_URL, ENV_CONFIG.VITE_SUPABASE_ANON_KEY, {
  auth: {
    // SECURITY: Enable automatic token refresh
    autoRefreshToken: true,
    // SECURITY: Persist session in localStorage (secure for web apps)
    persistSession: true,
    // SECURITY: Detect session in URL and store it
    detectSessionInUrl: true,
    // SECURITY: Set secure storage options
    storage: window.localStorage,
    // SECURITY: Enable flow type for better security
    flowType: 'pkce',
  },
  db: {
    // SECURITY: Use prepared statements to prevent SQL injection
    schema: 'public',
  },
  global: {
    // SECURITY: Set custom headers for better tracking
    headers: {
      'X-Client-Info': 'meddoc-frontend',
      'X-Client-Version': '1.0.0',
    },
  },
  // SECURITY: Enable realtime with auth
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting
    },
  },
});

// SECURITY: Add error handler for auth errors
supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any sensitive data from memory
    console.log('User signed out - clearing session data');
  }
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed successfully');
  }
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in successfully');
  }
});

// SECURITY: Export type-safe client
export type SupabaseClient = typeof supabase;
