import { z } from "zod";

/**
 * Module 11 — Web Push input schemas.
 * Body/query/params live here so `validate()` can reuse them (Section 6).
 */

/** The shape a browser hands back from `pushManager.subscribe()`. */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url("Endpoint must be a URL").max(500),
  // PushSubscription.toJSON() flattens keys onto the top level.
  keys: z
    .object({
      p256dh: z.string().trim().min(1, "p256dh key is required").max(200),
      auth: z.string().trim().min(1, "auth key is required").max(100),
    })
    .optional(),
  p256dh: z.string().trim().min(1).max(200).optional(),
  auth: z.string().trim().min(1).max(100).optional(),
  userAgent: z.string().trim().max(300).nullish(),
});

/**
 * Accepts both the nested (`keys`) and flattened forms. Resolved in the service
 * so a client sending either shape works.
 */
export function resolveSubscriptionKeys(input: z.infer<typeof pushSubscriptionSchema>): {
  p256dh: string;
  auth: string;
} | null {
  if (input.keys) return { p256dh: input.keys.p256dh, auth: input.keys.auth };
  if (input.p256dh && input.auth) return { p256dh: input.p256dh, auth: input.auth };
  return null;
}

export const subscribeSchema = pushSubscriptionSchema;

export const teamIdParamsSchema = z.object({
  teamId: z.string().uuid("Team id must be a UUID"),
});