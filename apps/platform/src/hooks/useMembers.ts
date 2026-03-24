import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberService } from "../services/api";
import type { Member } from "@axeVision/shared";
import { useAuthStore } from "../stores/authStore";

/**
 * Hook to fetch all members for the current user's team.
 */
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

/**
 * Hook to create a new team member.
 */
export const useCreateMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Member, Error, { name: string; role: string; type: "Admin" | "Member" }>({
    mutationFn: async (formData) => {
      const created = await memberService.createMember(formData);
      return created as Member;
    },
    onSuccess: (newMember) => {
      queryClient.setQueryData<Member[]>(["members"], (old = []) => [newMember, ...old]);
      alert("Member created successfully!");
    },
  });
};

/**
 * Hook to update an existing team member.
 */
export const useUpdateMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Member, Error, { memberId: string; formData: { name: string; role: string; type: "Admin" | "Member" } }>({
    mutationFn: async ({ memberId, formData }) => {
      const updated = await memberService.updateMember(memberId, formData);
      return updated as Member;
    },
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<Member[]>(["members"], (old = []) =>
        old.map((m) => (m.memberId === updatedMember.memberId ? updatedMember : m))
      );
      alert("Member updated successfully!");
    },
  });
};

/**
 * Hook to delete a team member.
 */
export const useDeleteMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (memberId) => {
      await memberService.deleteMember(memberId);
      return memberId;
    },
    onSuccess: (deletedMemberId) => {
      queryClient.setQueryData<Member[]>(["members"], (old = []) => old.filter((m) => m.memberId !== deletedMemberId));
      alert("Member deleted successfully!");
    },
  });
};

/**
 * Consolidated hook that provides both member data and management actions.
 * Useful for the Team Management page.
 */
export const useMembers = () => {
  const membersQuery = useMembersQuery();
  const createMemberMutation = useCreateMemberMutation();
  const updateMemberMutation = useUpdateMemberMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  return {
    // Queries
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error?.message || "",
    refetch: membersQuery.refetch,

    // Mutations
    createMember: createMemberMutation.mutate,
    updateMember: updateMemberMutation.mutate,
    deleteMember: deleteMemberMutation.mutate,

    // Loading states for mutations
    isCreating: createMemberMutation.isPending,
    isUpdating: updateMemberMutation.isPending,
    isDeleting: deleteMemberMutation.isPending,
  };
};
