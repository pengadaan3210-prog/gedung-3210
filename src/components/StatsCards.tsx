import { Kegiatan, Tahapan, StatusProgres } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardCheck, AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  data: Kegiatan[];
}

const StatsCards = ({ data }: StatsCardsProps) => {
  const total = data.length;
  const selesai = data.filter((d) => d.statusProgres === "Selesai").length;
  const proses = data.filter((d) => d.statusProgres === "Proses").length;
  const tertunda = data.filter((d) => d.statusProgres === "Tertunda").length;
  const belum = data.filter((d) => d.statusProgres === "Belum").length;
  const avgProgress = Math.round(data.reduce((s, d) => s + d.persentaseProgres, 0) / total);

  const cards = [
    { title: "Total Kegiatan", value: total, icon: Building2, className: "bg-primary text-primary-foreground" },
    { title: "Progres Rata-rata", value: `${avgProgress}%`, icon: TrendingUp, className: "bg-accent text-accent-foreground" },
    { title: "Selesai", value: selesai, icon: CheckCircle2, className: "bg-success text-success-foreground" },
    { title: "Dalam Proses", value: proses, icon: Clock, className: "bg-info text-info-foreground" },
    { title: "Tertunda", value: tertunda, icon: AlertTriangle, className: "bg-warning text-warning-foreground" },
    { title: "Belum Dimulai", value: belum, icon: ClipboardCheck, className: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={`${card.className} border-none shadow-md`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className="h-5 w-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs opacity-80 font-medium">{card.title}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
