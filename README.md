# Gedung 3210 - Sistem Manajemen Pembangunan Gedung

Aplikasi web modern untuk mengatur dan memantau progres pembangunan serta tracking dokumentasi dari tahap perencanaan hingga pengawasan.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [Fitur & Halaman](#fitur--halaman)
- [Development](#development)
- [Testing](#testing)
- [Build & Deploy](#build--deploy)
- [Kontribusi](#kontribusi)
- [Support](#support)

## 🎯 Fitur Utama

- **Dashboard Interaktif**: Ringkasan progres pembangunan dengan statistik real-time
- **Visualisasi Data**: Grafik dan chart untuk analisis progres
- **Manajemen Kegiatan**: Tracking kegiatan di tahap perencanaan, pelaksanaan, dan pengawasan
- **Dokumentasi**: Sistem untuk menyimpan dan mengelola dokumentasi proyek
- **Laporan**: Pembuatan dan pengelolaan laporan pembangunan
- **Notulen**: Pencatatan rapat dan keputusan
- **Foto Progres**: Upload dan galeri foto dokumentasi progres
- **Error Handling**: Interface yang user-friendly untuk error dan loading states

## 🛠️ Teknologi

### Frontend Stack
- **React 18.3** - UI Framework
- **TypeScript 5.8** - Type Safety
- **Vite 5.4** - Build Tool & Dev Server
- **Tailwind CSS 3.4** - CSS Utility Framework
- **Shadcn/ui** - High-quality UI Components
- **React Router 6** - Client-side Routing
- **React Hook Form** - Form Management
- **TanStack React Query** - Data Fetching & Caching

### Backend & Database
- **Supabase** - Backend as a Service (PostgreSQL, Auth, Real-time)
- **Google Sheets** - Data Storage Integration

### Development Tools
- **ESLint** - Code Quality
- **Vitest** - Unit Testing
- **Playwright** - E2E Testing
- **PostCSS** - CSS Processing
- **TypeScript ESLint** - Type-aware Linting

## 📦 Prasyarat

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** (v18 atau lebih baru) - [Download](https://nodejs.org/)
- **Bun** (opsional, untuk package manager yang lebih cepat) - [Download](https://bun.sh/)
- **Git** - [Download](https://git-scm.com/)

Verify instalasi:
```bash
node --version
npm --version
git --version
```

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/pengadaan3210-prog/gedung-3210.git
cd gedung-3210
```

### 2. Install Dependencies

Dengan npm:
```bash
npm install
```

Atau dengan bun (lebih cepat):
```bash
bun install
```

### 3. Konfigurasi Environment

Lihat bagian [Konfigurasi Environment](#konfigurasi-environment) di bawah.

## 🔧 Konfigurasi Environment

### Setup File `.env`

1. Copy file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Isi variabel environment dengan kredensial Supabase Anda:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

### Mendapatkan Kredensial Supabase

1. Buat akun di [Supabase](https://supabase.com/)
2. Buat project baru
3. Di halaman Project Settings > API, copy:
   - Project ID
   - Project URL
   - Anon Public Key (Publishable Key)
4. Paste ke file `.env`

**⚠️ PENTING**: Jangan commit file `.env` ke repository! Sudah ada di `.gitignore`.

## ▶️ Menjalankan Aplikasi

### Development Server

```bash
npm run dev
```

Aplikasi akan terbuka di `http://localhost:5173`

### Preview Build

```bash
npm run build
npm run preview
```

## 📁 Struktur Proyek

```
src/
├── components/          # React Components
│   ├── ui/             # Reusable UI Components (Shadcn)
│   ├── AppLayout.tsx   # Main Layout Component
│   ├── AppSidebar.tsx  # Navigation Sidebar
│   └── ...
├── pages/              # Page Components (Route Pages)
│   ├── Dashboard.tsx
│   ├── Visualisasi.tsx
│   ├── KegiatanPage.tsx
│   ├── Dokumentasi.tsx
│   ├── Laporan.tsx
│   ├── NotulenPage.tsx
│   └── FotoProgresPage.tsx
├── hooks/              # Custom React Hooks
│   ├── useSheetsData.ts   # Data fetching hook
│   ├── use-mobile.tsx     # Mobile detection hook
│   └── use-toast.ts       # Toast notifications hook
├── integrations/       # External Service Integration
│   └── supabase/       # Supabase client & types
├── lib/                # Utilities & Constants
│   ├── types.ts        # TypeScript types & interfaces
│   ├── mockData.ts     # Mock data for development
│   └── utils.ts        # Helper functions
├── App.tsx             # Main App Component
└── main.tsx            # Application Entry Point
```

## 📄 Fitur & Halaman

### 1. **Dashboard** (`/`)
Halaman utama dengan ringkasan progres pembangunan
- Total kegiatan per tahapan
- Progress overdue
- Recent updates
- Statistik progres

### 2. **Visualisasi** (`/visualisasi`)
Analisis data dengan grafik dan chart
- Progress charts
- Status breakdown
- Timeline visualization

### 3. **Perencanaan** (`/perancangan`)
Tracking kegiatan konsultan perancangan
- Daftar kegiatan perencanaan
- Detail dan update status
- Timeline kegiatan

### 4. **Konstruksi** (`/konstruksi`)
Tracking kegiatan pelaksanaan konstruksi
- Daftar kegiatan kontraktor
- Progress update
- Milestone tracking

### 5. **Pengawasan** (`/pengawas`)
Tracking kegiatan pengawasan
- Quality assurance activities
- Inspection tracking
- Report generation

### 6. **Dokumentasi** (`/dokumentasi`)
Manajemen dokumen proyek
- Dokumen perencanaan
- Laporan berkala
- Sertifikat dan dokumen teknis

### 7. **Laporan** (`/laporan`)
Pembuatan dan pengelolaan laporan
- Laporan progres
- Laporan finansial
- Export ke berbagai format

### 8. **Notulen** (`/notulen`)
Pencatatan rapat dan keputusan
- Daftar rapat
- Detail notulensi
- Action items tracking

### 9. **Foto Progres** (`/foto-progres`)
Galeri dan dokumentasi visual
- Upload foto progres
- Timeline foto
- Organizer by tahapan

## 💻 Development

### Scripts Tersedia

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Code Quality
npm run lint             # Run ESLint

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode for tests

# Preview
npm run preview          # Preview production build locally
```

### Code Quality Standards

#### ESLint
Kami menggunakan ESLint untuk menjaga kualitas kode. Jalankan:
```bash
npm run lint
```

#### TypeScript Checking
TypeScript secara otomatis mengecek type safety. Untuk cek manual:
```bash
npx tsc --noEmit
```

#### Formatting
Gunakan Prettier atau formatter built-in editor Anda (VSCode disarankan)

### Git Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Commit dengan pesan yang deskriptif:
   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push dan buat Pull Request

## 🧪 Testing

### Unit Tests dengan Vitest

Run semua tests:
```bash
npm run test
```

Watch mode (testing otomatis saat ada perubahan):
```bash
npm run test:watch
```

### E2E Tests dengan Playwright

Konfigurasi di `playwright.config.ts`

## 🔨 Build & Deploy

### Production Build

```bash
npm run build
```

Output folder: `dist/`

### Deployment Options

#### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### 2. Netlify
1. Connect repository di Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

#### 3. Docker
```bash
docker build -t gedung-3210 .
docker run -p 3000:3000 gedung-3210
```

#### 4. Self-hosted
Copy `dist/` folder ke web server (Nginx, Apache, etc.)

## 🤝 Kontribusi

Kami menyambut kontribusi! Silahkan baca [CONTRIBUTING.md](./CONTRIBUTING.md) untuk panduan lengkap.

### Quick Start untuk Kontributor

1. Fork repository
2. Clone fork Anda: `git clone https://github.com/your-username/gedung-3210.git`
3. Create feature branch: `git checkout -b feature/amazing-feature`
4. Commit changes: `git commit -m 'feat: add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

## 📞 Support

Untuk pertanyaan atau masalah:

- 📧 Email: pengadaan3210@gmail.com
- 📍 GitHub Issues: [Create an issue](https://github.com/pengadaan3210-prog/gedung-3210/issues)

## 📜 License

Project ini open source dan tersedia di bawah lisensi MIT.

---

**Last Updated**: March 2026
**Version**: 1.0.0
>>>>>>> 4d737005464f0583c7782b1547443f20dbdf20d8
