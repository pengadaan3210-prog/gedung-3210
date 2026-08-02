import { Kegiatan } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  data: Kegiatan[];
}

const StatsCards = ({ data }: StatsCardsProps) => {
  const total = data.length;
  const terpenuhi = data.filter((d) => d.status).length;
  const belum = total - terpenuhi;
  const persen = total ? Math.round((terpenuhi / total) * 100) : 0;

  const cards = [
    { title: "Total Dokumen", value: total, icon: FileText, className: "bg-primary text-primary-foreground" },
    { title: "Kelengkapan", value: `${persen}%`, icon: TrendingUp, className: "bg-accent text-accent-foreground" },
    { title: "Terpenuhi", value: terpenuhi, icon: CheckCircle2, className: "bg-success text-success-foreground" },
    { title: "Belum Terpenuhi", value: belum, icon: XCircle, className: "bg-warning text-warning-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
