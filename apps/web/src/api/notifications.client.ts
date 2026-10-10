import { http } from "./client.js";

/** Module 11 — web push client (Section 8). */

export interface PushConfig {
  enabled: boolean;
  publicKey: string;
  supported: string;
}

export async function getPushConfig(): Promise<PushConfig> {
  const { data } = await http.get<PushConfig>("/notifications/config");
  return data;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Public API — these must not change names; the worker and browsers depend on them. */
export const pushBrowser = {
  supported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  },

  permission(): NotificationPermission {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  },

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.supported()) return null;
    try {
      return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch {
      // A failed registration means push can't work; callers surface this.
      return null;
    }
  },

  async subscribe(publicKey: string): Promise<PushSubscription | null> {
    const registration = await this.register();
    if (!registration) return null;
    // Ask only once the user has already clicked — browsers ignore or deny a
    // permission prompt that wasn't user-initiated.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      // TS types BufferSource more narrowly than the DOM accepts here.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  },

  async current(): Promise<PushSubscription | null> {
    if (!this.supported()) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  },

  async unsubscribe(): Promise<void> {
    const subscription = await this.current();
    if (subscription) await subscription.unsubscribe();
  },
};

/** Sends the subscription to the API, flattened as the schema accepts both. */
export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON() as unknown as {
    endpoint: string;
    keys?: { p256dh: string; auth: string };
  };
  await http.post("/notifications/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
    userAgent: navigator.userAgent.slice(0, 300),
  });
}

export async function removeSubscription(endpoint?: string): Promise<void> {
  await http.delete("/notifications/subscribe", { data: endpoint ? { endpoint } : {} });
}

export async function getFollows(): Promise<string[]> {
  const { data } = await http.get<{ teamIds: string[] }>("/notifications/follows");
  return data.teamIds;
}

export async function followTeam(teamId: string): Promise<void> {
  await http.post(`/notifications/follows/${teamId}`);
}

export async function unfollowTeam(teamId: string): Promise<void> {
  await http.delete(`/notifications/follows/${teamId}`);
}

export interface TestPushResult {
  delivered: boolean;
  recipients: number;
  sent: number;
  failed: number;
  pruned: number;
  reason?: string;
}

export async function sendTestPush(): Promise<TestPushResult> {
  const { data } = await http.post<TestPushResult>("/notifications/test");
  return data;
}

/** Diagnostics for the browser half of the pipeline. */
export async function getPushDiagnostics(): Promise<{
  supported: boolean;
  permission: string;
  registered: boolean;
  controller: boolean;
  hasSubscription: boolean;
  endpointHost: string | null;
}> {
  const supported = pushBrowser.supported();
  if (!supported) {
    return { supported: false, permission: "unsupported", registered: false, controller: false, hasSubscription: false, endpointHost: null };
  }
  const registration = await navigator.serviceWorker.getRegistration();
  const sub = await pushBrowser.current();
  return {
    supported: true,
    permission: pushBrowser.permission(),
    registered: Boolean(registration),
    // controller is null until the page is controlled, which needs either a
    // hard reload or clients.claim() from the worker.
    controller: Boolean(navigator.serviceWorker.controller),
    hasSubscription: Boolean(sub),
    endpointHost: sub ? safeHost(sub.endpoint) : null,
  };
}

function safeHost(endpoint: string): string | null {
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
}