import { useKegiatan } from "@/hooks/useSheetsData";
import { Kegiatan } from "@/lib/types";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

const Laporan = () => {
  const { data, isLoading, isError, refetch } = useKegiatan();

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const penyediaMapping = [
    { label: "Semua", filter: "Semua" },
    { label: "BPS Kabupaten Majalengka", filter: "BPS Kabupaten Majalengka" },
    { label: "Konsultan Perancangan", filter: "Perencanaan" },
    { label: "Kontraktor Pelaksana", filter: "Pelaksanaan" },
    { label: "Konsultan Pengawas", filter: "Pengawasan" },
  ];

  const normalize = (val?: string) => (val || "").trim().toLowerCase();

  const tahapanSummary = penyediaMapping.map((t) => {
    const items = t.filter === "Semua"
      ? data
      : data.filter((d) => normalize(d.penyedia) === normalize(t.filter));
    const avg = items.length
      ? Math.round(items.reduce((s, d) => s + d.persentaseProgres, 0) / items.length)
      : 0;
    return {
      tahapan: t.label,
      total: items.length,
      selesai: items.filter((d) => d.statusProgres === "Selesai").length,
      proses: items.filter((d) => d.statusProgres === "Proses").length,
      tertunda: items.filter((d) => d.statusProgres === "Tertunda").length,
      belum: items.filter((d) => d.statusProgres === "Belum").length,
      avg,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekap progres dan ekspor data kegiatan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Rekap Progres per Penyedia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-semibold">Penyedia</TableHead>
                  <TableHead className="font-semibold text-center">Total</TableHead>
                  <TableHead className="font-semibold text-center">Selesai</TableHead>
                  <TableHead className="font-semibold text-center">Proses</TableHead>
                  <TableHead className="font-semibold text-center">Tertunda</TableHead>
                  <TableHead className="font-semibold text-center">Belum</TableHead>
                  <TableHead className="font-semibold text-center">Rata-rata (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tahapanSummary.map((t) => (
                  <TableRow key={t.tahapan}>
                    <TableCell className="font-medium">{t.tahapan}</TableCell>
                    <TableCell className="text-center">{t.total}</TableCell>
                    <TableCell className="text-center text-success font-medium">{t.selesai}</TableCell>
                    <TableCell className="text-center text-info font-medium">{t.proses}</TableCell>
                    <TableCell className="text-center text-warning font-medium">{t.tertunda}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{t.belum}</TableCell>
                    <TableCell className="text-center font-bold text-accent">{t.avg}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Rekap per PIC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-semibold">PIC</TableHead>
                  <TableHead className="font-semibold">Output</TableHead>
                  <TableHead className="font-semibold text-center">Kegiatan</TableHead>
                  <TableHead className="font-semibold text-center">Rata-rata (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(
                  data.reduce((acc, d) => {
                    if (!acc[d.pic]) acc[d.pic] = { output: d.output, items: [] };
                    acc[d.pic].items.push(d);
                    return acc;
                  }, {} as Record<string, { output: string; items: typeof data }>)
                ).map(([pic, info]) => (
                  <TableRow key={pic}>
                    <TableCell className="font-medium">{pic}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{info.output}</TableCell>
                    <TableCell className="text-center">{info.items.length}</TableCell>
                    <TableCell className="text-center font-bold text-accent">
                      {Math.round(info.items.reduce((s, d) => s + d.persentaseProgres, 0) / info.items.length)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Laporan;
