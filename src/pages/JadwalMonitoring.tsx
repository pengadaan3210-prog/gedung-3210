import { useJadwalMonitoring } from "@/hooks/useSheetsData";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const JadwalMonitoring = () => {
  const { data, isLoading, isError, refetch } = useJadwalMonitoring();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError) return <div className="p-6"><ErrorState onRetry={() => refetch()} /></div>;

  const sorted = [...data].sort((a, b) => {
    if (!a.tanggal || !b.tanggal) return 0;
    return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
  });

  const filtered = sorted.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.karyawan?.toLowerCase().includes(searchLower) ||
      item.status?.toLowerCase().includes(searchLower) ||
      item.catatan_lapangan?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hadir":
        return <Badge variant="default" className="bg-green-100 text-green-800">Hadir</Badge>;
      case "tidak hadir":
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      default:
        return <Badge variant="secondary">{status || "-"}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Jadwal Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Jadwal piket monitoring lapangan pembangunan kantor BPS Majalengka
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari karyawan, status, atau catatan..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "Tidak ada jadwal yang cocok dengan pencarian" : "Belum ada data jadwal monitoring"}
        </p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Hari ke-X</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan Lapangan</TableHead>
                  <TableHead>Link Dokumen/Bukti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={item.no || index}>
                    <TableCell className="font-medium">{item.no || startIndex + index + 1}</TableCell>
                    <TableCell>{item.hari_ke_x || "-"}</TableCell>
                    <TableCell>
                      {item.tanggal ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{item.karyawan || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={item.catatan_lapangan}>
                        {item.catatan_lapangan || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.link_dokumen_bukti ? (
                        <a
                          href={item.link_dokumen_bukti}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-accent hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Lihat
                        </a>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between py-3 px-2 border-t border-border/20">
              <span className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}-{Math.min(filtered.length, startIndex + ITEMS_PER_PAGE)} dari {filtered.length} jadwal
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-3 py-2 border border-border/40 bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikut
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JadwalMonitoring;