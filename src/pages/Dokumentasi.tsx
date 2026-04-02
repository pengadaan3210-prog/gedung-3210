import { useDokumentasi } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";

const Dokumentasi = () => {
  const { data, isLoading, isError, refetch } = useDokumentasi();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  // Group by judulDokumen (kolom C) as the main title
  const titles = [...new Set(data.map((d) => d.judulDokumen).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dokumentasi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar dokumen kontrak dan bukti dukung kegiatan
        </p>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada data dokumentasi</p>
      ) : (
        <div className="space-y-4">
          {titles.map((title) => {
            const items = data.filter((d) => d.judulDokumen === title);
            return (
              <Card key={title} className="shadow-sm border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-accent" />
                    {title} {/* Kolom C as main title */}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{item.nomorKontrak}</p> {/* Kolom B as subtitle */}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{item.tahapan}</Badge>
                            {item.kategori && <Badge variant="outline" className="text-[10px]">{item.kategori}</Badge>}
                            <span className="text-[11px] text-muted-foreground">{item.pic}</span>
                          </div>
                        </div>
                        {item.linkDokumen && (
                          <a
                            href={item.linkDokumen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 ml-3 text-accent hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dokumentasi;