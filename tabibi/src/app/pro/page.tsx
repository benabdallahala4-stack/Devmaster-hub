import Link from "next/link";

export const metadata = {
  title: "Tabibi Pro — La solution des soignants tunisiens",
};

const FEATURES = [
  {
    emoji: "📅",
    title: "Agenda intelligent",
    text: "Gérez cabinet et téléconsultations dans un seul agenda, synchronisé en temps réel et accessible depuis mobile.",
  },
  {
    emoji: "🔔",
    title: "Rappels automatiques",
    text: "SMS et e-mails de rappel en français et en arabe pour réduire jusqu'à 60 % des rendez-vous non honorés.",
  },
  {
    emoji: "📹",
    title: "Téléconsultation intégrée",
    text: "Consultations vidéo sécurisées avec paiement en ligne (e-Dinar, carte bancaire) et ordonnance numérique.",
  },
  {
    emoji: "🗂️",
    title: "Dossier patient",
    text: "Historique des consultations, documents partagés et notes privées, hébergés de manière sécurisée.",
  },
  {
    emoji: "📊",
    title: "Statistiques du cabinet",
    text: "Taux de remplissage, nouveaux patients, annulations : pilotez votre activité en un coup d'œil.",
  },
  {
    emoji: "🤝",
    title: "Visibilité en ligne",
    text: "Un profil public complet (CNAM, langues, tarifs, avis vérifiés) référencé dans la recherche Tabibi.",
  },
];

export default function ProPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-300">
            Tabibi Pro
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
            Développez votre patientèle et libérez du temps médical
          </h1>
          <p className="mt-4 max-w-xl text-primary-100">
            Rejoignez les praticiens tunisiens qui digitalisent leur cabinet : prise de
            rendez-vous en ligne 24h/24, rappels automatiques et téléconsultation.
          </p>
          <a
            href="#contact"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            Demander une démo
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-800">
          Tout votre cabinet, dans une seule plateforme
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 font-semibold text-slate-800">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Intéressé(e) ? Parlons-en</h2>
          <p className="mt-1 text-sm text-slate-500">
            Laissez vos coordonnées : notre équipe vous recontacte sous 24 h ouvrées.
            (Formulaire de démonstration — l&apos;envoi n&apos;est pas encore branché.)
          </p>
          <form className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nom et prénom"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="text"
              placeholder="Spécialité"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="email"
              placeholder="E-mail"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button
              type="button"
              className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 sm:col-span-2"
            >
              Être recontacté(e)
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            Ou explorez la plateforme côté patient :{" "}
            <Link href="/recherche" className="text-primary-600 hover:underline">
              rechercher un praticien
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
