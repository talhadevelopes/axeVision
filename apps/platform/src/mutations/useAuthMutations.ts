import { useMutation, type MutationOptions, type UseMutationResult } from "@tanstack/react-query";
import { authApi } from "../services/authApi";
import type { LoginResponse, SelectMemberResponse, RegisterResponse, OnboardResponse } from "@axeVision/shared";

export const useLoginMutation = (
  options?: MutationOptions<LoginResponse, any, { email: string; password: string }>
) => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    ...options,
  });
};

export const useSelectMemberMutation = (
  options?: MutationOptions<SelectMemberResponse, any, { userId: string; memberId: string }>
) => {
  return useMutation({
    mutationFn: ({ userId, memberId }: { userId: string; memberId: string }) =>
      authApi.selectMemberProfile(userId, memberId),
    ...options,
  });
};

export const useRegisterMutation = (
  options?: MutationOptions<RegisterResponse, any, { email: string; password: string }>
) => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.register(email, password),
    ...options,
  });
};

export const useOnboardMutation = (
  options?: MutationOptions<
    OnboardResponse,
    any,
    { name: string; role: string; type: "Admin" | "Member" }
  >
): UseMutationResult<
  OnboardResponse,
  any,
  { name: string; role: string; type: "Admin" | "Member" },
  unknown
> => {
  return useMutation({
    mutationFn: ({ name, role, type }: { name: string; role: string; type: "Admin" | "Member" }) =>
      authApi.onboard(name, role, type),
    ...options,
  });
};
