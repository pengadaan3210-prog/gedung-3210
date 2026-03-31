import { useState } from "react";
import { useFotoProgres } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Calendar } from "lucide-react";

const FotoProgresPage = () => {
  const { data, isLoading, isError, refetch } = useFotoProgres();
  const [filterKategori, setFilterKategori] = useState<string>("all");

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const kategoris = [...new Set(data.map((d) => d.kategori).filter(Boolean))];

  const filtered = filterKategori === "all"
    ? data
    : data.filter((d) => d.kategori === filterKategori);

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
              {items.map((item) => (
                <Card key={item.id} className="shadow-sm border-border overflow-hidden">
                  <CardContent className="p-0">
                    {item.linkFoto ? (
                      <a href={item.linkFoto} target="_blank" rel="noopener noreferrer">
                        <img
                          src={item.linkFoto}
                          alt={item.judul}
                          className="aspect-[4/3] object-cover w-full bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden aspect-[4/3] bg-muted flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      </a>
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
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FotoProgresPage;
