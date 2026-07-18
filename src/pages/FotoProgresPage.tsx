import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image as ImageIcon, ExternalLink, Play, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";

const ROOT_FOLDER = "https://drive.google.com/drive/folders/12MGEqO6vcJNNtoYTrrerbMl7KEqs6-nM";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
  viewUrl: string;
  createdTime: string;
};

type Group = {
  folderId: string;
  folderName: string;
  date: string | null;
  files: DriveFile[];
};

async function fetchPhotos(): Promise<{ groups: Group[] }> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/list-drive-photos?folderUrl=${encodeURIComponent(ROOT_FOLDER)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text);
}

const FotoProgresPage = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drive-photos"],
    queryFn: fetchPhotos,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [selected, setSelected] = useState<(DriveFile & { folderName: string }) | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const GROUPS_PER_PAGE = 3;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const groups = (data?.groups || []).filter((g) => g.files.length > 0);
  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * GROUPS_PER_PAGE;
  const displayed = groups.slice(startIdx, startIdx + GROUPS_PER_PAGE);
  const totalFiles = groups.reduce((s, g) => s + g.files.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foto Progres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dokumentasi foto langsung dari Google Drive — dikelompokkan per tanggal ({totalFiles} foto, {groups.length} tanggal)
          </p>
        </div>
        <a href={ROOT_FOLDER} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Buka Folder Drive
          </Button>
        </a>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Belum ada foto di folder Drive</p>
      ) : (
        displayed.map((group) => (
          <div key={group.folderId} className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {group.folderName}
              </h2>
              <Badge variant="secondary" className="text-xs">{group.files.length} foto</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.files.map((file) => (
                <Card
                  key={file.id}
                  className="shadow-sm border-border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelected({ ...file, folderName: group.folderName })}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          el.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden aspect-[4/3] bg-muted flex-col items-center justify-center absolute inset-0 gap-2">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">Foto tidak dapat dimuat</span>
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          <Play className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-foreground truncate" title={file.name}>{file.name}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 px-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground">
            Halaman {safePage} dari {totalPages} — {groups.length} tanggal, {totalFiles} foto
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm">{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/40 bg-background hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto">
          {selected && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">{selected.folderName}</p>
              </div>
              <img
                src={`https://drive.google.com/thumbnail?id=${selected.id}&sz=w1600`}
                alt={selected.name}
                className="w-full rounded-lg"
              />
              <Button onClick={() => window.open(selected.viewUrl, '_blank')} className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Buka di Google Drive
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FotoProgresPage;
