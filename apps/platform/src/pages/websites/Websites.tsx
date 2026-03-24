import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useWebsitesQuery } from "../../queries/useWebsiteQueries";
import type { WebsiteDTO } from "@axeVision/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@axeVision/shared/components/dropdown";
import {
  Globe,
  Calendar,
  Camera,
  ExternalLink,
  Shield,
  Zap,
  Eye,
  Plus,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  Filter,
  X,
  Brain,
  Chrome,
} from "lucide-react";
import {
  AuthRequiredError,
  ErrorDisplay,
  LoadingDisplay,
} from "../../components";

export default function Websites() {
  const { user } = useAuthStore();
  const { data: websites, isLoading, isError, error } = useWebsitesQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "updated">(
    "created"
  );

  const filteredAndSortedWebsites = useMemo(() => {
    if (!websites) return [];

    let filtered = websites.filter((website: any) => {
      // Search filter
      const matchesSearch =
        website.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.url?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && website.isActive) ||
        (filterStatus === "inactive" && !website.isActive);

      return matchesSearch && matchesStatus;
    });

    // Sort websites
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name":
          return (a.name || a.url).localeCompare(b.name || b.url);
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "updated":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [websites, searchQuery, filterStatus, sortBy]);

  if (isError && error) {
    return <ErrorDisplay message={error.message} />;
  }

  if (!user) {
    return <AuthRequiredError />;
  }

  if (isLoading) {
    return <LoadingDisplay message="Loading website data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 relative overflow-hidden">
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

      <div className="relative z-10 p-4 py-24 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          {/* Search and Filter Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search websites by name or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Summary */}
            {websites && (
              <div className="mt-4 pt-4 border-t border-slate-200/50">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Showing {filteredAndSortedWebsites.length} of{" "}
                    {websites.length} websites
                  </span>
                  {(searchQuery || filterStatus !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilterStatus("all");
                      }}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredAndSortedWebsites && filteredAndSortedWebsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredAndSortedWebsites.map((website: WebsiteDTO) => (
              <div
                key={website.id}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100/50 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <Link
                          to={`/websites/${website.id}`}
                          className="font-bold text-lg text-slate-800 hover:text-green-600 transition-colors block leading-tight"
                        >
                          {website.name || website.url}
                        </Link>
                        <p className="text-sm text-slate-500 mt-1 truncate max-w-[200px]">
                          {website.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {website.latestSnapshot && (
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg" />
                      )}
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>
                          Created:{" "}
                          {new Date(website.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {website.latestSnapshot && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 text-green-600">
                          <Camera className="w-4 h-4" />
                          <span>
                            Last Snapshot:{" "}
                            {new Date(
                              website.latestSnapshot
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/websites/${website.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Floating decoration */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-60">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100/50 p-12 text-center mb-8">
            <div className="max-w-md mx-auto">
              {websites && websites.length > 0 ? (
                // No search results found
                <>
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center shadow-xl">
                    <Search className="w-12 h-12 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-slate-800 mb-4">
                    No websites found
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    No websites match your current search or filter criteria.
                    Try adjusting your search terms or filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 text-green-700 font-medium border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Clear all filters
                  </button>
                </>
              ) : (
                // No websites at all
                <>
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-xl">
                    <Plus className="w-12 h-12 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-slate-800 mb-4">
                    No websites found
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Get started by capturing your first website snapshot using
                    the browser extension. Monitor changes, track performance,
                    and ensure quality across all your web properties.
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 text-green-700 font-medium border border-green-200">
                    <Sparkles className="w-5 h-5" />
                    Ready to start monitoring
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom tech badges */}
        <div className="mt-8 text-center opacity-80">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span>AI-Powered Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure & Reliable</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
