import { useSurat } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { ExternalLink, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const formatTanggalID = (iso: string) => {
  if (!iso) return "";
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
  const ITEMS_PER_PAGE = 8;

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
        <h1 className="text-2xl font-bold text-foreground">Surat</h1>
        <p className="text-sm text-muted-foreground mt-1">Daftar surat masuk dan keluar</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari surat..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada surat yang cocok dengan pencarian" : "Belum ada data surat"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginated.map((item: any) => (
            <a
              key={item.id}
              href={item.linkSurat || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl bg-card border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                  <Mail className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" />
                </div>
                {item.tanggalSurat && (
                  <span className="absolute top-2 right-2 text-[10px] font-semibold bg-background/80 backdrop-blur-sm text-foreground rounded-full px-2 py-0.5 border border-border/30">
                    {formatTanggalID(item.tanggalSurat)}
                  </span>
                )}
              </div>
              <div className="p-3.5 space-y-2">
                <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.judulSurat || "Tanpa Judul"}
                </h3>
                {item.nomorSurat && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{item.nomorSurat}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{startIndex + 1}–{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} surat</p>
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

export default SuratPage;
