import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabibi — طبيبي | Prenez rendez-vous avec un médecin en Tunisie",
  description:
    "Tabibi est la plateforme tunisienne de prise de rendez-vous médicaux en ligne : trouvez un médecin près de chez vous, réservez 24h/24 et consultez à distance.",
  icons: { icon: "/icon.svg" },
};

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Tabibi" className="h-9 w-9" />
          <span className="text-xl font-bold text-primary-700">
            Tabibi <span className="text-sm font-normal text-primary-500">طبيبي</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          <Link
            href="/recherche"
            className="hidden rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 sm:block"
          >
            Trouver un médecin
          </Link>
          <Link
            href="/mes-rdv"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100"
          >
            Mes rendez-vous
          </Link>
          <Link
            href="/pro"
            className="rounded-lg bg-primary-600 px-3 py-2 font-medium text-white hover:bg-primary-700"
          >
            Vous êtes soignant ?
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="Tabibi" className="h-8 w-8" />
            <span className="font-bold text-primary-700">Tabibi</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            La santé des Tunisiens, en un clic.
            <br />
            <span dir="rtl">صحتك أولويتنا</span>
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-slate-700">Patients</h3>
          <ul className="mt-3 space-y-2 text-slate-500">
            <li><Link href="/recherche" className="hover:text-primary-600">Rechercher un médecin</Link></li>
            <li><Link href="/mes-rdv" className="hover:text-primary-600">Gérer mes rendez-vous</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-slate-700">Professionnels</h3>
          <ul className="mt-3 space-y-2 text-slate-500">
            <li><Link href="/pro" className="hover:text-primary-600">Rejoindre Tabibi Pro</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Tabibi — Projet de démonstration inspiré de Doctolib, adapté à la Tunisie.
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
