import { z } from "zod";

import { ROLES, type Role } from "./roles.js";

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLES),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authTokensSchema = z.object({
  token: z.string(),
  tokenType: z.literal("Bearer"),
  expiresIn: z.string(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 \-]{6,19}$/, "Invalid phone number");

/** Sign up — OTP verifies the email; password is set during signup. */
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Resend the OTP while completing sign-up verification. */
export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

/** Confirm sign-up with the emailed OTP — issues JWT. */
export const confirmSignUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});
export type ConfirmSignUpInput = z.infer<typeof confirmSignUpSchema>;

/** Sign in — email + password only, no OTP. */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const userIdParamsSchema = z.object({
  id: z.string().uuid("User id must be a UUID"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginatedUsersSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  });

export type RoleName = Role;
