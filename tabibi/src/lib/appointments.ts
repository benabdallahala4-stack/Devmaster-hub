// Stockage local des rendez-vous (MVP sans backend).
// La feuille de route prévoit une API + base de données (voir docs/FEATURES.md).

import type { Appointment } from "./types";

const KEY = "tabibi.appointments";

export function listAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Appointment[];
  } catch {
    return [];
  }
}

export function saveAppointment(appt: Appointment): void {
  const all = listAppointments();
  all.push(appt);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function cancelAppointment(id: string): void {
  const all = listAppointments().map((a) =>
    a.id === id ? { ...a, status: "annule" as const } : a
  );
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function getAppointment(id: string): Appointment | undefined {
  return listAppointments().find((a) => a.id === id);
}
