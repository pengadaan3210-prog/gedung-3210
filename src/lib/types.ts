export type Tahapan = "Perencanaan" | "Pelaksanaan" | "Pengawasan";
export type StatusProgres = "Belum" | "Proses" | "Selesai" | "Tertunda";

export interface Kegiatan {
  id: string;
  penyedia: Tahapan;  // Kunci utama: Perencanaan, Pelaksanaan, Pengawasan
  tahapan: string;    // Deskripsi tahapan teknis
  uraianKegiatan: string;
  output: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  statusProgres: StatusProgres;
  persentaseProgres: number;
  peranPenyedia: string;
  pic: string;
  peranBPSKabupaten: string;
  peranBPSProvinsi: string;
  peranPusat: string;
  linkBuktiDukung: string;
  keterangan: string;
  tindakLanjut: string;
  nomorKontrak: string;
  tanggalUpdateTerakhir: string;
  kendala?: string;
  solusi?: string;
  urutan?: number;
  penanggungjawab?: string;
}

export interface Visualisasi {
  id: string;
  tipe: string;
  judul: string;
  deskripsi: string;
  url: string;
  kategori: string;
  urutan: number;
}

export interface Dokumentasi {
  id: string;
  nomorKontrak: string;
  judulDokumen: string;
  tahapan: string;
  kategori: string;
  pic: string;
  linkDokumen: string;
  tanggalUpload: string;
}

export interface Notulen {
  id: string;
  tanggalRapat: string;
  judulRapat: string;
  jenisRapat: string;
  tempat: string;
  peserta: string;
  ringkasan: string;
  linkNotulen: string;
  linkDokumentasiFoto: string;
}

export interface FotoProgres {
  id: string;
  tanggal: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  linkFoto: string;
  mingguKe: number;
}

export interface SheetsData {
  kegiatan?: Kegiatan[];
  visualisasi?: Visualisasi[];
  dokumentasi?: Dokumentasi[];
  notulen?: Notulen[];
  fotoProgres?: FotoProgres[];
}
