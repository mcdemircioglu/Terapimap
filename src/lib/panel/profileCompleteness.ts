/**
 * Faz 1 / Adım 5: Profil tamamlama skoru.
 *
 * Terapiste, profilinin ne kadar "dolu" olduğunu ve danışan çekme
 * olasılığını artıracak hangi alanların eksik olduğunu gösterir. Basit,
 * eşit ağırlıklı bir checklist — ileride ağırlıklandırma (ör. fotoğraf
 * daha değerli) eklenmek istenirse buradaki WEIGHT alanı kullanılabilir.
 */

export type ProfileCompletenessInput = {
  title: string | null;
  district: string | null;
  about: string | null;
  image_url: string | null;
  phone: string | null;
  price_range: string | null;
  experience_years: number | null;
  is_online: boolean | null;
  is_in_person: boolean | null;
  website_url: string | null;
  instagram_url: string | null;
  specialtyCount: number;
};

export type ProfileCompletenessItem = {
  key: string;
  label: string;
  done: boolean;
};

export type ProfileCompletenessResult = {
  score: number; // 0-100
  items: ProfileCompletenessItem[];
  missing: ProfileCompletenessItem[];
};

const MIN_ABOUT_LENGTH = 80;

export function calculateProfileCompleteness(
  p: ProfileCompletenessInput,
): ProfileCompletenessResult {
  const items: ProfileCompletenessItem[] = [
    { key: 'photo', label: 'Profil fotoğrafı ekleyin', done: !!p.image_url },
    { key: 'title', label: 'Unvanınızı belirtin', done: !!p.title },
    {
      key: 'about',
      label: `Hakkında bölümünü doldurun (en az ${MIN_ABOUT_LENGTH} karakter)`,
      done: (p.about?.trim().length ?? 0) >= MIN_ABOUT_LENGTH,
    },
    { key: 'specialties', label: 'En az bir uzmanlık alanı seçin', done: p.specialtyCount > 0 },
    { key: 'experience', label: 'Deneyim yılınızı girin', done: (p.experience_years ?? 0) > 0 },
    { key: 'price', label: 'Fiyat aralığınızı belirtin', done: !!p.price_range },
    {
      key: 'format',
      label: 'Online veya yüz yüze görüşme seçeneği belirtin',
      done: !!(p.is_online || p.is_in_person),
    },
    { key: 'district', label: 'İlçenizi belirtin', done: !!p.district },
    { key: 'phone', label: 'Telefon numaranızı ekleyin', done: !!p.phone },
    {
      key: 'presence',
      label: 'Web sitesi veya Instagram bağlantısı ekleyin',
      done: !!(p.website_url || p.instagram_url),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const score = Math.round((doneCount / items.length) * 100);
  const missing = items.filter((i) => !i.done);

  return { score, items, missing };
}
