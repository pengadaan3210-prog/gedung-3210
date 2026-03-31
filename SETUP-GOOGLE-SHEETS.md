# Setup Google Sheets untuk Visualisasi Proyek

Panduan lengkap untuk mengatur Google Sheets agar data Visualisasi dapat ditampilkan di aplikasi.

## 📋 Requirement

- Google Account
- Google Sheets dengan struktur data yang benar
- Supabase project dengan Cloud Function ter-deploy

## 🔧 Langkah-Langkah Setup

### 1. Buka Google Sheets

1. Akses spreadsheet Anda di: `https://docs.google.com/spreadsheets`
2. Buka atau buat spreadsheet baru
3. **Catat Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
                                            ↑ Copy ini
   ```

### 2. Buat Sheet "Visualisasi"

Jika belum ada, buat sheet baru dengan nama **tepat**: `Visualisasi`

![Step: Add New Sheet](https://lh3.googleusercontent.com/a/default-user=s0)

### 3. Setup Kolom Headers

Copy headers ini ke row pertama:

```
id | tipe | judul | deskripsi | url | kategori | urutan
```

**Urutan kolom sangat penting!** Harus sesuai persis.

| Kolom | Tipe Data | Contoh |
|-------|-----------|--------|
| **id** | Text | `vis-001` |
| **tipe** | Text | `Video`, `Model3D`, `Gambar` |
| **judul** | Text | `Animasi 3D Gedung` |
| **deskripsi** | Text | `Video animasi pembangunan gedung` |
| **url** | Text | `https://www.youtube.com/embed/...` |
| **kategori** | Text | `Arsitektur`, `Struktur`, `Fasad` |
| **urutan** | Number | `1`, `2`, `3` |

### 4. Tambah Data Visualisasi

Contoh data untuk sheet Visualisasi:

```
id                          | tipe      | judul                          | deskripsi              | url                                    | kategori      | urutan
vis-001                     | Video     | Animasi 3D Gedung              | Video animasi pembangunan | https://youtube.com/embed/SKAsnFLPqXo | Arsitektur    | 1
vis-002                     | Model3D   | Model 3D Struktur              | Model struktur baja        | https://sketchfab.com/models/abc123   | Struktur      | 2
vis-003                     | Gambar    | Denah Lantai 1                 | Desain denah lantai 1     | /images/denah-lt1.jpg                  | Denah         | 1
```

### 5. Update Spreadsheet ID

Update file konfigurasi Supabase Function dengan Spreadsheet ID Anda:

**File**: `supabase/functions/get-sheets-data/index.ts`

Cari baris ini:
```typescript
const SPREADSHEET_ID = '113WXaUwn-orVEGdLSm4p9DhKrk3bH7ZgexS1wsAR4QA';
```

Ganti dengan ID spreadsheet Anda:
```typescript
const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID';
```

### 6. Deploy Supabase Function

Jika belum ter-deploy, deploy sekarang:

```bash
supabase functions deploy get-sheets-data
```

Atau jika pakai CLI:
```bash
supabase link --project-ref <your-project-ref>
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat path/to/service-account.json | tr -d '\n')"
supabase functions deploy
```

## 🎥 Format URL untuk Setiap Tipe

### Video (YouTube)

Ambil video ID dari URL:
```
Original: https://www.youtube.com/watch?v=SKAsnFLPqXo
Embed:    https://www.youtube.com/embed/SKAsnFLPqXo
```

### Model 3D (Sketchfab)

Gunakan iframe embed:
```
https://sketchfab.com/models/abc-model-id/embed
```

### Gambar

Bisa menggunakan:
- Direct image URL: `https://example.com/image.jpg`
- Google Drive: `https://drive.google.com/uc?id=FILE_ID`
- Github raw: `https://raw.githubusercontent.com/.../image.jpg`

## 🔍 Troubleshooting

### Data Masih Tidak Tampil

1. **Check browser console** untuk error messages
2. **Verify spreadsheet permissions**:
   - Sheet harus readable oleh service account atau public
3. **Check function logs** di Supabase:
   ```bash
   supabase functions logs get-sheets-data
   ```

### Sheet Headers Tidak Terkenali

- Pastikan headers persis: `id`, `tipe`, `judul`, `deskripsi`, `url`, `kategori`, `urutan`
- Lowercase semua (case-sensitive!)
- Tidak ada space tambahan

### Gambar/Video Tidak Muncul

- Verify URL accessible dari browser
- Check CORS settings
- Untuk YouTube: gunakan embed URL, bukan watch URL

## ✅ Verifikasi Setup

Setelah setup selesai:

1. Buka aplikasi di browser
2. Navigate ke "Visualisasi Proyek"
3. Tunggu loading selesai
4. Data harus tampil di halaman

Jika masih error, check:
```bash
# Lihat network response di DevTools (F12)
# Check Console tab untuk error messages
```

## 📚 Struktur Data Lengkap

### Kegiatan Sheet Headers
```
id | tahapan | uraian_kegiatan | output | tanggal_mulai | tanggal_selesai | status_progres | persentase_progres | peran_penyedia | pic | peran_bps_kabupaten | peran_bps_provinsi | peran_pusat | link_bukti_dukung | keterangan | tindak_lanjut | nomor_kontrak | tanggal_update_terakhir
```

### Dokumentasi Sheet Headers
```
id | nomor_kontrak | judul_dokumen | tahapan | kategori | pic | link_dokumen | tanggal_upload
```

### Notulen Sheet Headers
```
id | tanggal_rapat | judul_rapat | jenis_rapat | tempat | peserta | ringkasan | link_notulen | link_dokumentasi_foto
```

### Foto Progres Sheet Headers
```
id | tanggal | judul | deskripsi | kategori | link_foto | minggu_ke
```

## 🚀 Tips

- **Backup data**: Download sheet sebagai CSV sebelum membuat perubahan besar
- **Date format**: Gunakan `dd/mm/yyyy` (e.g., `31/03/2026`)
- **Testing**: Tambah 1-2 baris test data dulu sebelum banyak
- **Monitoring**: Check function logs secara regular di Supabase console

---

**Sudah selesai setup? Refresh aplikasi dan data akan tampil! 🎉**
