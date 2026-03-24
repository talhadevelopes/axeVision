import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "../../stores/authStore";
import {
  websiteService,
  snapshotService,
  accessibilityService,
  memberService,
} from "../../services/api";
import type { Member } from "@axeVision/shared";
import type {
  AccessibilityIssue,
  Snapshot,
  WebsiteDTO,
} from "@axeVision/shared";
import {
  Globe,
  Camera,
  Users,
  Shield,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { PageBackground } from "../../components";

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();

  const {
    data: websites = [],
    isLoading: isLoadingWebsites,
    error: websitesError,
  } = useQuery({
    queryKey: ["websites"],
    queryFn: async (): Promise<WebsiteDTO[]> => {
      const data = await websiteService.getWebsites();
      return Array.isArray(data) ? (data as WebsiteDTO[]) : [];
    },
    enabled: !!token,
  });

  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useQuery({
    queryKey: ["snapshots", websites.map((w) => w.id)],
    queryFn: async (): Promise<Snapshot[]> => {
      if (!websites.length) return [];
      const snapshotPromises = websites
        .filter((website) => website.id && typeof website.id === "string")
        .map(async (website) => {
          try {
            const data = await snapshotService.getSnapshots(
              website.id as string
            );
            return Array.isArray(data) ? (data as Snapshot[]) : [];
          } catch (error) {
            console.warn(`Failed to fetch snapshots for website ${website.id}`);
            return [];
          }
        });
      const snapshotArrays = await Promise.all(snapshotPromises);
      return snapshotArrays.flat();
    },
    enabled: !!token && websites.length > 0,
  });

  const { data: accessibilityIssues = [], isLoading: isLoadingAccessibility } =
    useQuery({
      queryKey: ["accessibility-issues", websites.map((w) => w.id)],
      queryFn: async (): Promise<AccessibilityIssue[]> => {
        if (!websites.length) return [];
        const issuePromises = websites
          .filter((website) => website.id && typeof website.id === "string")
          .map(async (website) => {
            try {
              const data = await accessibilityService.getAccessibilityResults(
                website.id as string
              );
              if (Array.isArray(data)) return data as AccessibilityIssue[];
              return data?.issues || [];
            } catch (error) {
              console.warn(
                `Failed to fetch accessibility issues for website ${website.id}`
              );
              return [];
            }
          });
        const issueArrays = await Promise.all(issuePromises);
        return issueArrays.flat();
      },
      enabled: !!token && websites.length > 0,
    });

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => {
      const data = await memberService.getMembersByUser();
      if (Array.isArray(data)) return data as Member[];
      if (data?.members && Array.isArray(data.members))
        return data.members as Member[];
      return [];
    },
    enabled: !!token,
  });

  const activeWebsites = websites.filter((w) => w.isActive).length;
  const inactiveWebsites = websites.length - activeWebsites;
  const criticalAccessibilityIssues = accessibilityIssues.filter(
    (i) => i.severity === "Critical" || i.severity === "High"
  ).length;
  const totalIssues = accessibilityIssues.length;

  // Sparkline data for charts in cards
  const snapshotsOverTime = useMemo(() => {
    if (!snapshots.length) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const daySnapshots = snapshots.filter((s) => {
        const snapshotDate = new Date(s.capturedAt);
        return snapshotDate.toDateString() === date.toDateString();
      }).length;
      return { value: daySnapshots };
    }).reverse();
    return last7Days;
  }, [snapshots]);

  const issuesOverTime = useMemo(() => {
    if (!accessibilityIssues.length) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayIssues = accessibilityIssues.filter((issue) => {
        const issueDate = new Date((issue as any).createdAt || (issue as any).capturedAt);
        return issueDate.toDateString() === date.toDateString();
      }).length;
      return { value: dayIssues };
    }).reverse();
    return last7Days;
  }, [accessibilityIssues]);

  const membersOverTime = useMemo(() => {
    return [
      { value: Math.max(1, members.length - 2) },
      { value: Math.max(1, members.length - 1) },
      { value: members.length },
      { value: members.length },
      { value: members.length },
      { value: members.length },
      { value: members.length },
    ];
  }, [members]);

  const isLoading =
    isLoadingWebsites ||
    isLoadingSnapshots ||
    isLoadingAccessibility ||
    isLoadingMembers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 relative overflow-hidden">
      <PageBackground />

      <div className="relative z-10 p-4 py-8 mt-20 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">
                Loading Dashboard
              </h2>
              <p className="text-slate-600">Fetching your data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Websites Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-200/20 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                      <Globe className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                      Total
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-700 mb-1 tracking-wide">
                    WEBSITES
                  </h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
                    {websites.length}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/40">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-emerald-600">
                          {activeWebsites}
                        </span>{" "}
                        active
                      </p>
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-amber-600">
                          {inactiveWebsites}
                        </span>{" "}
                        inactive
                      </p>
                    </div>
                  </div>

                  {snapshotsOverTime.length > 0 && (
                    <div className="h-12">
                      <p className="text-xs text-slate-500 mb-2 font-medium">
                        7-day trend
                      </p>
                      <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={snapshotsOverTime}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Snapshots Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-200/20 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700">
                      Captured
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-700 mb-1 tracking-wide">
                    SNAPSHOTS
                  </h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">
                    {snapshots.length}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/40">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">
                        Last snapshot:{" "}
                        <span className="font-bold text-slate-800">
                          {snapshots.length > 0
                            ? new Date(
                              snapshots[0]?.capturedAt
                            ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {snapshotsOverTime.length > 0 && (
                    <div className="h-12">
                      <p className="text-xs text-slate-500 mb-2 font-medium">
                        7-day trend
                      </p>
                      <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={snapshotsOverTime}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Issues Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-transparent to-red-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-red-200/20 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      Critical
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-700 mb-1 tracking-wide">
                    ISSUES
                  </h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">
                    {criticalAccessibilityIssues}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/40">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-red-600">
                          {criticalAccessibilityIssues}
                        </span>{" "}
                        critical/high
                      </p>
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">
                          {totalIssues}
                        </span>{" "}
                        total
                      </p>
                    </div>
                  </div>

                  {issuesOverTime.length > 0 && (
                    <div className="h-12">
                      <p className="text-xs text-slate-500 mb-2 font-medium">
                        7-day trend
                      </p>
                      <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={issuesOverTime}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Members Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-emerald-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-200/20 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                      Team
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-700 mb-1 tracking-wide">
                    TEAM MEMBERS
                  </h3>
                  <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-3">
                    {members.length}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/40">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-emerald-600">
                          {members.filter((m) => m.type === "Admin").length}
                        </span>{" "}
                        admin
                      </p>
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">
                          {members.filter((m) => m.type !== "Admin").length}
                        </span>{" "}
                        members
                      </p>
                    </div>
                  </div>

                  {membersOverTime.length > 0 && (
                    <div className="h-12">
                      <p className="text-xs text-slate-500 mb-2 font-medium">
                        Growth
                      </p>
                      <ResponsiveContainer width="100%" height={32}>
                        <LineChart data={membersOverTime}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Websites Section */}
            {websites.length > 0 ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-heading text-slate-900">
                      Your Websites
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {websites.length} tracked properties
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {websites.map((website) => (
                    <Link
                      key={website.id}
                      to={`/websites/${website.id}`}
                      className="group relative overflow-hidden bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl rounded-2xl border border-green-100/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-transparent to-emerald-100/0 group-hover:from-emerald-50/40 group-hover:via-transparent group-hover:to-emerald-100/40 transition-all duration-500" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <Globe className="w-6 h-6 text-white" />
                          </div>
                          {website.isActive && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 border border-emerald-300">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-semibold text-emerald-700">
                                Active
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                          {website.name || website.url}
                        </h3>
                        <p className="text-sm text-slate-500 truncate mb-4">
                          {website.url}
                        </p>

                        <div className="space-y-2 pt-4 border-t border-slate-200/40">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              Created:{" "}
                              {new Date(website.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {website.latestSnapshot && (
                            <div className="flex items-center gap-2 text-sm">
                              <Camera className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700 font-medium">
                                Last:{" "}
                                {new Date(
                                  website.latestSnapshot
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 mb-8">
                <div className="bg-gradient-to-br from-slate-100/60 via-white/40 to-slate-100/60 backdrop-blur-xl rounded-3xl p-12 inline-block border border-slate-200/50">
                  <Globe className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">
                    No websites tracked yet
                  </h2>
                  <p className="text-slate-600">
                    Start monitoring by capturing a snapshot using the browser
                    extension.
                  </p>
                </div>
              </div>
            )}

            {/* Members Section */}
            {members.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold font-heading text-slate-900 mb-6">
                  Team Members
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <Link
                      key={member.memberId}
                      to={`/members/${member.memberId}`}
                      className="group relative overflow-hidden bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-xl rounded-2xl border border-green-100/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-100/0 group-hover:from-blue-50/40 group-hover:via-transparent group-hover:to-blue-100/40 transition-all duration-500" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {member.name}
                            </h3>
                            <p className="text-sm text-slate-600 capitalize mt-1">
                              {member.role}
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${member.type === "Admin"
                              ? "bg-purple-100 border border-purple-300 text-purple-700"
                              : "bg-blue-100 border border-blue-300 text-blue-700"
                              }`}
                          >
                            {member.type}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200/40">
                          <div className="flex items-center gap-2 text-sm">
                            {member.type === "Admin" ? (
                              <Shield className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Users className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="text-slate-600">
                              {member.type === "Admin"
                                ? "Administrator"
                                : "Team Member"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-emerald-700 font-medium text-sm group-hover:gap-3 transition-all">
                          <span>View Profile</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}