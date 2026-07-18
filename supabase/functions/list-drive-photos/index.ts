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

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: sa.client_email, scope: SCOPES.join(' '), aud: sa.token_uri, iat: now, exp: now + 3600 };
  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  const jwt = `${signingInput}.${base64url(signature)}`;
  const tokenRes = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const { access_token } = await tokenRes.json();
  return access_token;
}

function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) return m[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;
  return null;
}

async function driveList(q: string, token: string, fields: string) {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
  return (await res.json()).files || [];
}

const DEFAULT_ROOT = '12MGEqO6vcJNNtoYTrrerbMl7KEqs6-nM';

// Parse folder name like "1 Juni 2026", "08 juli 2026", "21 Juli 2026" to Date
function parseFolderDate(name: string): Date | null {
  const bulan: Record<string, number> = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
  };
  const m = name.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = bulan[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (mon === undefined) return null;
  return new Date(year, mon, day);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
    let sa: any;
    try { sa = JSON.parse(saJson); } catch { sa = JSON.parse(saJson.trim().replace(/^"|"$/g, '')); }

    const token = await getAccessToken(sa);

    const url = new URL(req.url);
    const folderUrl = url.searchParams.get('folderUrl') || '';
    const rootId = folderUrl ? (extractFolderId(folderUrl) || DEFAULT_ROOT) : DEFAULT_ROOT;

    // List subfolders
    const subfolders = await driveList(
      `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      token,
      'files(id,name)'
    );

    // For each subfolder, list image files
    const groups = await Promise.all(subfolders.map(async (folder: any) => {
      const files = await driveList(
        `'${folder.id}' in parents and trashed=false and mimeType contains 'image/'`,
        token,
        'files(id,name,mimeType,thumbnailLink,webViewLink,createdTime)'
      );
      const parsedDate = parseFolderDate(folder.name);
      return {
        folderId: folder.id,
        folderName: folder.name,
        date: parsedDate ? parsedDate.toISOString() : null,
        files: files.map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          thumbnailUrl: f.thumbnailLink || `https://drive.google.com/thumbnail?id=${f.id}&sz=w800`,
          viewUrl: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          createdTime: f.createdTime,
        })),
      };
    }));

    // Sort by parsed date desc (null last), then by name
    groups.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return b.folderName.localeCompare(a.folderName);
    });

    return new Response(JSON.stringify({ rootId, groups }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('list-drive-photos error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
