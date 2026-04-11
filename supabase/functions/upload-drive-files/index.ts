// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PARENT_FOLDER_ID = '12MGEqO6vcJNNtoYTrrerbMl7KEqs6-nM';
const SPREADSHEET_ID = '113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

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

// Format date string to "1 Juni 2026"
function formatTanggalFolder(tanggalStr: string): string {
  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  
  let date: Date;
  // Try parsing various formats
  if (tanggalStr.includes('/')) {
    const parts = tanggalStr.split('/');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      date = new Date(tanggalStr);
    }
  } else {
    date = new Date(tanggalStr);
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${tanggalStr}`);
  }
  
  return `${date.getDate()} ${bulanNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Find or create a folder by name under parent
async function findOrCreateFolder(accessToken: string, folderName: string, parentId: string): Promise<string> {
  const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`Failed to search folders: ${err}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    console.log(`📁 Found existing folder: ${folderName} (${searchData.files[0].id})`);
    return searchData.files[0].id;
  }
  
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create folder: ${err}`);
  }
  
  const folderData = await createRes.json();
  console.log(`📁 Created new folder: ${folderName} (${folderData.id})`);
  return folderData.id;
}

// Count existing files with same prefix in folder
async function countExistingFiles(accessToken: string, folderId: string, prefix: string): Promise<number> {
  const query = `'${folderId}' in parents and name contains '${prefix}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) return 0;
  const data = await res.json();
  return data.files?.length || 0;
}

async function getFolderMetadata(accessToken: string, folderId: string): Promise<{ id: string; name: string; driveId?: string }> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,driveId&supportsAllDrives=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to inspect parent folder: ${err}`);
  }

  return await res.json();
}

// Upload a single file to Google Drive
async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileData: Uint8Array,
  mimeType: string,
): Promise<{ id: string; name: string; webViewLink: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = '---BOUNDARY' + Date.now();
  const metadataStr = JSON.stringify(metadata);
  
  const encoder = new TextEncoder();
  const parts = [
    encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataStr}\r\n`),
    encoder.encode(`--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`),
    fileData,
    encoder.encode(`\r\n--${boundary}--`),
  ];
  
  // Combine parts
  let totalLength = 0;
  parts.forEach(p => totalLength += p.length);
  const body = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach(p => {
    body.set(p, offset);
    offset += p.length;
  });

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to upload file: ${err}`);
  }

  return await uploadRes.json();
}

// Update sheet cell
async function updateSheetCell(accessToken: string, sheetName: string, cell: string, value: string) {
  const range = `${sheetName}!${cell}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [[value]] }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update sheet: ${err}`);
  }
}

function parseServiceAccount(saJson: string) {
  try {
    return JSON.parse(saJson);
  } catch {
    const cleaned = saJson.trim().replace(/^"|"$/g, '');
    return JSON.parse(cleaned);
  }
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
    const formData = await req.formData();
    const userToken = formData.get('userToken') as string;
    const tanggal = formData.get('tanggal') as string;
    const karyawan = formData.get('karyawan') as string;
    const rowNumber = formData.get('rowNumber') as string;

    console.log('📝 Form data received:', {
      hasUserToken: !!userToken,
      tokenLength: userToken?.length || 0,
      tanggal,
      karyawan,
      rowNumber,
    });

    if (!tanggal || !karyawan || !rowNumber) {
      return new Response(JSON.stringify({ error: 'Missing tanggal, karyawan, or rowNumber' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
    }

    const serviceAccount = parseServiceAccount(saJson);
    const sheetAccessToken = await getAccessToken(serviceAccount);

    let driveAccessToken: string;

    // Try to use user token first (OAuth)
    if (userToken && userToken.trim()) {
      console.log('📱 Using user OAuth token');
      driveAccessToken = userToken;
    } else {
      // Fallback to service account
      console.log('🔑 Using service account token (no user token provided)');
      driveAccessToken = sheetAccessToken;
      
      // Verify folder is on shared drive
      const parentFolder = await getFolderMetadata(driveAccessToken, PARENT_FOLDER_ID);
      if (!parentFolder.driveId) {
        return new Response(JSON.stringify({
          error: 'Folder utama masih di My Drive. Silakan login dengan Google terlebih dahulu untuk upload, atau pindahkan folder ke Shared Drive.',
          code: 'PLEASE_LOGIN_WITH_GOOGLE',
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Format folder name
    const folderName = formatTanggalFolder(tanggal);
    console.log(`📅 Folder name: ${folderName}`);

    // Find or create date folder
    const folderId = await findOrCreateFolder(driveAccessToken, folderName, PARENT_FOLDER_ID);
    const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

    // Get all uploaded files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📤 Uploading ${files.length} files for ${karyawan}`);

    // Count existing files with this prefix
    const filePrefix = `${folderName} - ${karyawan}`;
    const existingCount = await countExistingFiles(driveAccessToken, folderId, filePrefix);

    const uploadedFiles: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Get file extension from original name
      const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';

      // Name: "1 Juni 2026 - Deni" for first, "1 Juni 2026 - Deni (1)" for subsequent
      const fileIndex = existingCount + i;
      const fileName = fileIndex === 0
        ? `${filePrefix}${ext}`
        : `${filePrefix} (${fileIndex})${ext}`;

      console.log(`   📎 Uploading: ${fileName} (${fileData.length} bytes)`);
      const result = await uploadFileToDrive(driveAccessToken, folderId, fileName, fileData, file.type || 'image/jpeg');
      uploadedFiles.push(result);
    }

    // Update sheet column G with folder link
    const cell = `G${rowNumber}`;
    await updateSheetCell(sheetAccessToken, 'Jadwal Monitoring', cell, folderLink);
    console.log(`✅ Updated sheet cell ${cell} with folder link`);

    return new Response(JSON.stringify({
      success: true,
      folderLink,
      folderId,
      uploadedFiles,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    console.error('❌ Upload error:', error);
    const status = message.includes('storage quota') || message.includes('storageQuotaExceeded') ? 409 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
