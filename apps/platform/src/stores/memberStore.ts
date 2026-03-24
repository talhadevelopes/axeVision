import { create } from "zustand";
import type { Member } from "@axeVision/shared";


interface MemberState {
  // State
  selectedMember: Member | null;
  isEditing: boolean;
  isCreating: boolean;
  teamLead: Member | null;
  formData: {
    name: string;
    role: string;
    type: "Admin" | "Member";
  };

  // Actions
  setSelectedMember: (member: Member | null) => void;
  setIsEditing: (editing: boolean) => void;
  setIsCreating: (creating: boolean) => void;
  setTeamLead: (teamLead: Member | null) => void;
  setFormData: (formData: {
    name: string;
    role: string;
    type: "Admin" | "Member";
  }) => void;
  selectMember: (member: Member | null) => void;
  startEditing: () => void;
  startCreating: () => void;
  cancelForm: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  // Initial state
  selectedMember: null,
  isEditing: false,
  isCreating: false,
  teamLead: null,
  formData: {
    name: "",
    role: "",
    type: "Member",
  },

  // Actions
  setSelectedMember: (member) => set({ selectedMember: member }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setTeamLead: (teamLead) => set({ teamLead: teamLead }),
  setFormData: (formData) => set({ formData }),

  selectMember: (member) => {
    if (member === null) {
      set({
        selectedMember: null,
        formData: { name: "", role: "", type: "Member" },
        isEditing: false,
        isCreating: false,
      });
    } else {
      set({
        selectedMember: member,
        formData: {
          name: member.name,
          role: member.role,
          type: member.type,
        },
        isEditing: false,
        isCreating: false,
      });
    }
  },

  startEditing: () => {
    const { selectedMember } = get();
    if (selectedMember) {
      set({
        formData: {
          name: selectedMember.name,
          role: selectedMember.role,
          type: selectedMember.type,
        },
        isEditing: true,
        isCreating: false,
      });
    }
  },

  startCreating: () => {
    set({
      formData: { name: "", role: "", type: "Member" },
      isCreating: true,
      isEditing: false,
      selectedMember: null,
    });
  },

  cancelForm: () => {
    set({
      isCreating: false,
      isEditing: false,
      formData: { name: "", role: "", type: "Member" },
    });
  },
}));
