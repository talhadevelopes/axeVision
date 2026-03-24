import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Globe,
  Calendar,
  TrendingUp,
  BarChart3,
  TreePine,
  Layers,
  Lightbulb,
  Activity,
} from "lucide-react";
import {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
  CustomTabsContent,
} from "@axeVision/shared/components/CustomTabs";
import type { Snapshot } from "@axeVision/shared";
import { useWebsiteSnapshots } from "../../queries/useSnapshotQueries";
import {
  ElementStatistics,
  CustomContentTreemap,
  TreeVisualization,
  LoadingDisplay,
} from "../../components";
import { parseHTMLContent, toD3Node } from "../../utils/dom-utils";

export default function WebsiteMindPage() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [parsedDOM, setParsedDOM] = useState<any>(null);
  const [elementCounts, setElementCounts] = useState<Record<string, number>>(
    {}
  );

  // AI-related state
  const [_aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Tree Visualization modal state
  const [showTree, setShowTree] = useState(false);

  // Snapshots query
  const {
    data: snapshots,
    isLoading: snapshotsLoading,
    error: snapshotsError,
  } = useWebsiteSnapshots(websiteId || "");

  useEffect(() => {
    setParsedDOM(null);
    setElementCounts({});
    setSnapshot(null);
    setError(null);
    setAiAnalysis(null);
  }, [websiteId]);

  // Reflect snapshots query state into local view state
  useEffect(() => {
    setLoading(snapshotsLoading);
    if (snapshotsError) {
      setError((snapshotsError as Error).message || "Failed to fetch snapshot");
      return;
    }
    if (snapshots && Array.isArray(snapshots)) {
      if (snapshots.length === 0) {
        setError("No snapshots found for this website");
        return;
      }
      const latestSnapshot = snapshots[0];
      setSnapshot(latestSnapshot);
      if (!latestSnapshot.content) {
        setError("Snapshot content is empty");
        return;
      }

      // Parse and set the DOM tree + element counts
      const { domTree, elementCounts } = parseHTMLContent(
        latestSnapshot.content
      );

      if (!domTree) {
        setError("Failed to parse snapshot content");
        return;
      }

      setParsedDOM(domTree);
      setElementCounts(elementCounts);
    }
  }, [snapshots, snapshotsLoading, snapshotsError]);

  if (loading) {
    return <LoadingDisplay message="Loading website data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-300/20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-100/40 to-teal-200/30 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-green-50/50 to-emerald-100/30 blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 p-4 py-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6"></div>

        {/* Snapshot Info Card */}
        {snapshot && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Website ID
                  </p>
                  <p className="font-mono text-sm text-slate-800">
                    {websiteId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Captured
                  </p>
                  <p className="text-sm text-slate-800">
                    {new Date(snapshot.capturedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Content Size
                  </p>
                  <p className="text-sm text-slate-800">
                    {snapshot.content.length.toLocaleString()} chars
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-hidden mb-8">
          <CustomTabs defaultValue="overview" className="w-full">
            <div className="border-b border-green-100/50 px-6 py-4">
              <CustomTabsList className="bg-green-50/50 p-1 rounded-xl">
                <CustomTabsTrigger
                  value="overview"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </CustomTabsTrigger>
                <CustomTabsTrigger
                  value="stats"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <TrendingUp className="w-4 h-4" />
                  Element Statistics
                </CustomTabsTrigger>
              </CustomTabsList>
            </div>

            <CustomTabsContent value="overview" className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-800">
                      Content Distribution
                    </h2>
                    <p className="text-slate-600">
                      Interactive treemap visualization of HTML elements
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <CustomContentTreemap counts={elementCounts} />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowTree(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <TreePine className="w-5 h-5" />
                  View Tree Visualization
                </button>
              </div>
            </CustomTabsContent>

            <CustomTabsContent value="stats" className="p-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-800">
                      Element Statistics
                    </h2>
                    <p className="text-slate-600">
                      Detailed breakdown of DOM structure
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50/50 rounded-xl p-4">
                  <ElementStatistics counts={elementCounts} />
                </div>
              </div>
            </CustomTabsContent>
          </CustomTabs>
        </div>

        {/* Tree Visualization Modal */}
        {showTree && (
          <TreeVisualization
            data={toD3Node(parsedDOM)}
            onClose={() => setShowTree(false)}
          />
        )}

        {/* Info Panel */}
        <div className="bg-gradient-to-r from-blue-50/80 via-cyan-50/80 to-teal-50/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100/50 p-8 mb-8">
          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-slate-800 mb-2">
                  About DOM Mind
                </h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  DOM Mind provides comprehensive analysis of your website's
                  structure and performance. Explore the interactive treemap to
                  understand element distribution, view detailed statistics for
                  optimization opportunities, and leverage AI-powered
                  recommendations for improved performance.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Interactive DOM structure exploration</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>AI-powered optimization insights</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Performance and accessibility analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>Modern HTML5 best practices</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
