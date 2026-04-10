// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SPREADSHEET_ID = '113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

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
    .replace(/[\s\/\-]+/g, '_')
    .replace(/[^a-z0-9_]+/g, '');
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
  
  // Filter out rows where all cells are empty
  const dataRows = rows.slice(1).filter(row => row.some(cell => cell && cell.trim() !== ''));
  console.log(`   📊 Data rows (after filtering empty): ${dataRows.length}`);
  
  return dataRows.map((row, idx) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    obj.__rowNumber = (idx + 2).toString();
    // Use existing ID or generate from index
    if (!obj.id || obj.id.trim() === '') {
      obj.id = `row_${idx + 1}`;
    }
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
  
  const mapped = raw.map((r) => ({
    id: r.id || '',
    penyedia: (r.penyedia || '').trim(),
    tahapan: r.tahapan || '',
    uraianKegiatan: r.uraian_kegiatan || '',
    output: r.output || '',
    tanggalMulai: parseDate(r.tanggal_mulai),
    tanggalSelesai: parseDate(r.tanggal_selesai),
    statusProgres: (r.status_progres || 'Belum').trim(),
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
  
  // Remove duplicates by ID
  const uniqueMap = new Map<string, any>();
  mapped.forEach(item => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });
  
  const result = Array.from(uniqueMap.values());
  console.log(`   ✨ Kegiatan deduplicated: ${mapped.length} → ${result.length} unique records`);
  return result;
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
    linkNotulen: r.link_notulen || r.linkNotulen || r.linknotulen || '',
    linkDokumentasiFoto: r.link_dokumentasi_foto || r.linkDokumentasiFoto || r.linkdokumentasifoto || '',
    linkUndangan: r.link_undangan || r.linkUndangan || r.linkundangan || '',
    linkDaftarHadir: r.link_daftar_hadir || r.linkDaftarHadir || r.linkdaftarhadir || '',
  }));
}

function mapStakeholder(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    namaStakeholder: r.nama_stakeholder || '',
    kategori: r.kategori || '',
    peranStakeholder: r.peran_stakeholder || '',
    kepentingan: r['kepentingan_/_interest'] || r.kepentingan || '',
    tingkatPengaruh: r.tingkat_pengaruh || '',
    potensiDukunganRisiko: r['potensi_dukungan_/_risiko'] || r.potensi_dukungan || '',
    strategiPendekatan: r.strategi_pendekatan || '',
    tindakLanjut: r.tindak_lanjut || '',
    outputYangDiharapkan: r.output_yang_diharapkan || r.output || '',
    kendala: r.kendala || '',
    buktiDukung: r.bukti_dukung || '',
    pic: r.pic || '',
    status: r.status || '',
    keterangan: r.keterangan || '',
  }));
}

function mapMitigasi(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    sumberRisiko: r.sumber_risiko || '',
    uraianRisiko: r['uraian_risiko_/_permasalahan'] || r.uraian_risiko || '',
    kategoriRisiko: r.kategori_risiko || '',
    dampakRisiko: r.dampak_risiko || '',
    tingkatRisiko: r.tingkat_risiko || '',
    penyebab: r.penyebab || '',
    mitigasiSolusi: r['mitigasi_/_solusi_yang_direncanakan'] || r.mitigasi || '',
    tindakLanjut: r.tindak_lanjut || '',
    pic: r.penanggung_jawab || r.pic || '',
    targetWaktu: r.target_waktu_penyelesaian || r.target_waktu || '',
    status: r.status || '',
    buktiDukung: r.bukti_dukung || '',
    keterangan: r.keterangan || '',
  }));
}

