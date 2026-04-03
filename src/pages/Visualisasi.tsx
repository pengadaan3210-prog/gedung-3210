import { useState } from "react";
import { useVisualisasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Cuboid, Play, Image, ExternalLink, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  isGoogleDriveUrl, 
  getGoogleDriveEmbedUrl,
  getGoogleDriveViewUrl,
  getGoogleDriveImageUrl
} from "@/lib/utils";

const Visualisasi = () => {
  const { data, isLoading, isError, error, refetch } = useVisualisasi();
  const [selectedImage, setSelectedImage] = useState<any>(null);

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return (
    <div className="p-6">
      <ErrorState 
        message="Gagal memuat data Visualisasi"
        onRetry={() => refetch()} 
      />
    </div>
  );

  const videos = data.filter((d) => d.tipe === "Video").sort((a, b) => a.urutan - b.urutan);
  const models = data.filter((d) => d.tipe === "Model3D").sort((a, b) => a.urutan - b.urutan);
  const images = data.filter((d) => d.tipe === "Gambar").sort((a, b) => a.urutan - b.urutan);

  const hasData = data.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visualisasi Proyek</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tampilan 3D dan video animasi Gedung Kantor BPS Kabupaten Majalengka
        </p>
      </div>

      {/* Videos & 3D Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {videos.length > 0 ? (
          videos.map((v) => {
            const isGDriveUrl = isGoogleDriveUrl(v.url);
            const embedUrl = isGDriveUrl ? getGoogleDriveEmbedUrl(v.url) : v.url;
            const viewUrl = isGDriveUrl ? getGoogleDriveViewUrl(v.url) : null;
            
            return (
              <Card key={v.id} className="shadow-md border-border overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {embedUrl ? (
                    <div className="aspect-video bg-black">
                      <iframe
                        src={embedUrl}
                        title={v.judul}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-primary/5 flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Play className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-center px-4">{v.judul}</p>
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{v.judul}</p>
                      {v.deskripsi && <p className="text-xs text-muted-foreground mt-1">{v.deskripsi}</p>}
                    </div>
                    {v.url && viewUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(viewUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka File
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-md border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-primary/5 flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <Play className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center px-6">
                  <p className="text-sm font-semibold text-foreground">Video Animasi 3D Gedung</p>
                  <p className="text-xs text-muted-foreground mt-1">Tambahkan data di sheet Visualisasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {models.length > 0 ? (
          models.map((m) => {
            const isGDriveUrl = isGoogleDriveUrl(m.url);
            const embedUrl = isGDriveUrl ? getGoogleDriveEmbedUrl(m.url) : m.url;
            const viewUrl = isGDriveUrl ? getGoogleDriveViewUrl(m.url) : null;
            
            return (
              <Card key={m.id} className="shadow-md border-border overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {embedUrl ? (
                    <div className="aspect-video bg-black">
                      <iframe 
                        src={embedUrl} 
                        title={m.judul} 
                        className="w-full h-full"
                        allowFullScreen 
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-accent/5 flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-accent/10">
                        <Cuboid className="h-10 w-10 text-accent" />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-center px-4">{m.judul}</p>
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.judul}</p>
                      {m.deskripsi && <p className="text-xs text-muted-foreground mt-1">{m.deskripsi}</p>}
                    </div>
                    {m.url && viewUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(viewUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka File
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-md border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-accent/5 flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-accent/10">
                  <Cuboid className="h-10 w-10 text-accent" />
                </div>
                <div className="text-center px-6">
                  <p className="text-sm font-semibold text-foreground">Model 3D Gedung</p>
                  <p className="text-xs text-muted-foreground mt-1">Tambahkan data di sheet Visualisasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gallery */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Galeri Desain</h2>
        {images.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {images.map((img) => {
                const isGDriveUrl = isGoogleDriveUrl(img.url);
                const imageUrl = isGDriveUrl ? getGoogleDriveImageUrl(img.url) : img.url;
                const viewUrl = isGDriveUrl ? getGoogleDriveViewUrl(img.url) : img.url;
                
                return (
                  <Card key={img.id} className="shadow-md border-border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setSelectedImage(img)}>
                    <CardContent className="p-0">
                      {imageUrl ? (
                        <div className="relative overflow-hidden bg-black/50 aspect-square flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <img 
                            src={imageUrl} 
                            alt={img.judul} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}>
                              <Play className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            {viewUrl && (
                              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); window.open(viewUrl, '_blank'); }}>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-semibold text-foreground line-clamp-2">{img.judul}</p>
                        {img.deskripsi && <p className="text-xs text-muted-foreground line-clamp-1">{img.deskripsi}</p>}
                        {img.kategori && <div><span className="inline-block text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">{img.kategori}</span></div>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Preview Modal */}
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

                    {selectedImage.kategori && (
                      <div className="flex gap-2">
                        <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">{selectedImage.kategori}</span>
                      </div>
                    )}

                    {isGoogleDriveUrl(selectedImage.url) ? (
                      <div className="space-y-4">
                        {/* Check if it's likely an image by looking at the file */}
                        <img 
                          src={getGoogleDriveImageUrl(selectedImage.url)} 
                          alt={selectedImage.judul} 
                          className="w-full rounded-lg"
                          onError={() => {
                            // Fallback UI if image fails to load
                          }}
                        />
                        <Button 
                          onClick={() => window.open(getGoogleDriveViewUrl(selectedImage.url), '_blank')} 
                          className="w-full gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Buka di Google Drive
                        </Button>
                      </div>
                    ) : (
                      <img src={selectedImage.url} alt={selectedImage.judul} className="w-full rounded-lg" />
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-md border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {images.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Tambahkan data gambar di sheet Visualisasi dengan tipe "Gambar"
          </p>
        )}
      </div>
    </div>
  );
};

export default Visualisasi;
