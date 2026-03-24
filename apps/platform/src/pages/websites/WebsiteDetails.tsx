import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useWebsiteDetails } from "../../hooks/useWebsiteDetails";
import {
  ArrowLeft,
  Globe,
  Gauge,
  Layers,
  ScanLine,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  Activity,
} from "lucide-react";
import {
  PerformanceCharts,
  InteractiveElements,
  SnapshotDisplay,
  EnhancedAccessibilitySection,
  AccessibilityChatbot,
  ErrorDisplay,
  AuthRequiredError,
  PageBackground,
} from "../../components";
import SummaryCard from "../../components/pages/websites/SummaryCard";

export default function WebsiteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const websiteId = id || "";
  const { token, user } = useAuthStore();

  const {
    snapshots,
    accessibilityIssues,
    aiRecommendations,
    overallError,
    snapshotsError,
    accessibilityError,
    isValidWebsiteId,
    loadingAi,
    isErrorAi,
    aiError,
    handleGenerateRecommendations,
    handleRetry,
    handleRetryAI,
  } = useWebsiteDetails({ websiteId });

  if (!user || !token) {
    return (
      <AuthRequiredError
        title="Website Details"
        message="Please login to view website details and snapshots."
      />
    );
  }

  if (!isValidWebsiteId) {
    return (
      <ErrorDisplay
        title="Invalid Website ID"
        message={`The website ID "${websiteId}" is not valid.`}
        action={{
          label: "Back to Websites",
          href: "/websites",
          icon: <ArrowLeft className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 relative overflow-hidden">
      <PageBackground />

      <div className="relative z-10 max-w-7xl mx-auto p-4 py-24">
        {/* Header Section with enhanced styling */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Link
                      to="/websites"
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Websites
                    </Link>
                  </div>
                  <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                    Website Details
                  </h1>
                  <p className="text-slate-600 flex items-center gap-2 mt-1">
                    <Activity className="w-4 h-4 text-green-500" />
                    Website ID: {websiteId}
                  </p>
                </div>
              </div>

              {/* Quick action button */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display with enhanced styling */}
        {overallError && (snapshotsError || accessibilityError) && (
          <div className="mb-6">
            <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-red-700 mb-4">
                    {(snapshotsError || accessibilityError)?.message}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                    {(snapshotsError?.message?.includes("login") ||
                      accessibilityError?.message?.includes("login")) && (
                        <Link
                          to="/login"
                          className="px-4 py-2 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-50 transition-colors"
                        >
                          Go to Login
                        </Link>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* summary cards with better styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            icon={Layers}
            iconColor="from-blue-500 to-indigo-600"
            title="Total Snapshots"
            value={snapshots?.length || 0}
            status="Available"
            statusColor="text-green-600"
            statusIcon={CheckCircle2}
            trendIcon={TrendingUp}
          />

          <SummaryCard
            icon={Gauge}
            iconColor="from-amber-500 to-orange-600"
            title="Accessibility Issues"
            value={accessibilityIssues?.length || 0}
            status={(accessibilityIssues?.length || 0) > 0 ? "Needs attention" : "All clear"}
            statusColor={(accessibilityIssues?.length || 0) > 0 ? "text-amber-600" : "text-green-600"}
            statusIcon={Eye}
            trendIcon={Activity}
          />

          <SummaryCard
            icon={ScanLine}
            iconColor="from-purple-500 to-pink-600"
            title="AI Recommendations"
            value={aiRecommendations ? "Ready" : "Generate"}
            status={aiRecommendations ? "Available" : "Click to generate"}
            statusColor="text-purple-600"
            statusIcon={Sparkles}
            trendIcon={Sparkles}
          />
        </div>

        {/* Performance Charts Section */}
        {snapshots && snapshots.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-visible">
              <div className="px-6 py-5 border-b border-green-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-800">
                      Performance Analytics
                    </h2>
                    <p className="text-sm text-slate-500">
                      Visual insights and performance metrics
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <PerformanceCharts snapshot={snapshots[0]} />
              </div>
            </div>
          </div>
        )}

        {/* Snapshots section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-visible">
            <div className="p-6">
              <SnapshotDisplay snapshots={snapshots || []} />
            </div>
          </div>
        </div>

        {/* Accessibility section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 overflow-visible">
            <div className="p-6">
              <EnhancedAccessibilitySection
                accessibilityIssues={accessibilityIssues}
                aiRecommendations={aiRecommendations}
                loadingAi={loadingAi}
                isErrorAi={isErrorAi}
                aiError={aiError}
                onGenerateRecommendations={handleGenerateRecommendations}
                onRetryAI={handleRetryAI}
                websiteId={websiteId}
              />
            </div>
          </div>
        </div>
        <div>
          <AccessibilityChatbot
            websiteId={websiteId}
            snapshotId={
              snapshots && snapshots.length > 0
                ? (snapshots[0] as any).id || (snapshots[0] as any)._id || (snapshots[0] as any).snapshotId
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
