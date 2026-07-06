export interface Doctor {
  slug: string;
  fullName: string;
  fullNameAr: string;
  specialty: string;
  specialtyAr: string;
  city: string;
  governorate: string;
  address: string;
  photoSeed: string; // initials used for the avatar
  languages: string[];
  cnam: boolean; // conventionné CNAM
  teleconsultation: boolean;
  priceTnd: number; // consultation de base en dinars
  rating: number;
  reviewCount: number;
  bio: string;
  education: string[];
  nextAvailability: string; // libellé indicatif
}

export interface Specialty {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
}

export interface Appointment {
  id: string;
  doctorSlug: string;
  doctorName: string;
  specialty: string;
  city: string;
  dateIso: string; // jour du RDV (YYYY-MM-DD)
  time: string; // HH:mm
  kind: "cabinet" | "teleconsultation";
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  createdAt: string;
  status: "confirme" | "annule";
}
