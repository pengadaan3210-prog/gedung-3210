import { useDokumentasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { isGoogleDriveUrl, getGoogleDriveImageUrl } from "@/lib/utils";

const Dokumentasi = () => {
  const { data, isLoading, isError, refetch } = useDokumentasi();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

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
  const currentStart = filteredTitles.length > 0 ? startIndex + 1 : 0;
  const currentEnd = Math.min(filteredTitles.length, startIndex + paginatedTitles.length);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedTitles.map((title) => {
            const items = data.filter((d) => d.judulDokumen === title);
            const firstItem = items[0];
            const imageLink = firstItem?.linkDokumen;
            const thumbnailUrl = imageLink && (isGoogleDriveUrl(imageLink)
              ? getGoogleDriveImageUrl(imageLink)
              : /\.(jpe?g|png|webp|gif|svg)$/i.test(imageLink)
                ? imageLink
                : null);

            return (
              <Card key={title} className="overflow-hidden border border-border/30 bg-background shadow-sm hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="relative w-full aspect-[4/3] bg-slate-100">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Arsip</p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-slate-950/70 to-transparent p-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-100">Dokumen Arsip</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{title}</h3>
                        {firstItem?.nomorKontrak && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{firstItem.nomorKontrak}</p>
                        )}
                      </div>
                      <a
                        href={firstItem?.linkDokumen || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 text-primary transition hover:bg-primary/10"
                        title="Buka dokumen"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {firstItem?.tahapan && (
                        <Badge variant="outline" className="text-[10px]">{firstItem.tahapan}</Badge>
                      )}
                      {firstItem?.kategori && (
                        <Badge variant="outline" className="text-[10px]">{firstItem.kategori}</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {firstItem?.pic && <span>{firstItem.pic}</span>}
                      <span className="rounded-full bg-muted px-2 py-1">{items.length} dokumen</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredTitles.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4 px-2 border-t border-border/30">
          <span className="text-sm text-muted-foreground font-medium">
            Menampilkan {currentStart}-{currentEnd} dari {filteredTitles.length} dokumen · Halaman {currentPage} dari {totalPages}
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