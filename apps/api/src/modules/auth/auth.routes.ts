import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { authRateLimit, otpSendRateLimit } from "../../core/middleware/rateLimit.js";
import * as authController from "./auth.controller.js";
import {
  confirmSignUpSchema,
  listUsersQuerySchema,
  resendOtpSchema,
  signInSchema,
  signUpSchema,
  updateUserRoleSchema,
  userIdParamsSchema,
} from "./auth.schema.js";

/**
 * Module 9 — Auth routes.
 * Fan sign-up: name+email+phone+password → OTP verify → JWT.
 * Sign in (fan & staff): email+password → JWT. No OTP on sign-in.
 */
export const authRouter = Router();

authRouter.use(authRateLimit);

// Sign up + email OTP confirmation
authRouter.post("/signup", otpSendRateLimit, validate({ body: signUpSchema }), asyncHandler(authController.signUp));
authRouter.post("/otp/resend", otpSendRateLimit, validate({ body: resendOtpSchema }), asyncHandler(authController.resendOtp));
authRouter.post("/signup/confirm", validate({ body: confirmSignUpSchema }), asyncHandler(authController.confirmSignUp));

// Sign in — email + password only (fans and staff/admin roles)
authRouter.post("/login", validate({ body: signInSchema }), asyncHandler(authController.signIn));

// Authenticated
authRouter.get("/me", authMiddleware, asyncHandler(authController.me));
authRouter.post("/logout", authMiddleware, asyncHandler(authController.logout));

// super_admin only (Section 7)
authRouter.get("/users", authMiddleware, requireRole("super_admin"), validate({ query: listUsersQuerySchema }), asyncHandler(authController.listUsers));
authRouter.patch(
  "/users/:id/role",
  authMiddleware,
  requireRole("super_admin"),
  validate({ params: userIdParamsSchema, body: updateUserRoleSchema }),
  asyncHandler(authController.updateUserRole)
);
authRouter.delete(
  "/users/:id",
  authMiddleware,
  requireRole("super_admin"),
  validate({ params: userIdParamsSchema }),
  asyncHandler(authController.deleteUser)
);
