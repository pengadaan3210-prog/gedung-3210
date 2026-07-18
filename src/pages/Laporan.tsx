import { useLaporan } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { isGoogleDriveUrl, getGoogleDriveImageUrl } from "@/lib/utils";

const formatTanggalID = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const Laporan = () => {
  const { data, isLoading, isError, refetch } = useLaporan();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...(data || [])].sort((a: any, b: any) => {
    const da = a.tanggalLaporan ? new Date(a.tanggalLaporan).getTime() : 0;
    const db = b.tanggalLaporan ? new Date(b.tanggalLaporan).getTime() : 0;
    return db - da;
  });

  const filtered = sorted.filter((d: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.judulLaporan?.toLowerCase().includes(s) ||
      d.tahapan?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">Daftar laporan per tahapan, diurutkan dari tanggal terbaru</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari laporan..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada laporan yang cocok dengan pencarian" : "Belum ada data laporan"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginated.map((item: any) => {
            const link = item.linkLaporan;
            const thumbnailUrl = link && (isGoogleDriveUrl(link)
              ? getGoogleDriveImageUrl(link)
              : /\.(jpe?g|png|webp|gif|svg)$/i.test(link) ? link : null);
            return (
            <a
              key={item.id}
              href={item.linkLaporan || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl bg-card border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={item.judulLaporan}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                    <FileBarChart className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" />
                </div>
              </div>
              <div className="p-3.5 space-y-2">
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.judulLaporan || "Tanpa Judul"}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tahapan && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">{item.tahapan}</Badge>
                  )}
                  {item.tanggalLaporan && (
                    <span className="text-[10px] text-muted-foreground">{formatTanggalID(item.tanggalLaporan)}</span>
                  )}
                </div>
              </div>
            </a>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{startIndex + 1}–{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} laporan</p>
            <p>Halaman {safePage} dari {totalPages}</p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => goPage(safePage - 1)} disabled={safePage === 1} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background text-sm hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                ) : (
                  <button key={p} onClick={() => goPage(p)} className={`inline-flex items-center justify-center h-8 min-w-[2rem] rounded-md border text-sm font-medium transition-colors ${p === safePage ? 'border-primary bg-primary text-primary-foreground' : 'border-border/40 bg-background hover:bg-muted/60'}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background text-sm hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Laporan;
