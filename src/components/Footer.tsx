import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Container from './Container';
import ManageCookiesLink from './cookie-consent/ManageCookiesLink';
import { CITIES } from '@/lib/cities';
import { PROFESSIONAL_TYPE_LABELS, type ProfessionalType } from '@/types/database';

// SEO: footer, [locale]/layout.tsx içinde render edildiği için TÜM public
// sayfalarda (profil, rehber, listeleme...) aynı şekilde görünür — admin/panel
// route'ları [locale] dışında olduğu için onları etkilemez. Buradaki linkler
// şehir×uzmanlık/uzmanlık sayfalarına siteyi her yerden 1 tık mesafeye indirir
// (bkz. CityBrowseSection.tsx'teki aynı gerekçe — P1 "orphan pages" denetimi).
// Sayılar gerçek DB kullanım verisine göre seçildi (bkz. sohbet geçmişi), sabit
// tutuldu — her sayfa render'ında ekstra bir DB sorgusu açmamak için.

// Şehirler: CITIES listesindeki ilk 8 (nüfus/kapsam sırasına göre tanımlı).
const FOOTER_CITIES = CITIES.slice(0, 8);

// Uzmanlık alanları (type: 'konu') — onaylı terapist sayısına göre en yoğun 8.
const FOOTER_TOPICS = [
  { slug: 'anksiyete', name: 'Anksiyete' },
  { slug: 'depresyon', name: 'Depresyon' },
  { slug: 'travma', name: 'Travma ve TSSB' },
  { slug: 'yas-ve-kayip', name: 'Yas ve Kayıp' },
  { slug: 'okb', name: 'Obsesif Kompulsif Bozukluk (OKB)' },
  { slug: 'fobi', name: 'Fobiler' },
  { slug: 'dehb', name: 'Dikkat Eksikliği ve Hiperaktivite (DEHB)' },
  { slug: 'bagimlilik', name: 'Bağımlılık' },
];

// Terapi yöntemleri (type: 'yontem') — onaylı terapist sayısına göre en yoğun 8.
const FOOTER_METHODS = [
  { slug: 'bilissel-davranisci-terapi-bdt', name: 'Bilişsel Davranışçı Terapi (BDT)' },
  { slug: 'aile-terapisi', name: 'Aile Terapisi' },
  { slug: 'cift-terapisi', name: 'Çift Terapisi' },
  { slug: 'cinsel-terapi', name: 'Cinsel Terapi' },
  { slug: 'emdr', name: 'EMDR' },
  { slug: 'sema-terapi', name: 'Şema Terapi' },
  { slug: 'oyun-terapisi', name: 'Oyun Terapisi' },
  { slug: 'psikanaliz', name: 'Psikanaliz ve Psikodinamik Terapi' },
];

