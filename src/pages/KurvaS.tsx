import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSheetsData } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { KurvaSPlanning, KurvaSRealisasi } from "@/lib/types";

export default function KurvaS() {
  const { data, isLoading, error } = useSheetsData();
  const [sortBy, setSortBy] = useState<"minggu" | "deviasi">("minggu");

  const planning = data?.kurvaSPlanning || [];
  const realisasi = data?.kurvaSRealisasi || [];

  // Merge data untuk chart
  const chartData = useMemo(() => {
    return planning.map((p) => {
      const r = realisasi.find((r) => r.mingguke === p.mingguke);
      return {
        minggu: p.mingguke,
        planning: p.targetPersentaseKumulatif,
        realisasi: r?.realisasiPersentaseKumulatif || 0,
        deviasi: (r?.realisasiPersentaseKumulatif || 0) - p.targetPersentaseKumulatif,
      };
    });
  }, [planning, realisasi]);

  // Detail tabel dengan deviasi
  const detailData = useMemo(() => {
    return planning.map((p) => {
      const r = realisasi.find((r) => r.mingguke === p.mingguke);
      const deviation = (r?.realisasiPersentaseKumulatif || 0) - p.targetPersentaseKumulatif;
      const status =
        deviation > 2
          ? "Ahead"
          : deviation < -2
            ? "Behind"
            : "On Track";

      return {
        minggu: p.mingguke,
        plan_persen: p.targetPersentaseMinggu || 0,
        plan_kumulatif: p.targetPersentaseKumulatif,
        real_persen: r?.realisasiPersentaseMinggu || 0,
        real_kumulatif: r?.realisasiPersentaseKumulatif || 0,
        deviation,
        status,
        deskripsi: p.deskripsiTahapan,
        pekerjaan: r?.deskripsiPekerjaanMinggu || "-",
        kendala: r?.kendala || "-",
        solusi: r?.solusi || "-",
        pic: r?.pic || "-",
      };
    });
  }, [planning, realisasi]);

  const sortedDetail = useMemo(() => {
    if (sortBy === "deviasi") {
      return [...detailData].sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
    }
    return detailData;
  }, [detailData, sortBy]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Gagal memuat data Kurva S"} />;

  // Summary stats
  const latestPlanning = planning[planning.length - 1];
  const latestRealisasi = realisasi[realisasi.length - 1];
  const finalDeviation = (latestRealisasi?.realisasiPersentaseKumulatif || 0) - (latestPlanning?.targetPersentaseKumulatif || 0);
  const onTrack = detailData.filter((d) => d.status === "On Track").length;
  const ahead = detailData.filter((d) => d.status === "Ahead").length;
  const behind = detailData.filter((d) => d.status === "Behind").length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kurva S - Monitoring Progres Konstruksi</h1>
        <p className="text-muted-foreground">
          Perbandingan antara target (planning) dan realisasi progres konstruksi minggu ke minggu
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progres Akhir (Planning)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestPlanning?.targetPersentaseKumulatif.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Target akhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progres Akhir (Realisasi)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestRealisasi?.realisasiPersentaseKumulatif.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Realisasi saat ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deviasi Akhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${finalDeviation > 0 ? "text-green-600" : finalDeviation < 0 ? "text-red-600" : "text-gray-600"}`}>
              {finalDeviation > 0 ? "+" : ""}
              {finalDeviation.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Selisih progres</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Minggu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50">
                {onTrack} On Track
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50">
                {ahead} Ahead
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                {behind} Behind
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Perbandingan Kurva S</CardTitle>
          <CardDescription>Perbandingan persentase kumulatif Planning vs Realisasi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="minggu"
                label={{ value: "Minggu Ke-", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis label={{ value: "Persentase (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(2)}%`}
                labelFormatter={(label) => `Minggu ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="planning"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name="Target (Planning)"
              />
              <Line
                type="monotone"
                dataKey="realisasi"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                name="Realisasi"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main Detail Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detail Progres Mingguan</CardTitle>
              <CardDescription>Analisis mendalam per minggu dengan deviasi dan kendala</CardDescription>
            </div>
            <button
              onClick={() => setSortBy(sortBy === "minggu" ? "deviasi" : "minggu")}
              className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Sort: {sortBy === "minggu" ? "Minggu" : "Deviasi"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Mgg</TableHead>
                  <TableHead>Tahapan / Pekerjaan</TableHead>
                  <TableHead className="text-center">Plan %</TableHead>
                  <TableHead className="text-center">Real %</TableHead>
                  <TableHead className="text-center">Kum Plan</TableHead>
                  <TableHead className="text-center">Kum Real</TableHead>
                  <TableHead className="text-center">Deviasi</TableHead>
                  <TableHead>Kendala</TableHead>
                  <TableHead>Solusi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDetail.map((row) => (
                  <TableRow key={row.minggu}>
                    <TableCell className="font-medium">{row.minggu}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.deskripsi}</div>
                        <div className="text-xs text-muted-foreground">{row.pekerjaan}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.plan_persen.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm">{row.real_persen.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium">{row.plan_kumulatif.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium">{row.real_kumulatif.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          row.deviation > 0
                            ? "text-green-600"
                            : row.deviation < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {row.deviation > 0 ? "+" : ""}
                        {row.deviation.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px]">{row.kendala}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px]">{row.solusi}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "On Track"
                            ? "outline"
                            : row.status === "Ahead"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          row.status === "On Track"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : row.status === "Ahead"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Realisasi Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Realisasi & PIC</CardTitle>
          <CardDescription>Informasi detail pekerjaan realisasi, PIC, dan dokumentasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Mgg</TableHead>
                  <TableHead>Pekerjaan Minggu</TableHead>
                  <TableHead className="text-center">Realisasi Minggu</TableHead>
                  <TableHead className="text-center">Realisasi Kumulatif</TableHead>
                  <TableHead>Kendala & Solusi</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realisasi.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.mingguke}</TableCell>
                    <TableCell className="text-sm">{r.deskripsiPekerjaanMinggu}</TableCell>
                    <TableCell className="text-center text-sm">{r.realisasiPersentaseMinggu?.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium">{r.realisasiPersentaseKumulatif?.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm">
                      {r.kendala !== "-" && (
                        <div>
                          <span className="font-medium text-red-600">K: </span>
                          {r.kendala}
                          {r.solusi !== "-" && (
                            <>
                              <br />
                              <span className="font-medium text-green-600">S: </span>
                              {r.solusi}
                            </>
                          )}
                        </div>
                      )}
                      {r.kendala === "-" && <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{r.pic}</TableCell>
                    <TableCell>
                      {r.linkFotoProgres && r.linkFotoProgres !== "-" ? (
                        <a
                          href={r.linkFotoProgres}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Foto →
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Minggu</p>
              <p className="text-2xl font-bold">{planning.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Rata-rata Deviasi</p>
              <p className="text-2xl font-bold">
                {(
                  detailData.reduce((sum, d) => sum + d.deviation, 0) / detailData.length
                ).toFixed(2)}
                %
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Max Deviasi</p>
              <p className="text-2xl font-bold">
                {Math.max(
                  ...detailData.map((d) => Math.abs(d.deviation))
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
