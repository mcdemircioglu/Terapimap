import type { ReactNode } from 'react';
import Container from './Container';

/**
 * Ortak hukuki metin sayfası düzeni.
 * KVKK, Gizlilik, Çerez, Kullanım Koşulları ve Terapist Profil Politikası
 * sayfalarında kullanılır.
 */

export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <section>
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-brand-500">
            Son güncelleme: {updatedAt}
          </p>
          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-brand-700">
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="pt-4 text-xl font-semibold tracking-tight text-brand-900">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-2 text-base font-semibold text-brand-900">{children}</h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6 marker:text-brand-400">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-6 marker:text-brand-400">
      {children}
    </ol>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-brand-900">{children}</strong>;
}
