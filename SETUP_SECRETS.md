# Setup Google Sheets Integration

Aplikasi menggunakan Google Sheets API untuk fetch data dinamis melalui Supabase Edge Function.

## Prerequisites

- Supabase CLI (atau akses Supabase Dashboard)
- Google Service Account JSON credentials

## Setup via Supabase Dashboard (Recommended untuk Development)

### 1. Login ke Supabase Dashboard
- Buka: https://supabase.com/dashboard
- Pilih project: `usgjbpyzhoiykbooxzjh` (gedung-3210)

### 2. Setup Secret
- Navigasi ke: **Settings > Secrets**
- Klik **New Secret**
- **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`
- **Value:** Paste seluruh JSON dari service account:
```json
{
  "type": "service_account",
  "project_id": "gedung-3210",
  "private_key_id": "...",
  ...
}
```
- Klik **Save**

### 3. Verify Secret
- Credentials akan otomatis tersedia untuk Supabase Functions
- Test dengan mengakses: `GET http://localhost:3000/functions/v1/get-sheets-data?sheets=Visualisasi`

## Setup via Supabase CLI

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link ke project
cd c:\Users\asus-\Pictures\gedung-3210-main
supabase link --project-ref usgjbpyzhoiykbooxzjh

# 4. Set secret
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{full json here}' --project-ref usgjbpyzhoiykbooxzjh

# 5. Deploy function (opsional untuk test lokal)
supabase functions deploy get-sheets-data --project-ref usgjbpyzhoiykbooxzjh
```

## Spreadsheet Configuration

**Spreadsheet ID:** `113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA`

Sheets yang tersedia:
- `Kegiatan` - Data kegiatan proyek
- `Visualisasi` - Data visualisasi (Video, Model 3D, Gambar)
- `Dokumentasi` - Data file dokumentasi
- `Notulen` - Data notulen rapat
- `Foto_Progres` - Data foto progress

## Testing dari Frontend

```javascript
// useSheetsData hook sudah configured
import { useVisualisasi } from '@/hooks/useSheetsData';

const Component = () => {
  const { data, isLoading, isError } = useVisualisasi();
  // data akan berisi array visualisasi dari Google Sheets
};
```

## Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured"
- Pastikan secret sudah di-set di Supabase Dashboard
- Verify dengan membuka: Settings > Secrets > check if GOOGLE_SERVICE_ACCOUNT_JSON exists

### Error: "Token exchange failed"
- Check private_key di JSON credentials - pastikan format benar (include -----BEGIN/END PRIVATE KEY-----)
- Verify service account memiliki Google Sheets API access

### Empty data response
- Check spreadsheet ID dan sheet names
- Verify service account email di-invite ke spreadsheet (share dengan service account email)

## Environment Variables (Frontend)

File `.env` sudah configure dengan:
```env
VITE_SUPABASE_PROJECT_ID=usgjbpyzhoiykbooxzjh
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=https://usgjbpyzhoiykbooxzjh.supabase.co
```

Tidak perlu Google credentials di frontend - semua via backend function.
