import { useKegiatan } from "@/hooks/useSheetsData";
import StatsCards from "@/components/StatsCards";
import ProgressCharts from "@/components/ProgressCharts";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Users } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";

const PJ_LIST = [
  "Konsultan Perancangan",
  "Kontraktor Pelaksana",
  "Konsultan Pengawas",
];

const normalize = (v?: string) => (v || "").trim().toLowerCase();

const Dashboard = () => {
  const { data, isLoading, isError, refetch } = useKegiatan();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const pjSummary = PJ_LIST.map((pj) => {
    const items = data.filter((d) => normalize(d.penanggungjawab) === normalize(pj));
    const terpenuhi = items.filter((d) => d.status).length;
    return {
      label: pj,
      total: items.length,
      terpenuhi,
      persen: items.length ? Math.round((terpenuhi / items.length) * 100) : 0,
    };
  });

  const statusData = [
    { name: "Terpenuhi", value: data.filter((d) => d.status).length },
    { name: "Belum Terpenuhi", value: data.filter((d) => !d.status).length },
  ].filter((d) => d.value > 0);

  const belumItems = data.filter((d) => !d.status);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kelengkapan dokumen pembangunan Gedung Kantor BPS Kabupaten Majalengka Tahun 2026
        </p>
      </div>

      <StatsCards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCharts data={data} />

        <Card className="shadow-md border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-accent" /> Rekap per Penanggungjawab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pjSummary.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.terpenuhi}/{p.total} terpenuhi
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${p.persen}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-accent">{p.persen}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-accent" /> Distribusi Status Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.name === "Terpenuhi" ? "hsl(152, 60%, 40%)" : "hsl(38, 92%, 50%)"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Dokumen Belum Terpenuhi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
            {belumItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semua dokumen sudah terpenuhi 🎉</p>
            ) : (
              belumItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                >
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {item.dokumen || item.namaFile || "-"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {item.penanggungjawab || "-"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {item.tahapan || "-"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
