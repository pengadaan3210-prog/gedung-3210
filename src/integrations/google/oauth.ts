const GOOGLE_CLIENT_ID = '521333077807-v2mk1dc8dqn9k4t177qq7gn300n82vk7.apps.googleusercontent.com';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token_type: string;
}

let googleLibLoaded = false;

/**
 * Load Google OAuth library if not already loaded
 */
async function ensureGoogleLibLoaded(): Promise<void> {
  if (googleLibLoaded || window.google) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleLibLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Auth library'));
    script.onabort = () => reject(new Error('Google Auth library load aborted'));
    document.head.appendChild(script);
  });
}

/**
 * Request access token from Google OAuth (loads library on-demand)
 */
export async function requestGoogleAccessToken(): Promise<GoogleAuthToken> {
  try {
    await ensureGoogleLibLoaded();
  } catch (err) {
    console.error("❌ Failed to load Google library:", err);
    throw err;
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google OAuth library not properly initialized');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Google OAuth request timeout'));
    }, 30000);

    window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES.join(' '),
      callback: (response: any) => {
        clearTimeout(timeout);

        if (response.error) {
          reject(new Error(`Google OAuth error: ${response.error} - ${response.error_description || ''}`));
          return;
        }

        if (!response.access_token) {
          reject(new Error('No access token received from Google'));
          return;
        }

        resolve({
          access_token: response.access_token,
          refresh_token: response.refresh_token, // Only on first auth
          expires_at: Date.now() + ((response.expires_in || 3600) * 1000),
          token_type: response.token_type || 'Bearer',
        });
      },
      error_callback: (error: any) => {
        clearTimeout(timeout);
        reject(new Error(`Google OAuth error: ${JSON.stringify(error)}`));
      },
    }).requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Refresh access token using refresh token (via backend)
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleAuthToken> {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // Call backend Edge Function to refresh token safely
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/refresh-google-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: refreshToken, // Keep existing refresh token
      expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
      token_type: data.token_type || 'Bearer',
    };
  } catch (err) {
    console.error('❌ Refresh token error:', err);
    throw err;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: GoogleAuthToken): boolean {
  return Date.now() >= token.expires_at - 300000; // 5 min buffer
}

/**
 * Store token in localStorage
 */
/**
 * Store token - use multiple storage strategies for better mobile support
 */
export function storeGoogleToken(token: GoogleAuthToken): void {
  const tokenStr = JSON.stringify(token);
  try {
    localStorage.setItem('google_auth_token', tokenStr);
  } catch (e) {
    console.warn('⚠️ localStorage failed, trying sessionStorage:', e);
  }
  try {
    sessionStorage.setItem('google_auth_token', tokenStr);
  } catch (e) {
    console.warn('⚠️ sessionStorage also failed:', e);
  }
}

/**
 * Get stored token - check multiple storage strategies
 */
export function getStoredGoogleToken(): GoogleAuthToken | null {
  let stored: string | null = null;
  
  // Try localStorage first
  try {
    stored = localStorage.getItem('google_auth_token');
  } catch (e) {
    console.warn('⚠️ Failed to read from localStorage');
  }
  
  // Fallback to sessionStorage if localStorage empty/failed
  if (!stored) {
    try {
      stored = sessionStorage.getItem('google_auth_token');
      if (stored) console.log('📦 Token loaded from sessionStorage');
    } catch (e) {
      console.warn('⚠️ Failed to read from sessionStorage');
    }
  } else {
    console.log('📦 Token loaded from localStorage');
  }
  
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored token from all storage
 */
export function clearGoogleToken(): void {
  try {
    localStorage.removeItem('google_auth_token');
  } catch (e) {
    console.warn('⚠️ Failed to clear localStorage');
  }
  try {
    sessionStorage.removeItem('google_auth_token');
  } catch (e) {
    console.warn('⚠️ Failed to clear sessionStorage');
  }
}

/**
 * Get valid access token (auto-refresh if needed)
 */
export async function getValidGoogleToken(): Promise<GoogleAuthToken> {
  let token = getStoredGoogleToken();

  // No token at all - need user to authorize
  if (!token) {
    token = await requestGoogleAccessToken();
    storeGoogleToken(token);
    return token;
  }

  // Token expired - try to refresh
  if (isTokenExpired(token)) {
    console.log('🔄 Access token expired, refreshing...');
    
    if (!token.refresh_token) {
      console.log('❌ No refresh token, need to authorize again');
      token = await requestGoogleAccessToken();
      storeGoogleToken(token);
      return token;
    }

    try {
      token = await refreshAccessToken(token.refresh_token);
      storeGoogleToken(token);
      console.log('✅ Token refreshed');
      return token;
    } catch (err) {
      console.error('Refresh failed, requesting new auth:', err);
      token = await requestGoogleAccessToken();
      storeGoogleToken(token);
      return token;
    }
  }

  // Token still valid
  return token;
}
