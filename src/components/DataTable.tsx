import { useState, useMemo } from "react";
import { Kegiatan, StatusProgres } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, ExternalLink } from "lucide-react";
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

const DataTable = ({ data, onSelect }: DataTableProps) => {
  const [search, setSearch] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<Kegiatan | null>(null);

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

    // Sort by urutan field, or by id if urutan not available
    result.sort((a, b) => {
      const aUrutan = a.urutan ?? 999;
      const bUrutan = b.urutan ?? 999;
      return aUrutan - bUrutan;
    });

    return result;
  }, [data, search]);

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
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9" 
        />
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
              <TableHead className="font-semibold">PIC Pelaksana</TableHead>
              <TableHead className="font-semibold text-center w-16">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Badge variant="outline" className="text-xs font-medium">{item.tahapan}</Badge>
                </TableCell>
                <TableCell className="text-sm max-w-[120px] truncate" title={item.penanggungjawab || '-'}>
                  {item.penanggungjawab || '-'}
                </TableCell>
                <TableCell className="font-medium text-sm">{item.uraianKegiatan}</TableCell>
                <TableCell className="text-sm">{item.output}</TableCell>
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
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedDetail(item)}
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.linkBuktiDukung && (
                      <a href={item.linkBuktiDukung} target="_blank" rel="noopener noreferrer">
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
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Menampilkan {sorted.length} kegiatan
      </div>

      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedDetail.uraianKegiatan}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Header Info */}
                <div className="grid grid-cols-3 gap-4 pb-3 border-b">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Tahapan</p>
                    <Badge className="mt-1.5">{selectedDetail.tahapan}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
                    <Badge className={`${statusVariant(selectedDetail.statusProgres)} text-xs border mt-1.5`}>
                      {selectedDetail.statusProgres}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Progress</p>
                    <p className="mt-1.5 text-sm font-semibold">{selectedDetail.persentaseProgres}%</p>
                  </div>
                </div>

                {/* PIC & Kontrak */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">PIC Pelaksana</p>
                    <p className="mt-1.5 text-sm font-medium">{selectedDetail.pic}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Penanggungjawab</p>
                    <p className="mt-1.5 text-sm">{selectedDetail.penanggungjawab || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Nomor Kontrak</p>
                    <p className="mt-1.5 text-sm">{selectedDetail.nomorKontrak || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Output</p>
                    <p className="mt-1.5 text-sm">{selectedDetail.output || '-'}</p>
                  </div>
                </div>

                {/* Jadwal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Tanggal Mulai</p>
                    <p className="mt-1.5 text-sm font-medium">
                      {new Date(selectedDetail.tanggalMulai).toLocaleDateString("id-ID", 
                        { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Tanggal Selesai</p>
                    <p className="mt-1.5 text-sm font-medium">
                      {new Date(selectedDetail.tanggalSelesai).toLocaleDateString("id-ID",
                        { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Kendala & Solusi */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Kendala</p>
                    <p className="text-sm p-2 bg-destructive/5 rounded border border-destructive/10">
                      {selectedDetail.kendala || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Solusi</p>
                    <p className="text-sm p-2 bg-success/5 rounded border border-success/10">
                      {selectedDetail.solusi || '-'}
                    </p>
                  </div>
                </div>

                {/* Tindak Lanjut & Keterangan */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tindak Lanjut</p>
                    <p className="text-sm p-2 bg-muted/50 rounded">{selectedDetail.tindakLanjut || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Keterangan</p>
                    <p className="text-sm p-2 bg-muted/50 rounded">{selectedDetail.keterangan || '-'}</p>
                  </div>
                </div>

                {/* Peran Details */}
                <div className="text-xs space-y-1.5 p-3 bg-muted/30 rounded">
                  <p className="font-semibold text-muted-foreground uppercase mb-2">Peran</p>
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="font-medium">Penyedia:</span> {selectedDetail.peranPenyedia || '-'}</p>
                    <p><span className="font-medium">BPS Kab:</span> {selectedDetail.peranBPSKabupaten || '-'}</p>
                    <p><span className="font-medium">BPS Prov:</span> {selectedDetail.peranBPSProvinsi || '-'}</p>
                    <p><span className="font-medium">Pusat:</span> {selectedDetail.peranPusat || '-'}</p>
                  </div>
                </div>

                {/* Document Links */}
                {selectedDetail.linkBuktiDukung && (
                  <Button 
                    onClick={() => window.open(selectedDetail.linkBuktiDukung, '_blank')} 
                    className="w-full"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka Bukti Dukung
                  </Button>
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
