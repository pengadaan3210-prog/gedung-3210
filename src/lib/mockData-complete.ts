/**
 * Mock data untuk testing dan development
 * Gunakan data ini untuk testing tanpa perlu Google Sheets API
 */

import { Kegiatan, Visualisasi, Dokumentasi, Notulen, FotoProgres } from "./types";

export const mockKegiatan: Kegiatan[] = [
  {
    id: "keg-001",
    tahapan: "Perencanaan",
    uraianKegiatan: "Penyusunan DED (Detail Engineering Design)",
    output: "Dokumen DED lengkap",
    tanggalMulai: "2024-01-15",
    tanggalSelesai: "2024-03-15",
    statusProgres: "Selesai",
    persentaseProgres: 100,
    peranPenyedia: "Konsultan Perencana",
    pic: "Ir. Ahmad Fauzi",
    peranBPSKabupaten: "Review & persetujuan",
    peranBPSProvinsi: "Konsultasi teknis",
    peranPusat: "Persetujuan anggaran",
    linkBuktiDukung: "https://drive.google.com/example1",
    keterangan: "DED telah disetujui",
    tindakLanjut: "-",
    nomorKontrak: "KTR/PLAN/001/2024",
    tanggalUpdateTerakhir: "2024-03-15",
  },
];

export const mockVisualisasi: Visualisasi[] = [
  {
    id: "vis-001",
    tipe: "Video",
    judul: "Animasi 3D Gedung Kantor BPS",
    deskripsi: "Video animasi pembangunan gedung kantor BPS Kabupaten Majalengka dari awal hingga selesai",
    url: "https://www.youtube.com/embed/SKAsnFLPqXo",
    kategori: "Arsitektur",
    urutan: 1,
  },
  {
    id: "vis-002",
    tipe: "Model3D",
    judul: "Model 3D Struktur Baja",
    deskripsi: "Model 3D interaktif struktur baja gedung",
    url: "https://sketchfab.com/models/abc123/embed",
    kategori: "Struktur",
    urutan: 2,
  },
  {
    id: "vis-003",
    tipe: "Gambar",
    judul: "Denah Lantai 1",
    deskripsi: "Desain denah lantai 1 gedung kantor",
    url: "https://via.placeholder.com/400x300?text=Denah+Lantai+1",
    kategori: "Denah",
    urutan: 1,
  },
  {
    id: "vis-004",
    tipe: "Gambar",
    judul: "Fasad Depan",
    deskripsi: "Desain fasad depan gedung",
    url: "https://via.placeholder.com/400x300?text=Fasad+Depan",
    kategori: "Fasad",
    urutan: 2,
  },
  {
    id: "vis-005",
    tipe: "Video",
    judul: "Perkembangan Konstruksi Bulan 1",
    deskripsi: "Dokumentasi perkembangan konstruksi minggu ke 1-4",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    kategori: "Konstruksi",
    urutan: 3,
  },
];

export const mockDokumentasi: Dokumentasi[] = [
  {
    id: "dok-001",
    nomorKontrak: "KTR/PLAN/001/2024",
    judulDokumen: "Detail Engineering Design (DED)",
    tahapan: "Perencanaan",
    kategori: "Desain",
    pic: "Ir. Ahmad Fauzi",
    linkDokumen: "https://drive.google.com/example1",
    tanggalUpload: "2024-03-15",
  },
];

export const mockNotulen: Notulen[] = [
  {
    id: "not-001",
    tanggalRapat: "2024-01-20",
    judulRapat: "Kickoff Meeting Proyek Gedung Kantor BPS",
    jenisRapat: "Internal",
    tempat: "Aula BPS Kabupaten Majalengka",
    peserta: "PPK, Konsultan, Kontraktor, Pengawas",
    ringkasan: "Penjelasan scope, timeline, dan kontrak",
    linkNotulen: "https://drive.google.com/example",
    linkDokumentasiFoto: "https://drive.google.com/example",
  },
];

export const mockFotoProgres: FotoProgres[] = [
  {
    id: "foto-001",
    tanggal: "2024-01-25",
    judul: "Persiapan Lahan",
    deskripsi: "Pembersihan dan persiapan lahan proyek",
    kategori: "Persiapan",
    linkFoto: "https://via.placeholder.com/600x400?text=Foto+Progres+1",
    mingguKe: 1,
  },
];
