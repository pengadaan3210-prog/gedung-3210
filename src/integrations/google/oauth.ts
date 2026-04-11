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
  expires_at: number;
  token_type: string;
}

/**
 * Initialize Google OAuth
 */
export function initializeGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Auth library'));
    document.head.appendChild(script);
  });
}

/**
 * Request access token from Google OAuth
 */
export async function requestGoogleAccessToken(): Promise<GoogleAuthToken> {
  if (!window.google) {
    throw new Error('Google OAuth library not loaded');
  }

  return new Promise((resolve, reject) => {
    window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES.join(' '),
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(`Google OAuth error: ${response.error}`));
          return;
        }

        resolve({
          access_token: response.access_token,
          expires_at: Date.now() + (response.expires_in * 1000),
          token_type: response.token_type || 'Bearer',
        });
      },
    }).requestAccessToken({ prompt: 'consent' });
  });
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
 * Get valid access token (refresh if needed)
 */
export async function getValidGoogleToken(): Promise<GoogleAuthToken> {
  let token = getStoredGoogleToken();

  if (!token || isTokenExpired(token)) {
    token = await requestGoogleAccessToken();
    storeGoogleToken(token);
  }

  return token;
}
