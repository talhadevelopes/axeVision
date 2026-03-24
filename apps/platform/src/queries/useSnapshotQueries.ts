import { useQuery } from "@tanstack/react-query";
import type { Snapshot } from "@axeVision/shared";
import { snapshotService } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export const fetchSnapshots = async (websiteId: string): Promise<Snapshot[]> => {
  const data = await snapshotService.getSnapshots(websiteId);
  if (!Array.isArray(data)) return [];
  return (data as any[]).map((s) => {
    const id = s.id || s._id || s.snapshotId;
    const content = s.content || "";
    const structured = s.structuredContent || s.interactiveElements || {};
    const interactiveElements = s.interactiveElements || {
      buttons: structured.buttons || [],
      links: structured.links || [],
      inputs: structured.inputs || [],
      forms: structured.forms || [],
    };
    return {
      ...s,
      id,
      content,
      contentPreview: s.contentPreview || (content ? content.slice(0, 100) + "..." : ""),
      interactiveElements,
    } as Snapshot;
  });
};

export const useWebsiteSnapshots = (websiteId: string) => {
  const { token } = useAuthStore();
  const isValidWebsiteId = !!websiteId && websiteId !== "undefined" && websiteId.trim() !== "";
  return useQuery<Snapshot[], Error>({
    queryKey: ["websiteSnapshots", websiteId],
    queryFn: () => fetchSnapshots(websiteId),
    enabled: !!token && !!isValidWebsiteId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
