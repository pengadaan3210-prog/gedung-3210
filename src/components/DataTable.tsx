import { useState, useMemo } from "react";
import { Kegiatan, Tahapan, StatusProgres } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, ExternalLink, ArrowUpDown } from "lucide-react";

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

const isOverdue = (item: Kegiatan) => {
  if (item.statusProgres === "Selesai") return false;
  return new Date(item.tanggalSelesai) < new Date();
};

const PAGE_SIZE = 5;

const DataTable = ({ data, onSelect }: DataTableProps) => {
  const [search, setSearch] = useState("");
  const [filterTahapan, setFilterTahapan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Kegiatan>("tanggalMulai");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.uraianKegiatan.toLowerCase().includes(q) ||
          d.pic.toLowerCase().includes(q) ||
          d.nomorKontrak.toLowerCase().includes(q)
      );
    }
    if (filterTahapan !== "all") result = result.filter((d) => d.tahapan === filterTahapan);
    if (filterStatus !== "all") result = result.filter((d) => d.statusProgres === filterStatus);
    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [data, search, filterTahapan, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: keyof Kegiatan) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari kegiatan, PIC, atau kontrak..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={filterTahapan} onValueChange={(v) => { setFilterTahapan(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tahapan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahapan</SelectItem>
            <SelectItem value="Perencanaan">Perencanaan</SelectItem>
            <SelectItem value="Pelaksanaan">Pelaksanaan</SelectItem>
            <SelectItem value="Pengawasan">Pengawasan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Belum">Belum</SelectItem>
            <SelectItem value="Proses">Proses</SelectItem>
            <SelectItem value="Selesai">Selesai</SelectItem>
            <SelectItem value="Tertunda">Tertunda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="font-semibold cursor-pointer" onClick={() => toggleSort("tahapan")}>
                <span className="flex items-center gap-1">Tahapan <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="font-semibold">Uraian Kegiatan</TableHead>
              <TableHead className="font-semibold cursor-pointer hidden md:table-cell" onClick={() => toggleSort("pic")}>
                <span className="flex items-center gap-1">PIC <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer" onClick={() => toggleSort("persentaseProgres")}>
                <span className="flex items-center gap-1">Progres <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Deadline</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((item) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${isOverdue(item) ? "bg-destructive/5" : ""}`}
                onClick={() => onSelect(item)}
              >
                <TableCell>
                  <Badge variant="outline" className="text-xs font-medium">{item.tahapan}</Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {item.uraianKegiatan}
                  {isOverdue(item) && <span className="ml-2 text-xs text-destructive font-semibold">⚠ Terlambat</span>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{item.pic}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${item.persentaseProgres}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{item.persentaseProgres}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusVariant(item.statusProgres)} text-xs border`}>{item.statusProgres}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell>
                  {item.linkBuktiDukung && (
                    <a href={item.linkBuktiDukung} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="h-4 w-4 text-accent hover:text-primary" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data ditemukan</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Menampilkan {paged.length} dari {filtered.length} kegiatan</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Hal {page + 1} / {Math.max(totalPages, 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
