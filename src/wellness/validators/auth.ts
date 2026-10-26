import { z } from "zod";

export const SignUpSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(3, "Full name must be at least 3 characters")
    .max(60, "Full name cannot exceed 60 characters")
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .regex(/^[0-9+\s\-]*$/, "Phone number may only contain digits, +, spaces, or hyphens")
    .min(10, "Phone number must be at least 10 digits")
    .max(18, "Phone number cannot exceed 18 digits")
    .optional()
    .or(z.literal("")),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
});

export const SignInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string({ required_error: "Reset token is missing" }).min(1),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "New password must contain at least 1 number"),
    confirmPassword: z.string({ required_error: "Password confirmation is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match new password",
    path: ["confirmPassword"],
  });

export const UpdateProfileSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(3, "Full name must be at least 3 characters")
    .max(60, "Full name cannot exceed 60 characters")
    .trim(),
  phone: z
    .string()
    .regex(/^[0-9+\s\-]*$/, "Phone number may only contain digits, +, spaces, or hyphens")
    .min(10, "Phone number must be at least 10 digits")
    .max(18, "Phone number cannot exceed 18 digits")
    .optional()
    .or(z.literal("")),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "New password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "New password must contain at least 1 number"),
    confirmPassword: z.string({ required_error: "Password confirmation is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password confirmation does not match new password",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const DeleteAccountSchema = z.object({
  password: z
    .string({ required_error: "Password is required for security verification" })
    .min(1, "Password is required"),
});
