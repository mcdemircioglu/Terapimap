/**
 * WhatsApp doğrulama daveti yardımcıları (saf fonksiyonlar).
 * Hem admin sayfası (client) hem admin API (server) kullanır; bu yüzden
 * Supabase ya da sunucu-only modül import etmez.
 */
import { getProfessionalUrl } from '@/lib/utils';

/** Türk telefon numarasını WhatsApp formatına (90XXXXXXXXXX) çevirir; geçersizse null. */
export function normalizeTrPhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, '');
  let nat = '';
  if (d.startsWith('90') && d.length === 12) nat = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) nat = d.slice(1);
  else if (d.length === 10) nat = d;
  else return null;
  // Türkiye'de cep numaraları 5 ile başlar. Sabit hatlar (312, 212, 216...) ve
  // 444/850 gibi servis numaraları WhatsApp'a düşmez, bu yüzden geçersiz sayılır.
  return nat.length === 10 && nat.startsWith('5') ? '90' + nat : null;
}

/* ── GSC segmentleri ──────────────────────────────────────────────────────
 * Kurallar GSC analiz raporundaki (terapimap_gsc_analiz.xlsx, "Özet") tanımla aynıdır
 * ve sırayla uygulanır:
 *   A öne çıkan : en az 3 tıklama
 *   B fırsat    : en az 100 gösterim ve en fazla 1 tıklama (görünür ama tıklanmıyor)
 *   C gelişen   : 1-2 tıklama
 *   D düşük     : 40'tan az gösterim, 0 tıklama
 *   E izlenecek : 40-99 gösterim, 0 tıklama
 * Segment saklanmaz, rakamlardan hesaplanır; böylece veri güncellenince kendiliğinden değişir.
 */
export type GscSegment = 'A' | 'B' | 'C' | 'D' | 'E';

export type GscStats = {
  period_start: string;
  period_end: string;
  impressions: number;
  clicks: number;
  avg_position: number | null;
  brand_impressions: number;
  brand_clicks: number;
  top_query: string | null;
};

export const GSC_SEGMENT_LABEL: Record<GscSegment, string> = {
  A: 'A · Öne çıkan',
  B: 'B · Fırsat',
  C: 'C · Gelişen',
  D: 'D · Düşük görünürlük',
  E: 'E · İzlenecek',
};

export function gscSegment(s: Pick<GscStats, 'impressions' | 'clicks'>): GscSegment {
  if (s.clicks >= 3) return 'A';
  if (s.impressions >= 100 && s.clicks <= 1) return 'B';
  if (s.clicks >= 1) return 'C';
  return s.impressions >= 40 ? 'E' : 'D';
}

/** Mesajda adınızla aranma cümlesi, yalnızca anlamlı bir sayı varsa kurulur (küçük sayı ters etki yapar). */
const MIN_BRAND_IMPRESSIONS = 20;

export type InviteMessageInput = {
  id: string;
  name: string;
  slug?: string | null;
  professionalType?: string | null;
  /** Kampanya bitiş tarihi (okunur metin, ör. "1 Ocak 2027"); kampanya kapalıysa null. */
  campaignDateText?: string | null;
  /** GSC özeti; yoksa standart davet metni kullanılır. */
  gsc?: GscStats | null;
};

const nf = (n: number) => n.toLocaleString('tr-TR');

