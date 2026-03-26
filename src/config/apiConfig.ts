/**
 * API Configuration
 * 
 * Reads from environment variables to allow easy configuration
 * without modifying code. Safe to commit to git.
 * 
 * For local development:
 * - Create .env.local file with VITE_API_BASE_URL (optional, defaults to empty for proxy)
 * 
 * For Vercel/production:
 * - Option 1: Leave VITE_API_BASE_URL empty (or unset) to use Vercel rewrites (see vercel.json)
 * - Option 2: Set VITE_API_BASE_URL to your HTTPS API URL (e.g., https://api.yourdomain.com)
 */

/**
 * API Base URL
 * 
 * - Empty string (default): Uses relative paths
 *   - In dev: Works with Vite proxy (see vite.config.ts)
 *   - In production: Works with Vercel rewrites (see vercel.json)
 * - Full URL: Direct API calls (e.g., https://api.yourdomain.com)
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Google OAuth client ID (Google Identity Services). Set VITE_GOOGLE_CLIENT_ID in .env.local or hosting env.
 * See also: src/auth/GoogleSignInButton — hidden when empty.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

// Debug log (remove in production if needed)
if (typeof window !== 'undefined') {
  console.log('API_BASE_URL:', API_BASE_URL || '(empty - using relative paths)');
}

/**
 * Get the full API URL for an endpoint
 * 
 * @param endpoint - API endpoint path (e.g., '/api/game/init')
 * @returns Full URL or relative path depending on API_BASE_URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if present (we'll add it)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (API_BASE_URL) {
    // If API_BASE_URL is set, use it (production/Vercel)
    // Remove trailing slash from base URL if present
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const fullUrl = `${baseUrl}${cleanEndpoint}`;
    console.log('API Request URL:', fullUrl);
    return fullUrl;
  }
  
  // If no API_BASE_URL, use relative path (works with Vite proxy in dev)
  return cleanEndpoint;
};
