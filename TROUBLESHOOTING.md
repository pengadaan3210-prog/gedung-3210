# Troubleshooting: Visualisasi Proyek Tidak Menampilkan Data

Panduan step-by-step untuk mengatasi masalah data Visualisasi tidak tampil.

## 🔍 Diagnosis Cepat

Buka browser DevTools (F12) dan jalankan di Console:

```javascript
window.sheetsDebug.runFullDiagnostic()
```

Output akan show masalah spesifik Anda.

## ⚠️ Error Common & Solusi

### 1️⃣ "Environment variables are not configured"

**Penyebab**: `.env` file tidak ada atau tidak lengkap

**Solusi**:
```bash
cp .env.example .env
```

Edit `.env` dan isi:
```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
```

Kemudian restart dev server:
```bash
npm run dev
```

---

### 2️⃣ "Sheets data endpoint not found" (Error 404)

**Penyebab**: Supabase Function `get-sheets-data` belum ter-deploy

**Solusi**:
```bash
# Deploy function ke Supabase
supabase functions deploy get-sheets-data

# Atau (jika sudah punya Supabase CLI)
supabase link --project-ref <project-ref>
supabase functions deploy
```

---

### 3️⃣ "Authentication failed" (Error 401)

**Penyebab**: 
- Service account credentials tidak ter-set di Supabase
- Credentials sudah expired

**Solusi**:
```bash
# Set service account ke Supabase secrets
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat /path/to/service-account.json)"

# Verify sudah di-set
supabase secrets list
```

---

### 4️⃣ "Sheet tidak ditemukan" atau No Data

**Penyebab**:
- Spreadsheet ID salah
- Sheet name typo (case-sensitive!)
- Sheet kosong/tidak ada data

**Solusi**:

1. **Verify Spreadsheet ID**:
   ```bash
   # Edit file ini:
   supabase/functions/get-sheets-data/index.ts
   
   # Cari baris:
   const SPREADSHEET_ID = '...';
   
   # Ganti dengan ID yang benar dari URL:
   # https://docs.google.com/spreadsheets/d/[ID]/edit
   ```

2. **Check sheet name** (harus exact):
   - ✅ `Visualisasi`
   - ❌ `visualisasi` (lowercase)
   - ❌ `Visualisasi_` (extra character)

3. **Add test data** ke Google Sheet:
   ```
   Kolom: id | tipe | judul | deskripsi | url | kategori | urutan
   Data:  1  | Video | Video Test | Test | https://youtube.com/embed/abc | Test | 1
   ```

---

## 🧪 Step-by-Step Testing

### Step 1: Check Environment
```javascript
// Browser console
window.sheetsDebug.checkEnvironment()
```

**Expected**: Semua ✅ Configured

---

### Step 2: Test API Call
```javascript
// Browser console
window.sheetsDebug.testSheetsFetch('Visualisasi')
```

**Expected**: 
- Status 200 ✅
- Data returned dengan visualisasi array

---

### Step 3: Validate Data Structure
```javascript
// Browser console
window.sheetsDebug.validateDataStructure()
```

**Expected**:
- ✅ All expected fields present
- Data shows proper structure

---

### Step 4: Check All Sheets
```javascript
// Browser console
window.sheetsDebug.checkAllSheets()
```

**Expected**: Semua sheets return ✅ Data received

---

## 📊 Format Sheet yang Benar

### Spreadsheet Structure

**Sheet Name**: `Visualisasi` (case-sensitive!)

**Headers** (Row 1):
```
id | tipe | judul | deskripsi | url | kategori | urutan
```

**Data Example** (Row 2 dst):
```
vis-001 | Video | Animasi 3D | Video animasi gedung | https://youtube.com/embed/xyz | Arsitektur | 1
vis-002 | Model3D | Model 3D | Model struktur | https://sketchfab.com/models/xyz/embed | Struktur | 2
vis-003 | Gambar | Denah Lt1 | Denah lantai 1 | https://example.com/image.jpg | Denah | 1
```

**Tipe Valid**: `Video`, `Model3D`, `Gambar`

---

## 🔧 Advanced Troubleshooting

### Check Supabase Logs
```bash
supabase functions logs get-sheets-data --follow
```

Ini akan show error logs dari function.

---

### Test dengan cURL
```bash
curl -X GET \
  "https://[PROJECT].supabase.co/functions/v1/get-sheets-data?sheets=Visualisasi" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "apikey: [ANON_KEY]"
```

Replace `[PROJECT]` dan `[ANON_KEY]` dengan nilai Anda.

---

### Check Google Sheets API

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Navigate ke project Anda
3. Enable **Google Sheets API**
4. Verify service account punya access ke spreadsheet

---

## ✅ Checklist Verifikasi

- [ ] `.env` file sudah dibuat dan filled
- [ ] `VITE_SUPABASE_PROJECT_ID` correct
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` correct
- [ ] Supabase function `get-sheets-data` ter-deploy
- [ ] Google service account credentials ter-set di Supabase
- [ ] Spreadsheet ID benar di `supabase/functions/get-sheets-data/index.ts`
- [ ] Sheet `Visualisasi` exists di Google Sheets
- [ ] Headers di sheet match: `id | tipe | judul | deskripsi | url | kategori | urutan`
- [ ] Data ada di sheet (minimal 1 baris)
- [ ] Google Sheets API enabled di Google Cloud
- [ ] Service account punya read access ke spreadsheet

---

## 📞 Masih Error?

Jika masih ada masalah, kumpulkan info ini:

```javascript
// Jalankan di browser console dan copy output
window.sheetsDebug.runFullDiagnostic()

// Copy hasilnya dan share untuk debugging
```

Selain itu:
- Check browser Network tab (F12 > Network)
- Look untuk GET request ke `get-sheets-data`
- Check response body untuk error detail
- Check browser Console tab untuk error messages

---

**Semoga berhasil! 🎉**
