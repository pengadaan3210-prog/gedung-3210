import { useState } from "react";
import { useFotoProgres } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Calendar, ExternalLink, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isGoogleDriveUrl, getGoogleDriveImageUrl, getGoogleDriveViewUrl } from "@/lib/utils";

const FotoProgresPage = () => {
  const { data, isLoading, isError, refetch } = useFotoProgres();
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterBulan, setFilterBulan] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const getDateFromItem = (item: any): Date | null => {
    if (!item.tanggal) return null;
    const date = new Date(item.tanggal);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const formatBulan = (item: any): string => {
    const raw = item.bulan?.trim();
    if (raw) return raw;

    const date = getDateFromItem(item);
    if (!date) return "Bulan belum ditetapkan";

    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  const getMingguKe = (item: any): number => {
    const raw = parseInt(item.mingguKe ?? item.minggu_ke);
    if (!Number.isNaN(raw) && raw > 0) return raw;

    const date = getDateFromItem(item);
    if (!date) return 0;

    return Math.ceil(date.getDate() / 7);
  };

  const kategoris = [...new Set(data.map((d) => d.kategori).filter(Boolean))];
  const bulanOptions = [...new Set(data.map((d) => formatBulan(d)).filter(Boolean))];

  const filteredByKategori = filterKategori === "all"
    ? data
    : data.filter((d) => d.kategori === filterKategori);

  const filtered = filterBulan === "all"
    ? filteredByKategori
    : filteredByKategori.filter((d) => formatBulan(d) === filterBulan);

  const sorted = [...filtered].sort((a, b) => {
    const aDate = getDateFromItem(a);
    const bDate = getDateFromItem(b);

    if (aDate && bDate) {
      if (aDate.getFullYear() !== bDate.getFullYear()) return bDate.getFullYear() - aDate.getFullYear();
      if (aDate.getMonth() !== bDate.getMonth()) return bDate.getMonth() - aDate.getMonth();
    } else if (aDate || bDate) {
      return bDate ? 1 : -1;
    }

    const aWeek = getMingguKe(a);
    const bWeek = getMingguKe(b);
    if (aWeek !== bWeek) return bWeek - aWeek;

    if (aDate && bDate) return bDate.getTime() - aDate.getTime();
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const displayItems = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const grouped = displayItems.reduce((acc, item) => {
    const bulanLabel = formatBulan(item);
    const mingguLabel = getMingguKe(item) ? `Minggu ke-${getMingguKe(item)}` : "Lainnya";

    if (!acc[bulanLabel]) acc[bulanLabel] = {};
    if (!acc[bulanLabel][mingguLabel]) acc[bulanLabel][mingguLabel] = [];
    acc[bulanLabel][mingguLabel].push(item);
    return acc;
  }, {} as Record<string, Record<string, typeof displayItems>>);

  const isNoItems = sorted.length === 0;
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foto Progres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dokumentasi visual progres pembangunan per minggu
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kategoris.length > 0 && (
            <Select value={filterKategori} onValueChange={(value) => { setFilterKategori(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoris.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {bulanOptions.length > 0 && (
            <Select value={filterBulan} onValueChange={(value) => { setFilterBulan(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {bulanOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada foto progres</p>
      ) : isNoItems ? (
        <p className="text-sm text-muted-foreground text-center py-12">Tidak ada foto progres untuk kombinasi filter saat ini</p>
      ) : (
        Object.entries(grouped).map(([bulan, mingguMap]) => (
          <div key={bulan} className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-2">Bulan: {bulan}</h2>

            {Object.entries(mingguMap).map(([week, items]) => (
              <div key={`${bulan}-${week}`} className="mb-6">
                <h3 className="text-sm font-semibold text-foreground dark:text-white mb-2">{week}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const isGDrive = item.linkFoto && isGoogleDriveUrl(item.linkFoto);
                    const thumbnailUrl = isGDrive ? getGoogleDriveImageUrl(item.linkFoto) : item.linkFoto;
                    const viewUrl = isGDrive ? getGoogleDriveViewUrl(item.linkFoto) : item.linkFoto;

                    return (
                      <Card
                        key={item.id}
                        className="shadow-sm border-border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                        onClick={() => setSelectedImage({ ...item, thumbnailUrl, viewUrl })}
                      >
                        <CardContent className="p-0">
                          {thumbnailUrl ? (
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                              <img
                                src={thumbnailUrl}
                                alt={item.judul}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden aspect-[4/3] bg-muted flex items-center justify-center absolute inset-0">
                                <div className="flex flex-col items-center gap-2">
                                  <ExternalLink className="h-6 w-6 text-muted-foreground/60" />
                                  <span className="text-xs text-muted-foreground">Buka link</span>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedImage({ ...item, thumbnailUrl, viewUrl }); }}>
                                  <Play className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="p-3 space-y-1.5">
                            <p className="text-sm font-medium text-foreground truncate">{item.judul}</p>
                            {item.deskripsi && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{item.deskripsi}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              {item.kategori && (
                                <Badge variant="outline" className="text-[10px]">{item.kategori}</Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px]">
                                {formatBulan(item)}
                              </Badge>
                              {item.tanggal && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} ({sorted.length} foto)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
            >Awal</Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
            >Sebelumnya</Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
            >Berikut</Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >Akhir</Button>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">{selectedImage.judul}</h2>
              </div>

              {selectedImage.deskripsi && (
                <p className="text-sm text-muted-foreground">{selectedImage.deskripsi}</p>
              )}

              <div className="flex gap-2 flex-wrap">
                {selectedImage.kategori && (
                  <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">{selectedImage.kategori}</span>
                )}
                {selectedImage.tanggal && (
                  <span className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedImage.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              {selectedImage.thumbnailUrl ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage.thumbnailUrl}
                    alt={selectedImage.judul}
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
                  <Image className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FotoProgresPage;
