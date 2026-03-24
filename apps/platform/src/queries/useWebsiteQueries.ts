import { useQuery } from "@tanstack/react-query";
import { websiteService } from "../services/api";
import type { WebsiteDTO } from "@axeVision/shared";
import { useAuthStore } from "../stores/authStore";

export const useWebsitesQuery = () => {
  const { token, logout } = useAuthStore();

  return useQuery<WebsiteDTO[], Error>({
    queryKey: ["websites"],
    queryFn: async () => {
      if (!token) {
        logout();
        throw new Error("Authentication token not found. Please log in.");
      }
      const data = await websiteService.getWebsites();
      const list = Array.isArray(data) ? (data as any[]) : (data && Array.isArray((data as any).websites) ? (data as any).websites : []);
      return (list as any[]).map((w) => {
        const id = w.id || w._id || w.websiteId;
        return {
          ...w,
          id,
        } as WebsiteDTO;
      });
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
