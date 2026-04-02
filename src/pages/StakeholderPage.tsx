import { useStakeholder } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StakeholderDetailModal from "@/components/StakeholderDetailModal";
import { Stakeholder } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  Aktif: "bg-green-100 text-green-800",
  Selesai: "bg-blue-100 text-blue-800",
  Monitoring: "bg-yellow-100 text-yellow-800",
};

const PENGARUH_COLORS: Record<string, string> = {
  Tinggi: "bg-red-100 text-red-800",
  Sedang: "bg-yellow-100 text-yellow-800",
  Rendah: "bg-green-100 text-green-800",
};

const StakeholderPage = () => {
  const { data, isLoading, isError, refetch } = useStakeholder();
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState<Stakeholder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const filtered = data.filter((item) => {
    const matchSearch = !search || 
      item.namaStakeholder.toLowerCase().includes(search.toLowerCase()) ||
      item.peranStakeholder.toLowerCase().includes(search.toLowerCase());
    const matchKategori = kategoriFilter === "Semua" || item.kategori === kategoriFilter;
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    return matchSearch && matchKategori && matchStatus;
  });

  const kategoris = ["Semua", ...new Set(data.map((d) => d.kategori).filter(Boolean))];
  const statuses = ["Semua", ...new Set(data.map((d) => d.status).filter(Boolean))];

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const goPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" /> Stakeholder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar stakeholder dan strategi pendekatan
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari stakeholder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {kategoris.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama Stakeholder</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Kepentingan</TableHead>
                  <TableHead>Pengaruh</TableHead>
                  <TableHead>Potensi Dukungan/Risiko</TableHead>
                  <TableHead>Strategi Pendekatan</TableHead>
                  <TableHead>Tindak Lanjut</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead>Bukti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Tidak ada data stakeholder
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell className="text-sm">{startIndex + idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{item.namaStakeholder}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={item.peranStakeholder}>{item.peranStakeholder}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={item.kepentingan}>{item.kepentingan}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${PENGARUH_COLORS[item.tingkatPengaruh] || ''}`}>
                          {item.tingkatPengaruh || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={item.potensiDukunganRisiko}>{item.potensiDukunganRisiko || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate" title={item.strategiPendekatan}>{item.strategiPendekatan || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate" title={item.tindakLanjut}>{item.tindakLanjut || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate" title={item.outputYangDiharapkan}>{item.outputYangDiharapkan || '-'}</TableCell>
                      <TableCell className="text-sm">{item.pic || '-'}</TableCell>
                      <TableCell>
                        {item.buktiDukung ? (
                          <a href={item.buktiDukung} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between py-3 px-2">
        <span className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goPage(1)}
            disabled={currentPage === 1}
            className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
          >Awal</button>
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
          >Sebelumnya</button>
          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
          >Berikut</button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
          >Akhir</button>
        </div>
      </div>

      <StakeholderDetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default StakeholderPage;
