import { Stakeholder } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  item: Stakeholder | null;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold mb-2">
      {Icon}
      {label}
    </div>
    <div className="text-sm text-foreground bg-muted/30 p-2.5 rounded border border-border">{value || "-"}</div>
  </div>
);

const STATUS_STYLE: Record<string, string> = {
  Aktif: "bg-blue-100 text-blue-800 border-blue-200",
  Selesai: "bg-green-100 text-green-800 border-green-200",
  Monitoring: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const PENGARUH_STYLE: Record<string, string> = {
  Tinggi: "bg-red-100 text-red-800 border-red-200",
  Sedang: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Rendah: "bg-green-100 text-green-800 border-green-200",
};

const StakeholderDetailModal = ({ item, open, onClose }: Props) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground pr-8 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {item.namaStakeholder}
          </DialogTitle>
        </DialogHeader>

        {/* Badges Section */}
        <div className="flex flex-wrap gap-2">
          {item.kategori && <Badge variant="outline" className="text-xs">{item.kategori}</Badge>}
          {item.tingkatPengaruh && (
            <Badge className={`text-xs border ${PENGARUH_STYLE[item.tingkatPengaruh] || ""}`}>
              Pengaruh: {item.tingkatPengaruh}
            </Badge>
          )}
          {item.status && (
            <Badge className={`text-xs border ${STATUS_STYLE[item.status] || ""}`}>
              {item.status}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Informasi Dasar */}
        <div className="space-y-1 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Informasi Dasar</h3>
          <p className="text-xs text-muted-foreground">PIC: {item.pic || "-"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Kategori Stakeholder" value={item.kategori} />
          <Field label="Peran Stakeholder" value={item.peranStakeholder} />
          <Field label="Tingkat Pengaruh" value={item.tingkatPengaruh} icon={<TrendingUp className="h-4 w-4" />} />
          <Field label="Kepentingan" value={item.kepentingan} />
          <Field label="Potensi Dukungan/Risiko" value={item.potensiDukunganRisiko} />
          <Field label="PIC" value={item.pic} />
        </div>

        <Separator className="my-4" />

        {/* Strategi & Rencana */}
        <div className="space-y-1 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Strategi & Rencana Aksi</h3>
        </div>

        <div className="space-y-4">
          <Field
            label="Strategi Pendekatan"
            value={item.strategiPendekatan}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <Field label="Tindak Lanjut" value={item.tindakLanjut} />
          <Field label="Output yang Diharapkan" value={item.outputYangDiharapkan} />
        </div>

        <Separator className="my-4" />

        {/* Detail Kendala & Keterangan */}
        <div className="space-y-1 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Status & Catatan</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Kendala"
            value={item.kendala || "-"}
            icon={<AlertCircle className="h-4 w-4 text-destructive" />}
          />
          <Field label="Status" value={item.status} icon={<CheckCircle2 className="h-4 w-4 text-success" />} />
        </div>

        <div className="mt-4">
          <Field label="Keterangan" value={item.keterangan} />
        </div>

        {/* Bukti Dukung */}
        {item.buktiDukung && (
          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <a
              href={item.buktiDukung}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-primary font-semibold transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Buka Bukti Dukung
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StakeholderDetailModal;
