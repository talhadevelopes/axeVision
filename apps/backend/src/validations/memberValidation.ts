import z from "zod";
import { MemberType } from "../models";

export const createMemberValidation = z.object({
  name: z.string().min(1, "Name is required").trim(),
  role: z.string().min(1, "Role is required").trim(),
  type: z.nativeEnum(MemberType, { errorMap: () => ({ message: "Invalid member type" }) }),
  targetUserId: z.string().optional(),
});

export const updateMemberValidation = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  role: z.string().min(1, "Role is required").trim().optional(),
  type: z.nativeEnum(MemberType).optional(),
}).refine(data => data.name || data.role || data.type, {
  message: "At least one field (name, role, or type) must be provided",
});