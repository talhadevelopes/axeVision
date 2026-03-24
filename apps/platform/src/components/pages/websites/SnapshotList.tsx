import { useState, useEffect } from "react";
import type { Snapshot } from "@axeVision/shared";
import PerformanceCharts from "./PerformanceCharts";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Monitor, 
  ChevronDown,
  FileCode,
  Camera,
  TrendingUp,
  Layers,
  AlertCircle
} from "lucide-react";

interface SnapshotPreviewProps {
  content: string;
  capturedAt: string;
}

interface SnapshotListProps {
  snapshots: Snapshot[];
  onSnapshotSelect?: (snapshotId: string) => void;
}

function SnapshotPreview({ content, capturedAt }: SnapshotPreviewProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!content) {
    return (
      <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-8 text-center">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">No content available</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-green-100/50 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-green-100/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold font-heading text-slate-800">
              Snapshot Preview
            </h4>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(capturedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors text-sm font-medium"
        >
          <FileCode className="w-4 h-4" />
          {showRaw ? "Show Rendered" : "Show Raw HTML"}
        </button>
      </div>

      <div className="p-6">
        {showRaw ? (
          <div className="relative">
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-auto max-h-96 whitespace-pre-wrap font-mono border">
              {content}
            </pre>
          </div>
        ) : (
          <div className="relative">
            <div className="max-h-96 overflow-auto border border-slate-200 rounded-xl bg-white">
              <iframe
                srcDoc={content}
                className="w-full h-96 border-0 rounded-xl"
                title={`Preview from ${capturedAt}`}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SnapshotList({ 
  snapshots, 
  onSnapshotSelect
}: SnapshotListProps) {
  const [selectedSnapshotForPreview, setSelectedSnapshotForPreview] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (snapshots && snapshots.length > 0 && !selectedSnapshotForPreview) {
      setSelectedSnapshotForPreview(snapshots[0].id);
    }
  }, [snapshots, selectedSnapshotForPreview]);

  const handleSnapshotClick = (snapshotId: string) => {
    setSelectedSnapshotForPreview(snapshotId);
    onSnapshotSelect?.(snapshotId);
  };

  const previewSnapshot = snapshots?.find(
    (s) => s.id === selectedSnapshotForPreview
  );

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <Camera className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-lg font-medium text-slate-800 mb-2">No snapshots found</p>
        <p className="text-sm text-slate-500">
          Use the browser extension to capture snapshots for this website.
        </p>
      </div>
    );
  }

  const displayedSnapshots = showAll ? snapshots : snapshots.slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Main snapshots grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Snapshots list */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-800">
                  Snapshots
                </h2>
                <p className="text-sm text-slate-500">
                  {showAll ? snapshots.length : Math.min(2, snapshots.length)} of {snapshots.length} shown
                </p>
              </div>
            </div>
            {snapshots.length > 2 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? `Show less` : `Show all (${snapshots.length})`}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {displayedSnapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                  selectedSnapshotForPreview === snapshot.id
                    ? "border-green-300 shadow-xl ring-2 ring-green-100"
                    : "border-green-100/50 hover:border-green-200 hover:shadow-xl"
                }`}
                onClick={() => handleSnapshotClick(snapshot.id)}
              >
                {selectedSnapshotForPreview === snapshot.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none" />
                )}
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold font-heading text-lg text-slate-800">
                          Snapshot {index + 1}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {new Date(snapshot.capturedAt).toLocaleDateString()} at{' '}
                            {new Date(snapshot.capturedAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedSnapshotForPreview === snapshot.id && (
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg" />
                      )}
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                    </div>
                  </div>

                  {snapshot.contentPreview && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {snapshot.contentPreview.substring(0, 100)}...
                      </p>
                    </div>
                  )}
                  
                  {/* <div className="mt-4">
                    <PM snapshot={snapshot} />
                  </div> */}
                </div>
                
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-60">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <div 
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" 
                    style={{ animationDelay: "0.5s" }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview panel */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-800">
                  Live Preview
                </h2>
                <p className="text-sm text-slate-500">
                  {previewSnapshot ? `Selected: Snapshot from ${new Date(previewSnapshot.capturedAt).toLocaleDateString()}` : "Select a snapshot to preview"}
                </p>
              </div>
            </div>
            
            {snapshots.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 font-medium">Quick select:</label>
                <select
                  value={selectedSnapshotForPreview || snapshots[0].id}
                  onChange={(e) => handleSnapshotClick(e.target.value)}
                  className="appearance-none bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 cursor-pointer text-sm"
                >
                  {snapshots.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {`Snapshot ${idx + 1} — ${new Date(s.capturedAt).toLocaleString()}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {previewSnapshot ? (
            <div className="space-y-6">
              <SnapshotPreview 
                content={previewSnapshot.content} 
                capturedAt={previewSnapshot.capturedAt} 
              />
              
              
            </div>
          ) : (
            <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <Eye className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-500 font-medium">Select a snapshot to preview</p>
              <p className="text-sm text-slate-400 mt-2">Click on any snapshot from the list to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}