import nodemailer from 'nodemailer';

/**
 * Gmail SMTP üzerinden mail gönderimi (Google Workspace).
 *
 * Gerekli ortam değişkenleri:
 *   GMAIL_USER          → gönderici adres (ör. iletisim@terapimap.com)
 *   GMAIL_APP_PASSWORD  → Google hesabında oluşturulan 16 haneli uygulama şifresi
 */

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://terapimap.com').replace(/\/$/, '');
const FROM_NAME = 'Terapimap';

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD ortam değişkenleri tanımlı değil.');
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/* ── Ortak şablon parçaları ─────────────────────────────────────────── */

const C = {
  bg: '#f0f7f7',
  card: '#ffffff',
  border: '#daecec',
  primary: '#316c6f',
  dark: '#1f3a3d',
  text: '#2a565a',
  muted: '#5ba1a3',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 8px 16px;">
          <span style="font-size:20px;font-weight:bold;color:${C.dark};">Terapimap</span>
        </td></tr>
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:32px 28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${C.dark};">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:20px 8px;font-size:12px;color:${C.muted};line-height:1.6;">
          Bu e-posta <a href="${BASE}" style="color:${C.primary};">terapimap.com</a> tarafından gönderilmiştir.
          Terapimap bir sağlık hizmeti sağlayıcısı değildir; danışanlar ile uzmanları buluşturan bir dizin platformudur.<br>
          Kişisel verilerinize ilişkin bilgi için
          <a href="${BASE}/tr/kvkk-aydinlatma-metni" style="color:${C.primary};">KVKK Aydınlatma Metni</a>&#39;ni inceleyebilirsiniz.
          Sorularınız için: <a href="mailto:${process.env.GMAIL_USER}" style="color:${C.primary};">${process.env.GMAIL_USER}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:${C.dark};">${value}</td>
  </tr>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${C.primary};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:8px;">${label}</a>`;
}

/* ── Terapiste: danışan talebi ──────────────────────────────────────── */

export type LeadEmailInput = {
  lead: {
    name: string;
    email: string;
    phone: string | null;
    message: string;
  };
  professional: {
    id: string;
    name: string;
    email: string;
    slug: string;
    is_verified: boolean;
  };
};

export async function sendLeadToTherapist({ lead, professional }: LeadEmailInput) {
  const verifyUrl = `${BASE}/profil-dogrula/${professional.id}`;
  const profileUrl = `${BASE}/tr/psikolog/${professional.slug}`;

  const verifyBlock = professional.is_verified
    ? ''
    : `<div style="margin-top:28px;background:${C.bg};border:1px solid ${C.border};border-radius:10px;padding:20px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:${C.dark};">Terapimap profilinizi doğrulayın</p>
        <p style="margin:0 0 14px;font-size:13px;color:${C.text};line-height:1.6;">
          Profiliniz henüz doğrulanmamış görünüyor. Profilinizi doğrulayarak bilgilerinizi güncelleyebilir,
          &quot;Doğrulanmış Profil&quot; rozeti kazanabilir ve danışan taleplerini doğrudan yönetebilirsiniz.
          Dilerseniz profilinizin güncellenmesini veya kaldırılmasını da talep edebilirsiniz.
        </p>
        ${button(verifyUrl, 'Profilimi Doğrula')}
      </div>`;

  const html = layout(
    'Yeni danışan talebi',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Sayın ${escapeHtml(professional.name)},<br>
      Terapimap üzerindeki <a href="${profileUrl}" style="color:${C.primary};">profiliniz</a> aracılığıyla
      size ulaşmak isteyen bir danışan talebi aldık. İletişim bilgileri aşağıdadır;
      danışanla doğrudan iletişime geçebilirsiniz.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${infoRow('Ad Soyad', escapeHtml(lead.name))}
      ${infoRow('E-posta', `<a href="mailto:${escapeHtml(lead.email)}" style="color:${C.primary};">${escapeHtml(lead.email)}</a>`)}
      ${lead.phone ? infoRow('Telefon', escapeHtml(lead.phone)) : ''}
      ${infoRow('Mesaj', escapeHtml(lead.message).replace(/\n/g, '<br>'))}
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:${C.muted};line-height:1.6;">
      Bu bilgiler, danışanın açık talebi üzerine yalnızca size iletilmiştir.
      Lütfen kişisel verileri 6698 sayılı KVKK&#39;ya uygun şekilde ve yalnızca
      danışanla iletişim amacıyla kullanınız.
    </p>
    ${verifyBlock}`,
  );

  const text = [
    `Sayın ${professional.name},`,
    '',
    'Terapimap üzerinden size ulaşmak isteyen bir danışan talebi aldık:',
    '',
    `Ad Soyad: ${lead.name}`,
    `E-posta: ${lead.email}`,
    lead.phone ? `Telefon: ${lead.phone}` : null,
    `Mesaj: ${lead.message}`,
    '',
    professional.is_verified ? null : `Profilinizi doğrulamak için: ${verifyUrl}`,
    '',
    'Terapimap — terapimap.com',
  ]
    .filter((l) => l !== null)
    .join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: professional.email,
    replyTo: lead.email,
    subject: `Yeni danışan talebi — ${lead.name}`,
    html,
    text,
  });
}

/* ── Danışana: talebiniz iletildi ───────────────────────────────────── */

export async function sendConfirmationToClient({ lead, professional }: LeadEmailInput) {
  const profileUrl = `${BASE}/tr/psikolog/${professional.slug}`;

  const html = layout(
    'Talebiniz iletildi',
    `<p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      Merhaba ${escapeHtml(lead.name)},<br><br>
      Terapimap üzerinden <a href="${profileUrl}" style="color:${C.primary};">${escapeHtml(professional.name)}</a>&#39;a
      ilettiğiniz iletişim talebi ve bilgileriniz kendisine ulaştırılmıştır.
      Uzman, paylaştığınız iletişim bilgileri üzerinden en kısa sürede sizinle iletişime geçecektir.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      Makul bir süre içinde dönüş alamazsanız, profil sayfasındaki iletişim bilgilerini kullanarak
      uzmana doğrudan ulaşabilir veya Terapimap üzerinden başka bir uzmanla iletişime geçebilirsiniz.
    </p>
    <p style="margin:0;font-size:12px;color:${C.muted};line-height:1.6;">
      Hatırlatma: Terapimap terapi veya sağlık hizmeti sunmaz; yalnızca sizi uzmanlarla buluşturan bir
      platformdur. Bilgileriniz yalnızca talep ettiğiniz uzmana iletilmiştir.
    </p>`,
  );

  const text = [
    `Merhaba ${lead.name},`,
    '',
    `Terapimap üzerinden ${professional.name} adlı uzmana ilettiğiniz iletişim talebi kendisine ulaştırılmıştır.`,
    'Uzman en kısa sürede sizinle iletişime geçecektir.',
    '',
    'Bilgileriniz yalnızca talep ettiğiniz uzmana iletilmiştir.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: lead.email,
    subject: `Talebiniz ${professional.name}'a iletildi — Terapimap`,
    html,
    text,
  });
}
