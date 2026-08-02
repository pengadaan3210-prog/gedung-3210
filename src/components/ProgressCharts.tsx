import { Kegiatan } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface ProgressChartsProps {
  data: Kegiatan[];
}

const ProgressCharts = ({ data }: ProgressChartsProps) => {
  const tahapanList = Array.from(new Set(data.map((d) => d.tahapan).filter(Boolean)));

  const chartData = tahapanList.map((t) => {
    const items = data.filter((d) => d.tahapan === t);
    return {
      name: t.length > 18 ? `${t.slice(0, 18)}…` : t,
      Terpenuhi: items.filter((d) => d.status).length,
      Belum: items.filter((d) => !d.status).length,
    };
  });

  return (
    <Card className="shadow-md border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <BarChart3 className="h-4 w-4 text-accent" /> Kelengkapan per Tahapan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Terpenuhi" stackId="a" fill="hsl(152, 60%, 40%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Belum" stackId="a" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressCharts;
