import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import DoctorCard from "@/components/DoctorCard";
import { searchDoctors } from "@/lib/data";

export const metadata = {
  title: "Rechercher un praticien | Tabibi",
};

function Results({ q, ville }: { q: string; ville: string }) {
  const doctors = searchDoctors(q, ville);
  return (
    <>
      <p className="mt-6 text-sm text-slate-500">
        {doctors.length} praticien{doctors.length > 1 ? "s" : ""} trouvé
        {doctors.length > 1 ? "s" : ""}
        {q && (
          <>
            {" "}pour « <span className="font-medium text-slate-700">{q}</span> »
          </>
        )}
        {ville && (
          <>
            {" "}à <span className="font-medium text-slate-700">{ville}</span>
          </>
        )}
      </p>
      <div className="mt-4 space-y-4">
        {doctors.map((d) => (
          <DoctorCard key={d.slug} doctor={d} />
        ))}
        {doctors.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
            Aucun praticien ne correspond à votre recherche.
            <br />
            Essayez une autre spécialité ou élargissez à « Toute la Tunisie ».
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; ville?: string };
}) {
  const q = searchParams.q ?? "";
  const ville = searchParams.ville ?? "";
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Trouver un praticien</h1>
      <div className="mt-4">
        <Suspense>
          <SearchBar initialQuery={q} initialCity={ville} compact />
        </Suspense>
      </div>
      <Results q={q} ville={ville} />
    </div>
  );
}
