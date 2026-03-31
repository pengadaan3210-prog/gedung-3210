import { useState, useMemo } from "react";
import { Kegiatan, StatusProgres } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DataTableProps {
  data: Kegiatan[];
  onSelect: (item: Kegiatan) => void;
}

const statusVariant = (s: StatusProgres) => {
  switch (s) {
    case "Selesai": return "bg-success/15 text-success border-success/30";
    case "Proses": return "bg-info/15 text-info border-info/30";
    case "Tertunda": return "bg-warning/15 text-warning border-warning/30";
    case "Belum": return "bg-muted text-muted-foreground border-border";
  }
};

// Get gradient color from red (0%) to green (100%)
const getProgressGradientColor = (percentage: number): string => {
  // Clamp percentage between 0 and 100
  const p = Math.max(0, Math.min(100, percentage));
  
  // Only green at exactly 100%
  if (p === 100) {
    return "rgb(34, 197, 94)"; // Green
  }
  
  // For 0-99%: Gradient from Red through Yellow/Orange
  // Red(255,0,0) → Orange(255,165,0) → Yellow-Orange(255,200,0)
  const ratio = p / 99; // Use 99 as max to never reach green until 100%
  const r = 255;
  const g = Math.round(165 * ratio); // Goes from 0 to 165
  const b = 0;
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Get color for tahapan badges based on penanggungjawab/penyedia
const getTahapanBadgeClass = (item: Kegiatan): string => {
  // Check penanggungjawab first
  if (item.penanggungjawab === "BPS Kabupaten Majalengka" || item.penanggungjawab?.includes("BPS")) {
    return 'text-blue-700 font-bold';  // Biru
  }
  
  // Then check penyedia
  if (item.penyedia === "Perencanaan") {
    return 'text-amber-700 font-bold';  // Gold
  } else if (item.penyedia === "Pengawasan") {
    return 'text-green-700 font-bold';  // Hijau
  } else if (item.penyedia === "Pelaksanaan") {
    return 'text-orange-600 font-bold';  // Orange
  }
  
  return 'text-amber-700 font-bold';  // Default
};

const DataTable = ({ data, onSelect }: DataTableProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<Kegiatan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;
  const STATUS_OPTIONS: string[] = ["Semua", "Belum", "Proses", "Selesai", "Tertunda"];

  const sorted = useMemo(() => {
    let result = [...data];
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.uraianKegiatan.toLowerCase().includes(q) ||
          d.pic.toLowerCase().includes(q) ||
          d.tahapan.toLowerCase().includes(q)
      );
    }

    // Filter by status (from column H: statusProgres)
    if (statusFilter && statusFilter !== "Semua") {
      result = result.filter((d) => d.statusProgres.trim() === statusFilter.trim());
    }

    // Sort by urutan field, or by id if urutan not available
    result.sort((a, b) => {
      const aUrutan = a.urutan ?? 999;
      const bUrutan = b.urutan ?? 999;
      return aUrutan - bUrutan;
    });

    return result;
  }, [data, search, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const endIdx = startIdx + ROWS_PER_PAGE;
  const paginatedData = sorted.slice(startIdx, endIdx);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleStatusToggle = (status: string) => {
    if (status === "Semua") {
      setStatusFilter("");
    } else {
      setStatusFilter(statusFilter === status ? "" : status);
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    const endStr = end.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Cari kegiatan, PIC, atau tahapan..." 
          value={search} 
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);  // Reset to first page on search
          }} 
          className="pl-9" 
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold text-muted-foreground self-center">Status:</span>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusToggle(status)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              (status === "Semua" && statusFilter === "") || statusFilter === status
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="font-semibold">Tahapan</TableHead>              <TableHead className="font-semibold min-w-[120px]">Penanggungjawab</TableHead>              <TableHead className="font-semibold min-w-[250px]">Uraian Kegiatan</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Output</TableHead>
              <TableHead className="font-semibold min-w-[160px]">Tanggal Pelaksanaan</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Persentase</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Kendala</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Solusi</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Tindak Lanjut</TableHead>
              <TableHead className="font-semibold min-w-[120px]">PIC Pelaksana</TableHead>
              <TableHead className="font-semibold min-w-[140px]">Peran BPS Provinsi</TableHead>
              <TableHead className="font-semibold text-center w-16">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow 
                key={item.id} 
                className="hover:bg-muted/50 transition-colors cursor-pointer h-auto"
                onClick={() => setSelectedDetail(item)}
              >
                <TableCell>
                  <span className={`${getTahapanBadgeClass(item)} text-xs`}>
                    {item.tahapan}
                  </span>
                </TableCell>
                <TableCell className="text-sm max-w-[120px] truncate" title={item.penanggungjawab || '-'}>
                  {item.penanggungjawab || '-'}
                </TableCell>
                <TableCell 
                  className="font-medium text-sm max-w-[250px] truncate"
                  title={item.uraianKegiatan}
                >
                  {item.uraianKegiatan.length > 50 
                    ? `${item.uraianKegiatan.substring(0, 50)}...` 
                    : item.uraianKegiatan
                  }
                </TableCell>
                <TableCell className="text-sm max-w-[180px] truncate" title={item.output}>
                  {item.output || '-'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateRange(item.tanggalMulai, item.tanggalSelesai)}
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{item.persentaseProgres}%</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.persentaseProgres}%`,
                          backgroundColor: getProgressGradientColor(item.persentaseProgres)
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm max-w-[150px] truncate" title={item.kendala}>
                  {item.kendala || '-'}
                </TableCell>
                <TableCell className="text-sm max-w-[150px] truncate" title={item.solusi}>
                  {item.solusi || '-'}
                </TableCell>
                <TableCell className="text-sm max-w-[150px] truncate" title={item.tindakLanjut}>
                  {item.tindakLanjut || '-'}
                </TableCell>
                <TableCell className="text-sm font-medium">{item.pic}</TableCell>
                <TableCell className="text-sm max-w-[140px] truncate" title={item.peranBPSProvinsi || '-'}>
                  {item.peranBPSProvinsi || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetail(item);
                      }}
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.linkBuktiDukung && (
                      <a 
                        href={item.linkBuktiDukung} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Buka bukti dukung"
                        >
                          <ExternalLink className="h-4 w-4 text-accent hover:text-primary" />
                        </Button>
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Menampilkan {startIdx + 1}-{Math.min(endIdx, sorted.length)} dari {sorted.length} kegiatan
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDetail && (
            <>
              <DialogHeader className="border-b pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="w-fit">{selectedDetail.penyedia}</Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-medium">{selectedDetail.tahapan}</span>
                  </div>
                  <DialogTitle className="text-base font-semibold text-foreground">{selectedDetail.uraianKegiatan}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status Bar */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
                    <Badge className={`${statusVariant(selectedDetail.statusProgres)} text-xs border w-full justify-center`}>
                      {selectedDetail.statusProgres}
                    </Badge>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Progress</p>
                    <p className="text-sm font-bold">{selectedDetail.persentaseProgres}%</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">PIC</p>
                    <p className="text-xs font-medium truncate">{selectedDetail.pic.split(' ')[0]}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Kontrak</p>
                    <p className="text-xs font-medium truncate">{selectedDetail.nomorKontrak?.slice(-4) || '-'}</p>
                  </div>
                </div>

                {/* Output */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Output</p>
                  <p className="text-sm p-2 bg-muted/30 rounded border">{selectedDetail.output || '-'}</p>
                </div>

                {/* Jadwal */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Jadwal Pelaksanaan</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-sm p-2 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Mulai</p>
                      <p className="font-medium">
                        {new Date(selectedDetail.tanggalMulai).toLocaleDateString("id-ID", 
                          { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-sm p-2 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Selesai</p>
                      <p className="font-medium">
                        {new Date(selectedDetail.tanggalSelesai).toLocaleDateString("id-ID",
                          { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PIC & Peran */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tim</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between p-1.5 bg-muted/20 rounded">
                      <span className="text-muted-foreground">PIC Pelaksana:</span>
                      <span className="font-medium">{selectedDetail.pic}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Penanggungjawab:</span>
                      <span className="font-medium">{selectedDetail.penanggungjawab || '-'}</span>
                    </div>
                    <div className="flex justify-between p-1.5 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Penyedia:</span>
                      <span className="font-medium">{selectedDetail.peranPenyedia || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Kendala Solusi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Kendala</p>
                    <p className="text-sm p-2 bg-destructive/5 rounded border border-destructive/10 min-h-[60px]">
                      {selectedDetail.kendala || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Solusi</p>
                    <p className="text-sm p-2 bg-success/5 rounded border border-success/10 min-h-[60px]">
                      {selectedDetail.solusi || '-'}
                    </p>
                  </div>
                </div>

                {/* Tindak Lanjut & Keterangan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tindak Lanjut</p>
                    <p className="text-sm p-2 bg-muted/30 rounded border min-h-[60px]">{selectedDetail.tindakLanjut || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Keterangan</p>
                    <p className="text-sm p-2 bg-muted/30 rounded border min-h-[60px]">{selectedDetail.keterangan || '-'}</p>
                  </div>
                </div>

                {/* Additional Info */}
                {(selectedDetail.peranBPSKabupaten || selectedDetail.peranBPSProvinsi || selectedDetail.peranPusat || selectedDetail.keterangan) && (
                  <div className="text-xs space-y-1.5 p-2 bg-muted/20 rounded">
                    {selectedDetail.peranBPSKabupaten && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BPS Kabupaten:</span>
                        <span>{selectedDetail.peranBPSKabupaten}</span>
                      </div>
                    )}
                    {selectedDetail.peranBPSProvinsi && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BPS Provinsi:</span>
                        <span>{selectedDetail.peranBPSProvinsi}</span>
                      </div>
                    )}
                    {selectedDetail.peranPusat && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pusat:</span>
                        <span>{selectedDetail.peranPusat}</span>
                      </div>
                    )}
                    {selectedDetail.keterangan && (
                      <div className="border-t pt-1.5">
                        <p className="text-muted-foreground mb-1">Keterangan: {selectedDetail.keterangan}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Link */}
                {selectedDetail.linkBuktiDukung && (
                  <button
                    onClick={() => window.open(selectedDetail.linkBuktiDukung, '_blank')}
                    className="w-full px-3 py-2 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka Bukti Dukung
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataTable;