/** "Son 3 ayda" gibi dönem ifadesi; dönem tarihleri geçersizse null (rakam cümlesi kurulmaz). */
function periodPhrase(g: GscStats): string | null {
  const a = new Date(g.period_start).getTime();
  const b = new Date(g.period_end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  const months = Math.max(1, Math.round((b - a) / 86_400_000 / 30));
  return `son ${months} ayda`;
}

/**
 * Segmente göre kişiselleştirilmiş açılış paragrafı. Yalnızca GSC'den gelen gerçek
 * rakamlar yazılır; D/E segmentinde (çok düşük görünürlük) rakam verilmez.
 */
function personalIntro(g: GscStats): string[] {
  const seg = gscSegment(g);
  const per = periodPhrase(g);
  const sentence = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
  const brand =
    g.brand_impressions >= MIN_BRAND_IMPRESSIONS
      ? ` Bunun ${nf(g.brand_impressions)} kadarı adınızla yapılan aramalardan geldi.`
      : '';

  if (!per || seg === 'D' || seg === 'E') {
    return [
      "Size Terapimap ekibinden ulaşıyoruz. Terapimap'te sizin için ücretsiz bir uzman profili hazırladık ve profiliniz Google aramalarında görünmeye başladı.",
      '',
      'Profilinizdeki eksik alanları (hakkında yazısı, uzmanlık etiketleri, ilçe bilgisi, fotoğraf) tamamlamak Google ve danışan aramalarında görünürlüğünüzü artırır.',
    ];
  }

  if (seg === 'A') {
    return [
      'Size Terapimap ekibinden ulaşıyoruz.',
      '',
      sentence(`${per} Terapimap profiliniz Google aramalarında ${nf(g.impressions)} kez gösterildi ve ${nf(g.clicks)} kez tıklandı.${brand}`),
      "Terapimap'te en çok tıklanan profiller arasındasınız.",
      '',
      'Bu ilgiyi korumak ve profilinizi daha da öne çıkarmak için bilgilerinizi güncel tutmanızı öneririz.',
    ];
  }

  if (seg === 'B') {
    const pos = g.avg_position != null ? Math.round(g.avg_position) : null;
    const posText = pos
      ? ` Profiliniz ortalama ${pos}. sırada göründüğü için tıklama sayısı ${nf(g.clicks)} kaldı.`
      : ` Buna rağmen tıklama sayısı ${nf(g.clicks)} kaldı.`;
    return [
      'Size Terapimap ekibinden ulaşıyoruz.',
      '',
      sentence(`${per} Terapimap profiliniz Google aramalarında ${nf(g.impressions)} kez gösterildi.${brand}${posText}`),
      '',
      'Fotoğraf, kısa tanıtım yazısı ve uzmanlık etiketlerini güçlendirmek tıklanmayı artırmaya yardımcı olabilir.',
    ];
  }

  // C: gelişen
  return [
    'Size Terapimap ekibinden ulaşıyoruz.',
    '',
    sentence(`${per} Terapimap profiliniz Google aramalarında ${nf(g.impressions)} kez gösterildi, ${nf(g.clicks)} kez tıklandı.${brand}`),
    '',
    'Profilinizdeki bilgileri güncelleyerek görünürlüğünüzü daha da artırabilirsiniz.',
  ];
}

/**
 * E-posta davetinin (sendVerificationInvite) WhatsApp metni karşılığı.
 * GSC özeti varsa açılış kişiselleştirilir; doğrulama faydaları, kampanya, bağlantı
 * ve kaldırma notu her iki varyantta da aynıdır.
 */
export function buildInviteMessage(p: InviteMessageInput, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const verifyUrl = `${base}/profil-dogrula/${p.id}`;
  const profileUrl = p.slug ? `${base}${getProfessionalUrl(p.slug, p.professionalType, 'tr')}` : null;

  const intro = p.gsc
    ? personalIntro(p.gsc)
    : [
        "Size Terapimap ekibinden ulaşıyoruz. Terapimap, ruh sağlığı profesyonellerinin danışanlar tarafından daha kolay keşfedilmesini amaçlayan bir uzman dizin platformudur. Mesleki görünürlüğünüzü desteklemek amacıyla Terapimap'te sizin için ücretsiz bir uzman profili hazırladık.",
        '',
        'Profiliniz şimdiden arama sonuçlarında görünmeye başladı.',
      ];

  return [
    `Sayın ${p.name},`,
    '',
    ...intro,
    ...(profileUrl ? ['', `Profiliniz: ${profileUrl}`] : []),
    '',
    'Profilinizi ücretsiz doğrulayarak:',
    '- Bilgilerinizi güncelleyin (uzmanlık, iletişim, hakkında, fotoğraf)',
    '- "Doğrulanmış Profil" rozeti kazanın',
    '- Danışan taleplerini doğrudan yönetin',
    '- Tamamen ücretsiz, ödeme gerekmez',
    ...(p.campaignDateText
      ? ['', `KAMPANYA: Şimdi doğrulayan uzmanları ${p.campaignDateText} tarihine kadar ücretsiz öne çıkarıyoruz.`]
      : []),
    '',
    `Doğrulama bağlantısı: ${verifyUrl}`,
    '',
    'Profilinizin platformda yer almasını istemiyorsanız aynı bağlantı üzerinden kaldırılmasını da talep edebilirsiniz.',
    '',
    'İyi çalışmalar dileriz,',
    'Terapimap Ekibi',
  ].join('\n');
}
