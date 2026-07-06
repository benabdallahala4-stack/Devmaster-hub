import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { DOCTORS, SPECIALTIES } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            Trouvez un médecin en Tunisie et réservez en ligne, 24h/24
          </h1>
          <p className="mt-4 max-w-xl text-primary-100">
            Fini les appels et les files d&apos;attente : recherchez par spécialité et par
            ville, choisissez un créneau et recevez votre confirmation.{" "}
            <span dir="rtl" className="font-medium">صحتك أولويتنا</span>
          </p>
          <div className="mt-8 max-w-3xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-primary-100">
            <span className="rounded-full bg-white/10 px-3 py-1">✓ Gratuit pour les patients</span>
            <span className="rounded-full bg-white/10 px-3 py-1">✓ Rappels SMS &amp; e-mail</span>
            <span className="rounded-full bg-white/10 px-3 py-1">✓ Téléconsultation</span>
            <span className="rounded-full bg-white/10 px-3 py-1">✓ Praticiens conventionnés CNAM</span>
          </div>
        </div>
      </section>

      {/* Spécialités populaires */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-800">Spécialités populaires</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SPECIALTIES.map((s) => (
            <Link
              key={s.id}
              href={`/recherche?q=${encodeURIComponent(s.label)}`}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-primary-400"
            >
              <span className="text-2xl">{s.emoji}</span>
              <span>
                <span className="block text-sm font-medium text-slate-700">{s.label}</span>
                <span className="block text-xs text-slate-400" dir="rtl">{s.labelAr}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-800">Comment ça marche ?</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Recherchez",
                text: "Par spécialité, nom ou ville — dans les 24 gouvernorats.",
              },
              {
                step: "2",
                title: "Réservez",
                text: "Choisissez un créneau en cabinet ou en téléconsultation, sans appeler.",
              },
              {
                step: "3",
                title: "Consultez",
                text: "Recevez la confirmation et un rappel avant votre rendez-vous.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl bg-slate-50 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-slate-800">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Médecins mis en avant */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Ils sont disponibles rapidement</h2>
          <Link href="/recherche" className="text-sm font-medium text-primary-600 hover:underline">
            Voir tous les praticiens →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DOCTORS.filter((d) => d.nextAvailability === "Aujourd'hui")
            .slice(0, 4)
            .map((d) => (
              <Link
                key={d.slug}
                href={`/medecin/${d.slug}`}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-primary-400"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                  {d.photoSeed}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{d.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {d.specialty} · {d.city}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  Aujourd&apos;hui
                </span>
              </Link>
            ))}
        </div>
      </section>

      {/* Bandeau pro */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary-700 to-primary-600 p-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Vous êtes médecin, dentiste ou kiné ?</h2>
            <p className="mt-1 text-sm text-primary-100">
              Réduisez les rendez-vous non honorés et remplissez votre agenda avec Tabibi Pro.
            </p>
          </div>
          <Link
            href="/pro"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            Découvrir Tabibi Pro
          </Link>
        </div>
      </section>
    </>
  );
}
