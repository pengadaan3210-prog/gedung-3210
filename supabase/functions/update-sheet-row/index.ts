// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-runtime',
};

const SPREADSHEET_ID = '113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
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

function normalizeHeader(header: string): string {
  return header
    .trim()
    .split('(')[0]
    .trim()
    .toLowerCase()
    .replace(/[\s\/\-]+/g, '_')
    .replace(/[^a-z0-9_]+/g, '');
}

function columnLetter(columnIndex: number): string {
  let letter = '';
  let index = columnIndex;
  while (index > 0) {
    const remainder = (index - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

async function fetchHeaders(accessToken: string, sheetName: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!1:1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch headers: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return (data.values && data.values[0]) || [];
}

async function batchUpdateValues(accessToken: string, values: Array<{ range: string; values: string[][] }>) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: values }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update values: ${res.status} ${errorText}`);
  }

  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured in Supabase secrets');
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(saJson);
    } catch (parseErr) {
      const cleaned = saJson.trim().replace(/^"|"$/g, '');
      serviceAccount = JSON.parse(cleaned);
    }

    const accessToken = await getAccessToken(serviceAccount);

    const body = await req.json();
    const { sheetName, rowNumber, updates } = body;

    if (!sheetName || !rowNumber || !updates || typeof updates !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing sheetName, rowNumber, or updates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = await fetchHeaders(accessToken, sheetName);
    const normalizedHeaders = headers.map(normalizeHeader);

    const requests: Array<{ range: string; values: string[][] }> = [];

    Object.entries(updates).forEach(([field, value]) => {
      const normalizedField = normalizeHeader(field);
      const columnIndex = normalizedHeaders.findIndex((h) => h === normalizedField);
      if (columnIndex === -1) return;
      const column = columnLetter(columnIndex + 1);
      const range = `${sheetName}!${column}${rowNumber}`;
      requests.push({ range, values: [[value?.toString() || '']] });
    });

    if (requests.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid columns to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await batchUpdateValues(accessToken, requests);
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
