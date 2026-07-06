<p align="center">
  <img src="public/logo.svg" alt="Tabibi — طبيبي" width="420" />
</p>

# Tabibi — طبيبي

**La plateforme tunisienne de prise de rendez-vous médicaux en ligne**, inspirée de Doctolib et adaptée au contexte tunisien (CNAM, dinar tunisien, bilinguisme français/arabe, 24 gouvernorats).

> *Tabibi* signifie « mon médecin » en dialecte tunisien. Le logo combine une croix médicale aux pétales arrondis (clin d'œil au jasmin, fleur nationale) et un tracé d'électrocardiogramme rouge tunisien.

## ✨ Fonctionnalités du MVP

**Côté patient :**
- 🔍 Recherche de praticiens par spécialité, nom et ville (12 spécialités, 13 villes)
- 👨‍⚕️ Profils praticiens complets : bio, formation, langues, tarifs en DT, conventionnement CNAM, avis
- 📅 Réservation en ligne : calendrier de créneaux sur 7 jours, au cabinet ou en téléconsultation
- ✅ Confirmation instantanée et gestion des rendez-vous (consultation, annulation)
- 🇹🇳 Interface française avec libellés arabes (spécialités, noms, slogan)

**Côté praticien (vitrine Tabibi Pro) :**
- Présentation de l'offre : agenda intelligent, rappels SMS/e-mail, téléconsultation, dossier patient, statistiques

La liste complète des fonctionnalités Doctolib analysées et la feuille de route se trouvent dans [`docs/FEATURES.md`](docs/FEATURES.md).

## 🛠️ Stack technique

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Tailwind CSS 3](https://tailwindcss.com/)
- MVP sans backend : données de démonstration (`src/lib/data.ts`), créneaux générés de façon déterministe, rendez-vous stockés en `localStorage`
- Prêt pour un déploiement Vercel/Netlify

## 🚀 Démarrage

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

## 📁 Structure

```
tabibi/
├── docs/FEATURES.md          # Analyse Doctolib + feuille de route Tunisie
├── public/logo.svg           # Logo complet (icône + wordmark FR/AR)
├── public/icon.svg           # Icône seule (favicon)
└── src/
    ├── app/
    │   ├── page.tsx              # Accueil (hero, spécialités, disponibilités)
    │   ├── recherche/            # Résultats de recherche + filtres
    │   ├── medecin/[slug]/       # Profil praticien + prise de RDV
    │   ├── rdv/confirmation/     # Confirmation de rendez-vous
    │   ├── mes-rdv/              # Tableau de bord patient
    │   └── pro/                  # Vitrine Tabibi Pro (praticiens)
    ├── components/               # SearchBar, DoctorCard, BookingWidget
    └── lib/                      # Types, données seed, créneaux, stockage RDV
```

## ⚠️ Avertissement

Projet de démonstration à but éducatif : les praticiens et les créneaux sont fictifs. Ce projet n'est pas affilié à Doctolib.
