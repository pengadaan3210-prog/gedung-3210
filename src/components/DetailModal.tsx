import { Kegiatan } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, User, FileText, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DetailModalProps {
  item: Kegiatan | null;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
    <div className="text-sm text-foreground">{value || "-"}</div>
  </div>
);

const DetailModal = ({ item, open, onClose }: DetailModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground pr-8">{item.uraianKegiatan}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{item.tahapan}</Badge>
          <Badge className={
            item.statusProgres === "Selesai" ? "bg-success/15 text-success border-success/30 border" :
            item.statusProgres === "Proses" ? "bg-info/15 text-info border-info/30 border" :
            item.statusProgres === "Tertunda" ? "bg-warning/15 text-warning border-warning/30 border" :
            "bg-muted text-muted-foreground border"
          }>{item.statusProgres}</Badge>
          <span className="text-sm font-bold text-accent">{item.persentaseProgres}%</span>
        </div>

        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${item.persentaseProgres}%` }} />
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Output" value={item.output} />
          <Field label="Nomor Kontrak" value={item.nomorKontrak} />
          <Field label="Tanggal Mulai" value={new Date(item.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
          <Field label="Tanggal Selesai" value={new Date(item.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
          <Field label="PIC" value={item.pic} />
          <Field label="Peran Penyedia" value={item.peranPenyedia} />
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Peran Stakeholder
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="BPS Kabupaten" value={item.peranBPSKabupaten} />
            <Field label="BPS Provinsi" value={item.peranBPSProvinsi} />
            <Field label="Pusat" value={item.peranPusat} />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Keterangan & Tindak Lanjut
          </h4>
          <Field label="Keterangan/Kendala" value={item.keterangan} />
          <Field label="Tindak Lanjut" value={item.tindakLanjut} />
        </div>

        {item.linkBuktiDukung && (
          <a
            href={item.linkBuktiDukung}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-primary font-medium mt-2"
          >
            <ExternalLink className="h-4 w-4" /> Buka Bukti Dukung
          </a>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          Terakhir diupdate: {new Date(item.tanggalUpdateTerakhir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailModal;
