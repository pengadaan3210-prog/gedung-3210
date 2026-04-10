import { useNotulen } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, MapPin, Users, FileText, Image, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isGoogleDriveUrl, getGoogleDriveImageUrl, getGoogleDriveViewUrl } from "@/lib/utils";

const NotulenPage = () => {
  const { data, isLoading, isError, refetch } = useNotulen();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const ITEMS_PER_PAGE = 8;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...data].sort((a, b) => {
    if (!a.tanggalRapat || !b.tanggalRapat) return 0;
    return new Date(b.tanggalRapat).getTime() - new Date(a.tanggalRapat).getTime();
  });

  const filtered = sorted.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.judulRapat?.toLowerCase().includes(s) ||
      item.ringkasan?.toLowerCase().includes(s) ||
      item.peserta?.toLowerCase().includes(s) ||
      item.jenisRapat?.toLowerCase().includes(s) ||
      item.tempat?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notulen Rapat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catatan dan dokumentasi seluruh rapat terkait proyek
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari notulen rapat..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada notulen yang cocok dengan pencarian" : "Belum ada data notulen"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedData.map((item) => {
            const findKey = (regex: RegExp) => {
              const key = Object.keys(item).find((k) => regex.test(k));
              return key ? (item as any)[key] : '';
            };

            const linkUndangan = item.linkUndangan || findKey(/link[_\s]*undangan/i) || '';
            const linkDaftarHadir = item.linkDaftarHadir || findKey(/link[_\s]*(daftar[_\s]*hadir|hadir)/i) || '';
            const linkNotulen = item.linkNotulen || findKey(/link[_\s]*notulen/i) || '';
            const linkDokumentasiFoto = item.linkDokumentasiFoto || findKey(/link[_\s]*(dokumentasi[_\s]*foto|dokumen)/i) || '';

            const isGDrive = linkDokumentasiFoto && isGoogleDriveUrl(linkDokumentasiFoto);
            const thumbnailUrl = isGDrive ? getGoogleDriveImageUrl(linkDokumentasiFoto) : linkDokumentasiFoto;
            const viewUrl = isGDrive ? getGoogleDriveViewUrl(linkDokumentasiFoto) : linkDokumentasiFoto;

            return (
              <Card key={item.id} className="shadow-sm border-border overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {thumbnailUrl && (
                      <div
                        className="w-full h-24 bg-muted rounded-lg border border-border/50 overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedImage({ ...item, thumbnailUrl, viewUrl })}
                      >
                        <img
                          src={thumbnailUrl}
                          alt="Dokumentasi"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.judulRapat}</h3>
                          {item.jenisRapat && (
                            <Badge variant="outline" className="text-[10px] shrink-0">{item.jenisRapat}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {item.tanggalRapat && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.tanggalRapat).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {item.tempat && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.tempat}</span>
                          )}
                          {item.peserta && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.peserta}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.ringkasan && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-foreground/80 leading-snug line-clamp-2 cursor-help">{item.ringkasan}</p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">{item.ringkasan}</TooltipContent>
                      </Tooltip>
                    )}

                    <div className="flex flex-wrap gap-2 gap-y-2">
                      {linkNotulen && (
                        <a href={linkNotulen} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium">
                          <FileText className="h-3 w-3" /> Lihat Notulen
                        </a>
                      )}
                      {linkDokumentasiFoto && (
                        <a href={linkDokumentasiFoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium">
                          <Image className="h-3 w-3" /> Foto Dokumentasi
                        </a>
                      )}
                      {linkUndangan && (
                        <a href={linkUndangan} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium">
                          <Mail className="h-3 w-3" /> Undangan
                        </a>
                      )}
                      {linkDaftarHadir && (
                        <a href={linkDaftarHadir} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium">
                          <Users className="h-3 w-3" /> Daftar Hadir
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{startIndex + 1}–{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} notulen</p>
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

      {/* Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">{selectedImage.judulRapat}</h2>
              {selectedImage.jenisRapat && <Badge variant="outline" className="w-fit">{selectedImage.jenisRapat}</Badge>}
              <div className="flex gap-2 flex-wrap text-sm text-muted-foreground">
                {selectedImage.tanggalRapat && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedImage.tanggalRapat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {selectedImage.tempat && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedImage.tempat}</span>}
                {selectedImage.peserta && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{selectedImage.peserta}</span>}
              </div>
              {selectedImage.ringkasan && <p className="text-sm text-muted-foreground">{selectedImage.ringkasan}</p>}
              {selectedImage.thumbnailUrl ? (
                <div className="space-y-4">
                  <img src={selectedImage.thumbnailUrl} alt={selectedImage.judulRapat} className="w-full rounded-lg" />
                  {selectedImage.viewUrl && (
                    <Button onClick={() => window.open(selectedImage.viewUrl, '_blank')} className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" /> Buka di Google Drive
                    </Button>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <Image className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotulenPage;
