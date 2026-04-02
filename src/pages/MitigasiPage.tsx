import { useMitigasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import MitigasiDetailModal from "@/components/MitigasiDetailModal";
import { Mitigasi } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  Selesai: "bg-green-100 text-green-800",
  Proses: "bg-blue-100 text-blue-800",
  Belum: "bg-gray-100 text-gray-800",
};

const RISIKO_COLORS: Record<string, string> = {
  Tinggi: "bg-red-100 text-red-800",
  Sedang: "bg-yellow-100 text-yellow-800",
  Rendah: "bg-green-100 text-green-800",
};

const MitigasiPage = () => {
  const { data, isLoading, isError, refetch } = useMitigasi();
  const [search, setSearch] = useState("");
  const [sumberFilter, setSumberFilter] = useState("Semua");
  const [selected, setSelected] = useState<Mitigasi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const filtered = data.filter((item) => {
    const matchSearch = !search ||
      item.uraianRisiko.toLowerCase().includes(search.toLowerCase()) ||
      item.kategoriRisiko.toLowerCase().includes(search.toLowerCase());
    const matchSumber = sumberFilter === "Semua" || item.sumberRisiko === sumberFilter;
    return matchSearch && matchSumber;
  });

  const sumbers = ["Semua", ...new Set(data.map((d) => d.sumberRisiko).filter(Boolean))];

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
          <ShieldAlert className="h-6 w-6" /> Potensi Masalah
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identifikasi potensi masalah dan rencana penanganan
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari risiko..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sumberFilter} onValueChange={setSumberFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sumbers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <TableHead>Sumber</TableHead>
                  <TableHead>Uraian Risiko</TableHead>
                  <TableHead>Mitigasi / Solusi</TableHead>
                  <TableHead>Tindak Lanjut</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead>Target Waktu</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Bukti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Tidak ada data mitigasi
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell className="text-sm">{startIndex + idx + 1}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.sumberRisiko}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate" title={item.uraianRisiko}>{item.uraianRisiko}</TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate" title={item.mitigasiSolusi}>{item.mitigasiSolusi || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate" title={item.tindakLanjut}>{item.tindakLanjut || '-'}</TableCell>
                      <TableCell className="text-sm">{item.pic || '-'}</TableCell>
                      <TableCell className="text-sm">{item.targetWaktu || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${RISIKO_COLORS[item.tingkatRisiko] || ''}`}>
                          {item.tingkatRisiko || '-'}
                        </Badge>
                      </TableCell>
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

      <MitigasiDetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default MitigasiPage;
