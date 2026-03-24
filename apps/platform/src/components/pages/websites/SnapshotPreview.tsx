import type { Snapshot } from "@axeVision/shared";
import SnapshotList from "./SnapshotList";
import SnapshotDiff from "./SnapshotDiff";
import { useSnapshotDisplay } from "../../../hooks/useSnapshotDisplay";
import { 
  Camera, 
  TrendingUp, 
  Layers, 
  Sparkles, 
} from "lucide-react";
import InteractiveElements from "./InteractiveElements";

interface SnapshotDisplayProps {
  snapshots: Snapshot[];
}

export default function SnapshotDisplay({ snapshots }: SnapshotDisplayProps) {
  const { previewSnapshot } = useSnapshotDisplay({ snapshots });

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-xl">
            <Camera className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold font-heading text-slate-800 mb-4">
            No Snapshots Found
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Use the browser extension to capture snapshots for this website. 
            Monitor changes, track performance, and ensure quality across your web properties.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Ready to capture</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main snapshot list */}
      <SnapshotList snapshots={snapshots} />
      
      {/* Interactive elements section */}
      {previewSnapshot && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-green-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-800">
                  Interactive Elements Analysis
                </h2>
                <p className="text-sm text-slate-500">
                  Detailed breakdown of interactive components
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <InteractiveElements snapshot={previewSnapshot} />
          </div>
        </div>
      )}

      {/* Diff comparison section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-green-100/50">
          <div className="flex items-center gap-3">
            
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-800">
                Snapshot Comparison
              </h2>
              <p className="text-sm text-slate-500">
                Compare changes between different snapshots
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SnapshotDiff snapshots={snapshots} />
        </div>
      </div>
    </div>
  );
}