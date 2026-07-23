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

export default function KurvaS() {
  const { data, isLoading, error } = useSheetsData();
  const [sortBy, setSortBy] = useState<"minggu" | "deviasi">("minggu");

  const planning = data?.kurvaSPlanning || [];
  const realisasi = data?.kurvaSRealisasi || [];

  const formatDateIndo = (dateInput: string) => {
    if (!dateInput || dateInput === "-") return "-";
    const isoDash = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDash) {
      const [, yyyy, part2, part3] = isoDash;
      const p2 = Number(part2);
      const p3 = Number(part3);
      if (p2 > 12 && p3 <= 12) {
        return `${String(p2).padStart(2, "0")}/${String(p3).padStart(2, "0")}/${yyyy}`;
      }
      if (p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
        return `${String(p3).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${yyyy}`;
      }
    }
    const slash = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slash) {
      const dd = Number(slash[1]);
      const mm = Number(slash[2]);
      const yyyy = slash[3];
      return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
    }
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return dateInput;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const parseDate = (dateInput: string): Date | null => {
    if (!dateInput || dateInput === "-") return null;
    const isoDash = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDash) {
      const [, yyyy, part2, part3] = isoDash;
      const p2 = Number(part2);
      const p3 = Number(part3);
      if (p2 > 12 && p3 <= 12) {
        return new Date(Number(yyyy), p3 - 1, p2);
      }
      if (p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
        return new Date(Number(yyyy), p2 - 1, p3);
      }
    }
    const slash = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slash) {
      const dd = Number(slash[1]);
      const mm = Number(slash[2]);
      const yyyy = Number(slash[3]);
      return new Date(yyyy, mm - 1, dd);
    }
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const chartData = useMemo(() => {
    return planning.map((p) => {
      const r = realisasi.find((r) => r.mingguke === p.mingguke);
      const endDate = parseDate(p.tanggalAkhir);
      const periodPassed = endDate ? today > endDate : false;

      const hasReal =
        periodPassed &&
        r !== undefined &&
        ((r.realisasiPersentaseMingguPelaksana || 0) > 0 ||
          (r.realisasiPersentaseKumulatifPelaksana || 0) > 0);

      return {
        minggu: p.mingguke,
        planning: p.targetPersentaseKumulatif,
        realisasi: hasReal ? (r?.realisasiPersentaseKumulatifPelaksana || 0) : null,
        tanggalAwal: p.tanggalAwal ? formatDateIndo(p.tanggalAwal) : "-",
        tanggalAkhir: p.tanggalAkhir ? formatDateIndo(p.tanggalAkhir) : "-",
      };
    });
  }, [planning, realisasi, today]);

  const detailData = useMemo(() => {
    return planning.map((p) => {
      const r = realisasi.find((r) => r.mingguke === p.mingguke);
      const endDate = parseDate(p.tanggalAkhir);
      const startDate = parseDate(p.tanggalAwal);
      const periodPassed = endDate ? today > endDate : false;
      const isCurrent = !!(startDate && endDate && today >= startDate && today <= endDate);

      const real_persen = r?.realisasiPersentaseMingguPelaksana || 0;
      const real_kum = r?.realisasiPersentaseKumulatifPelaksana || 0;

      const hasRealisasi =
        periodPassed && r !== undefined && (real_persen > 0 || real_kum > 0);

      const deviation = real_kum - p.targetPersentaseKumulatif;
      const status =
        deviation < -2
          ? "Dibawah Target"
          : deviation > 2
            ? "Diatas Target"
            : "On track";

      return {
        minggu: p.mingguke,
        plan_persen: p.targetPersentaseMinggu || 0,
        plan_kumulatif: p.targetPersentaseKumulatif,
        real_persen,
        real_kumulatif: real_kum,
        hasRealisasi,
        isCurrent,
        periodPassed,
        deviation,
        status,
        deskripsi: p.deskripsiTahapan,
        pekerjaan: r?.deskripsiPekerjaanMinggu || "-",
        tanggalAwal: p.tanggalAwal || "",
        tanggalAkhir: p.tanggalAkhir || "",
        linkLaporanPengawas: r?.linkLaporanMingguanPengawas || "",
      };
    });
  }, [planning, realisasi, today]);

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
            const valueClass =
              entry.dataKey === "planning" ? "text-blue-600" : "text-orange-700";
            return (
              <div key={entry.dataKey} className="flex justify-between gap-2">
                <span className="font-medium">{entry.name}</span>
                <span className={valueClass}>{Number(entry.value).toFixed(3)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Gagal memuat data Kurva S"} />;

  // Minggu berjalan = minggu terakhir yang periodenya sudah lewat (selesai).
  const currentWeek =
    [...detailData].reverse().find((d) => d.periodPassed) || detailData[0];

  const rencanaMingguIni = currentWeek?.plan_kumulatif || 0;
  const realisasiMingguIni = currentWeek?.hasRealisasi ? currentWeek.real_kumulatif : 0;
  const deviasiMingguIni = currentWeek?.hasRealisasi ? currentWeek.deviation : 0;

  // Statistics
  const evaluated = detailData.filter((d) => d.hasRealisasi);
  const sesuaiTarget = evaluated.filter((d) => d.status === "On track").length;
  const diAtasTarget = evaluated.filter((d) => d.status === "Diatas Target").length;
  const diBawahTarget = evaluated.filter((d) => d.status === "Dibawah Target").length;

  const avgDeviation =
    evaluated.length > 0
      ? evaluated.reduce((sum, d) => sum + d.deviation, 0) / evaluated.length
      : 0;
  const maxDeviation =
    evaluated.length > 0 ? Math.max(...evaluated.map((d) => d.deviation)) : 0;
  const minDeviation =
    evaluated.length > 0 ? Math.min(...evaluated.map((d) => d.deviation)) : 0;

  const latestPlanning = planning[planning.length - 1];
  const targetAkhir = latestPlanning?.targetPersentaseKumulatif || 0;

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
            <CardTitle className="text-sm font-medium">Rencana Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{rencanaMingguIni.toFixed(3)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Minggu ke-{currentWeek?.minggu ?? "-"} (Kum Plan)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Realisasi Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: "#C65D1A" }}>
              {realisasiMingguIni.toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minggu ke-{currentWeek?.minggu ?? "-"} (Kum Real)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deviasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                deviasiMingguIni > 0
                  ? "text-green-600"
                  : deviasiMingguIni < 0
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {deviasiMingguIni > 0 ? "+" : ""}
              {deviasiMingguIni.toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kum Real − Kum Plan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Mingguan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {sesuaiTarget} On track
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {diAtasTarget} Diatas
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {diBawahTarget} Dibawah
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {evaluated.length} dari {planning.length} minggu terevaluasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Perbandingan Kurva S</CardTitle>
          <CardDescription>Perbandingan persentase kumulatif Target vs Realisasi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={600}>
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
                strokeWidth={5}
                dot={false}
                name="Target (Planning)"
              />
              <Line
                type="monotone"
                dataKey="realisasi"
                stroke="#C65D1A"
                strokeWidth={6}
                dot={false}
                name="Realisasi"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabel Perbandingan Kurva S */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tabel Perbandingan Kurva S</CardTitle>
              <CardDescription>Perbandingan target planning dan realisasi per minggu</CardDescription>
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
                  <TableHead className="text-center">Laporan Pengawas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDetail.map((row) => (
                  <TableRow key={row.minggu}>
                    <TableCell className="font-medium">{row.minggu}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.pekerjaan !== "-" ? row.pekerjaan : row.deskripsi}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.tanggalAwal && row.tanggalAkhir
                            ? `${formatDateIndo(row.tanggalAwal)} sd ${formatDateIndo(row.tanggalAkhir)}`
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.plan_persen.toFixed(3)}%</TableCell>
                    <TableCell className="text-center text-sm">
                      {row.hasRealisasi ? `${row.real_persen.toFixed(3)}%` : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{row.plan_kumulatif.toFixed(3)}%</TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {row.hasRealisasi ? `${row.real_kumulatif.toFixed(3)}%` : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.hasRealisasi ? (
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
                          {row.deviation.toFixed(3)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.linkLaporanPengawas && row.linkLaporanPengawas !== "-" ? (
                        <a
                          href={row.linkLaporanPengawas}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Laporan →
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.hasRealisasi ? (
                        <Badge
                          variant="outline"
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

      {/* Ringkasan Statistik */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Statistik</CardTitle>
          <CardDescription>Rekapitulasi progres konstruksi secara keseluruhan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Minggu</p>
              <p className="text-2xl font-bold">{planning.length}</p>
              <p className="text-xs text-muted-foreground">
                {evaluated.length} minggu terealisasi
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sisa Target</p>
              <p className="text-2xl font-bold text-blue-600">{(100 - realisasiMingguIni).toFixed(3)}%</p>
              <p className="text-xs text-muted-foreground">100% − Kum Real minggu ke-{currentWeek?.minggu ?? "-"}</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rata-rata Deviasi</p>
              <p
                className={`text-2xl font-bold ${
                  avgDeviation >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {avgDeviation > 0 ? "+" : ""}
                {avgDeviation.toFixed(3)}%
              </p>
              <p className="text-xs text-muted-foreground">Dari {evaluated.length} minggu</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rentang Deviasi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-red-600">
                  {minDeviation > 0 ? "+" : ""}
                  {minDeviation.toFixed(3)}%
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="text-lg font-bold text-green-600">
                  {maxDeviation > 0 ? "+" : ""}
                  {maxDeviation.toFixed(3)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Min — Max deviasi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
