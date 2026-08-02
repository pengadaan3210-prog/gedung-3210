import { Kegiatan } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";

interface DetailModalProps {
  item: Kegiatan | null;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
    <div className="text-sm text-foreground break-words">{value || "-"}</div>
  </div>
);

const DetailModal = ({ item, open, onClose }: DetailModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground pr-8">
            {item.dokumen || "Detail Dokumen"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{item.penanggungjawab}</Badge>
          <Badge variant="outline">{item.tahapan}</Badge>
          {item.status ? (
            <Badge className="bg-success/15 text-success border border-success/30 gap-1">
              <CheckCircle2 className="h-3 w-3" /> {item.statusKeterangan || "Terpenuhi"}
            </Badge>
          ) : (
            <Badge className="bg-destructive/10 text-destructive border border-destructive/30 gap-1">
              <XCircle className="h-3 w-3" /> {item.statusKeterangan || "Belum Terpenuhi"}
            </Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Penanggungjawab" value={item.penanggungjawab} />
          <Field label="Tahapan" value={item.tahapan} />
          <Field label="Dokumen" value={item.dokumen} />
          <Field label="Penyedia" value={item.penyedia} />
          <Field label="Nama File" value={item.namaFile} />
          <Field label="Status" value={item.statusKeterangan} />
        </div>

        <Separator />

        <Field label="Keterangan" value={item.keterangan} />

        {item.linkDokumen && item.linkDokumen.startsWith("http") && (
          <Button asChild className="w-full sm:w-auto">
            <a href={item.linkDokumen} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Buka Dokumen
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetailModal;
