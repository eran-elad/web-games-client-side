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
 * - Set VITE_API_BASE_URL in Vercel environment variables
 * - Example: https://api.yourdomain.com
 */

/**
 * API Base URL
 * 
 * - Empty string (default): Uses relative paths, works with Vite proxy in dev
 * - Full URL: Direct API calls (e.g., https://api.yourdomain.com)
 * 
 * In Vercel, set this to your backend API URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
    return `${baseUrl}${cleanEndpoint}`;
  }
  
  // If no API_BASE_URL, use relative path (works with Vite proxy in dev)
  return cleanEndpoint;
};
