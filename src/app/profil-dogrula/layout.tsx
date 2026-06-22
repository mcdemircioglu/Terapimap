import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Profil Doğrulama — Terapimap',
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
