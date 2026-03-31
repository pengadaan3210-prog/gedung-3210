import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SPREADSHEET_ID = '113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
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

  // Import private key
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

async function fetchSheet(accessToken: string, sheetName: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Failed to fetch sheet "${sheetName}": ${res.status} ${res.statusText}`);
      console.error(`   Response: ${err}`);
      
      // More detailed error logging
      if (res.status === 404) {
        console.error(`   → Sheet "${sheetName}" not found in spreadsheet`);
      } else if (res.status === 403) {
        console.error(`   → Permission denied. Check service account access to spreadsheet.`);
      } else if (res.status === 401) {
        console.error(`   → Authentication failed. Check GOOGLE_SERVICE_ACCOUNT_JSON.`);
      }
      
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];
    console.log(`✅ Successfully fetched sheet "${sheetName}": ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error(`❌ Network error fetching "${sheetName}":`, error);
    return [];
  }
}

// Normalize header name by extracting just the field name (before parenthesis)
// "tipe (Video / Model3D / Gambar)" -> "tipe"
// "url (link YouTube/embed/gambar)" -> "url"
function normalizeHeader(header: string): string {
  return header
    .trim()
    .split('(')[0]
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function sheetToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const rawHeaders = rows[0];
  const headers = rawHeaders.map(normalizeHeader);
  
  console.log(`   📊 Total columns: ${rawHeaders.length}`);
  console.log(`   📊 Headers (raw): [${rawHeaders.join(', ')}]`);
  console.log(`   📊 Headers (normalized): [${headers.join(', ')}]`);
  
  // Debug: Show column U specifically (index 20)
  if (rawHeaders.length > 20) {
    console.log(`   📍 Column U (index 20): Raw="${rawHeaders[20]}" → Normalized="${headers[20]}"`);
  }
  
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

// Parse dd/mm/yyyy to yyyy-mm-dd
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return dateStr;
}

function mapKegiatan(raw: Record<string, string>[]) {
  console.log(`   🔍 Mapping ${raw.length} kegiatan records...`);
  if (raw.length > 0) {
    console.log(`   🔍 First row keys: [${Object.keys(raw[0]).join(', ')}]`);
    console.log(`   🔍 Sample penanggungjawab values:`);
    raw.slice(0, 3).forEach((r, i) => {
      console.log(`      Row ${i}: penanggungjawab="${r.penanggungjawab || '(empty)'}"`);
    });
  }
  
  return raw.map((r) => ({
    id: r.id || '',
    penyedia: r.penyedia || '',
    tahapan: r.tahapan || '',
    uraianKegiatan: r.uraian_kegiatan || '',
    output: r.output || '',
    tanggalMulai: parseDate(r.tanggal_mulai),
    tanggalSelesai: parseDate(r.tanggal_selesai),
    statusProgres: r.status_progres || 'Belum',
    persentaseProgres: parseInt(r.persentase_progres) || 0,
    peranPenyedia: r.peran_penyedia || '',
    pic: r.pic || '',
    peranBPSKabupaten: r.peran_bps_kabupaten || '',
    peranBPSProvinsi: r.peran_bps_provinsi || '',
    peranPusat: r.peran_pusat || '',
    linkBuktiDukung: r.link_bukti_dukung || '',
    keterangan: r.keterangan || '',
    tindakLanjut: r.tindak_lanjut || '',
    nomorKontrak: r.nomor_kontrak || '',
    tanggalUpdateTerakhir: parseDate(r.tanggal_update_terakhir),
    kendala: r.kendala || '',
    solusi: r.solusi || '',
    urutan: parseInt(r.urutan) || 0,
    penanggungjawab: r.penanggungjawab || '',
  }));
}

function mapVisualisasi(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    tipe: r.tipe || '',
    judul: r.judul || '',
    deskripsi: r.deskripsi || '',
    url: r.url || '',
    kategori: r.kategori || '',
    urutan: parseInt(r.urutan) || 0,
  }));
}

function mapDokumentasi(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    nomorKontrak: r.nomor_kontrak || '',
    judulDokumen: r.judul_dokumen || '',
    tahapan: r.tahapan || '',
    kategori: r.kategori || '',
    pic: r.pic || '',
    linkDokumen: r.link_dokumen || '',
    tanggalUpload: parseDate(r.tanggal_upload),
  }));
}

function mapNotulen(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    tanggalRapat: parseDate(r.tanggal_rapat),
    judulRapat: r.judul_rapat || '',
    jenisRapat: r.jenis_rapat || '',
    tempat: r.tempat || '',
    peserta: r.peserta || '',
    ringkasan: r.ringkasan || '',
    linkNotulen: r.link_notulen || '',
    linkDokumentasiFoto: r.link_dokumentasi_foto || '',
  }));
}

function mapFotoProgres(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    tanggal: parseDate(r.tanggal),
    judul: r.judul || '',
    deskripsi: r.deskripsi || '',
    kategori: r.kategori || '',
    linkFoto: r.link_foto || '',
    mingguKe: parseInt(r.minggu_ke) || 0,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('\n📋 === GET-SHEETS-DATA REQUEST ===');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Spreadsheet ID: ${SPREADSHEET_ID}`);

    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON is not configured in Supabase secrets');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured. Please set it in Supabase dashboard');
    }
    console.log('✅ Service account credentials found');

    const serviceAccount = JSON.parse(saJson);
    console.log(`✅ Service account email: ${serviceAccount.client_email}`);
    
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Google Sheets API access token acquired');

    // Parse requested sheets from query param, default all
    const url = new URL(req.url);
    const sheetsParam = url.searchParams.get('sheets');
    const requestedSheets = sheetsParam
      ? sheetsParam.split(',')
      : ['Kegiatan', 'Visualisasi', 'Dokumentasi', 'Notulen', 'Foto_Progres'];

    console.log(`📊 Requesting ${requestedSheets.length} sheets: ${requestedSheets.join(', ')}`);

    const result: Record<string, any> = {};

    const sheetPromises = requestedSheets.map(async (sheet) => {
      const rows = await fetchSheet(accessToken, sheet);
      const objects = sheetToObjects(rows);

      switch (sheet) {
        case 'Kegiatan': 
          result.kegiatan = mapKegiatan(objects);
          console.log(`   → Kegiatan: ${objects.length} records mapped`);
          break;
        case 'Visualisasi': 
          result.visualisasi = mapVisualisasi(objects);
          console.log(`   → Visualisasi: ${objects.length} records mapped`);
          break;
        case 'Dokumentasi': 
          result.dokumentasi = mapDokumentasi(objects);
          console.log(`   → Dokumentasi: ${objects.length} records mapped`);
          break;
        case 'Notulen': 
          result.notulen = mapNotulen(objects);
          console.log(`   → Notulen: ${objects.length} records mapped`);
          break;
        case 'Foto_Progres': 
          result.fotoProgres = mapFotoProgres(objects);
          console.log(`   → Foto Progres: ${objects.length} records mapped`);
          break;
        default: 
          result[sheet] = objects;
      }
    });

    await Promise.all(sheetPromises);

    console.log(`✅ Successfully processed all sheets`);
    console.log('📤 === RESPONSE READY ===\n');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ === ERROR ===');
    console.error(`Error: ${errorMsg}`);
    console.error('📋 Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('====\n');
    
    return new Response(
      JSON.stringify({ 
        error: errorMsg,
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        spreadsheetId: SPREADSHEET_ID,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
