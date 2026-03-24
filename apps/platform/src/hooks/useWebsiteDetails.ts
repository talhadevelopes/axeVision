import { useState, useEffect } from "react";
import { useWebsiteSnapshots } from "../queries/useSnapshotQueries";
import { useWebsiteAccessibilityIssues } from "../queries/useAccessibilityQueries";
import { useGenerateAIRecommendationsMutation } from "../mutations/useAiMutations";
import type { Snapshot, AccessibilityIssue } from "@axeVision/shared";
import type { DiffType } from "../utils/diff-utils";

interface UseWebsiteDetailsParams {
  websiteId: string;
  token?: string | null; 
  logout?: () => void;   // kept for backward compatibility (unused)
}

export const useWebsiteDetails = ({ websiteId }: UseWebsiteDetailsParams) => {
  const [snapshotA, setSnapshotA] = useState<string>("");
  const [snapshotB, setSnapshotB] = useState<string>("");
  const [diffType, setDiffType] = useState<DiffType>("lines");
  const [diffView, setDiffView] = useState<"body" | "head" | "full">("body");

  const isValidWebsiteId = !!websiteId && websiteId !== "undefined" && websiteId.trim() !== "";

  const {
    data: snapshots,
    isLoading: isLoadingSnapshots,
    isError: isErrorSnapshots,
    error: snapshotsError,
    refetch: refetchSnapshots,
  } = useWebsiteSnapshots(websiteId);

  const {
    data: accessibilityIssues,
    isLoading: isLoadingAccessibility,
    isError: isErrorAccessibility,
    error: accessibilityError,
    refetch: refetchAccessibility,
  } = useWebsiteAccessibilityIssues(websiteId);

  const {
    mutate: generateRecommendations,
    data: aiRecommendations,
    isPending: loadingAi,
    isError: isErrorAi,
    error: aiError,
    reset: resetAiRecommendations,
  } = useGenerateAIRecommendationsMutation(websiteId);

  // Set initial snapshot selections when snapshots data loads
  useEffect(() => {
    if (snapshots && snapshots.length > 0) {
      if (!snapshotA) setSnapshotA(snapshots[0].id);
      if (snapshots.length > 1 && !snapshotB) setSnapshotB(snapshots[1].id);
    }
  }, [snapshots, snapshotA, snapshotB]);

  // Computed values
  const selectedSnapshotA: Snapshot | undefined = snapshots?.find((s: Snapshot) => s.id === snapshotA);
  const selectedSnapshotB: Snapshot | undefined = snapshots?.find((s: Snapshot) => s.id === snapshotB);
  const overallLoading = isLoadingSnapshots || isLoadingAccessibility;
  const overallError = isErrorSnapshots || isErrorAccessibility;

  // Actions
  const handleGenerateRecommendations = () => {
    if (accessibilityIssues && (accessibilityIssues as AccessibilityIssue[]).length > 0) {
      generateRecommendations(accessibilityIssues as AccessibilityIssue[]);
    }
  };

  const handleRetry = () => {
    refetchSnapshots();
    refetchAccessibility();
  };

  const handleRetryAI = () => {
    resetAiRecommendations();
    handleGenerateRecommendations();
  };

  return {
    // Data
    snapshots,
    accessibilityIssues: (accessibilityIssues as AccessibilityIssue[]) || [],
    aiRecommendations,
    selectedSnapshotA,
    selectedSnapshotB,

    // Loading states
    isLoadingSnapshots,
    isLoadingAccessibility,
    loadingAi,
    overallLoading,

    // Error states
    isErrorSnapshots,
    isErrorAccessibility,
    isErrorAi,
    overallError,
    snapshotsError,
    accessibilityError,
    aiError,

    // Local state
    snapshotA,
    snapshotB,
    diffType,
    diffView,

    // State setters
    setSnapshotA,
    setSnapshotB,
    setDiffType,
    setDiffView,

    // Computed
    isValidWebsiteId,

    // Actions
    handleGenerateRecommendations,
    handleRetry,
    handleRetryAI,
    resetAiRecommendations,
  };
};
