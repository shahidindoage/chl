import { useEffect, useState } from "react";

import { getActivityFacets, listActivity, type ActivityLogDto } from "../api/admin.client.js";
import { apiErrorMessage } from "../api/client.js";

/** Module 10 — activity log viewer (Phase 4). Read-only audit trail. */

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span className="text-xs text-slate-400">system</span>;
  const tone =
    role === "super_admin"
      ? "bg-red-50 text-red-700"
      : role === "fan"
        ? "bg-slate-100 text-slate-600"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

function MetadataCell({ metadata }: { metadata: unknown }) {
  if (metadata === null || metadata === undefined) return <span className="text-slate-300">—</span>;
  let text: string;
  try {
    text = JSON.stringify(metadata);
  } catch {
    return <span className="text-slate-300">—</span>;
  }
  if (text === "{}") return <span className="text-slate-300">—</span>;
  return <span className="font-mono text-[11px] text-slate-500">{text}</span>;
}

export function ActivityLogPage() {
  const [items, setItems] = useState<ActivityLogDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [facets, setFacets] = useState<{ actions: string[]; entities: string[] }>({
    actions: [],
    entities: [],
  });
  const [error, setError] = useState<string | null>(null);
  const limit = 25;

  useEffect(() => {
    getActivityFacets().then(setFacets).catch(() => undefined);
  }, []);

  useEffect(() => {
    setItems(null);
    listActivity({
      page,
      limit,
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
    })
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch((e) => setError(apiErrorMessage(e, "Could not load the activity log")));
  }, [page, action, entity]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy">Activity log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every admin write action, newest first. {total} entries.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Action
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="input mt-1 block"
          >
            <option value="">All actions</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Entity
          <select
            value={entity}
            onChange={(e) => {
              setPage(1);
              setEntity(e.target.value);
            }}
            className="input mt-1 block"
          >
            <option value="">All entities</option>
            {facets.entities.map((en) => (
              <option key={en} value={en}>
                {en}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="alert-error">{error}</p>}

      {!items ? (
        <p className="text-slate-400">Loading activity…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No activity recorded</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Entries appear here once a manager creates, edits or deletes something.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">Metadata</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-navy">{entry.action}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {entry.entity}
                    {entry.entityId && (
                      <span className="ml-1 font-mono text-[10px] text-slate-300">
                        {entry.entityId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">{entry.userName ?? "—"}</span>
                      <RoleBadge role={entry.userRole} />
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5">
                    <MetadataCell metadata={entry.metadata} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}