"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Doctor } from "@/lib/types";
import { upcomingSlots, type DaySlots } from "@/lib/slots";
import { saveAppointment } from "@/lib/appointments";

export default function BookingWidget({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  // Les créneaux dépendent de la date du jour : on les calcule côté client
  // pour éviter tout écart entre rendu serveur et navigateur.
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [selected, setSelected] = useState<{ dateIso: string; time: string } | null>(null);
  const [kind, setKind] = useState<"cabinet" | "teleconsultation">("cabinet");
  const [form, setForm] = useState({ name: "", phone: "", email: "", reason: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setDays(upcomingSlots(doctor.slug, new Date(), 7));
  }, [doctor.slug]);

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Merci d'indiquer au minimum votre nom et votre numéro de téléphone.");
      return;
    }
    const id = `rdv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    saveAppointment({
      id,
      doctorSlug: doctor.slug,
      doctorName: doctor.fullName,
      specialty: doctor.specialty,
      city: doctor.city,
      dateIso: selected.dateIso,
      time: selected.time,
      kind,
      patientName: form.name.trim(),
      patientPhone: form.phone.trim(),
      patientEmail: form.email.trim(),
      reason: form.reason.trim(),
      createdAt: new Date().toISOString(),
      status: "confirme",
    });
    router.push(`/rdv/confirmation?id=${id}`);
  }

  if (!days) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-400 ring-1 ring-slate-200">
        Chargement des disponibilités…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-800">Prendre rendez-vous</h2>

      {doctor.teleconsultation && (
        <div className="mt-4 flex gap-2">
          {(["cabinet", "teleconsultation"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                kind === k
                  ? "bg-primary-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {k === "cabinet" ? "🏥 Au cabinet" : "📹 Téléconsultation"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {days.map((day) => (
          <div key={day.dateIso}>
            <p className="text-sm font-semibold capitalize text-slate-700">
              {day.weekdayLabel} {day.dayLabel}
            </p>
            {day.times.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">Aucun créneau</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {day.times.map((t) => {
                  const isSelected =
                    selected?.dateIso === day.dateIso && selected?.time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelected({ dateIso: day.dateIso, time: t })}
                      className={`rounded-lg px-3 py-1.5 text-sm transition ${
                        isSelected
                          ? "bg-primary-600 font-semibold text-white"
                          : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <form onSubmit={confirm} className="mt-6 space-y-3 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-600">
            Créneau choisi :{" "}
            <span className="font-semibold text-primary-700">
              {selected.dateIso} à {selected.time}
            </span>{" "}
            ({kind === "cabinet" ? "au cabinet" : "en téléconsultation"})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nom et prénom *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="tel"
              placeholder="Téléphone (ex. 22 123 456) *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="email"
              placeholder="E-mail (facultatif)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 sm:col-span-2"
            />
            <textarea
              placeholder="Motif de consultation (facultatif)"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 sm:col-span-2"
            />
          </div>
          {error && <p className="text-sm text-accent-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Confirmer le rendez-vous
          </button>
          <p className="text-center text-xs text-slate-400">
            Gratuit et sans engagement — vous pourrez annuler depuis « Mes rendez-vous ».
          </p>
        </form>
      )}
    </div>
  );
}
