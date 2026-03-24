import { useQuery } from "@tanstack/react-query";
import { memberService } from "../services/api";
import type { Member } from "@axeVision/shared";
import { useAuthStore } from "../stores/authStore";

export const useMembersQuery = () => {
  const { token } = useAuthStore();
  return useQuery<Member[], Error>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!token) throw new Error("Authentication token not found. Please log in.");
      const data = await memberService.getMembersByUser();
      if (Array.isArray(data)) return data as Member[];
      if (data?.members && Array.isArray(data.members)) return data.members as Member[];
      return [];
    },
    enabled: !!token,
    staleTime: 60_000,
  });
};
