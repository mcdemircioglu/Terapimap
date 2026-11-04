import { track } from '@vercel/analytics';

/**
 * Dönüşüm olayları (Vercel Analytics özel olayları).
 *
 * Yalnızca kişisel olmayan, düz değerler gönderilir (yerleşim, kaynak, seans türü gibi).
 * Ad, e-posta, telefon, mesaj metni, terapist adı veya kimliği ASLA olay verisine konmaz.
 * Sayfa yolu, Vercel tarafından olayla birlikte zaten kaydedilir.
 * Analitik yoksa ya da engellenmişse sessizce geçilir; olay hatası kullanıcı akışını bozmaz.
 */
type EventProps = Record<string, string | number | boolean | null>;

export type ConversionEvent =
  | 'appointment_cta_click' // Randevu butonuna tıklandı (placement: sticky_bar | sidebar | meeting_card)
  | 'appointment_booked' // Randevu başarıyla alındı (placement, session_type)
  | 'message_cta_click' // "Mesaj gönder" butonuna tıklandı
  | 'lead_submitted' // İletişim/mesaj formu gönderildi (source)
  | 'profile_card_click'; // Liste ya da vitrindeki karttan profile geçildi

export function trackEvent(name: ConversionEvent, props?: EventProps) {
  try {
    track(name, props);
  } catch {
    /* analitik yoksa sessiz geç */
  }
}
