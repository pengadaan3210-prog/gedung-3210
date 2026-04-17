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

  // Debug logging
  console.log('Realisasi data:', realisasi.slice(0, 2)); // Show first 2 records
  if (realisasi.length > 0) {
    console.log('Sample realisasi record:', realisasi[0]);
    console.log('linkLaporanMingguanPengawas:', realisasi[0].linkLaporanMingguanPengawas);
    console.log('linkLaporanMingguanPelaksana:', realisasi[0].linkLaporanMingguanPelaksana);
  }

  // Merge data untuk chart
  const formatDateIndo = (dateInput: string) => {
    if (!dateInput || dateInput === "-") return "-";

    const isoDash = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDash) {
      const [, yyyy, part2, part3] = isoDash;
      const p2 = Number(part2);
      const p3 = Number(part3);

      // If format is yyyy-dd-mm (e.g. 2026-31-08) where month > 12, swap
      if (p2 > 12 && p3 <= 12) {
        return `${String(p2).padStart(2, "0")}/${String(p3).padStart(2, "0")}/${yyyy}`;
      }

      // Normal ISO yyyy-mm-dd
      if (p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
        return `${String(p3).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${yyyy}`;
      }
    }

    // dd/mm/yyyy or mm/dd/yyyy
    const slash = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slash) {
      const dd = Number(slash[1]);
      const mm = Number(slash[2]);
      const yyyy = slash[3];

      // if looks like dd/mm/yyyy (day>12) keep (or always output dd/mm/yyyy)
      return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
    }

    // Fallback: try Date constructor for other formats
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return dateInput;

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const chartData = useMemo(() => {
    return planning.map((p) => {
      const r = realisasi.find((r) => r.mingguke === p.mingguke);
      return {
        minggu: p.mingguke,
        planning: p.targetPersentaseKumulatif,
        realisasi: r?.realisasiPersentaseKumulatif || 0,
        realisasiPelaksana: r?.realisasiPersentaseKumulatifPelaksana || 0,
        deviasi: (r?.realisasiPersentaseKumulatif || 0) - p.targetPersentaseKumulatif,
        tanggalAwal: p.tanggalAwal ? formatDateIndo(p.tanggalAwal) : "-",
        tanggalAkhir: p.tanggalAkhir ? formatDateIndo(p.tanggalAkhir) : "-",
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
          ? "Diatas Target"
          : deviation < -2
            ? "Dibawah Target"
            : "On track";

      const real_kum_pel = r?.realisasiPersentaseKumulatifPelaksana || 0;
      const deviation_pelaksana = real_kum_pel - p.targetPersentaseKumulatif;
      const status_pelaksana =
        deviation_pelaksana > 2
          ? "Diatas Target"
          : deviation_pelaksana < -2
            ? "Dibawah Target"
            : "On track";

      return {
        minggu: p.mingguke,
        plan_persen: p.targetPersentaseMinggu || 0,
        plan_kumulatif: p.targetPersentaseKumulatif,
        real_persen: r?.realisasiPersentaseMinggu || 0,
        real_kumulatif: r?.realisasiPersentaseKumulatif || 0,
        real_persen_pelaksana: r?.realisasiPersentaseMingguPelaksana || 0,
        real_kumulatif_pelaksana: real_kum_pel,
        deviation,
        deviation_pelaksana,
        status,
        status_pelaksana,
        deskripsi: p.deskripsiTahapan,
        pekerjaan: r?.deskripsiPekerjaanMinggu || "-",
        tanggalAwal: p.tanggalAwal || "",
        tanggalAkhir: p.tanggalAkhir || "",
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const current = chartData.find((item) => item.minggu === label);

    return (
      <div className="rounded border bg-white p-2 text-sm shadow-lg">
        <p className="font-semibold">Minggu {label}</p>
        <p className="text-muted-foreground">
          {current?.tanggalAwal || "-"} sd {current?.tanggalAkhir || "-"}
        </p>
        <div className="mt-1">
          {payload.map((entry: any) => {
            const valueClass = entry.dataKey === "planning"
              ? "text-blue-600"
              : entry.dataKey === "realisasi"
                ? "text-orange-600"
                : entry.dataKey === "realisasiPelaksana"
                  ? "text-purple-600"
                  : "text-gray-700";
            return (
              <div key={entry.dataKey} className="flex justify-between gap-2">
                <span className="font-medium">{entry.name}</span>
                <span className={valueClass}>{Number(entry.value).toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const realisasiRows = useMemo(() => {
    return realisasi.map((r) => {
      const planWeek = planning.find((p) => p.mingguke === r.mingguke);
      return (
        <TableRow key={r.id}>
          <TableCell className="font-medium">{r.mingguke}</TableCell>
          <TableCell className="text-sm">
            <div className="space-y-1">
              <div>{r.deskripsiPekerjaanMinggu}</div>
              <div className="text-xs text-muted-foreground">
                {planWeek && planWeek.tanggalAwal && planWeek.tanggalAkhir
                  ? `${formatDateIndo(planWeek.tanggalAwal)} sd ${formatDateIndo(planWeek.tanggalAkhir)}`
                  : "-"}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center text-sm whitespace-normal break-words max-w-[100px]">{r.realisasiPersentaseMinggu?.toFixed(1)}%</TableCell>
          <TableCell className="text-center text-sm font-medium whitespace-normal break-words max-w-[120px]">{r.realisasiPersentaseKumulatif?.toFixed(1)}%</TableCell>
          <TableCell className="text-sm">
            {r.kendala !== "-" ? (
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
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
          <TableCell className="text-sm font-medium">{r.pic}</TableCell>
          <TableCell>
            {r.linkFotoProgres && r.linkFotoProgres !== "-" ? (
              <a href={r.linkFotoProgres} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Foto →
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </TableCell>
          <TableCell className="whitespace-normal break-words max-w-[150px]">
            {r.linkLaporanMingguanPengawas && r.linkLaporanMingguanPengawas !== "-" ? (
              <a href={r.linkLaporanMingguanPengawas} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Laporan →
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </TableCell>
          <TableCell className="whitespace-normal break-words max-w-[150px]">
            {r.linkLaporanMingguanPelaksana && r.linkLaporanMingguanPelaksana !== "-" ? (
              <a href={r.linkLaporanMingguanPelaksana} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Laporan →
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </TableCell>
        </TableRow>
      );
    });
  }, [realisasi, planning]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Gagal memuat data Kurva S"} />;

  // Summary stats
  const latestPlanning = planning[planning.length - 1];
  const latestRealisasi = realisasi[realisasi.length - 1];
  const finalDeviation = (latestRealisasi?.realisasiPersentaseKumulatif || 0) - (latestPlanning?.targetPersentaseKumulatif || 0);
  const sesuaiTarget = detailData.filter((d) => d.status === "On track").length;
  const diAtasTarget = detailData.filter((d) => d.status === "Diatas Target").length;
  const diBawahTarget = detailData.filter((d) => d.status === "Dibawah Target").length;

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
              <Badge variant="outline" className="bg-blue-50">
                {sesuaiTarget} On track
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50">
                {diAtasTarget} Diatas Target
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                {diBawahTarget} Dibawah Target
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="planning"
                stroke="#3b82f6"
                strokeWidth={7}
                dot={false}
                name="Target (Planning)"
              />
              <Line
                type="monotone"
                dataKey="realisasi"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Realisasi (Pengawas)"
              />
              <Line
                type="monotone"
                dataKey="realisasiPelaksana"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
                name="Realisasi (Pelaksana)"
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
              <CardTitle>Detail Progres Mingguan (Pengawas)</CardTitle>
              <CardDescription>Analisis mendalam per minggu berdasarkan hitungan Pengawas</CardDescription>
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
                  <TableHead>Kendala & Solusi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDetail.map((row) => (
                  <TableRow key={row.minggu}>
                    <TableCell className="font-medium">{row.minggu}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.pekerjaan || row.deskripsi}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.tanggalAwal && row.tanggalAkhir
                            ? `${formatDateIndo(row.tanggalAwal)} sd ${formatDateIndo(row.tanggalAkhir)}`
                            : "-"}
                        </div>
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
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {row.kendala !== "-" || row.solusi !== "-" ? (
                        <>
                          {row.kendala !== "-" && (
                            <span>
                              <span className="font-semibold text-red-600">K: </span>
                              {row.kendala}
                            </span>
                          )}
                          {row.kendala !== "-" && row.solusi !== "-" && <br />}
                          {row.solusi !== "-" && (
                            <span>
                              <span className="font-semibold text-green-600">S: </span>
                              {row.solusi}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "On track"
                            ? "outline"
                            : row.status === "Diatas Target"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          row.status === "On track"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : row.status === "Diatas Target"
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

      {/* Detail Progres Mingguan (Pelaksana) */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Progres Mingguan (Pelaksana)</CardTitle>
          <CardDescription>Analisis mendalam per minggu berdasarkan hitungan Kontraktor Pelaksana</CardDescription>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDetail.map((row) => (
                  <TableRow key={row.minggu}>
                    <TableCell className="font-medium">{row.minggu}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.pekerjaan || row.deskripsi}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.tanggalAwal && row.tanggalAkhir
                            ? `${formatDateIndo(row.tanggalAwal)} sd ${formatDateIndo(row.tanggalAkhir)}`
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.plan_persen.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm">{row.real_persen_pelaksana.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium">{row.plan_kumulatif.toFixed(1)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium text-purple-700">{row.real_kumulatif_pelaksana.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          row.deviation_pelaksana > 0
                            ? "text-green-600"
                            : row.deviation_pelaksana < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {row.deviation_pelaksana > 0 ? "+" : ""}
                        {row.deviation_pelaksana.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status_pelaksana === "On track"
                            ? "outline"
                            : row.status_pelaksana === "Diatas Target"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          row.status_pelaksana === "On track"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : row.status_pelaksana === "Diatas Target"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {row.status_pelaksana}
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
                  <TableHead className="text-center whitespace-normal break-words max-w-[100px]">Realisasi Minggu</TableHead>
                  <TableHead className="text-center whitespace-normal break-words max-w-[120px]">Realisasi Kumulatif</TableHead>
                  <TableHead>Kendala & Solusi</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead className="whitespace-normal break-words max-w-[100px]">Link</TableHead>
                  <TableHead className="whitespace-normal break-words max-w-[120px]">Laporan Pengawas</TableHead>
                  <TableHead className="whitespace-normal break-words max-w-[120px]">Laporan Pelaksana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realisasiRows}
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Minggu</p>
              <p className="text-2xl font-bold">{planning.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Rata-rata Deviasi</p>
              <p
                className={`text-2xl font-bold ${
                  (() => {
                    const avgDeviation =
                      detailData.length > 0
                        ? detailData.reduce((sum, d) => sum + d.deviation, 0) / detailData.length
                        : 0;
                    return avgDeviation >= 0 ? "text-green-600" : "text-red-600";
                  })()
                }`}
              >
                {(
                  detailData.reduce((sum, d) => sum + d.deviation, 0) / detailData.length
                ).toFixed(2)}
                %
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Max Deviasi</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(
                  ...detailData.map((d) => Math.abs(d.deviation))
                ).toFixed(2)}
                %
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Min Deviasi</p>
              <p className="text-2xl font-bold text-red-600">
                {(() => {
                  const validDeviations = detailData.map((d) => d.deviation).filter(val => !isNaN(val) && isFinite(val));
                  const minDeviation = validDeviations.length > 0 ? Math.min(...validDeviations) : 0;
                  return minDeviation.toFixed(2);
                })()}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
