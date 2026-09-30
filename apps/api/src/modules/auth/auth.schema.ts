/**
 * Module 9 — Auth input schemas.
 * Shapes live in @tournament/shared so the frontend can reuse the exact
 * same validation (Section 6: "<module>.schema.ts ... reused by validate()
 * and by packages/shared").
 */
export {
  signUpSchema,
  resendOtpSchema,
  confirmSignUpSchema,
  signInSchema,
  updateUserRoleSchema,
  userIdParamsSchema,
  listUsersQuerySchema,
  authUserSchema,
  authTokensSchema,
  authResponseSchema,
  paginatedUsersSchema,
  type SignUpInput,
  type ResendOtpInput,
  type ConfirmSignUpInput,
  type SignInInput,
  type UpdateUserRoleInput,
  type AuthUser,
  type AuthTokens,
  type AuthResponse,
} from "@tournament/shared";
