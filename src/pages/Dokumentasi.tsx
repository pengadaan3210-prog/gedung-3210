import { useDokumentasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
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

  const allTitles = [...new Set(data.map((d) => d.judulDokumen).filter(Boolean))];

  // Sort titles by latest upload date (newest first)
  const sortedTitles = allTitles.sort((a, b) => {
    const itemsA = data.filter((d) => d.judulDokumen === a);
    const itemsB = data.filter((d) => d.judulDokumen === b);
    const latestA = itemsA.reduce((latest, item) => {
      if (!item.tanggalUpload) return latest;
      const dateA = new Date(item.tanggalUpload).getTime();
      return dateA > latest ? dateA : latest;
    }, 0);
    const latestB = itemsB.reduce((latest, item) => {
      if (!item.tanggalUpload) return latest;
      const dateB = new Date(item.tanggalUpload).getTime();
      return dateB > latest ? dateB : latest;
    }, 0);
    return latestB - latestA; // Newest first
  });

  const filteredTitles = sortedTitles.filter((title) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const titleMatch = title.toLowerCase().includes(s);
    const items = data.filter((d) => d.judulDokumen === title);
    return titleMatch || items.some((i) => i.nomorKontrak?.toLowerCase().includes(s) || i.pic?.toLowerCase().includes(s));
  });

  const totalPages = Math.max(1, Math.ceil(filteredTitles.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedTitles = filteredTitles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arsip</h1>
        <p className="text-sm text-muted-foreground mt-1">Daftar dokumen kontrak dan bukti dukung kegiatan</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari dokumen..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-xs"
        />
      </div>

      {filteredTitles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada dokumen yang cocok dengan pencarian" : "Belum ada data dokumentasi"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginatedTitles.map((title) => {
            const items = data.filter((d) => d.judulDokumen === title);
            const firstItem = items[0];
            const imageLink = firstItem?.linkDokumen;
            const thumbnailUrl = imageLink && (isGoogleDriveUrl(imageLink)
              ? getGoogleDriveImageUrl(imageLink)
              : /\.(jpe?g|png|webp|gif|svg)$/i.test(imageLink) ? imageLink : null);

            return (
              <a
                key={title}
                href={firstItem?.linkDokumen || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl bg-card border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                  {/* Item count badge */}
                  <span className="absolute top-2 right-2 text-[10px] font-semibold bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-0.5 border border-border/30">
                    {items.length} file
                  </span>
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {firstItem?.nomorKontrak && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{firstItem.nomorKontrak}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {firstItem?.tahapan && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">{firstItem.tahapan}</Badge>
                    )}
                    {firstItem?.kategori && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium">{firstItem.kategori}</Badge>
                    )}
                  </div>
                  {firstItem?.pic && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" />
                      {firstItem.pic}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredTitles.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{startIndex + 1}–{Math.min(filteredTitles.length, startIndex + ITEMS_PER_PAGE)} dari {filteredTitles.length} dokumen</p>
            <p>Halaman {safePage} dari {totalPages}</p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(safePage - 1)}
                disabled={safePage === 1}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background text-sm hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`inline-flex items-center justify-center h-8 min-w-[2rem] rounded-md border text-sm font-medium transition-colors ${
                      p === safePage
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/40 bg-background hover:bg-muted/60'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background text-sm hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dokumentasi;
