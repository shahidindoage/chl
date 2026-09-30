import { useCallback, useEffect, useState } from "react";

import { ROLES, type Role } from "@tournament/shared";

import * as authApi from "../../api/auth.client.js";
import { apiErrorMessage } from "../../api/client.js";
import { useAuthStore } from "../../store/auth.store.js";

interface Toast {
  kind: "error" | "ok";
  text: string;
}

/** Admin FE (Module 9): user list + role change — super_admin only. */
export function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [data, setData] = useState<authApi.PaginatedUsers | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      setData(await authApi.listUsers({ page: p, limit: 20 }));
      setPage(p);
    } catch (err) {
      setToast({ kind: "error", text: apiErrorMessage(err, "Failed to load users") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  async function changeRole(userId: string, role: Role) {
    setSavingId(userId);
    setToast(null);
    try {
      const updated = await authApi.updateUserRole(userId, role);
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((u) => (u.id === updated.id ? updated : u)) }
          : prev
      );
      setToast({ kind: "ok", text: `${updated.email} is now ${updated.role}` });
    } catch (err) {
      setToast({ kind: "error", text: apiErrorMessage(err, "Failed to update role") });
    } finally {
      setSavingId(null);
    }
  }

  async function removeUser(userId: string, userEmail: string) {
    if (!window.confirm(`Delete ${userEmail}? This cannot be undone.`)) return;
    setSavingId(userId);
    setToast(null);
    try {
      await authApi.deleteUser(userId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((u) => u.id !== userId),
              pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
            }
          : prev
      );
      setToast({ kind: "ok", text: `Deleted ${userEmail}` });
    } catch (err) {
      setToast({ kind: "error", text: apiErrorMessage(err, "Failed to delete user") });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      {toast && (
        <p className={toast.kind === "error" ? "alert-error mb-3" : "alert-info mb-3"}>{toast.text}</p>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">{u.isVerified ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    className="input w-auto"
                    value={u.role}
                    disabled={savingId === u.id || u.id === currentUser?.id}
                    onChange={(e) => void changeRole(u.id, e.target.value as Role)}
                    aria-label={`Role for ${u.email}`}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={savingId === u.id || u.id === currentUser?.id}
                    onClick={() => void removeUser(u.id, u.email)}
                    title={u.id === currentUser?.id ? "You cannot delete your own account" : "Delete account"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button
            className="btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} users)
          </span>
          <button
            className="btn-secondary"
            disabled={page >= data.pagination.totalPages || loading}
            onClick={() => void load(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
