import Link from "next/link";
import type { Doctor } from "@/lib/types";

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
          {doctor.photoSeed}
        </div>
        <div>
          <Link
            href={`/medecin/${doctor.slug}`}
            className="text-lg font-semibold text-primary-700 hover:underline"
          >
            {doctor.fullName}
          </Link>
          <p className="text-sm text-slate-500">
            {doctor.specialty} · {doctor.city}
          </p>
          <p className="mt-1 text-xs text-slate-400">{doctor.address}</p>
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
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <span className="text-xs text-slate-500">
          Prochaine disponibilité :{" "}
          <span className="font-medium text-emerald-600">{doctor.nextAvailability}</span>
        </span>
        <Link
          href={`/medecin/${doctor.slug}`}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Prendre rendez-vous
        </Link>
        <span className="text-center text-xs text-slate-400 sm:text-right">
          Consultation : {doctor.priceTnd} DT
        </span>
      </div>
    </div>
  );
}
