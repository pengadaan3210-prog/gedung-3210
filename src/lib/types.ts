export type Tahapan = "Perencanaan" | "Pelaksanaan" | "Pengawasan";
export type StatusProgres = "Belum" | "Proses" | "Selesai" | "Tertunda";

export interface Kegiatan {
  id: string;
  penyedia?: string;
  tahapan: Tahapan;
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
  linkUndangan: string;
  linkDaftarHadir: string;
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

export interface Stakeholder {
  id: string;
  namaStakeholder: string;
  kategori: string;
  peranStakeholder: string;
  kepentingan: string;
  tingkatPengaruh: string;
  potensiDukunganRisiko: string;
  strategiPendekatan: string;
  tindakLanjut: string;
  outputYangDiharapkan: string;
  kendala: string;
  buktiDukung: string;
  pic: string;
  status: string;
  keterangan: string;
}

export interface Mitigasi {
  id: string;
  sumberRisiko: string;
  uraianRisiko: string;
  kategoriRisiko: string;
  dampakRisiko: string;
  tingkatRisiko: string;
  penyebab: string;
  mitigasiSolusi: string;
  tindakLanjut: string;
  pic: string;
  targetWaktu: string;
  status: string;
  buktiDukung: string;
  keterangan: string;
}

export interface KurvaSPlanning {
  id: string;
  mingguke: number;
  tanggalAwal: string;
  tanggalAkhir: string;
  deskripsiTahapan: string;
  targetPersentaseMinggu: number;
  targetPersentaseKumulatif: number;
  keterangan: string;
}

export interface KurvaSRealisasi {
  id: string;
  mingguke: number;
  tanggalAwal: string;
  tanggalAkhir: string;
  deskripsiPekerjaanMinggu: string;
  realisasiPersentaseMinggu: number;
  realisasiPersentaseKumulatif: number;
  kendala: string;
  solusi: string;
  pic: string;
  linkFotoProgres: string;
  linkLaporanMingguanPengawas: string;
  linkLaporanMingguanPelaksana: string;
}

export interface SheetsData {
  kegiatan?: Kegiatan[];
  visualisasi?: Visualisasi[];
  dokumentasi?: Dokumentasi[];
  notulen?: Notulen[];
  fotoProgres?: FotoProgres[];
  stakeholder?: Stakeholder[];
  mitigasi?: Mitigasi[];
  kurvaSPlanning?: KurvaSPlanning[];
  kurvaSRealisasi?: KurvaSRealisasi[];
}
