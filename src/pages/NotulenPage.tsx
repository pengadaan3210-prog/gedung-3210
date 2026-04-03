import { useNotulen } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, MapPin, Users, FileText, Image, X, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { isGoogleDriveUrl, getGoogleDriveImageUrl, getGoogleDriveViewUrl } from "@/lib/utils";

const NotulenPage = () => {
  const { data, isLoading, isError, refetch } = useNotulen();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const ITEMS_PER_PAGE = 16;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...data].sort((a, b) => {
    if (!a.tanggalRapat || !b.tanggalRapat) return 0;
    return new Date(b.tanggalRapat).getTime() - new Date(a.tanggalRapat).getTime();
  });

  // Filter based on search
  const filtered = sorted.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.judulRapat?.toLowerCase().includes(searchLower) ||
      item.ringkasan?.toLowerCase().includes(searchLower) ||
      item.peserta?.toLowerCase().includes(searchLower) ||
      item.jenisRapat?.toLowerCase().includes(searchLower) ||
      item.tempat?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
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
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada notulen yang cocok dengan pencarian" : "Belum ada data notulen"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {paginatedData.map((item) => {
            const findKey = (regex: RegExp) => {
              const key = Object.keys(item).find((k) => regex.test(k));
              return key ? (item as any)[key] : '';
            };

            const linkUndangan =
              item.linkUndangan ||
              item.link_undangan ||
              item.linkundangan ||
              findKey(/link[_\s]*undangan/i) ||
              '';
            const linkDaftarHadir =
              item.linkDaftarHadir ||
              item.link_daftar_hadir ||
              item.linkdaftarhadir ||
              findKey(/link[_\s]*(daftar[_\s]*hadir|hadir)/i) ||
              '';
            const linkNotulen =
              item.linkNotulen ||
              item.link_notulen ||
              item.linknotulen ||
              findKey(/link[_\s]*notulen/i) ||
              '';
            const linkDokumentasiFoto =
              item.linkDokumentasiFoto ||
              item.link_dokumentasi_foto ||
              item.linkdokumentasifoto ||
              findKey(/link[_\s]*(dokumentasi[_\s]*foto|dokumen)/i) ||
              '';

            console.log('Notulen item raw:', item);
            console.log('Notulen item links:', item.id, linkNotulen, linkDokumentasiFoto, linkUndangan, linkDaftarHadir);

            const isGDrive = linkDokumentasiFoto && isGoogleDriveUrl(linkDokumentasiFoto);
            const thumbnailUrl = isGDrive ? getGoogleDriveImageUrl(linkDokumentasiFoto) : linkDokumentasiFoto;
            const viewUrl = isGDrive ? getGoogleDriveViewUrl(linkDokumentasiFoto) : linkDokumentasiFoto;

            return (
              <Card key={item.id} className="shadow-sm border-border overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {thumbnailUrl && (
                      <div 
                        className="w-full h-16 bg-muted rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setSelectedImage({ ...item, thumbnailUrl, viewUrl })}
                      >
                        <img
                          src={thumbnailUrl}
                          alt="Dokumentasi"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', thumbnailUrl);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                          onLoad={() => console.log('Image loaded successfully:', thumbnailUrl)}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-muted-foreground absolute inset-0 bg-muted">
                          <div className="flex flex-col items-center gap-1">
                            <Image className="w-5 h-5" />
                            <span className="text-xs">Gambar</span>
                          </div>
                        </div>
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
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {item.tanggalRapat && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.tanggalRapat).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {item.tempat && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.tempat}
                            </span>
                          )}
                          {item.peserta && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.peserta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.ringkasan && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-foreground/80 leading-snug line-clamp-2 cursor-help">{item.ringkasan}</p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          {item.ringkasan}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <div className="flex flex-wrap gap-3 gap-y-2">
                      {linkNotulen && (
                        <a
                          href={linkNotulen}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium"
                        >
                          <FileText className="h-3 w-3" /> Lihat Notulen
                        </a>
                      )}
                      {linkDokumentasiFoto && (
                        <a
                          href={linkDokumentasiFoto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium"
                        >
                          <Image className="h-3 w-3" /> Foto Dokumentasi
                        </a>
                      )}
                      {linkUndangan && (
                        <a
                          href={linkUndangan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium"
                        >
                          <Mail className="h-3 w-3" /> Undangan
                        </a>
                      )}
                      {linkDaftarHadir && (
                        <a
                          href={linkDaftarHadir}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-primary font-medium"
                        >
                          <Users className="h-3 w-3" /> Daftar Hadir
                        </a>
                      )}

                      {!linkUndangan && !linkDaftarHadir && (
                        <span className="text-xs text-muted-foreground">Undangan/Daftar Hadir tidak tersedia</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between py-3 px-2">
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} ({filtered.length} notulen)
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

      {/* Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">{selectedImage.judulRapat}</h2>
              </div>

              {selectedImage.jenisRapat && (
                <Badge variant="outline" className="w-fit">{selectedImage.jenisRapat}</Badge>
              )}

              <div className="flex gap-2 flex-wrap text-sm text-muted-foreground">
                {selectedImage.tanggalRapat && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedImage.tanggalRapat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {selectedImage.tempat && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedImage.tempat}
                  </span>
                )}
                {selectedImage.peserta && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedImage.peserta}
                  </span>
                )}
              </div>

              {selectedImage.ringkasan && (
                <p className="text-sm text-muted-foreground">{selectedImage.ringkasan}</p>
              )}

              {selectedImage.thumbnailUrl ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage.thumbnailUrl}
                    alt={selectedImage.judulRapat}
                    className="w-full rounded-lg"
                  />
                  {selectedImage.viewUrl && (
                    <Button
                      onClick={() => window.open(selectedImage.viewUrl, '_blank')}
                      className="w-full gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka di Google Drive
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
