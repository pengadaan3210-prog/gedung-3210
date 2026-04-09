import { useDokumentasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Dokumentasi = () => {
  const { data, isLoading, isError, refetch } = useDokumentasi();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  // Group by judulDokumen (kolom C) as the main title
  const allTitles = [...new Set(data.map((d) => d.judulDokumen).filter(Boolean))];

  // Filter titles based on search
  const filteredTitles = allTitles.filter((title) => {
    if (!search) return true;
    const titleMatch = title.toLowerCase().includes(search.toLowerCase());
    const items = data.filter((d) => d.judulDokumen === title);
    const contractMatch = items.some((item) => 
      item.nomorKontrak?.toLowerCase().includes(search.toLowerCase())
    );
    const picMatch = items.some((item) => 
      item.pic?.toLowerCase().includes(search.toLowerCase())
    );
    return titleMatch || contractMatch || picMatch;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTitles.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTitles = filteredTitles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arsip</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar dokumen kontrak dan bukti dukung kegiatan
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari dokumen..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="max-w-xs"
        />
      </div>

      {filteredTitles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada dokumen yang cocok dengan pencarian" : "Belum ada data dokumentasi"}
        </p>
      ) : (
        <div className="space-y-3">
          {paginatedTitles.map((title) => {
            const items = data.filter((d) => d.judulDokumen === title);
            return (
              <Card key={title} className="shadow-sm border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-accent" />
                    {title} {/* Kolom C as main title */}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{item.nomorKontrak}</p> {/* Kolom B as subtitle */}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{item.tahapan}</Badge>
                            {item.kategori && <Badge variant="outline" className="text-[10px]">{item.kategori}</Badge>}
                            <span className="text-[11px] text-muted-foreground">{item.pic}</span>
                          </div>
                        </div>
                        {item.linkDokumen && (
                          <a
                            href={item.linkDokumen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 ml-3 text-accent hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredTitles.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between py-3 px-2">
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} ({filteredTitles.length} dokumen)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goPage(1)}
              disabled={currentPage === 1}
              className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
            >
              Awal
            </button>
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
            >
              Berikut
            </button>
            <button
              onClick={() => goPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded px-3 py-1 border border-border bg-background text-sm disabled:opacity-50"
            >
              Akhir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dokumentasi;