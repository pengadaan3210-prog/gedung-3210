import { Stakeholder } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  item: Stakeholder | null;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
    <div className="text-sm text-foreground">{value || "-"}</div>
  </div>
);

const STATUS_STYLE: Record<string, string> = {
  Aktif: "bg-green-100 text-green-800",
  Selesai: "bg-blue-100 text-blue-800",
  Monitoring: "bg-yellow-100 text-yellow-800",
};

const PENGARUH_STYLE: Record<string, string> = {
  Tinggi: "bg-red-100 text-red-800",
  Sedang: "bg-yellow-100 text-yellow-800",
  Rendah: "bg-green-100 text-green-800",
};

const StakeholderDetailModal = ({ item, open, onClose }: Props) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground pr-8">{item.namaStakeholder}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{item.kategori || "-"}</Badge>
          {item.tingkatPengaruh && (
            <Badge className={PENGARUH_STYLE[item.tingkatPengaruh] || ""}>{item.tingkatPengaruh}</Badge>
          )}
          {item.status && (
            <Badge className={STATUS_STYLE[item.status] || ""}>{item.status}</Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Peran Stakeholder" value={item.peranStakeholder} />
          <Field label="Kepentingan / Interest" value={item.kepentingan} />
          <Field label="Tingkat Pengaruh" value={item.tingkatPengaruh} />
          <Field label="Potensi Dukungan / Risiko" value={item.potensiDukunganRisiko} />
          <Field label="Strategi Pendekatan" value={item.strategiPendekatan} />
          <Field label="PIC" value={item.pic} />
        </div>

        <Separator />

        <div className="space-y-3">
          <Field label="Tindak Lanjut" value={item.tindakLanjut} />
          <Field label="Output yang Diharapkan" value={item.outputYangDiharapkan} />
          <Field label="Kendala" value={item.kendala} />
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

export default StakeholderDetailModal;
