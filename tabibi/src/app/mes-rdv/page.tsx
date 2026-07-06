"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cancelAppointment, listAppointments } from "@/lib/appointments";
import type { Appointment } from "@/lib/types";

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);

  useEffect(() => {
    setAppointments(listAppointments());
  }, []);

  function cancel(id: string) {
    cancelAppointment(id);
    setAppointments(listAppointments());
  }

  const upcoming = (appointments ?? []).filter((a) => a.status === "confirme");
  const cancelled = (appointments ?? []).filter((a) => a.status === "annule");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Mes rendez-vous</h1>
      <p className="mt-1 text-sm text-slate-500">
        Vos réservations sont enregistrées sur cet appareil (démo sans compte).
      </p>

      {appointments === null ? (
        <p className="mt-8 text-slate-400">Chargement…</p>
      ) : appointments.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="text-slate-600">Vous n&apos;avez pas encore de rendez-vous.</p>
          <Link
            href="/recherche"
            className="mt-4 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Trouver un praticien
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 space-y-4">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    <Link href={`/medecin/${a.doctorSlug}`} className="hover:underline">
                      {a.doctorName}
                    </Link>
                  </p>
                  <p className="text-sm text-slate-500">
                    {a.specialty} · {a.city} ·{" "}
                    {a.kind === "cabinet" ? "au cabinet" : "téléconsultation"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary-700">
                    {a.dateIso} à {a.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cancel(a.id)}
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-accent-600 transition hover:bg-red-100"
                >
                  Annuler
                </button>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-500">Aucun rendez-vous à venir.</p>
            )}
          </section>

          {cancelled.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Annulés
              </h2>
              <div className="mt-3 space-y-3">
                {cancelled.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-100"
                  >
                    <span className="line-through">
                      {a.doctorName} — {a.dateIso} à {a.time}
                    </span>{" "}
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-accent-600">
                      Annulé
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
