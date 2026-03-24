import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memberService } from "../services/api";
import type { Member } from "@axeVision/shared";

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
