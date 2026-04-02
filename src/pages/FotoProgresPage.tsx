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
  const [selectedImage, setSelectedImage] = useState<any>(null);

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const kategoris = [...new Set(data.map((d) => d.kategori).filter(Boolean))];

  const filtered = filterKategori === "all"
    ? data
    : data.filter((d) => d.kategori === filterKategori);

  // Sort descending: highest mingguKe first, then newest date first
  const sorted = [...filtered].sort((a, b) => {
    if (a.mingguKe !== b.mingguKe) return b.mingguKe - a.mingguKe;
    if (!a.tanggal || !b.tanggal) return 0;
    return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
  });

  // Group by minggu_ke
  const grouped = sorted.reduce((acc, item) => {
    const key = item.mingguKe ? `Minggu ke-${item.mingguKe}` : "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof sorted>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foto Progres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dokumentasi visual progres pembangunan per minggu
          </p>
        </div>
        {kategoris.length > 0 && (
          <Select value={filterKategori} onValueChange={setFilterKategori}>
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
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada foto progres</p>
      ) : (
        Object.entries(grouped).map(([week, items]) => (
          <div key={week}>
            <h2 className="text-base font-bold text-foreground mb-3">{week}</h2>
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
                        <div className="flex items-center gap-2">
                          {item.kategori && (
                            <Badge variant="outline" className="text-[10px]">{item.kategori}</Badge>
                          )}
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
        ))
      )}

      {/* Lightbox Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">{selectedImage.judul}</h2>
                <button onClick={() => setSelectedImage(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-6 w-6" />
                </button>
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
