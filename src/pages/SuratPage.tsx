import { useState } from "react";
import { useSurat } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const formatTanggalID = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const SuratPage = () => {
  const { data, isLoading, isError, refetch } = useSurat();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...(data || [])].sort((a: any, b: any) => {
    const da = a.tanggalSurat ? new Date(a.tanggalSurat).getTime() : 0;
    const db = b.tanggalSurat ? new Date(b.tanggalSurat).getTime() : 0;
    return db - da;
  });

  const filtered = sorted.filter((d: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.nomorSurat?.toLowerCase().includes(s) ||
      d.judulSurat?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Surat</h1>
        <p className="text-sm text-muted-foreground mt-1">Daftar surat, diurutkan dari tanggal terbaru</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari nomor atau judul surat..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-sm"
        />
      </div>

      <div className="border border-border/40 rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">No</TableHead>
              <TableHead className="whitespace-nowrap">Tanggal</TableHead>
              <TableHead className="whitespace-nowrap">Nomor Surat</TableHead>
              <TableHead>Judul Surat</TableHead>
              <TableHead className="text-center whitespace-nowrap">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  {search ? "Tidak ada surat yang cocok dengan pencarian" : "Belum ada data surat"}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((item: any, idx: number) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatTanggalID(item.tanggalSurat)}</TableCell>
                  <TableCell className="text-sm font-mono whitespace-nowrap">{item.nomorSurat || "-"}</TableCell>
                  <TableCell className="text-sm break-words">{item.judulSurat || "-"}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {item.linkSurat ? (
                      <a href={item.linkSurat} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Buka
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2 px-1">
          <div className="text-sm text-muted-foreground">
            {startIndex + 1}–{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} surat · Halaman {safePage} dari {totalPages}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm">{safePage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuratPage;
