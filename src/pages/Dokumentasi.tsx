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
  const ITEMS_PER_PAGE = 10;

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedTitles.map((title) => {
            const items = data.filter((d) => d.judulDokumen === title);
            return (
              <Card key={title} className="shadow-md border-border/50 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground line-clamp-2">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={item.id} className={`flex items-start justify-between gap-3 pb-3 ${idx < items.length - 1 ? 'border-b border-border/30' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.nomorKontrak}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="secondary" className="text-[11px] font-medium">{item.tahapan}</Badge>
                            {item.kategori && <Badge variant="outline" className="text-[11px]">{item.kategori}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">{item.pic}</p>
                        </div>
                        {item.linkDokumen && (
                          <a
                            href={item.linkDokumen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary hover:text-primary/80"
                            title="Buka dokumen"
                          >
                            <ExternalLink className="h-5 w-5" />
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
        <div className="flex items-center justify-between py-4 px-2 border-t border-border/30">
          <span className="text-sm text-muted-foreground font-medium">
            Halaman {currentPage} dari {totalPages} ({filteredTitles.length} dokumen)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goPage(1)}
              disabled={currentPage === 1}
              className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Awal
            </button>
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikut
            </button>
            <button
              onClick={() => goPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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