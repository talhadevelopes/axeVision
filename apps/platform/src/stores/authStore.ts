import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MemberProfile,
  RegisterResponse,
  User,
  LoginResponse,
  SelectMemberResponse,
  OnboardResponse,
} from "@axeVision/shared";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  updateAuthData: (
    token: string | undefined,
    userId: string,
    onboarded: boolean,
    memberId?: string,
    memberType?: "Admin" | "Member"
  ) => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      updateAuthData: (
        newToken: string | undefined,
        newUserId: string,
        newOnboarded: boolean,
        newMemberId?: string,
        newMemberType?: "Admin" | "Member"
      ) => {
        const updatedUser: User = {
          userId: newUserId,
          onboarded: newOnboarded,
          memberId: newMemberId,
          memberType: newMemberType,
        };

        set({
          user: updatedUser,
          token:
            typeof newToken === "string" && newToken.length > 0
              ? newToken
              : null,
          isAuthenticated: typeof newToken === "string" && newToken.length > 0,
        });

        if (typeof newToken === "string" && newToken.length > 0) {
          localStorage.setItem("token", newToken);
        }

        if (typeof window !== "undefined" && window.parent === window) {
          window.postMessage(
            {
              type: "axeVision_AUTH_UPDATE",
              payload: {
                token: newToken,
                userId: newUserId,
                onboarded: newOnboarded,
                memberId: newMemberId,
                memberType: newMemberType,
              },
            },
            "*"
          );
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type {
  User,
  MemberProfile,
  LoginResponse,
  RegisterResponse,
  SelectMemberResponse,
  OnboardResponse,
};
