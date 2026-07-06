import { notFound } from "next/navigation";
import BookingWidget from "@/components/BookingWidget";
import { DOCTORS, findDoctor } from "@/lib/data";

export function generateStaticParams() {
  return DOCTORS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const doctor = findDoctor(params.slug);
  return {
    title: doctor
      ? `${doctor.fullName} — ${doctor.specialty} à ${doctor.city} | Tabibi`
      : "Praticien introuvable | Tabibi",
  };
}

export default function DoctorPage({ params }: { params: { slug: string } }) {
  const doctor = findDoctor(params.slug);
  if (!doctor) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* En-tête praticien */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
          {doctor.photoSeed}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">
            {doctor.fullName}{" "}
            <span className="text-base font-normal text-slate-400" dir="rtl">
              {doctor.fullNameAr}
            </span>
          </h1>
          <p className="text-slate-500">
            {doctor.specialty} · {doctor.city}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {doctor.cnam && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Conventionné CNAM
              </span>
            )}
            {doctor.teleconsultation && (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                📹 Téléconsultation
              </span>
            )}
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              ★ {doctor.rating} ({doctor.reviewCount} avis)
            </span>
          </div>
        </div>
        <div className="text-sm text-slate-500 sm:text-right">
          <p className="font-semibold text-slate-700">{doctor.priceTnd} DT</p>
          <p className="text-xs">Consultation de base</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Colonne infos */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Présentation</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Formation</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
              {doctor.education.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Informations pratiques</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-slate-700">Adresse</dt>
                <dd className="text-slate-500">{doctor.address}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Langues parlées</dt>
                <dd className="text-slate-500">{doctor.languages.join(", ")}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">Moyens de paiement</dt>
                <dd className="text-slate-500">
                  Espèces, carte bancaire{doctor.cnam ? ", prise en charge CNAM" : ""}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Colonne réservation */}
        <div className="lg:col-span-3">
          <BookingWidget doctor={doctor} />
        </div>
      </div>
    </div>
  );
}
