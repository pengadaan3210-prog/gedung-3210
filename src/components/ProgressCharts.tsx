import { Kegiatan, Tahapan } from "@/lib/types";
import { normalizePenyedia } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

interface ProgressChartsProps {
  data: Kegiatan[];
}

const TAHAPAN_COLORS: Record<string, string> = {
  "BPS Kabupaten Majalengka": "hsl(215, 70%, 28%)",
  "Perencanaan": "hsl(200, 75%, 45%)",
  "Pelaksanaan": "hsl(38, 92%, 50%)",
  "Pengawasan": "hsl(152, 60%, 40%)",
};

const TAHAPAN_MAP: { label: string; value: string }[] = [
  { label: "BPS Kabupaten Majalengka", value: "BPS Kabupaten Majalengka" },
  { label: "Perencanaan", value: "Perencanaan" },
  { label: "Pelaksanaan", value: "Pelaksanaan" },
  { label: "Pengawasan", value: "Pengawasan" },
];

const STATUS_COLORS: Record<string, string> = {
  Selesai: "hsl(152, 60%, 40%)",
  Proses: "hsl(200, 75%, 45%)",
  Tertunda: "hsl(38, 92%, 50%)",
  Belum: "hsl(215, 15%, 75%)",
};

const ProgressCharts = ({ data }: ProgressChartsProps) => {
  const penyediaData = TAHAPAN_MAP.map((p) => {
    const items = data.filter((d) => normalizePenyedia(d.penyedia) === p.value);
    const avg = items.length ? Math.round(items.reduce((s, d) => s + d.persentaseProgres, 0) / items.length) : 0;
    return { name: p.label, progres: avg, total: items.length };
  });

  const statusData = Object.entries(
    data.reduce((acc, d) => {
      acc[d.statusProgres] = (acc[d.statusProgres] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="shadow-md border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Progres per Tahapan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={penyediaData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={160} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="progres" radius={[0, 6, 6, 0]} barSize={24}>
                {penyediaData.map((entry) => {
                  const colorKey = TAHAPAN_COLORS[entry.name]
                    ? entry.name
                    : TAHAPAN_COLORS[entry.name?.toLowerCase()] ? entry.name : entry.name;
                  return (
                    <Cell
                      key={entry.name}
                      fill={TAHAPAN_COLORS[entry.name] || TAHAPAN_COLORS[entry.name === 'Konsultan Perancangan' ? 'Perencanaan' : entry.name === 'Kontraktor Pelaksana' ? 'Pelaksanaan' : entry.name === 'Konsultan Pengawas' ? 'Pengawasan' : entry.name] || "#1d4ed8"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressCharts;
