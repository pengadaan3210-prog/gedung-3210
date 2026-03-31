import { useKegiatan } from "@/hooks/useSheetsData";
import { Tahapan } from "@/lib/types";
import StatsCards from "@/components/StatsCards";
import ProgressCharts from "@/components/ProgressCharts";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarClock, Activity } from "lucide-react";

const Dashboard = () => {
  const { data, isLoading, isError, refetch } = useKegiatan();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const overdueItems = data.filter(
    (d) => d.statusProgres !== "Selesai" && d.tanggalSelesai && new Date(d.tanggalSelesai) < new Date()
  );

  const recentUpdates = [...data]
    .filter((d) => d.tanggalUpdateTerakhir)
    .sort((a, b) => new Date(b.tanggalUpdateTerakhir).getTime() - new Date(a.tanggalUpdateTerakhir).getTime())
    .slice(0, 5);

  const tahapanSummary = (["Perencanaan", "Pelaksanaan", "Pengawasan"] as Tahapan[]).map((t) => {
    const items = data.filter((d) => d.tahapan === t);
    const avg = items.length
      ? Math.round(items.reduce((s, d) => s + d.persentaseProgres, 0) / items.length)
      : 0;
    const selesai = items.filter((d) => d.statusProgres === "Selesai").length;
    return { tahapan: t, total: items.length, avg, selesai };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan progres pembangunan Gedung Kantor BPS Kabupaten Majalengka Tahun 2026
        </p>
      </div>

      <StatsCards data={data} />
      <ProgressCharts data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md border-destructive/20 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Kegiatan Terlambat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada kegiatan terlambat 🎉</p>
            ) : (
              overdueItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-sm font-medium text-foreground leading-tight">{item.uraianKegiatan}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{item.tahapan}</Badge>
                    <span className="text-[11px] text-destructive font-medium">
                      Deadline: {new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-accent" /> Rekap per Tahapan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tahapanSummary.map((t) => (
              <div key={t.tahapan}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-foreground">{t.tahapan}</span>
                  <span className="text-xs text-muted-foreground">{t.selesai}/{t.total} selesai</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${t.avg}%` }} />
                </div>
                <span className="text-xs font-semibold text-accent">{t.avg}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <CalendarClock className="h-4 w-4 text-accent" /> Update Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUpdates.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight truncate">{item.uraianKegiatan}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(item.tanggalUpdateTerakhir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
            {recentUpdates.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
