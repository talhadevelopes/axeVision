import { useMemo, useState } from "react";
import type { Snapshot } from "@axeVision/shared";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface PerformanceChartsProps {
  snapshot: Snapshot | null | undefined;
}

// Safe parse helper for metadata string shape
function safeParse<T = any>(input: unknown, fallback: T | null = null): T | null {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as T;
    } catch {
      return fallback;
    }
  }
  return (input as T) ?? fallback;
}

type Perf = { totalElements?: number; captureTime?: number; elementsPerSecond?: number } | null;
type Counts = Record<string, number> | null;

export default function PerformanceCharts({ snapshot }: PerformanceChartsProps) {
  const { perf, counts } = useMemo<{
    perf: Perf;
    counts: Counts;
  }>(() => {
    if (!snapshot) return { perf: null, counts: null };
    const meta = safeParse<Snapshot["metadata"]>(snapshot.metadata, snapshot.metadata ?? null);
    const p = meta?.performance;
    const c = meta?.elementCounts as
      | { headings?: number; paragraphs?: number; links?: number; inputs?: number; buttons?: number; forms?: number }
      | undefined;
    const perf: Perf = p
      ? {
          totalElements: Number(p.totalElements ?? 0),
          captureTime: Number(p.captureTime ?? 0),
          elementsPerSecond: Number(p.elementsPerSecond ?? 0),
        }
      : null;
    const counts: Counts = c
      ? {
          headings: Number(c.headings ?? 0),
          paragraphs: Number(c.paragraphs ?? 0),
          links: Number(c.links ?? 0),
          inputs: Number(c.inputs ?? 0),
          buttons: Number(c.buttons ?? 0),
          forms: Number(c.forms ?? 0),
        }
      : null;
    return { perf, counts };
  }, [snapshot]);

  if (!perf && !counts) {
    return null;
  }

  // Legend hover effect state for the dual-series line chart
  const [activeSeries, setActiveSeries] = useState<string | null>(null);


  return (
    <div className="space-y-4">
      {/* KPI Cards for selected snapshot */}
      {perf && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-5 floating-card">
            <div className="text-sm text-slate-500">Snapshot Throughput</div>
            <div className="mt-2 text-2xl font-bold text-slate-800 font-heading">
              {(perf.totalElements ?? 0).toLocaleString()} elements in {perf.captureTime ?? 0}ms
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-5 floating-card">
            <div className="text-sm text-slate-500">Capture Time (ms)</div>
            <div className="mt-2 text-2xl font-bold text-slate-800 font-heading">{perf.captureTime ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-5 floating-card">
            <div className="text-sm text-slate-500">Elements / sec</div>
            <div className="mt-2 text-2xl font-bold text-slate-800 font-heading">{perf.elementsPerSecond ?? 0}</div>
          </div>
        </div>
      )}

      {/* Three side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SimpleRadarChart: Element counts */}
        {counts && (
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-4">
            <div className="mb-3 font-semibold text-slate-800">Element Composition</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={Object.entries(counts).map(([name, value]) => ({ name, value }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Radar name="Counts" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* LegendEffectOpacity LineChart: Elements vs Capture Time (replaces Total Elements chart) */}
        {perf && (
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-4">
            <div className="mb-3 font-semibold text-slate-800">Elements vs Capture Time</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: "Start", elements: 0, ms: 0 },
                    { name: "Snapshot", elements: Number(perf.totalElements ?? 0), ms: Number(perf.captureTime ?? 0) },
                  ]}
                  margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
                  <YAxis tick={{ fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: number, key: string) => [
                      key === "ms" ? `${val.toLocaleString()} ms` : `${val.toLocaleString()} elements`,
                      key === "ms" ? "Capture Time" : "Elements",
                    ]}
                  />
                  <Legend onMouseEnter={(e: any) => setActiveSeries(e.dataKey)} onMouseLeave={() => setActiveSeries(null)} />
                  <Line
                    type="monotone"
                    dataKey="ms"
                    name="Capture Time"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeOpacity={activeSeries && activeSeries !== "ms" ? 0.3 : 1}
                  />
                  <Line
                    type="monotone"
                    dataKey="elements"
                    name="Elements"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeOpacity={activeSeries && activeSeries !== "elements" ? 0.3 : 1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {/* SimpleAreaChart: el/sec with baseline so it renders clearly */}
        {perf && (
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-4">
            <div className="mb-3 font-semibold text-slate-800">Elements per Second</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[{ name: "baseline", value: 0 }, { name: "el/sec", value: Number(perf.elementsPerSecond ?? 0) }]}
                  margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorElSec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
                  <YAxis tick={{ fill: "#64748b" }} domain={[0, (dataMax: number) => Math.max(1, dataMax * 1.2)]} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [
                    `${Number(value).toLocaleString()} el/sec`,
                    "Throughput",
                  ]} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#colorElSec)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
