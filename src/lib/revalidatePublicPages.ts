import { revalidatePath, revalidateTag } from 'next/cache';
import { getProfessionalUrl, getTherapistsListPath } from '@/lib/utils';

type ProfessionalRef = {
  slug?: string | null;
  professional_type?: string | null;
} | null | undefined;

/**
 * Bir profesyonelin görünürlüğü admin panelinden değiştiğinde (kaldırma,
 * talep reddi, kalıcı silme, yeni başvuru onayı vb.) herkese açık
 * sayfaların önbelleğini anında tazeler.
 *
 * Bunu çağırmazsak değişiklik sitede şu kadar gecikebilir:
 *  - Anasayfa / öne çıkan terapistler / terapist detay sayfaları: 1 saate
 *    kadar (ISR — bkz. ilgili page.tsx'lerdeki `revalidate = 3600`).
 *  - Şehir/uzmanlık filtreli liste sayfaları: 10 dakikaya kadar
 *    (src/lib/queries.ts'teki unstable_cache, `tags: ['therapists-list']`).
 *
 * `professional` verilirse (slug + professional_type), o profesyonelin
 * kendi detay sayfası da ayrıca tazelenir — kaldırma/silme sonrası o
 * sayfanın da hemen güncellenmesi (404/kaldırıldı durumuna düşmesi) için.
 */
export function revalidatePublicTherapistPages(professional?: ProfessionalRef): void {
  revalidateTag('therapists-list');

  revalidatePath('/tr');
  revalidatePath('/tr/one-cikan-terapistler');
  revalidatePath(getTherapistsListPath('tr'));

  if (professional?.slug) {
    revalidatePath(getProfessionalUrl(professional.slug, professional.professional_type, 'tr'));
  }
}
