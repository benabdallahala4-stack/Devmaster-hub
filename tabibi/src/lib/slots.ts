// Génération déterministe des créneaux : pas de vrai backend dans ce MVP,
// mais un même médecin + un même jour donnent toujours les mêmes créneaux.

const HOURS = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DaySlots {
  dateIso: string; // YYYY-MM-DD
  weekdayLabel: string;
  dayLabel: string;
  times: string[];
}

const WEEKDAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function toDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Créneaux des `days` prochains jours pour un médecin (dimanche fermé). */
export function upcomingSlots(doctorSlug: string, from: Date, days = 7): DaySlots[] {
  const result: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const dateIso = toDateIso(d);
    const isSunday = d.getDay() === 0;
    const times = isSunday
      ? []
      : HOURS.filter((h) => hashCode(`${doctorSlug}|${dateIso}|${h}`) % 3 !== 0);
    result.push({
      dateIso,
      weekdayLabel: WEEKDAYS_FR[d.getDay()],
      dayLabel: `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`,
      times,
    });
  }
  return result;
}
