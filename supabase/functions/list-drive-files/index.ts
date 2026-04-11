// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPES.join(' '),
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  const jwt = `${signingInput}.${base64url(signature)}`;

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// Extract folder ID from Google Drive folder URL
function extractFolderId(url: string): string | null {
  // Pattern: /folders/{id}
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];

  // Pattern: ?id={id}
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2?.[1]) return match2[1];

  // Maybe it's just a folder ID directly
  if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(saJson);
    } catch {
      const cleaned = saJson.trim().replace(/^"|"$/g, '');
      serviceAccount = JSON.parse(cleaned);
    }

    const accessToken = await getAccessToken(serviceAccount);

    const url = new URL(req.url);
    const folderUrl = url.searchParams.get('folderUrl') || '';
    
    if (!folderUrl) {
      return new Response(JSON.stringify({ error: 'Missing folderUrl parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      return new Response(JSON.stringify({ error: 'Could not extract folder ID from URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List files in the folder
    const query = `'${folderId}' in parents and trashed=false`;
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime)&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list files: ${res.status} ${err}`);
    }

    const data = await res.json();
    const files = (data.files || []).map((f: any) => {
      // Always use the reliable webContentLink for viewing full size
      // For thumbnails, use custom thumbnail URL if available, otherwise generate a reliable one
      let thumbnailUrl = f.thumbnailLink;
      
      // If no thumbnail link from API, generate a reliable thumbnail URL
      if (!thumbnailUrl) {
        // Use direct preview URL which works for most files
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${f.id}`;
      }
      
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        thumbnailUrl: thumbnailUrl,
        viewUrl: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        downloadUrl: f.webContentLink || '',
        createdTime: f.createdTime,
      };
    });

    return new Response(JSON.stringify({ files, folderId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ List files error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
