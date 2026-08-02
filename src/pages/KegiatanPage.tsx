import { useState } from "react";
import { useKegiatan } from "@/hooks/useSheetsData";
import { Kegiatan } from "@/lib/types";
import DataTable from "@/components/DataTable";
import DetailModal from "@/components/DetailModal";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

interface KegiatanPageProps {
  penanggungjawab: string;
  title: string;
  description: string;
}

const normalize = (val?: string) => (val || "").trim().toLowerCase();

const KegiatanPage = ({ penanggungjawab, title, description }: KegiatanPageProps) => {
  const [selected, setSelected] = useState<Kegiatan | null>(null);
  const { data: allData, isLoading, isError, refetch } = useKegiatan();

  const data =
    penanggungjawab === "Semua"
      ? allData
      : allData.filter((d) => normalize(d.penanggungjawab) === normalize(penanggungjawab));

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const terpenuhi = data.filter((d) => d.status).length;
  const persen = data.length ? Math.round((terpenuhi / data.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{persen}%</div>
            <div className="text-xs text-muted-foreground">Kelengkapan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{terpenuhi}</div>
            <div className="text-xs text-muted-foreground">Terpenuhi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{data.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      <DataTable data={data} onSelect={setSelected} />
      <DetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default KegiatanPage;
