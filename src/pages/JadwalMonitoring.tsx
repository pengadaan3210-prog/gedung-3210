import { useJadwalMonitoring, useSheetsData } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { GoogleSignInModal } from "@/components/GoogleSignInModal";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileEdit, Upload, ExternalLink, Loader2, ImageIcon, ArrowUp, ArrowDown, FileText } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
import { getValidGoogleToken, getStoredGoogleToken, isTokenExpired, clearGoogleToken } from "@/integrations/google/oauth";

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
  const sheetsData = useSheetsData(["Kurva_S_Planning"]);
  const kurvaSPlanning = sheetsData.data?.kurvaSPlanning || [];
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>("no");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter state
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterKaryawan, setFilterKaryawan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Parse tanggal dari format "DD/MM/YYYY"
  const parseDMY = (s: string) => {
    const m = s?.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    return new Date(s);
  };

  // Helper function untuk parse ISO date string dan normalize ke midnight
  const parseISODate = (isoStr: string): Date => {
    const [year, month, day] = isoStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
  };

  // Helper function untuk match tanggal dengan range dan return tahapan
  const getTahapanForDate = (tanggal: string): string => {
    if (!tanggal || !kurvaSPlanning.length) return "-";
    
    // Parse tanggal dari format "DD/MM/YYYY"
    const parts = tanggal?.split(/[\/\-]/);
    if (parts.length !== 3) return "-";
    
    const targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 0, 0, 0, 0);
    if (isNaN(targetDate.getTime())) return "-";
    
    // Find matching tahapan
    const matching = kurvaSPlanning.find(tahapan => {
      const startDate = parseISODate(tahapan.tanggalAwal);
      const endDate = parseISODate(tahapan.tanggalAkhir);
      return targetDate >= startDate && targetDate <= endDate;
    });
    
    return matching?.deskripsiTahapan || "-";
  };

  // Helper function untuk match tanggal dengan range dan return minggu ke
  const getMingguKeForDate = (tanggal: string): number => {
    if (!tanggal || !kurvaSPlanning.length) return 0;
    
    // Parse tanggal dari format "DD/MM/YYYY"
    const parts = tanggal?.split(/[\/\-]/);
    if (parts.length !== 3) return 0;
    
    const targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 0, 0, 0, 0);
    if (isNaN(targetDate.getTime())) return 0;
    
    // Find matching minggu ke
    const matching = kurvaSPlanning.find(tahapan => {
      const startDate = parseISODate(tahapan.tanggalAwal);
      const endDate = parseISODate(tahapan.tanggalAkhir);
      return targetDate >= startDate && targetDate <= endDate;
    });
    
    return matching?.mingguke || 0;
  };

  // Helper function untuk determine status
  const getStatusValue = (row: any): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const rowDate = row.tanggal ? parseDMY(row.tanggal) : null;
    if (!rowDate) return "-";
    
    rowDate.setHours(0, 0, 0, 0);
    
    const hasCatatan = !!row.catatan_lapangan?.trim();
    const hasFoto = !!row.link_dokumen_bukti?.trim();
    
    // Jika tanggal masih di masa depan → "-"
    if (rowDate > today) {
      return "-";
    }
    
    // Jika tanggal sudah terlewat atau hari ini
    if (rowDate <= today) {
      // Hadir jika ada catatan dan foto
      if (hasCatatan && hasFoto) {
        return "Hadir";
      }
      // Tidak Hadir jika tidak ada catatan dan tidak ada foto
      if (!hasCatatan && !hasFoto) {
        return "Tidak Hadir";
      }
    }
    
    // Default untuk status intermediate
    return "-";
  };

  // Note editor state
  const [noteRow, setNoteRow] = useState<any>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Upload state
  const [uploadRow, setUploadRow] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<FileList | null>(null);
  const uploadRowRef = useRef<any>(null);

  // View files state
  const [viewRow, setViewRow] = useState<any>(null);
  const [viewFiles, setViewFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Detail row dialog state
  const [detailRow, setDetailRow] = useState<any>(null);
  const [detailFiles, setDetailFiles] = useState<DriveFile[]>([]);
  const [isLoadingDetailFiles, setIsLoadingDetailFiles] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());

  const normalizedData = useMemo(() => (data || []).map((row) => ({
    ...normalizeScheduleRow(row),
    tahapan: getTahapanForDate(row.tanggal),
    mingguKe: getMingguKeForDate(row.tanggal),
    computedStatus: getStatusValue(row),
  })), [data, kurvaSPlanning]);

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  // Handle sort column click
  const handleSortColumn = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction jika kolom sama
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set sorting untuk kolom baru
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Apply sort
  const sorted = [...normalizedData].sort((a, b) => {
    let aVal: any = "";
    let bVal: any = "";

    switch (sortColumn) {
      case "no":
        aVal = parseInt(a.no || a.__rowNumber || a.rowNumber || "0", 10);
        bVal = parseInt(b.no || b.__rowNumber || b.rowNumber || "0", 10);
        break;
      case "mingguKe":
        aVal = a.mingguKe || 0;
        bVal = b.mingguKe || 0;
        break;
      case "tanggal":
        aVal = a.tanggal ? parseDMY(a.tanggal).getTime() : 0;
        bVal = b.tanggal ? parseDMY(b.tanggal).getTime() : 0;
        break;
      case "karyawan":
        aVal = (a.karyawan || "").toLowerCase();
        bVal = (b.karyawan || "").toLowerCase();
        break;
      case "tahapan":
        aVal = (a.tahapan || "").toLowerCase();
        bVal = (b.tahapan || "").toLowerCase();
        break;
      case "status":
        aVal = (a.computedStatus || "").toLowerCase();
        bVal = (b.computedStatus || "").toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Apply filter
  const filtered = sorted.filter((item) => {
    // Filter tanggal
    if (filterTanggal && item.tanggal !== filterTanggal) return false;
    
    // Filter karyawan
    if (filterKaryawan && !item.karyawan?.toLowerCase().includes(filterKaryawan.toLowerCase())) return false;
    
    // Filter status
    if (filterStatus && item.computedStatus !== filterStatus) return false;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      return (
        item.karyawan?.toLowerCase().includes(s) ||
        item.computedStatus?.toLowerCase().includes(s) ||
        item.catatan_lapangan?.toLowerCase().includes(s) ||
        item.hari_ke_x?.toString().toLowerCase().includes(s)
      );
    }
    
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  // Update Status di sheet
  const updateStatusInSheet = async (row: any) => {
    try {
      const rowNumber = parseInt(row.__rowNumber || row.rowNumber || "0", 10);
      if (!rowNumber || rowNumber <= 0) return;

      const computedStatus = getStatusValue(row);
      
      // Jika status "-", tidak perlu update
      if (computedStatus === "-") return;

      const res = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/update-sheet-row`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetName: "Jadwal Monitoring",
          rowNumber,
          updates: { status: computedStatus },
        }),
      });

      if (!res.ok) {
        console.error("Failed to update status:", await res.text());
      }
    } catch (err: any) {
      console.error("Error updating status:", err?.message);
    }
  };

  const readErrorResponse = async (res: Response) => {
    try {
      const data = await res.json();
      return {
        message: data?.error || "Terjadi kesalahan",
        code: data?.code as string | undefined,
      };
    } catch {
      return {
        message: await res.text(),
        code: undefined,
      };
    }
  };

  const getGoogleAccessToken = async () => {
    try {
      // Use getValidGoogleToken which auto-refreshes if possible
      const token = await getValidGoogleToken();
      console.log("✅ Got Google access token");
      return token.access_token;
    } catch (err: any) {
      console.error("❌ Failed to get token:", err?.message);
      const rawMessage = String(err?.message || "").toLowerCase();
      
      if (rawMessage.includes("popup") || rawMessage.includes("blocked")) {
        throw new Error("Popup login Google diblokir. Silakan coba lagi.");
      }

      throw new Error("Login Google diperlukan untuk mengakses Drive Anda. " + (err?.message || ""));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hadir":
        return <Badge variant="default">Hadir</Badge>;
      case "tidak hadir":
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      case "-":
        return <Badge variant="outline">-</Badge>;
      default:
        return <Badge variant="outline">{status || "-"}</Badge>;
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
      
      // Update status setelah catatan disimpan
      const updatedRow = { ...noteRow, catatan_lapangan: noteDraft };
      await updateStatusInSheet(updatedRow);
      
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
    uploadRowRef.current = row;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const performUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      console.log("❌ No files to upload");
      return;
    }

    const rowData = uploadRowRef.current || uploadRow;
    if (!rowData) {
      console.log("❌ Row data not found");
      toast.error("Data baris tidak ditemukan. Silakan coba lagi.");
      return;
    }

    const rowNumber = rowData.__rowNumber || rowData.rowNumber;
    if (!rowNumber) {
      console.log("❌ Row number not found");
      toast.error("Tidak dapat menentukan baris untuk update.");
      return;
    }

    console.log(`📤 Starting upload for ${files.length} files to row ${rowNumber}`);
    setIsUploading(true);
    setUploadProgress(`Menyiapkan upload ${files.length} file...`);

    try {
      setUploadProgress("Menghubungkan Google Drive...");
      const userToken = await getGoogleAccessToken();

      const formData = new FormData();
      formData.append("tanggal", rowData.tanggal);
      formData.append("karyawan", rowData.karyawan);
      formData.append("rowNumber", rowNumber.toString());
      formData.append("userToken", userToken);

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      setUploadProgress(`Mengirim ke server...`);
      const res = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/upload-drive-files`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await readErrorResponse(res);
        let message = errorData.message || "Gagal mengupload file";
        
        // Enhance permission error messages
        if (res.status === 403) {
          if (errorData.code === 'PLEASE_LOGIN_WITH_GOOGLE') {
            message = "Folder Drive masih di My Drive. Admin perlu login dengan Google dan memindahkan folder ke Shared Drive terlebih dahulu.";
          } else if (message.includes('Permission denied') || message.includes('Insufficient permissions')) {
            message = `Akun Google Anda tidak punya akses.\n\n💡 Solusi:\n1. Pastikan sudah login dengan akun Google yang benar\n2. Coba logout dan login ulang di perangkat ini\n3. Minta admin untuk memberikan akses ke folder Drive\n\n${message}`;
          }
        }
        throw new Error(message);
      }

      const result = await res.json();
      toast.success(`${result.uploadedFiles?.length || files.length} file berhasil diupload`);
      
      // Update status setelah upload berhasil
      const updatedRow = { ...rowData, link_dokumen_bukti: result.folderLink };
      await updateStatusInSheet(updatedRow);
      
      await refetch();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Gagal mengupload file");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setUploadRow(null);
      uploadRowRef.current = null;
      pendingFilesRef.current = null;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = ""; // Reset immediately
    
    if (!files || files.length === 0 || !uploadRowRef.current) {
      return;
    }

    console.log("📂 File selected, checking token...");
    const token = getStoredGoogleToken();
    
    // Check if token exists and is not expired
    if (token && !isTokenExpired(token)) {
      console.log("✅ Valid token found, uploading directly...");
      await performUpload(files);
    } else {
      // No valid token, save files and show login modal
      console.log("📱 No valid token, showing login modal...");
      pendingFilesRef.current = files;
      setIsWaitingForLogin(true);
      setShowGoogleSignIn(true);
    }
  };

  const handleGoogleSignInSuccess = async () => {
    console.log("✅ Google sign-in successful");
    
    try {
      if (pendingFilesRef.current) {
        console.log("📤 Starting upload with pending files...");
        const filesToUpload = pendingFilesRef.current;
        pendingFilesRef.current = null;
        
        // Perform upload BEFORE closing modal
        await performUpload(filesToUpload);
        console.log("✅ Upload completed successfully");
      }
    } catch (err: any) {
      console.error("❌ Upload failed in handleGoogleSignInSuccess:", err?.message);
    } finally {
      // Close modal and clear waiting state AFTER upload completes
      setIsWaitingForLogin(false);
      setShowGoogleSignIn(false);
    }
  };

  const fetchDriveFiles = async (folderUrl: string, googleToken?: string) => {
    const url = `https://${PROJECT_ID}.supabase.co/functions/v1/list-drive-files?folderUrl=${encodeURIComponent(folderUrl)}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    };

    if (googleToken) {
      headers["x-google-access-token"] = googleToken;
    }

    return fetch(url, { headers });
  };

  // === VIEW FOTO ===
  const handleViewClick = async (row: any) => {
    const link = row.link_dokumen_bukti;
    if (!link) return;

    setViewRow(row);
    setIsLoadingFiles(true);
    setViewFiles([]);

    try {
      let res = await fetchDriveFiles(link);

      if (!res.ok) {
        const firstError = await readErrorResponse(res);

        if (firstError.code === "PLEASE_LOGIN_WITH_GOOGLE") {
          const googleToken = await getGoogleAccessToken();
          res = await fetchDriveFiles(link, googleToken);
        } else {
          throw new Error(firstError.message || "Gagal memuat daftar file");
        }
      }

      if (!res.ok) {
        const secondError = await readErrorResponse(res);
        throw new Error(secondError.message || "Gagal memuat daftar file");
      }

      const data = await res.json();
      setViewFiles(data.files || []);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat daftar file");
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // === DETAIL MODAL ===
  const handleOpenDetailModal = async (row: any) => {
    setDetailRow(row);
    setDetailFiles([]);
    setFailedThumbnails(new Set());
    
    const link = row.link_dokumen_bukti;
    if (!link) return;

    setIsLoadingDetailFiles(true);

    try {
      let res = await fetchDriveFiles(link);

      if (!res.ok) {
        const firstError = await readErrorResponse(res);

        if (firstError.code === "PLEASE_LOGIN_WITH_GOOGLE") {
          const googleToken = await getGoogleAccessToken();
          res = await fetchDriveFiles(link, googleToken);
        } else {
          throw new Error(firstError.message || "Gagal memuat daftar file");
        }
      }

      if (!res.ok) {
        const secondError = await readErrorResponse(res);
        throw new Error(secondError.message || "Gagal memuat daftar file");
      }

      const data = await res.json();
      setDetailFiles(data.files || []);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat daftar file");
      console.error(err);
    } finally {
      setIsLoadingDetailFiles(false);
    }
  };

  const handleThumbnailError = (fileId: string) => {
    setFailedThumbnails((prev) => new Set(prev).add(fileId));
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
          <Button
            variant={showFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            🔍 Filter
          </Button>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress}
            </div>
          )}
        </div>

        {showFilter && (
          <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium">Tanggal</Label>
                <Input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => { setFilterTanggal(e.target.value); setCurrentPage(1); }}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Karyawan</Label>
                <Input
                  placeholder="Cari nama..."
                  value={filterKaryawan}
                  onChange={(e) => { setFilterKaryawan(e.target.value); setCurrentPage(1); }}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Status</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                  <option value="-">-</option>
                </select>
              </div>
            </div>
            {(filterTanggal || filterKaryawan || filterStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterTanggal("");
                  setFilterKaryawan("");
                  setFilterStatus("");
                  setCurrentPage(1);
                }}
              >
                Clear Filter
              </Button>
            )}
          </div>
        )}

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
                    <TableHead 
                      className="w-14 text-center cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("no")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        No
                        {sortColumn === "no" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-24">Hari ke-</TableHead>
                    <TableHead 
                      className="w-32 cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("tanggal")}
                    >
                      <div className="flex items-center gap-1">
                        Tanggal
                        {sortColumn === "tanggal" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-20 cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("mingguKe")}
                    >
                      <div className="flex items-center gap-1">
                        Minggu ke-
                        {sortColumn === "mingguKe" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("karyawan")}
                    >
                      <div className="flex items-center gap-1">
                        Karyawan
                        {sortColumn === "karyawan" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("tahapan")}
                    >
                      <div className="flex items-center gap-1">
                        Tahapan / Pekerjaan
                        {sortColumn === "tahapan" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Catatan Lapangan</TableHead>
                    <TableHead 
                      className="w-28 cursor-pointer hover:bg-muted/60"
                      onClick={() => handleSortColumn("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortColumn === "status" && (
                          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => {
                    const hasLink = !!item.link_dokumen_bukti;
                    return (
                      <TableRow 
                        key={item.no || index}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOpenDetailModal(item)}
                      >
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {item.no || startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{item.hari_ke_x || "-"}</TableCell>
                        <TableCell className="w-32">
                          {item.tanggal ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatTanggal(item.tanggal)}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.mingguKe || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{item.karyawan || "-"}</TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="truncate text-sm" title={item.tahapan}>
                            {item.tahapan && item.tahapan !== "-" ? (
                              <Badge variant="outline" className="text-xs">{item.tahapan}</Badge>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate text-sm" title={item.catatan_lapangan}>
                            {item.catatan_lapangan || <span className="text-muted-foreground italic">Belum ada catatan</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.computedStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Catatan */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); openNoteEditor(item); }}
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
                                  onClick={(e) => { e.stopPropagation(); handleUploadClick(item); }}
                                  disabled={isUploading}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Upload Foto</TooltipContent>
                            </Tooltip>
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

        {/* === MODAL: Detail Jadwal === */}
        <Dialog open={!!detailRow} onOpenChange={(open) => { if (!open) { setDetailRow(null); setDetailFiles([]); } }}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold leading-tight">{detailRow?.karyawan}</DialogTitle>
              <DialogDescription className="text-sm mt-1 text-muted-foreground font-medium">
                {detailRow?.tanggal ? formatTanggal(detailRow.tanggal) : "-"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Tahapan / Pekerjaan */}
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-2">Tahapan / Pekerjaan</div>
                {detailRow?.tahapan && detailRow.tahapan !== "-" ? (
                  <Badge variant="outline" className="w-fit">{detailRow.tahapan}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground italic">-</span>
                )}
              </div>

              {/* Catatan Lapangan */}
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-2">Catatan Lapangan</div>
                <div className="text-sm bg-muted/30 p-3 rounded-md min-h-[60px] whitespace-pre-wrap">
                  {detailRow?.catatan_lapangan || <span className="text-muted-foreground italic">Belum ada catatan</span>}
                </div>
              </div>

              {/* Foto & Dokumen */}
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Foto & Dokumen
                </div>

                {isLoadingDetailFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Memuat file...</span>
                  </div>
                ) : detailFiles.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-md border-2 border-dashed border-muted-foreground/20">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada file dokumentasi</p>
                    {detailRow?.link_dokumen_bukti && (
                      <a
                        href={detailRow.link_dokumen_bukti}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka folder di Google Drive
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Klik gambar untuk membuka ukuran penuh</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {detailFiles.map((file) => {
                        const isImage = file.mimeType?.startsWith("image/");
                        const hasThumbnailFailed = failedThumbnails.has(file.id);
                        
                        return (
                          <a
                            key={file.id}
                            href={file.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                            title={file.name}
                          >
                            <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                              {isImage && !hasThumbnailFailed ? (
                                <img
                                  src={file.thumbnailUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={() => handleThumbnailError(file.id)}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                  {isImage ? (
                                    <>
                                      <ImageIcon className="h-8 w-8" />
                                      <span className="text-xs text-center">Gambar</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-6 w-6" />
                                      <span className="text-xs text-center px-1 break-words">{file.mimeType?.split("/")[1] || "file"}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="p-2 bg-muted/20">
                              <p className="text-xs truncate font-medium text-foreground">{file.name}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailRow(null)}>Tutup</Button>
              {detailRow?.link_dokumen_bukti && (
                <a
                  href={detailRow.link_dokumen_bukti}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google Drive
                  </Button>
                </a>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Google Sign-In Modal */}
        <GoogleSignInModal
          open={showGoogleSignIn}
          onClose={() => setShowGoogleSignIn(false)}
          onSuccess={handleGoogleSignInSuccess}
        />
      </div>
    </TooltipProvider>
  );
};

export default JadwalMonitoring;
