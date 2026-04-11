const GOOGLE_CLIENT_ID = '521333077807-v2mk1dc8dqn9k4t177qq7gn300n82vk7.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
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
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleAuthToken> {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
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
export function storeGoogleToken(token: GoogleAuthToken): void {
  localStorage.setItem('google_auth_token', JSON.stringify(token));
}

/**
 * Get stored token
 */
export function getStoredGoogleToken(): GoogleAuthToken | null {
  const stored = localStorage.getItem('google_auth_token');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored token
 */
export function clearGoogleToken(): void {
  localStorage.removeItem('google_auth_token');
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
