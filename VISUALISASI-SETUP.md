# Visualisasi Proyek - Setup & Debugging Guide

Panduan lengkap untuk setup dan debug menu Visualisasi Proyek agar menampilkan data dengan benar.

## 🚀 Quick Start (3 Langkah)

### 1. Setup Google Sheets "Visualisasi" Sheet

Buka Google Sheets Anda dan buat sheet baru dengan nama **`Visualisasi`** (case-sensitive!)

**Headers** (Row 1):
```
id | tipe | judul | deskripsi | url | kategori | urutan
```

**Contoh Data** (Row 2 dst):
```
vis-001 | Video | Animasi 3D Gedung | Video pembangunan | https://youtube.com/embed/dQw4w9WgXcQ | Arsitektur | 1
vis-002 | Model3D | Model Struktur | Model 3D struktur | https://sketchfab.com/models/abc/embed | Struktur | 2
vis-003 | Gambar | Denah Lantai 1 | Desain denah | https://via.placeholder.com/400x300 | Denah | 1
```

### 2. Update Spreadsheet ID di Supabase Function

Edit file: `supabase/functions/get-sheets-data/index.ts`

Baris 9:
```typescript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
```

Dapat dari URL Google Sheets:
```
https://docs.google.com/spreadsheets/d/[ID_INI]/edit
                                        ↑
```

### 3. Deploy ke Supabase

```bash
supabase functions deploy get-sheets-data
```

---

## 🧪 Verify Setup

Buka aplikasi di browser dan:

1. **Menu Visualisasi** → Harus menampilkan data
2. **Buka Console** (F12) → Run:
```javascript
window.sheetsDebug.runFullDiagnostic()
```

Harus show `✅ All checks passed`

---

## 📋 Data Format Reference

### Kolom di Google Sheets

| Kolom | Tipe | Required | Contoh |
|-------|------|----------|--------|
| **id** | Text | ✅ | `vis-001` |
| **tipe** | Text | ✅ | `Video`, `Model3D`, `Gambar` |
| **judul** | Text | ✅ | `Animasi 3D Gedung` |
| **deskripsi** | Text | ❌ | `Deskripsi video atau gambar` |
| **url** | Text | ⚠️ | Lihat format di bawah |
| **kategori** | Text | ❌ | `Arsitektur`, `Struktur`, dll |
| **urutan** | Number | ❌ | `1`, `2`, `3` |

### Format URL Berdasarkan Tipe

#### 🎥 Video (YouTube)
Ambil **Embed URL**, bukan Watch URL:
```
❌ JANGAN: https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ GUNAKAN: https://www.youtube.com/embed/dQw4w9WgXcQ
```

Cara copy:
1. Buka video YouTube
2. Klik "Share" → "Embed"
3. Copy src dari iframe
4. Paste di kolom `url`

#### 🧊 Model 3D (Sketchfab)
```
✅ https://sketchfab.com/models/[MODEL_ID]/embed
```

Cara copy:
1. Buka model di Sketchfab
2. Klik "Embed"
3. Copy embed link
4. Paste di kolom `url`

#### 🖼️ Gambar (Berbagai Source)
Bisa dari:
- **Imgur**: `https://imgur.com/[ID].jpg`
- **Google Drive**: `https://drive.google.com/uc?id=[FILE_ID]`
- **GitHub**: `https://raw.githubusercontent.com/user/repo/path/image.jpg`
- **Direct URL**: `https://example.com/image.png`
- **Placeholder**: `https://via.placeholder.com/400x300`

---

## ❌ Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT_JSON not configured"

**Masalah**: Service account credentials belum di-set di Supabase

**Solusi**:
1. Buka [Supabase Dashboard](https://supabase.com)
2. Navigate ke: Project Settings → Secrets
3. Add secret:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: Paste isi file service account JSON

---

### Error: "Failed to fetch sheet Visualisasi"

**Masalah**: 
- Sheet "Visualisasi" tidak ada atau kosong
- Spreadsheet ID salah
- Service account tidak punya akses ke spreadsheet

**Solusi**:
1. Cek sheet name di Google Sheet (harus `Visualisasi`)
2. Cek spreadsheet ID benar di `index.ts`
3. Pastikan service account punya **read access** ke spreadsheet:
   - Share spreadsheet dengan email service account
   - Minimal "Viewer" access

---

### "Data tidak tampil di menu" (tapi tidak ada error)

**Masalah**: Data fetching berhasil tapi sheet kosong

**Solusi**:
1. Buka Google Sheets
2. Buka sheet "Visualisasi"
3. Check: Ada data di Row 2 dst?
4. Check: Header row benar? (`id | tipe | judul | ...`)
5. Refresh aplikasi: F5 atau Ctrl+Shift+R

---

### "Hanya beberapa gambar yang muncul"

**Masalah**: URL gambar tidak accessible

**Solusi**:
- Verify URL bisa dibuka di browser
- Check image hosting CORS settings
- Untuk Google Drive: gunakan `https://drive.google.com/uc?id=...` format
- Untuk imgur: gunakan `.jpg` atau `.png` extension

---

## 🔧 Debug Mode

### Browser Console Debugging

Di browser console (F12), tersedia debug utilities:

```javascript
// Full check semua sheets
window.sheetsDebug.checkAllSheets()

// Test fetch Visualisasi
window.sheetsDebug.testSheetsFetch('Visualisasi')

// Check environment
window.sheetsDebug.checkEnvironment()

// Validate data structure
window.sheetsDebug.validateDataStructure()
```

### Supabase Function Logs

```bash
supabase functions logs get-sheets-data --follow
```

Akan show real-time logs ketika API dipanggil.

---

## ✅ Checklist Sebelum Push ke Production

- [ ] Sheet "Visualisasi" ada di Google Sheets
- [ ] Headers persis: `id | tipe | judul | deskripsi | url | kategori | urutan`
- [ ] Minimal 1 baris data di sheet
- [ ] Spreadsheet ID sudah di-update di `index.ts`
- [ ] Google Service Account credentials ter-set di Supabase Secrets
- [ ] Service Account punya read access ke spreadsheet
- [ ] Function sudah di-deploy: `supabase functions deploy`
- [ ] .env file di local sudah filled dengan Supabase credentials
- [ ] Menu Visualisasi menampilkan data dengan benar
- [ ] `window.sheetsDebug.runFullDiagnostic()` return semua ✅

---

## 📞 Support

Jika masih ada masalah:

1. **Kumpulkan debug info**:
```javascript
window.sheetsDebug.runFullDiagnostic()
// Copy output dan share
```

2. **Check Supabase logs**:
```bash
supabase functions logs get-sheets-data
```

3. **Check browser network tab**:
   - F12 → Network → Cari request `get-sheets-data`
   - Lihat response body untuk error detail

---

**Happy visualizing! 🚀**
