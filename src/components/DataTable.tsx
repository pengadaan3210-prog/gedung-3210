import { useMemo, useState } from "react";
import { Kegiatan } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface DataTableProps {
  data: Kegiatan[];
  onSelect: (item: Kegiatan) => void;
}

const PAGE_SIZE = 8;

const DataTable = ({ data, onSelect }: DataTableProps) => {
  const [search, setSearch] = useState("");
  const [tahapanFilter, setTahapanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const tahapanOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.tahapan).filter(Boolean))),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      const matchSearch =
        !q ||
        [d.dokumen, d.namaFile, d.penyedia, d.tahapan, d.keterangan]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchTahapan = tahapanFilter === "all" || d.tahapan === tahapanFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "terpenuhi" ? d.status : !d.status);
      return matchSearch && matchTahapan && matchStatus;
    });
  }, [data, search, tahapanFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari dokumen, nama file, penyedia..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={tahapanFilter}
          onValueChange={(v) => {
            setTahapanFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Semua Tahapan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahapan</SelectItem>
            {tahapanOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="terpenuhi">Terpenuhi</SelectItem>
            <SelectItem value="belum">Belum Terpenuhi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 whitespace-nowrap">No</TableHead>
                <TableHead className="whitespace-nowrap">Tahapan</TableHead>
                <TableHead className="min-w-[200px]">Dokumen</TableHead>
                <TableHead className="whitespace-nowrap">Penyedia</TableHead>
                <TableHead className="min-w-[220px]">Nama File</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="min-w-[160px]">Keterangan</TableHead>
                <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
              {pageItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40">
                  <TableCell className="text-muted-foreground text-xs">{item.id}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{item.tahapan || "-"}</TableCell>
                  <TableCell className="text-sm font-medium break-words">{item.dokumen || "-"}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{item.penyedia || "-"}</TableCell>
                  <TableCell className="text-xs break-words">{item.namaFile || "-"}</TableCell>
                  <TableCell>
                    {item.status ? (
                      <Badge className="bg-success/15 text-success border border-success/30 gap-1 whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" /> Terpenuhi
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border border-destructive/30 gap-1 whitespace-nowrap">
                        <XCircle className="h-3 w-3" /> Belum
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground break-words">
                    {item.keterangan || "-"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onSelect(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.linkDokumen && item.linkDokumen.startsWith("http") && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.linkDokumen} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} dokumen
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
