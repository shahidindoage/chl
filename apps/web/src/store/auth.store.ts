import type { AuthUser, Role } from "@tournament/shared";
import { create } from "zustand";

import * as authApi from "../api/auth.client.js";
import { getToken, setToken } from "../api/client.js";

export type GuestStatus = "guest" | "loading" | "authenticated";

interface AuthState {
  user: AuthUser | null;
  status: GuestStatus;
  restore: () => Promise<void>;
  loginWithToken: (user: AuthUser, token: string) => void;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

/** Section 8: logout is client-side token discard. */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: getToken() ? "loading" : "guest",

  async restore() {
    if (!getToken()) {
      set({ user: null, status: "guest" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authApi.getMe();
      set({ user, status: "authenticated" });
    } catch {
      setToken(null);
      set({ user: null, status: "guest" });
    }
  },

  loginWithToken(user, token) {
    setToken(token);
    set({ user, status: "authenticated" });
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      /* client-side discard regardless */
    }
    setToken(null);
    set({ user: null, status: "guest" });
  },

  hasRole(roles) {
    const user = get().user;
    if (!user) return false;
    if (user.role === "super_admin") return true;
    return roles.includes(user.role);
  },
}));
