import { useQuery } from "@tanstack/react-query";
import type { AccessibilityIssue } from "@axeVision/shared";
import { accessibilityService } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export const fetchAccessibilityIssues = async (websiteId: string): Promise<AccessibilityIssue[]> => {
  const data = await accessibilityService.getAccessibilityResults(websiteId);
  if (data && Array.isArray(data)) return data as any;
  if (data?.issues && Array.isArray(data.issues)) return data.issues as AccessibilityIssue[];
  return [];
};

export const useWebsiteAccessibilityIssues = (websiteId: string) => {
  const { token } = useAuthStore();
  const isValidWebsiteId = !!websiteId && websiteId !== "undefined" && websiteId.trim() !== "";
  return useQuery<AccessibilityIssue[], Error>({
    queryKey: ["websiteAccessibilityIssues", websiteId],
    queryFn: () => fetchAccessibilityIssues(websiteId),
    enabled: !!token && !!isValidWebsiteId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
