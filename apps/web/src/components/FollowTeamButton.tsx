import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import {
  followTeam,
  getFollows,
  getPushConfig,
  pushBrowser,
  removeSubscription,
  saveSubscription,
  unfollowTeam,
} from "../api/notifications.client.js";
import type { PushConfig } from "../api/notifications.client.js";
import { apiErrorMessage } from "../api/client.js";
import { useAuthStore } from "../store/auth.store.js";
import { useHomeData } from "../public/home/HomeDataContext.js";

/**
 * Module 11 — follow-a-team opt-in.
 *
 * Deliberately a single follow action rather than a global "notify me for
 * everything" switch. A fan who is muted once can never be unmuted, so the
 * first permission we ask for has to be one they'll still want in a month.
 */

type State = "idle" | "enabling" | "on" | "off" | "unsupported" | "blocked";

export function FollowTeamButton({
  teamId,
  teamName,
  color1,
}: {
  teamId: string;
  teamName: string;
  /** Team colour for the enabled state; falls back to the site orange. */
  color1?: string | null;
}) {
  const isSignedIn = useAuthStore((s) => s.status === "authenticated");
  const { openAuth } = useHomeData();
  const [following, setFollowing] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefetch the config so the click path can ask for permission without an
  // await in front of it — browsers treat requestPermission() as a user
  // gesture, and awaiting the API first can lose that.
  useEffect(() => {
    if (!isSignedIn) return;
    getPushConfig().then(setConfig).catch(() => undefined);
    if (!pushBrowser.supported()) return;
    getFollows()
      .then((ids) => setFollowing(ids.includes(teamId)))
      .catch(() => undefined);
  }, [isSignedIn, teamId]);

  async function enable() {
    setState("enabling");
    setError(null);
    try {
      // The VAPID public key comes from the API so it is only ever configured
      // in one place (apps/api/.env).
      const cfg = config ?? (await getPushConfig());
      setConfig(cfg);
      if (!cfg.enabled) {
        setState("unsupported");
        return;
      }

      const sub = await pushBrowser.subscribe(cfg.publicKey);
      if (!sub) {
        // Permission was granted but registration still failed, which is a
        // different problem from being blocked.
        const permission = pushBrowser.permission();
        setState(permission === "denied" ? "blocked" : "idle");
        if (permission !== "denied") {
          setError("Could not register this device for notifications. Try again, or check your browser's notification settings.");
        }
        return;
      }

      await saveSubscription(sub);
      await followTeam(teamId);

      // The server is the source of truth — re-read rather than trusting the
      // local flag, so a lost response can't leave the button out of sync.
      const ids = await getFollows();
      setFollowing(ids.includes(teamId));
      setState("on");
    } catch (err) {
      console.error("follow failed", err);
      setError(apiErrorMessage(err, "Could not enable notifications"));
      setState("idle");
    }
  }

  async function disable() {
    setState("enabling");
    setError(null);
    try {
      const sub = await pushBrowser.current();
      if (sub) await removeSubscription(sub.endpoint);
      await unfollowTeam(teamId);
      const ids = await getFollows();
      setFollowing(ids.includes(teamId));
      setState(ids.includes(teamId) ? "on" : "off");
    } catch (err) {
      console.error("unfollow failed", err);
      setError(apiErrorMessage(err, "Could not turn notifications off"));
      setState(following ? "on" : "idle");
    }
  }

  // Semi-transparent so the team's hero art shows through the pill.
  const accent = color1
    ? { backgroundColor: `${color1}dd`, borderColor: `${color1}` }
    : undefined;

  if (!isSignedIn) {
    return (
      <button
        type="button"
        onClick={openAuth}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-navy"
      >
        <Bell className="h-3.5 w-3.5" />
        Follow {teamName}
      </button>
    );
  }

  if (state === "unsupported" || state === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <BellOff className="h-3.5 w-3.5" />
        {state === "blocked"
          ? "Notifications blocked — enable them in your browser settings"
          : "Push not supported on this browser"}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {following || state === "on" ? (
        <button
          type="button"
          onClick={() => void disable()}
          disabled={state === "enabling"}
          className="inline-flex items-center gap-1.5 rounded-full border border-pitch-orange/40 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-pitch-orange-dark transition-colors hover:border-pitch-orange disabled:opacity-60"
        >
          <Bell className="h-3.5 w-3.5" />
          {state === "enabling" ? "Turning off…" : "Following — turn off"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={state === "enabling"}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60"
          style={accent}
        >
          <Bell className="h-3.5 w-3.5" />
          {state === "enabling" ? "Enabling…" : "Notify me when this team plays"}
        </button>
      )}
      {error && (
        <span role="alert" className="max-w-[16rem] text-[11px] font-normal leading-snug text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}