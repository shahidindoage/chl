import type { VenueDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as api from "../api/tournament.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";

/** Public FE (Module 1): venues list + venue detail. */
export function VenuesPage() {
  const [venues, setVenues] = useState<VenueDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listVenues({ page: 1, limit: 50 })
      .then((d) => setVenues(d.items))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <PageHero
        title="Venues"
        description="The grounds hosting the competition — capacity, location and everything you need before matchday."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Venues" }]}
        // image="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1600&q=80"
      />

      {!venues ? (
        <p className="mt-8 text-slate-400">Loading venues…</p>
      ) : venues.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No venues announced yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Grounds appear here as soon as they are added to a tournament.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Link key={v.id} to={`/venues/${v.id}`} className="card hover:border-brand-500 hover:shadow-md">
              {v.image && <img src={v.image} alt={v.name} className="mb-3 h-32 w-full rounded object-cover" />}
              <h2 className="font-bold">{v.name}</h2>
              <p className="text-sm text-slate-500">{v.city}{v.capacity ? ` · ${v.capacity.toLocaleString()} seats` : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getVenue(id).then(setVenue).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!venue) return <p className="text-slate-400">Loading venue…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/venues" className="text-sm text-brand-600 hover:underline">← All venues</Link>
      <div className="card mt-3">
        {venue.image && <img src={venue.image} alt={venue.name} className="mb-4 h-56 w-full rounded object-cover" />}
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex gap-2"><dt className="w-24 font-semibold text-slate-500">Address</dt><dd>{venue.address}</dd></div>
          <div className="flex gap-2"><dt className="w-24 font-semibold text-slate-500">City</dt><dd>{venue.city}</dd></div>
          <div className="flex gap-2"><dt className="w-24 font-semibold text-slate-500">Capacity</dt><dd>{venue.capacity ? venue.capacity.toLocaleString() : "—"}</dd></div>
        </dl>
      </div>
    </div>
  );
}