function mapFotoProgres(raw: Record<string, string>[]) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return raw.map((r) => {
    const parsedTanggal = parseDate(r.tanggal);
    const date = parsedTanggal ? new Date(parsedTanggal) : null;

    const derivedMingguKe = date ? Math.ceil(date.getDate() / 7) : 0;
    const derivedBulan = date
      ? `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      : '';

    const mingguKe = parseInt(r.minggu_ke) || derivedMingguKe || 0;
    const bulan = (r.bulan || r.month || '').trim() || derivedBulan;

    return {
      id: r.id || '',
      tanggal: parsedTanggal,
      judul: r.judul || '',
      deskripsi: r.deskripsi || '',
      kategori: r.kategori || '',
      linkFoto: r.link_foto || '',
      mingguKe,
      bulan,
    };
  });
}

function mapKurvaSPlanning(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    mingguke: parseInt(r.minggu_ke || r.mingguke) || 0,
    tanggalAwal: parseDate(r.tanggal_awal || r.tglawal || ''),
    tanggalAkhir: parseDate(r.tanggal_akhir || r.tglakhir || ''),
    deskripsiTahapan: r.deskripsi_tahapan || r.deskripsi || '',
    targetPersentasePersentaseMinggu: parseFloat(r.target_persentase_minggu || r.target_persen_minggu || '0') || 0,
    targetPersentaseMinggu: parseFloat(r.target_persentase_minggu || r.target_persen_minggu || '0') || 0,
    targetPersentaseKumulatif: parseFloat(r.target_persentase_kumulatif || r.target_kumulatif || '0') || 0,
    keterangan: r.keterangan || '',
  }));
}

function mapKurvaSRealisasi(raw: Record<string, string>[]) {
  return raw.map((r) => ({
    id: r.id || '',
    mingguke: parseInt(r.minggu_ke || r.mingguke) || 0,
    tanggalAwal: parseDate(r.tanggal_awal || r.tglawal || ''),
    tanggalAkhir: parseDate(r.tanggal_akhir || r.tglakhir || ''),
    deskripsiPekerjaanMinggu: r.deskripsi_pekerjaan_minggu || r.deskripsi || '',
    realisasiPersentaseMinggu: parseFloat(r.realisasi_persentase_minggu || r.realisasi_persen_minggu || '0') || 0,
    realisasiPersentaseKumulatif: parseFloat(r.realisasi_persentase_kumulatif || r.realisasi_kumulatif || '0') || 0,
    kendala: r.kendala || '-',
    solusi: r.solusi || '-',
    pic: r.pic || '',
    linkFotoProgres: r.link_foto_progres || r.link_foto || '',
    linkLaporanMingguanPengawas: r.link_laporan_mingguan_pengawas || r.linkLaporanMingguanPengawas || r.link_laporan_pengawas || r.link_pengawas || r['Link Laporan Mingguan Pengawas'] || r['link laporan mingguan pengawas'] || r['Laporan Mingguan Pengawas'] || r['laporan mingguan pengawas'] || '',
    linkLaporanMingguanPelaksana: r.link_laporan_mingguan_pelaksana || r.linkLaporanMingguanPelaksana || r.link_laporan_pelaksana || r.link_pelaksana || r['Link Laporan Mingguan Pelaksana'] || r['link laporan mingguan pelaksana'] || r['Laporan Mingguan Pelaksana'] || r['laporan mingguan pelaksana'] || '',
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

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(saJson);
    } catch (parseErr) {
      // Try cleaning: remove wrapping quotes if double-encoded
      try {
        let cleaned = saJson.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = JSON.parse(cleaned); // un-double-encode
        }
        serviceAccount = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
      } catch {
        console.error('❌ Failed to parse SA JSON. First 100 chars:', saJson.substring(0, 100));
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON contains invalid JSON.');
      }
    }
    console.log(`✅ Service account email: ${serviceAccount.client_email}`);
    
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Google Sheets API access token acquired');

    // Parse requested sheets from query param, default all
    const url = new URL(req.url);
    const sheetsParam = url.searchParams.get('sheets');
    const requestedSheets = sheetsParam
      ? sheetsParam.split(',')
      : ['Kegiatan', 'Visualisasi', 'Dokumentasi', 'Notulen', 'Foto_Progres', 'Stakeholder', 'Mitigasi', 'Kurva_S_Planning', 'Kurva_S_Realisasi'];

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
        case 'Stakeholder':
          result.stakeholder = mapStakeholder(objects);
          console.log(`   → Stakeholder: ${objects.length} records mapped`);
          break;
        case 'Mitigasi':
          result.mitigasi = mapMitigasi(objects);
          console.log(`   → Mitigasi: ${objects.length} records mapped`);
          break;
        case 'Kurva_S_Planning':
          result.kurvaSPlanning = mapKurvaSPlanning(objects);
          console.log(`   → Kurva S Planning: ${objects.length} records mapped`);
          break;
        case 'Kurva_S_Realisasi':
          console.log(`   → Kurva S Realisasi: ${objects.length} records`);
          if (objects.length > 0) {
            console.log(`     Sample record keys:`, Object.keys(objects[0]));
            console.log(`     Sample link_laporan_mingguan_pengawas:`, objects[0].link_laporan_mingguan_pengawas || 'NOT FOUND');
            console.log(`     Sample link_laporan_mingguan_pelaksana:`, objects[0].link_laporan_mingguan_pelaksana || 'NOT FOUND');
          }
          result.kurvaSRealisasi = mapKurvaSRealisasi(objects);
          console.log(`   → Kurva S Realisasi: ${result.kurvaSRealisasi.length} records mapped`);
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