// Terapi türleri (meslek) — Filters.tsx'teki ?type= filtresiyle birebir aynı
// 5 değer. Not: bu sayfa (/terapistler?type=...) canonical'ı filtresiz temel
// listeye işaret eder (bkz. therapists/page.tsx generateMetadata) — yani bu
// linkler kendi başına ayrı bir sıralama kazanmaz, ama (a) kullanıcı için
// gerçek bir kısayoldur, (b) ana dizin sayfasına link değeri taşır.
const FOOTER_PROF_TYPES = Object.entries(PROFESSIONAL_TYPE_LABELS) as [
  ProfessionalType,
  string,
][];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-brand-700">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tMeta = useTranslations('meta');
  const locale = useLocale();
  const year = new Date().getFullYear();
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  const listPath = `/${locale}/${listBase}`;

  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-50/40">
      <Container className="py-10 md:py-14">
        <div className="max-w-md">
          <div className="text-base font-semibold text-brand-900">
            {tMeta('siteName')}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-brand-700">
            {t('disclaimer')}
          </p>
        </div>

        {/* SEO link kümesi — yalnızca TR: EN içerik henüz tam çevrilmedi ve
            layout.tsx'te noindex, bu yüzden burada gereksiz/ölü link üretmiyoruz. */}
        {locale === 'tr' && (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            <FooterColumn title="Şehre Göre">
              {FOOTER_CITIES.map((city) => (
                <li key={city.slug}>
                  <Link href={`${listPath}/${city.slug}`} className="hover:text-brand-900">
                    {city.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={listPath} className="font-medium text-brand-600 hover:text-brand-900">
                  Tüm şehirler →
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title="Uzmanlık Alanına Göre">
              {FOOTER_TOPICS.map((topic) => (
                <li key={topic.slug}>
                  <Link href={`/${locale}/${topic.slug}`} className="hover:text-brand-900">
                    {topic.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={listPath} className="font-medium text-brand-600 hover:text-brand-900">
                  Tüm uzmanlıklar →
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title="Terapi Yöntemine Göre">
              {FOOTER_METHODS.map((method) => (
                <li key={method.slug}>
                  <Link href={`/${locale}/${method.slug}`} className="hover:text-brand-900">
                    {method.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={listPath} className="font-medium text-brand-600 hover:text-brand-900">
                  Tüm yöntemler →
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title="Terapi Türüne Göre">
              {FOOTER_PROF_TYPES.map(([value, label]) => (
                <li key={value}>
                  <Link href={`${listPath}?type=${value}`} className="hover:text-brand-900">
                    {label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title="Kurumsal">
              <li><Link href={`/${locale}/psikoloji-rehberi`} className="hover:text-brand-900">{tNav('guide')}</Link></li>
              <li><Link href={`/${locale}/iletisim`} className="hover:text-brand-900">{t('contact')}</Link></li>
              <li><Link href={`/${locale}/uzman-basvuru`} className="hover:text-brand-900">{tNav('applyExpert')}</Link></li>
              <li><Link href="/panel/giris" className="hover:text-brand-900">{tNav('panelLogin')}</Link></li>
              <li><Link href={`/${locale}/kvkk-aydinlatma-metni`} className="hover:text-brand-900">{t('kvkk')}</Link></li>
              <li><Link href={`/${locale}/gizlilik-politikasi`} className="hover:text-brand-900">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/cerez-politikasi`} className="hover:text-brand-900">{t('cookies')}</Link></li>
              <li><Link href={`/${locale}/kullanim-kosullari`} className="hover:text-brand-900">{t('terms')}</Link></li>
              <li><Link href={`/${locale}/terapist-profil-politikasi`} className="hover:text-brand-900">{t('therapistPolicy')}</Link></li>
              <li><ManageCookiesLink label={t('cookiePrefs')} /></li>
            </FooterColumn>
          </div>
        )}

        {/* EN locale — sade kurumsal link listesi (eski davranış korunuyor). */}
        {locale !== 'tr' && (
          <ul className="mt-8 grid grid-cols-1 gap-2 text-sm text-brand-700 sm:grid-cols-2 sm:gap-x-8">
            <li><Link href={`/${locale}/psikoloji-rehberi`} className="hover:text-brand-900">{tNav('guide')}</Link></li>
            <li><Link href={`/${locale}/iletisim`} className="hover:text-brand-900">{t('contact')}</Link></li>
            <li><Link href={`/${locale}/kvkk-aydinlatma-metni`} className="hover:text-brand-900">{t('kvkk')}</Link></li>
            <li><Link href={`/${locale}/gizlilik-politikasi`} className="hover:text-brand-900">{t('privacy')}</Link></li>
            <li><Link href={`/${locale}/cerez-politikasi`} className="hover:text-brand-900">{t('cookies')}</Link></li>
            <li><Link href={`/${locale}/kullanim-kosullari`} className="hover:text-brand-900">{t('terms')}</Link></li>
            <li><Link href={`/${locale}/terapist-profil-politikasi`} className="hover:text-brand-900">{t('therapistPolicy')}</Link></li>
            <li><Link href="/panel/giris" className="hover:text-brand-900">{tNav('panelLogin')}</Link></li>
            <li><ManageCookiesLink label={t('cookiePrefs')} /></li>
          </ul>
        )}

        <div className="mt-8 border-t border-brand-100 pt-6 text-xs text-brand-500">
          © {year} {tMeta('siteName')}. {t('rights')}
        </div>
      </Container>
    </footer>
  );
}
