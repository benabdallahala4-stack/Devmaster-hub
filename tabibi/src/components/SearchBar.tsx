"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, SPECIALTIES } from "@/lib/data";

export default function SearchBar({
  initialQuery = "",
  initialCity = "",
  compact = false,
}: {
  initialQuery?: string;
  initialCity?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("ville", city);
    router.push(`/recherche?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={`flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 sm:flex-row ${
        compact ? "" : "sm:items-center"
      }`}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nom, spécialité (ex. dentiste, cardiologue…)"
        list="tabibi-specialties"
        className="flex-1 rounded-xl border-0 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary-400"
        aria-label="Spécialité ou nom du praticien"
      />
      <datalist id="tabibi-specialties">
        {SPECIALTIES.map((s) => (
          <option key={s.id} value={s.label} />
        ))}
      </datalist>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-primary-400 sm:w-44"
        aria-label="Ville"
      >
        <option value="">Toute la Tunisie</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        Rechercher
      </button>
    </form>
  );
}
