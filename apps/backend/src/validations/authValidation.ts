import z from "zod";

const emailField = z
  .string()
  .email("Invalid email")
  .transform((s) => s.trim().toLowerCase());

export const registerValidation = z.object({
  email: emailField,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginValidation = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const selectMemberValidation = z.object({
  userId: z.string().min(1, "User ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
});
