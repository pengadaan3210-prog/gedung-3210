import { useJadwalMonitoring } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileEdit, Upload, Eye, ExternalLink, X, Loader2, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const normalizeScheduleRow = (row: any) => ({
  ...row,
  hari_ke_x: row.hari_ke_x || row["hari_ke-x"] || row["hari ke x"] || row["hari kex"] || row["hari"] || "",
  catatan_lapangan: row.catatan_lapangan || row["catatan lapangan"] || row["catatan_lapangan"] || "",
  link_dokumen_bukti: row.link_dokumen_bukti || row["link_dokumen/bukti"] || row["link dokumen/bukti"] || row.link_dokumen || "",
});

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
  viewUrl: string;
  createdTime: string;
}

const JadwalMonitoring = () => {
  const { data, isLoading, isError, refetch } = useJadwalMonitoring();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Note editor state
  const [noteRow, setNoteRow] = useState<any>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Upload state
  const [uploadRow, setUploadRow] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View files state
  const [viewRow, setViewRow] = useState<any>(null);
  const [viewFiles, setViewFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const normalizedData = useMemo(() => (data || []).map(normalizeScheduleRow), [data]);

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const parseDMY = (s: string) => {
    const m = s?.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    return new Date(s);
  };

  const sorted = [...normalizedData].sort((a, b) => {
    if (!a.tanggal || !b.tanggal) return 0;
    return parseDMY(b.tanggal).getTime() - parseDMY(a.tanggal).getTime();
  });

  const filtered = sorted.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.karyawan?.toLowerCase().includes(s) ||
      item.status?.toLowerCase().includes(s) ||
      item.catatan_lapangan?.toLowerCase().includes(s) ||
      item.hari_ke_x?.toString().toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hadir":
        return <Badge variant="default">Hadir</Badge>;
      case "tidak hadir":
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      default:
        return <Badge variant="secondary">{status || "-"}</Badge>;
    }
  };

  // === CATATAN LAPANGAN ===
  const openNoteEditor = (row: any) => {
    setNoteRow(row);
    setNoteDraft(row.catatan_lapangan || "");
  };

  const handleSaveNote = async () => {
    if (!noteRow) return;
    const rowNumber = parseInt(noteRow.__rowNumber || noteRow.rowNumber || "0", 10);
    if (!rowNumber || rowNumber <= 0) {
      toast.error("Tidak dapat menentukan baris untuk update.");
      return;
    }

    setIsSavingNote(true);
    try {
      const res = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/update-sheet-row`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetName: "Jadwal Monitoring",
          rowNumber,
          updates: { catatan_lapangan: noteDraft },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Catatan berhasil disimpan");
      await refetch();
      setNoteRow(null);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan catatan");
    } finally {
      setIsSavingNote(false);
    }
  };

  // === UPLOAD FOTO ===
  const handleUploadClick = (row: any) => {
    setUploadRow(row);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !uploadRow) return;

    const rowNumber = uploadRow.__rowNumber || uploadRow.rowNumber;
    if (!rowNumber) {
      toast.error("Tidak dapat menentukan baris untuk update.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Mengupload ${files.length} file...`);

    try {
      const formData = new FormData();
      formData.append("tanggal", uploadRow.tanggal);
      formData.append("karyawan", uploadRow.karyawan);
      formData.append("rowNumber", rowNumber.toString());

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/upload-drive-files`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Gagal mengupload file";
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          errorMessage = await res.text();
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      toast.success(`${result.uploadedFiles?.length || files.length} file berhasil diupload`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengupload file");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setUploadRow(null);
      event.target.value = "";
    }
  };

  // === VIEW FOTO ===
  const handleViewClick = async (row: any) => {
    const link = row.link_dokumen_bukti;
    if (!link) return;

    setViewRow(row);
    setIsLoadingFiles(true);
    setViewFiles([]);

    try {
      const url = `https://${PROJECT_ID}.supabase.co/functions/v1/list-drive-files?folderUrl=${encodeURIComponent(link)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setViewFiles(data.files || []);
    } catch (err: any) {
      toast.error("Gagal memuat daftar file");
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";
    try {
      // Parse DD/MM/YYYY format explicitly
      const dmy = tanggal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (dmy) {
        const day = parseInt(dmy[1]);
        const month = parseInt(dmy[2]) - 1;
        const year = parseInt(dmy[3]);
        const date = new Date(year, month, day);
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      }
      return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return tanggal;
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jadwal piket monitoring lapangan pembangunan kantor BPS Majalengka
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Cari karyawan, status, atau catatan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="max-w-xs"
          />
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "Tidak ada jadwal yang cocok dengan pencarian" : "Belum ada data jadwal monitoring"}
          </p>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-14 text-center">No</TableHead>
                    <TableHead className="w-24">Hari ke-X</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead>Catatan Lapangan</TableHead>
                    <TableHead className="w-36">Link Dokumen</TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => {
                    const hasLink = !!item.link_dokumen_bukti;
                    return (
                      <TableRow key={item.no || index}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {item.no || startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{item.hari_ke_x || "-"}</TableCell>
                        <TableCell>
                          {item.tanggal ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatTanggal(item.tanggal)}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{item.karyawan || "-"}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate text-sm" title={item.catatan_lapangan}>
                            {item.catatan_lapangan || <span className="text-muted-foreground italic">Belum ada catatan</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hasLink ? (
                            <a
                              href={item.link_dokumen_bukti}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Buka Folder
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Belum ada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Catatan */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => openNoteEditor(item)}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Isi/Edit Catatan</TooltipContent>
                            </Tooltip>

                            {/* Upload Foto */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleUploadClick(item)}
                                  disabled={isUploading}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Upload Foto</TooltipContent>
                            </Tooltip>

                            {/* Lihat Foto - only show if link exists */}
                            {hasLink && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleViewClick(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Lihat Foto</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}–{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} jadwal
                {" · "}Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Berikut
                </Button>
              </div>
            </div>
          </>
        )}

        {/* === MODAL: Edit Catatan === */}
        <Dialog open={!!noteRow} onOpenChange={(open) => { if (!open) setNoteRow(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Catatan Lapangan</DialogTitle>
              <DialogDescription>
                {noteRow?.karyawan} — {noteRow?.tanggal ? formatTanggal(noteRow.tanggal) : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label htmlFor="catatan">Catatan Lapangan</Label>
              <Textarea
                id="catatan"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Tulis catatan monitoring lapangan..."
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteRow(null)}>Batal</Button>
              <Button onClick={handleSaveNote} disabled={isSavingNote}>
                {isSavingNote ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                ) : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* === MODAL: View Foto === */}
        <Dialog open={!!viewRow} onOpenChange={(open) => { if (!open) { setViewRow(null); setViewFiles([]); } }}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Foto & Dokumen</DialogTitle>
              <DialogDescription>
                {viewRow?.karyawan} — {viewRow?.tanggal ? formatTanggal(viewRow.tanggal) : ""}
              </DialogDescription>
            </DialogHeader>

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Memuat file...</span>
              </div>
            ) : viewFiles.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada file di folder ini</p>
                {viewRow?.link_dokumen_bukti && (
                  <a
                    href={viewRow.link_dokumen_bukti}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka folder di Google Drive
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {viewFiles.map((file) => {
                    const isImage = file.mimeType?.startsWith("image/");
                    return (
                      <a
                        key={file.id}
                        href={file.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                              <ExternalLink className="h-6 w-6" />
                              <span className="text-xs">{file.mimeType?.split("/")[1] || "file"}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate font-medium" title={file.name}>{file.name}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
                {viewRow?.link_dokumen_bukti && (
                  <div className="text-center pt-2 border-t">
                    <a
                      href={viewRow.link_dokumen_bukti}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka folder di Google Drive
                    </a>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </TooltipProvider>
  );
};

export default JadwalMonitoring;
