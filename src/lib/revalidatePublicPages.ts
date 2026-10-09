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
 *    kadar (ISR — anasayfa/öne çıkanlar `revalidate = 3600`); terapist detay
 *    sayfaları 7 güne kadar (`revalidate = 604800`), ama bunlar slug verilince
 *    yola göre anında temizlenir.
 *  - Şehir/uzmanlık filtreli liste sayfaları: 24 saate kadar
 *    (src/lib/queries.ts'teki unstable_cache ve sayfaların `revalidate = 86400`
 *    değeri, `tags: ['therapists-list']`). Bu fonksiyon etiketi temizlediği için
 *    admin işlemlerinde bu bekleme yaşanmaz; yalnızca veritabanında doğrudan
 *    yapılan değişiklikler süre dolana kadar görünmez.
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
