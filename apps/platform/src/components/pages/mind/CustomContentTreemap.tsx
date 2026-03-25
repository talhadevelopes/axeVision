import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { memo, useMemo, useState } from "react";

interface Props {
  counts: Record<string, number>;
}

function CustomContentTreemapComponent({ counts }: Props) {
  const entries = useMemo(() => Object.entries(counts).sort((a, b) => b[1] - a[1]), [counts]);
  const data = useMemo(() => entries.map(([name, value]) => ({ name, value })), [entries]);
  const totalElements = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const uniqueElements = data.length;
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  // Colors for pie slices
  const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#22d3ee", "#f59e0b", "#10b981", "#ef4444"];    

  const CustomTooltip = ({ active }: any) => {
    if (!active) return null;
    return (
      <div className="bg-white border rounded-md shadow p-3 max-w-lg">
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xl font-bold">{totalElements}</div>
            <div className="text-gray-500">Total Elements</div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xl font-bold">{uniqueElements}</div>
            <div className="text-gray-500">Unique Elements</div>
          </div>
        </div>
        <div className="max-h-48 overflow-auto">
          <ul className="text-sm space-y-1">
            {entries.map(([el, val]) => (
              <li key={el} className="flex items-center justify-between">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{el}</span>
                <span className="text-gray-700">{val} ({totalElements ? ((val / totalElements) * 100).toFixed(1) : 0}%)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border rounded-lg shadow-sm p-3">
      {/* Top 5 badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {entries.slice(0, 5).map(([el, val]) => (
          <span key={el} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs bg-gray-50">
            <span className="font-mono">{el}</span>
            <span className="text-gray-600">{val} ({totalElements ? ((val / totalElements) * 100).toFixed(1) : 0}%)</span>
          </span>
        ))}
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-600">View:</span>
        <button
          className={`px-2 py-1 text-xs rounded border ${chartType === 'bar' ? 'bg-gray-900 text-white' : 'bg-white'}`}
          onClick={() => setChartType('bar')}
        >
          Bar
        </button>
        <button
          className={`px-2 py-1 text-xs rounded border ${chartType === 'pie' ? 'bg-gray-900 text-white' : 'bg-white'}`}
          onClick={() => setChartType('pie')}
        >
          Pie
        </button>
      </div>

      <div className="w-full h-[420px] overflow-x-auto">
        <div style={{ width: Math.max(600, data.length * 60) }} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(t) => (typeof t === 'string' && t.length > 15 ? `${t.slice(0, 15)}…` : t)}
                />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#60a5fa" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={140} innerRadius={60}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export const CustomContentTreemap = memo(CustomContentTreemapComponent);