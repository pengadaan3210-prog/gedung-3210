# Troubleshooting Guide - Upload File

## ❌ Error: "Insufficient permissions for the specified parent"

### Penyebab
- Akun Google di HP berbeda dari web, atau tidak punya akses ke folder Drive
- Token Google hilang di HP (mobile browser) karena storage issue  
- Folder masih di My Drive, belum di Shared Drive

### Solusi

#### Step 1: Verifikasi Akun Google
1. **Di HP**: Buka Settings → Akun Google
2. Pastikan login dengan **akun yang sama seperti di web**
3. Jika beda, logout dan login dengan akun yang benar

#### Step 2: Clear Cache & Login Ulang
1. **Di HP**:
   - Buka browser (Chrome/Safari/dll)
   - Buka Settings/More → Clear browsing data
   - Pilih "Cookies and site data" 
   - Clear ✓
   
2. **Kembali ke aplikasi dan login ulang dengan Google**

#### Step 3: Cek Akses Folder Drive
1. Pastikan akun Google Anda punya akses ke folder Drive yang ditetapkan
2. **Hubungi admin jika belum diberikan akses**

#### Step 4: Verifikasi Folder di Shared Drive
- Hubungi admin untuk memastikan folder sudah dipindahkan ke Shared Drive, bukan My Drive

---

## ✅ Cara Mengupload dari HP (Recommended)

1. **Login terlebih dahulu**: Buka aplikasi → klik tombol login Google
2. **Tunggu token tersimpan**: Tunggu popup login google selesai
3. **Baru upload**: Setelah login berhasil, baru coba upload file

---

## 🔧 Debugging Info

Jika masih error, screenshot pesan error dan:
1. Buka DevTools (F12)
2. Cek tab "Console" untuk error messages
3. Share screenshot konsol + pesan error ke admin

---

## 📱 Khusus Mobile Browser (Privacy Mode)

Jika menggunakan **Private/Incognito mode**:
- Token tidak akan tersimpan 
- **Solusi**: Gunakan normal browsing mode, bukan private mode

---

## 🎯 Ringkas Checklist

- [ ] Akun Google di HP sama dengan web? 
- [ ] Sudah clear cache?
- [ ] Sudah login ulang?
- [ ] Admin sudah memberikan akses folder?
- [ ] Folder sudah di Shared Drive?

Jika semua checklist ✓ tapi masih error, hubungi admin dengan screenshot error.
