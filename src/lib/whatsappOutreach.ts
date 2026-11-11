/**
 * WhatsApp doğrulama daveti yardımcıları (saf fonksiyonlar).
 * Hem admin sayfası (client) hem admin API (server) kullanır; bu yüzden
 * Supabase ya da sunucu-only modül import etmez.
 */

/** Türk telefon numarasını WhatsApp formatına (90XXXXXXXXXX) çevirir; geçersizse null. */
export function normalizeTrPhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, '');
  let nat = '';
  if (d.startsWith('90') && d.length === 12) nat = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) nat = d.slice(1);
  else if (d.length === 10) nat = d;
  else return null;
  return nat.length === 10 ? '90' + nat : null;
}

export type InviteMessageInput = {
  id: string;
  name: string;
  slug?: string | null;
  /** Kampanya bitiş tarihi (okunur metin, ör. "1 Ocak 2027"); kampanya kapalıysa null. */
  campaignDateText?: string | null;
};

/**
 * E-posta davetinin (sendVerificationInvite) WhatsApp metni karşılığı.
 * E-postadaki içerik ve sıra korunur; HTML yerine düz metin kullanılır.
 */
export function buildInviteMessage(p: InviteMessageInput, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const verifyUrl = `${base}/profil-dogrula/${p.id}`;
  const profileUrl = p.slug ? `${base}/tr/psikolog/${p.slug}` : null;
  return [
    `Sayın ${p.name},`,
    '',
    "Size Terapimap ekibinden ulaşıyoruz. Terapimap, ruh sağlığı profesyonellerinin danışanlar tarafından daha kolay keşfedilmesini amaçlayan bir uzman dizin platformudur. Mesleki görünürlüğünüzü desteklemek amacıyla Terapimap'te sizin için ücretsiz bir uzman profili hazırladık.",
    '',
    'Profiliniz şimdiden arama sonuçlarında görünmeye başladı.',
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
