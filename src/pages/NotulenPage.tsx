import { useNotulen } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, MapPin, Users, FileText, Image } from "lucide-react";

const NotulenPage = () => {
  const { data, isLoading, isError, refetch } = useNotulen();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...data].sort((a, b) => {
    if (!a.tanggalRapat || !b.tanggalRapat) return 0;
    return new Date(b.tanggalRapat).getTime() - new Date(a.tanggalRapat).getTime();
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notulen Rapat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catatan dan dokumentasi seluruh rapat terkait proyek
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada data notulen</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <Card key={item.id} className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {item.judulRapat}
                  </CardTitle>
                  {item.jenisRapat && (
                    <Badge variant="outline" className="text-[10px] w-fit">{item.jenisRapat}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {item.tanggalRapat && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.tanggalRapat).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  {item.tempat && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.tempat}
                    </span>
                  )}
                  {item.peserta && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {item.peserta}
                    </span>
                  )}
                </div>

                {item.ringkasan && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.ringkasan}</p>
                )}

                <div className="flex gap-3 pt-1">
                  {item.linkNotulen && (
                    <a
                      href={item.linkNotulen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-primary font-medium"
                    >
                      <FileText className="h-3.5 w-3.5" /> Lihat Notulen
                    </a>
                  )}
                  {item.linkDokumentasiFoto && (
                    <a
                      href={item.linkDokumentasiFoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-primary font-medium"
                    >
                      <Image className="h-3.5 w-3.5" /> Foto Dokumentasi
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotulenPage;
