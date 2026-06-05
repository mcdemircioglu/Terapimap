import { redirect } from 'next/navigation';

// /[locale]/therapist/[slug] → /[locale]/psikolog/[slug] (301)
// Tüm sayfa mantığı artık /psikolog/[slug]/page.tsx'te.

export default function TherapistRedirectPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  redirect('/' + locale + '/psikolog/' + slug);
}
