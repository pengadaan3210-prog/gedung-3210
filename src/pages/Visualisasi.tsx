import { useVisualisasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Cuboid, Play, Image, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  isGoogleDriveUrl, 
  getGoogleDriveEmbedUrl,
  getGoogleDriveViewUrl 
} from "@/lib/utils";

const Visualisasi = () => {
  const { data, isLoading, isError, error, refetch } = useVisualisasi();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return (
    <div className="p-6">
      <ErrorState 
        message="Gagal memuat data Visualisasi"
        error={error as Error | null}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => {
              const isGDriveUrl = isGoogleDriveUrl(img.url);
              const viewUrl = isGDriveUrl ? getGoogleDriveViewUrl(img.url) : img.url;
              
              return (
                <Card key={img.id} className="shadow-sm border-border overflow-hidden hover:shadow-md transition-shadow group">
                  <CardContent className="p-0">
                    {img.url ? (
                      <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden">
                        {isGDriveUrl ? (
                          <div className="aspect-square bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <div className="text-center space-y-2">
                              <FileText className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                              <p className="text-xs font-medium text-muted-foreground">Lihat di Drive</p>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={img.url} 
                            alt={img.judul} 
                            className="aspect-square object-cover w-full group-hover:scale-105 transition-transform"
                          />
                        )}
                      </a>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">{img.judul}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/40" />
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
