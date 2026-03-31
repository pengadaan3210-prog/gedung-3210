import { Kegiatan, Tahapan } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

interface ProgressChartsProps {
  data: Kegiatan[];
}

const TAHAPAN_COLORS: Record<Tahapan, string> = {
  Perencanaan: "hsl(215, 70%, 28%)",
  Pelaksanaan: "hsl(200, 75%, 45%)",
  Pengawasan: "hsl(152, 60%, 40%)",
};

const STATUS_COLORS: Record<string, string> = {
  Selesai: "hsl(152, 60%, 40%)",
  Proses: "hsl(200, 75%, 45%)",
  Tertunda: "hsl(38, 92%, 50%)",
  Belum: "hsl(215, 15%, 75%)",
};

const ProgressCharts = ({ data }: ProgressChartsProps) => {
  const tahapanData = (["Perencanaan", "Pelaksanaan", "Pengawasan"] as Tahapan[]).map((t) => {
    const items = data.filter((d) => d.tahapan === t);
    const avg = items.length ? Math.round(items.reduce((s, d) => s + d.persentaseProgres, 0) / items.length) : 0;
    return { name: t, progres: avg, total: items.length };
  });

  const statusData = Object.entries(
    data.reduce((acc, d) => {
      acc[d.statusProgres] = (acc[d.statusProgres] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-md border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Progres per Tahapan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tahapanData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="progres" radius={[0, 6, 6, 0]} barSize={28}>
                {tahapanData.map((entry) => (
                  <Cell key={entry.name} fill={TAHAPAN_COLORS[entry.name as Tahapan]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Distribusi Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#999"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressCharts;
