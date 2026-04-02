import { useState } from "react";
import { useKegiatan } from "@/hooks/useSheetsData";
import { Kegiatan } from "@/lib/types";
import DataTable from "@/components/DataTable";
import DetailModal from "@/components/DetailModal";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

interface KegiatanPageProps {
  tahapan: string;
  title: string;
  description: string;
}

const KegiatanPage = ({ tahapan, title, description }: KegiatanPageProps) => {
  const [selected, setSelected] = useState<Kegiatan | null>(null);
  const { data: allData, isLoading, isError, refetch } = useKegiatan();
  
  // Filter data based on tahapan
  const normalize = (val?: string) => (val || "").trim().toLowerCase();
  const data = tahapan === "Semua"
    ? allData
    : normalize(tahapan) === "bps kabupaten majalengka"
    ? allData.filter((d) => normalize(d.penyedia) === "bps kabupaten majalengka")
    : allData.filter((d) => normalize(d.penyedia) === normalize(tahapan));

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.persentaseProgres, 0) / data.length)
    : 0;
  const selesai = data.filter((d) => d.statusProgres === "Selesai").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{avg}%</div>
            <div className="text-xs text-muted-foreground">Rata-rata</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{selesai}</div>
            <div className="text-xs text-muted-foreground">Selesai</div>
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
