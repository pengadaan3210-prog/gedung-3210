import { useVisualisasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Cuboid, Play, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Visualisasi = () => {
  const { data, isLoading, isError, refetch } = useVisualisasi();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

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
          videos.map((v) => (
            <Card key={v.id} className="shadow-md border-border overflow-hidden">
              <CardContent className="p-0">
                {v.url ? (
                  <div className="aspect-video">
                    <iframe
                      src={v.url}
                      title={v.judul}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-primary/5 flex flex-col items-center justify-center gap-3">
                    <Play className="h-10 w-10 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{v.judul}</p>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{v.judul}</p>
                  {v.deskripsi && <p className="text-xs text-muted-foreground mt-1">{v.deskripsi}</p>}
                </div>
              </CardContent>
            </Card>
          ))
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
          models.map((m) => (
            <Card key={m.id} className="shadow-md border-border overflow-hidden">
              <CardContent className="p-0">
                {m.url ? (
                  <div className="aspect-video">
                    <iframe src={m.url} title={m.judul} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <div className="aspect-video bg-accent/5 flex flex-col items-center justify-center gap-3">
                    <Cuboid className="h-10 w-10 text-accent" />
                    <p className="text-sm font-semibold text-foreground">{m.judul}</p>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{m.judul}</p>
                  {m.deskripsi && <p className="text-xs text-muted-foreground mt-1">{m.deskripsi}</p>}
                </div>
              </CardContent>
            </Card>
          ))
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
            {images.map((img) => (
              <Card key={img.id} className="shadow-sm border-border overflow-hidden">
                <CardContent className="p-0">
                  {img.url ? (
                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={img.judul} className="aspect-square object-cover w-full" />
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
            ))}
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
