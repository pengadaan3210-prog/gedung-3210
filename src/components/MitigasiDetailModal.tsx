import { Mitigasi } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  item: Mitigasi | null;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="text-xs">
    <div className="text-[11px] text-muted-foreground font-medium mb-1">{label}</div>
    <div className="text-sm text-foreground bg-muted/10 px-2 py-1 rounded">{value || "-"}</div>
  </div>
);

const STATUS_STYLE: Record<string, string> = {
  Selesai: "bg-green-100 text-green-800",
  Proses: "bg-blue-100 text-blue-800",
  Belum: "bg-gray-100 text-gray-800",
};

const RISIKO_STYLE: Record<string, string> = {
  Tinggi: "bg-red-100 text-red-800",
  Sedang: "bg-yellow-100 text-yellow-800",
  Rendah: "bg-green-100 text-green-800",
};

const MitigasiDetailModal = ({ item, open, onClose }: Props) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground pr-8">{item.uraianRisiko}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{item.sumberRisiko || "-"}</Badge>
          {item.kategoriRisiko && <Badge variant="outline">{item.kategoriRisiko}</Badge>}
          {item.tingkatRisiko && (
            <Badge className={RISIKO_STYLE[item.tingkatRisiko] || ""}>{item.tingkatRisiko}</Badge>
          )}
          {item.status && (
            <Badge className={STATUS_STYLE[item.status] || ""}>{item.status}</Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sumber Risiko" value={item.sumberRisiko} />
          <Field label="Kategori Risiko" value={item.kategoriRisiko} />
          <Field label="Dampak Risiko" value={item.dampakRisiko} />
          <Field label="Tingkat Risiko" value={item.tingkatRisiko} />
          <Field label="Penyebab" value={item.penyebab} />
          <Field label="PIC" value={item.pic} />
          <Field label="Target Waktu" value={item.targetWaktu} />
          <Field label="Status" value={item.status} />
        </div>

        <Separator />

        <div className="space-y-3">
          <Field label="Mitigasi / Solusi" value={item.mitigasiSolusi} />
          <Field label="Tindak Lanjut" value={item.tindakLanjut} />
          <Field label="Keterangan" value={item.keterangan} />
        </div>

        {item.buktiDukung && (
          <a
            href={item.buktiDukung}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-primary font-medium mt-2"
          >
            <ExternalLink className="h-4 w-4" /> Buka Bukti Dukung
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MitigasiDetailModal;
