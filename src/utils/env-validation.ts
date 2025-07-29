/**
 * SECURITY: Environment Variable Validation Utility
 * Validates and sanitizes environment variables for security
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

/**
 * SECURITY: Validate environment variables with strict checks
 */
export function validateEnvironment(): EnvConfig {
  const env = import.meta.env;

  // SECURITY: Check for required variables
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
  const missing = requiredVars.filter(key => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `SECURITY ERROR: Missing required environment variables:\n${missing.map(v => `- ${v}`).join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'NEVER use SUPABASE_SERVICE_ROLE_KEY in frontend code!',
    );
  }

  const supabaseUrl = env['VITE_SUPABASE_URL'] as string;
  const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'] as string;

  // SECURITY: Validate Supabase URL format
  if (!isValidSupabaseUrl(supabaseUrl)) {
    throw new Error(
      'SECURITY ERROR: Invalid Supabase URL format.\n' +
      'Expected format: https://[project-id].supabase.co\n' +
      `Received: ${supabaseUrl.substring(0, 20)}...`,
    );
  }

  // SECURITY: Validate anon key format
  if (!isValidSupabaseAnonKey(supabaseAnonKey)) {
    throw new Error(
      'SECURITY ERROR: Invalid Supabase anon key format.\n' +
      'The anon key should be a JWT token starting with "eyJ"',
    );
  }

  // SECURITY: Check for accidentally exposed service role key
  if (supabaseAnonKey.includes('service_role') || supabaseAnonKey.length > 500) {
    throw new Error(
      'SECURITY CRITICAL: Service role key detected in frontend!\n' +
      'NEVER use SUPABASE_SERVICE_ROLE_KEY in frontend code.\n' +
      'Use VITE_SUPABASE_ANON_KEY instead.',
    );
  }

  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
  };
}

/**
 * SECURITY: Validate Supabase URL format
 */
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.hostname.length > 12 // Minimum length for project-id.supabase.co
    );
  } catch {
    return false;
  }
}

/**
 * SECURITY: Validate Supabase anon key format
 */
function isValidSupabaseAnonKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.startsWith('eyJ') && // JWT format
    key.length > 100 && // Minimum reasonable length
    key.length < 500 && // Maximum reasonable length (service keys are longer)
    key.split('.').length === 3 // JWT has 3 parts
  );
}

/**
 * SECURITY: Get validated environment config
 */
export const ENV_CONFIG = validateEnvironment();

/**
 * SECURITY: Development mode check
 */
export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

/**
 * SECURITY: Log environment status (safe for production)
 */
if (IS_DEVELOPMENT) {
  console.log('🔒 Environment validation passed');
  console.log('🌍 Mode:', import.meta.env.MODE);
  console.log('🔗 Supabase URL:', ENV_CONFIG.VITE_SUPABASE_URL);
  console.log('🔑 Anon key length:', ENV_CONFIG.VITE_SUPABASE_ANON_KEY.length);
}
