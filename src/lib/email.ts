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
    : `<div style="margin-top:28px;background:#fff7e6;border:1px solid #f0c36d;border-radius:10px;padding:20px;">
        <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:${C.dark};">Profilinizi doğrulayın, daha fazla danışana ulaşın</p>
        <p style="margin:0 0 14px;font-size:13px;color:${C.text};line-height:1.7;">
          Profiliniz şu an <strong>doğrulanmamış</strong> görünüyor: doğrulayarak bilgilerinizi
          güncelleyebilir, &quot;Doğrulanmış Profil&quot; rozeti kazanabilirsiniz. Doğrulanmış, güncel ve
          eksiksiz profiller danışanların gözünde daha güvenilir durur ve genellikle daha fazla danışan
          talebi alır. Dilerseniz profilinizin güncellenmesini veya kaldırılmasını da talep edebilirsiniz.
        </p>
        ${button(verifyUrl, 'Profilimi Doğrula')}
      </div>`;

  const html = layout(
    'YENİ DANIŞAN TALEBİ',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Sayın ${escapeHtml(professional.name)},<br>
      Bu talep, Terapimap&#39;teki <a href="${profileUrl}" style="color:${C.primary};">profiliniz</a> sayesinde
      size ulaştı — Terapimap, danışanların size ulaşmasını sağlayan önemli bir dijital görünürlük kanalı.<br><br>
      Profiliniz aracılığıyla sizinle görüşmek isteyen bir danışan talebi aldık. İletişim bilgileri
      aşağıdadır; danışanla doğrudan iletişime geçebilirsiniz.
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:${C.dark};">Danışan Bilgileri;</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${infoRow('Ad Soyad', escapeHtml(lead.name))}
      ${infoRow('E-posta', `<a href="mailto:${escapeHtml(lead.email)}" style="color:${C.primary};">${escapeHtml(lead.email)}</a>`)}
      ${lead.phone ? infoRow('Telefon', escapeHtml(lead.phone)) : ''}
      ${infoRow('Mesaj', escapeHtml(lead.message).replace(/\n/g, '<br>'))}
    </table>
    <p style="margin:16px 0 0;font-size:13px;font-weight:bold;color:${C.dark};line-height:1.6;background:#fdeeee;border:1px solid #f3c9c9;border-radius:8px;padding:12px 14px;">
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
    professional.is_verified
      ? null
      : `Profiliniz henüz doğrulanmamış. Doğrulanmış, güncel profiller danışanların gözünde daha güvenilir durur ve genellikle daha fazla danışan talebi alır. Profilinizi doğrulamak için: ${verifyUrl}`,
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

/* ── Admin'e: yeni uzman başvurusu ──────────────────────────────────── */

export type ApplicationEmailInput = {
  fullName: string;
  email: string;
  phone: string;
  title: string;
  city: string;
  district: string;
  bio: string;
  specialties: string[];
  website?: string | null;
  instagram?: string | null;
  googleMapsUrl?: string | null;
  clinicName?: string | null;
  offersOnline?: boolean;
  offersInPerson?: boolean;
};

export async function sendApplicationNotification(app: ApplicationEmailInput) {
  const adminAddr = process.env.GMAIL_USER;
  if (!adminAddr) {
    throw new Error('GMAIL_USER ortam değişkeni tanımlı değil.');
  }

  const adminUrl = `${BASE}/admin/basvurular`;
  const meeting = [
    app.offersOnline ? 'Online' : null,
    app.offersInPerson ? 'Yüz yüze' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const rows = [
    infoRow('Ad Soyad', escapeHtml(app.fullName)),
    infoRow('Unvan', escapeHtml(app.title)),
    infoRow('E-posta', `<a href="mailto:${escapeHtml(app.email)}" style="color:${C.primary};">${escapeHtml(app.email)}</a>`),
    infoRow('Telefon', escapeHtml(app.phone)),
    infoRow('Şehir / İlçe', escapeHtml([app.city, app.district].filter(Boolean).join(' / '))),
    app.clinicName ? infoRow('Kurum', escapeHtml(app.clinicName)) : '',
    meeting ? infoRow('Görüşme', escapeHtml(meeting)) : '',
    app.website ? infoRow('Web', `<a href="${escapeHtml(app.website)}" style="color:${C.primary};">${escapeHtml(app.website)}</a>`) : '',
    app.instagram ? infoRow('Instagram', escapeHtml(app.instagram)) : '',
    app.googleMapsUrl ? infoRow('Google Haritalar', `<a href="${escapeHtml(app.googleMapsUrl)}" style="color:${C.primary};">Konumu aç</a>`) : '',
    app.specialties.length ? infoRow('Uzmanlıklar', escapeHtml(app.specialties.join(', '))) : '',
    infoRow('Hakkında', escapeHtml(app.bio).replace(/\n/g, '<br>')),
  ].join('');

  const html = layout(
    'Yeni uzman başvurusu',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Terapimap üzerinden yeni bir uzman üyelik başvurusu alındı. Başvuru bilgileri aşağıdadır.
      Onaylamak veya reddetmek için admin panelindeki
      <a href="${adminUrl}" style="color:${C.primary};">Başvurular</a> bölümünü kullanın.
      Başvuru siz onaylayana kadar yayınlanmaz.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${rows}
    </table>
    <div style="margin-top:24px;">
      ${button(adminUrl, 'Başvuruları Görüntüle')}
    </div>`,
  );

  const text = [
    'Terapimap — yeni uzman başvurusu alındı:',
    '',
    `Ad Soyad: ${app.fullName}`,
    `Unvan: ${app.title}`,
    `E-posta: ${app.email}`,
    `Telefon: ${app.phone}`,
    `Şehir / İlçe: ${[app.city, app.district].filter(Boolean).join(' / ')}`,
    app.clinicName ? `Kurum: ${app.clinicName}` : null,
    meeting ? `Görüşme: ${meeting}` : null,
    app.website ? `Web: ${app.website}` : null,
    app.instagram ? `Instagram: ${app.instagram}` : null,
    app.googleMapsUrl ? `Google Haritalar: ${app.googleMapsUrl}` : null,
    app.specialties.length ? `Uzmanlıklar: ${app.specialties.join(', ')}` : null,
    `Hakkında: ${app.bio}`,
    '',
    `Başvuruları görüntüle: ${adminUrl}`,
    '',
    'Terapimap — terapimap.com',
  ]
    .filter((l) => l !== null)
    .join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: adminAddr },
    to: adminAddr,
    replyTo: app.email,
    subject: `Uzman Başvuru İsteği — ${app.fullName}`,
    html,
    text,
  });
}

/* ── Terapiste: profil doğrulama daveti (outreach) ──────────────────── */

export type VerificationInviteInput = {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  city?: string | null;
  district?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
};

function checkItem(text: string): string {
  return `<tr>
    <td style="padding:5px 10px 5px 0;vertical-align:top;width:20px;">
      <span style="color:${C.primary};font-weight:bold;font-size:15px;line-height:1.5;">&#10003;</span>
    </td>
    <td style="padding:5px 0;font-size:14px;color:${C.text};line-height:1.55;">${text}</td>
  </tr>`;
}

export async function sendVerificationInvite({
  id,
  name,
  email,
  title,
  city,
  district,
  slug,
  imageUrl,
}: VerificationInviteInput) {
  const verifyUrl = `${BASE}/profil-dogrula/${id}`;
  const profileUrl = slug ? `${BASE}/tr/psikolog/${slug}` : null;
  const location = [city, district].filter(Boolean).join(' · ');

  const avatar = imageUrl
    ? `<img src="${imageUrl}" width="52" height="52" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover;display:block;border:1px solid ${C.border};">`
    : `<div style="width:52px;height:52px;border-radius:50%;background:${C.bg};color:${C.primary};font-weight:bold;font-size:20px;line-height:52px;text-align:center;">${escapeHtml(
        name.trim().charAt(0).toUpperCase() || 'T',
      )}</div>`;

  const previewCard = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:10px;margin:0 0 8px;background:#fbfdfd;">
    <tr>
      <td style="padding:14px 14px 14px 16px;width:56px;vertical-align:middle;">${avatar}</td>
      <td style="padding:14px 16px 14px 0;vertical-align:middle;">
        <div style="font-size:15px;font-weight:bold;color:${C.dark};">${escapeHtml(name)}</div>
        ${title ? `<div style="font-size:13px;color:${C.primary};margin-top:2px;">${escapeHtml(title)}</div>` : ''}
        ${location ? `<div style="font-size:13px;color:${C.muted};margin-top:2px;">${escapeHtml(location)}</div>` : ''}
      </td>
    </tr>
  </table>`;

  const viewLink = profileUrl
    ? `<p style="margin:0 0 20px;font-size:13px;">
        <a href="${profileUrl}" style="color:${C.primary};font-weight:bold;text-decoration:none;">&rarr; Profilinizi Terapimap&#39;te görüntüleyin</a>
      </p>`
    : '<div style="height:12px;"></div>';

  // Kampanya bloğu — CAMPAIGN_FEATURED_DAYS>0 ise gösterilir (grant mantığıyla senkron).
  const campaignDays = parseInt(process.env.CAMPAIGN_FEATURED_DAYS ?? '30', 10) || 0;
  const campaignBox =
    campaignDays > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#eef8f5;border:1px solid #bfe6dd;border-radius:10px;">
          <tr><td style="padding:14px 16px;">
            <span style="display:inline-block;background:${C.primary};color:#ffffff;font-size:11px;font-weight:bold;padding:3px 9px;border-radius:20px;letter-spacing:.3px;">KAMPANYA</span>
            <p style="margin:10px 0 0;font-size:14px;color:${C.dark};line-height:1.6;">
              Şimdi profilini doğrulayan uzmanları <strong>${campaignDays} gün boyunca ücretsiz öne çıkarıyoruz.</strong>
              Arama sonuçlarında üst sırada ve ana sayfada <strong>&quot;Öne Çıkan&quot;</strong> olarak yer alırsınız.
            </p>
          </td></tr>
        </table>`
      : '';

  const html = layout(
    'Terapimap profiliniz yayında',
    `<p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      Sayın ${escapeHtml(name)},<br><br>
      Sizin için Terapimap&#39;te adınıza profil oluşturduk. İsterseniz profilinizi ücretsiz
      güncelleyip onaylı profil avantajlarından yararlanabilirsiniz. Danışanlar arama sonuçlarında
      bu profille karşılaşıyor. Terapimap, danışanların şehir ve uzmanlık alanına göre terapist
      bulduğu ücretsiz bir dizin platformudur.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:${C.primary};font-weight:bold;line-height:1.6;">
      Profilinizi doğrulayarak daha fazla görüntülenme ve danışan talebi alabilirsiniz.
    </p>
    ${previewCard}
    ${viewLink}
    <p style="margin:0 0 12px;font-size:14px;color:${C.text};line-height:1.7;">
      Profilinizi <strong>ücretsiz</strong> doğrulayarak:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      ${checkItem('Bilgilerinizi güncelleyin — uzmanlık alanları, iletişim, hakkında metni ve fotoğrafınız')}
      ${checkItem('<strong>&quot;Doğrulanmış Profil&quot;</strong> rozeti kazanın — danışan güvenini artırır')}
      ${checkItem('Size ulaşmak isteyen danışan taleplerini doğrudan yönetin')}
      ${checkItem('Tamamen ücretsiz — kredi kartı ya da herhangi bir ödeme gerekmez')}
    </table>
    <p style="margin:0 0 20px;font-size:13px;color:${C.muted};line-height:1.6;">
      Doğrulama yalnızca birkaç dakika sürer.
    </p>
    ${campaignBox}
    ${button(verifyUrl, 'Profilimi Ücretsiz Doğrula')}
    <p style="margin:22px 0 0;font-size:12px;color:${C.muted};line-height:1.6;">
      Bu e-postayı, adınıza kayıtlı profil Terapimap&#39;te yayında olduğu için aldınız. Profilin size
      ait olmadığını düşünüyorsanız ya da <strong>kaldırılmasını</strong> isterseniz, yukarıdaki
      bağlantıdan talep oluşturabilir ya da bu e-postayı yanıtlayabilirsiniz.
    </p>`,
  );

  const text = [
    `Sayın ${name},`,
    '',
    'Sizin için Terapimap\'te adınıza profil oluşturduk. İsterseniz profilinizi ücretsiz güncelleyip onaylı profil avantajlarından yararlanabilirsiniz. Danışanlar arama sonuçlarında bu profille karşılaşıyor. Terapimap, danışanların şehir ve uzmanlık alanına göre terapist bulduğu ücretsiz bir dizin platformudur.',
    '',
    'Profilinizi doğrulayarak daha fazla görüntülenme ve danışan talebi alabilirsiniz.',
    ...(profileUrl ? ['', `Profiliniz: ${profileUrl}`] : []),
    '',
    'Profilinizi ücretsiz doğrulayarak:',
    '- Bilgilerinizi güncelleyin (uzmanlık, iletişim, hakkında, fotoğraf)',
    '- "Doğrulanmış Profil" rozeti kazanın',
    '- Danışan taleplerini doğrudan yönetin',
    '- Tamamen ücretsiz, ödeme gerekmez',
    ...(campaignDays > 0
      ? ['', `KAMPANYA: Şimdi doğrulayan uzmanları ${campaignDays} gün boyunca ücretsiz öne çıkarıyoruz.`]
      : []),
    '',
    `Doğrulama bağlantısı: ${verifyUrl}`,
    '',
    'Profilin size ait olmadığını düşünüyorsanız ya da kaldırılmasını isterseniz aynı bağlantıdan talep edebilir veya bu e-postayı yanıtlayabilirsiniz.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: email,
    subject: `${name}, Terapimap profiliniz yayında — ücretsiz doğrulayın`,
    html,
    text,
  });
}

/* ── Terapiste: panel hesabı daveti ───────────────────────────────────
 * Supabase Auth'un kendi (markasız, mail.app.supabase.io'dan giden) davet
 * e-postası yerine kullanılır: hesap supabase.auth.admin.generateLink ile
 * e-posta GÖNDERMEDEN oluşturulur, dönen action_link bu şablonla gönderilir.
 */

export type PanelInviteEmailInput = {
  name: string;
  email: string;
  inviteUrl: string;
};

export async function sendPanelInviteEmail({ name, email, inviteUrl }: PanelInviteEmailInput) {
  const html = layout(
    'Panel hesabınız hazır',
    `<p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      Sayın ${escapeHtml(name)},<br><br>
      Terapimap panelinde size özel bir hesap oluşturduk. Panel üzerinden profilinizi
      güncelleyebilir, danışan taleplerinizi yönetebilir ve blog yazılarınızı
      yayınlayabilirsiniz.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Hesabınıza giriş yapmak ve şifrenizi belirlemek için aşağıdaki butona tıklayın.
    </p>
    ${button(inviteUrl, 'Panele Giriş Yap')}
    <p style="margin:22px 0 0;font-size:12px;color:${C.muted};line-height:1.6;">
      Bu bağlantı güvenlik amacıyla sınırlı bir süre için geçerlidir. Butona tıklanamıyorsa
      aşağıdaki adresi tarayıcınıza kopyalayabilirsiniz:<br>
      <a href="${inviteUrl}" style="color:${C.primary};word-break:break-all;">${inviteUrl}</a>
    </p>`,
  );

  const text = [
    `Sayın ${name},`,
    '',
    'Terapimap panelinde size özel bir hesap oluşturduk. Panel üzerinden profilinizi güncelleyebilir, danışan taleplerinizi yönetebilir ve blog yazılarınızı yayınlayabilirsiniz.',
    '',
    'Hesabınıza giriş yapmak ve şifrenizi belirlemek için aşağıdaki bağlantıyı kullanın:',
    inviteUrl,
    '',
    'Bu bağlantı güvenlik amacıyla sınırlı bir süre için geçerlidir.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: email,
    subject: `${name}, Terapimap panel hesabınız hazır`,
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
      Makul bir süre içinde dönüş alamazsanız, Terapimap üzerinden listelenen diğer uzmanlarla iletişime
      geçebilir ya da durumu bize <a href="mailto:iletisim@terapimap.com" style="color:${C.primary};">iletisim@terapimap.com</a>
      adresinden bildirebilirsiniz — size yardımcı olmaktan memnuniyet duyarız.
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
    'Makul bir süre içinde dönüş alamazsanız, Terapimap üzerinden listelenen diğer uzmanlarla iletişime',
    'geçebilir ya da durumu bize iletisim@terapimap.com adresinden bildirebilirsiniz — size yardımcı',
    'olmaktan memnuniyet duyarız.',
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

/* ── Danışana: test sonucu ────────────────────────────────────────────── */

export type TestResultEmailInput = {
  email: string;
  testTitle: string;
  score: number;
  maxScore: number;
  tierLabel: string;
  tierSummary: string;
  /** 'score' (varsayılan): doğrusal testler, "Puanınız: X / Y — Kademe" gösterir.
   *  'category': kategorik/viral testler (ör. Bağlanma Stili Testi), sonucu bir
   *  puan yerine bir stil/tip olarak başlıkta gösterir. */
  resultKind?: 'score' | 'category';
  specialtySlug?: string | null;
  specialtyName?: string | null;
};

export async function sendTestResultEmail({
  email,
  testTitle,
  score,
  maxScore,
  tierLabel,
  tierSummary,
  resultKind = 'score',
  specialtySlug,
  specialtyName,
}: TestResultEmailInput) {
  const therapistsUrl = specialtySlug ? `${BASE}/tr/${specialtySlug}` : `${BASE}/tr/terapistler`;
  const therapistsLabel = specialtyName
    ? `${specialtyName} alanında uzman terapistleri görüntüle`
    : 'Uzman terapistleri görüntüle';

  const isCategory = resultKind === 'category';
  const scoreBar = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;margin:0 0 20px;">
    <tr>
      <td style="padding:16px 18px;">
        <div style="font-size:13px;color:${C.muted};margin-bottom:4px;">${isCategory ? 'Sonucunuz' : 'Puanınız'}</div>
        <div style="font-size:22px;font-weight:bold;color:${C.dark};margin-bottom:8px;">${
          isCategory ? escapeHtml(tierLabel) : `${score} / ${maxScore} — ${escapeHtml(tierLabel)}`
        }</div>
        ${isCategory ? `<div style="font-size:12px;color:${C.muted};margin-bottom:8px;">${score} / ${maxScore} soruda bu sonuca işaret eden cevabı seçtiniz</div>` : ''}
        <div style="font-size:13px;color:${C.text};line-height:1.7;">${escapeHtml(tierSummary)}</div>
      </td>
    </tr>
  </table>`;

  const html = layout(
    `${testTitle} Sonucunuz`,
    `<p style="margin:0 0 16px;font-size:14px;color:${C.text};line-height:1.7;">
      Merhaba,<br><br>
      Terapimap üzerinde tamamladığınız <strong>${escapeHtml(testTitle)}</strong>&#39;nin sonucu aşağıdadır.
    </p>
    ${scoreBar}
    <p style="margin:0 0 20px;font-size:12px;color:${C.muted};line-height:1.6;background:#fdeeee;border:1px solid #f3c9c9;border-radius:8px;padding:12px 14px;">
      Bu sonuç bir <strong>tanı değildir</strong>, yalnızca genel bilgilendirme amaçlı kısa bir öz-değerlendirmedir.
      Kesin bir değerlendirme için bir uzmana danışmanızı öneririz.
    </p>
    ${button(therapistsUrl, therapistsLabel)}`,
  );

  const text = [
    'Merhaba,',
    '',
    `Terapimap üzerinde tamamladığınız "${testTitle}" testinin sonucu:`,
    '',
    isCategory ? `Sonuç: ${tierLabel} (${score} / ${maxScore} soruda bu sonuca işaret eden cevap)` : `Puan: ${score} / ${maxScore} — ${tierLabel}`,
    tierSummary,
    '',
    'Bu sonuç bir tanı değildir, yalnızca genel bilgilendirme amaçlı bir öz-değerlendirmedir. Kesin bir değerlendirme için bir uzmana danışmanızı öneririz.',
    '',
    `${therapistsLabel}: ${therapistsUrl}`,
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: email,
    subject: `${testTitle} Sonucunuz — Terapimap`,
    html,
    text,
  });
}

/* ── Randevu bildirimleri (terapiste + danışana) ─────────────────────── */

type AppointmentEmailCore = {
  client_name: string;
  session_type: string; // 'online' | 'in_person'
  start_at: string; // UTC ISO
  end_at: string; // UTC ISO
  meeting_link: string | null;
};

type AppointmentProfessionalInfo = {
  name: string;
  clinic_name: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
};

function fmtAppointmentRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const datePart = start.toLocaleDateString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = end.toLocaleTimeString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${startTime}–${endTime}`;
}

function locationBlock(professional: AppointmentProfessionalInfo): string {
  const parts = [professional.clinic_name, professional.address, professional.district, professional.city].filter(
    Boolean,
  );
  return parts.length > 0 ? escapeHtml(parts.join(', ')) : 'Terapist sizinle görüşme adresini paylaşacaktır.';
}

export type AppointmentToTherapistInput = {
  appointment: AppointmentEmailCore & { client_email: string; client_phone: string | null };
  professional: AppointmentProfessionalInfo & { email: string };
};

/**
 * Terapiste: yeni bir randevu TALEBİ geldi, onayı bekliyor (artık rezervasyon
 * anında otomatik onaylanmıyor — bkz. appointments.status='pending').
 */
export async function sendAppointmentRequestToTherapist({ appointment, professional }: AppointmentToTherapistInput) {
  const when = fmtAppointmentRange(appointment.start_at, appointment.end_at);
  const typeLabel = appointment.session_type === 'online' ? 'Online görüşme' : 'Yüz yüze görüşme';
  const panelUrl = `${BASE}/panel/randevular`;

  const html = layout(
    'ONAYINIZI BEKLEYEN RANDEVU TALEBİ',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Sayın ${escapeHtml(professional.name)},<br>
      Terapimap profiliniz üzerinden bir danışan, müsait saatlerinizden birini
      seçerek randevu talebinde bulundu. Bu randevunun kesinleşmesi için
      panelinizden <strong>onaylamanız</strong> gerekiyor.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${infoRow('Tarih / Saat', `<strong>${escapeHtml(when)}</strong>`)}
      ${infoRow('Görüşme Türü', escapeHtml(typeLabel))}
      ${infoRow('Danışan', escapeHtml(appointment.client_name))}
      ${infoRow('E-posta', `<a href="mailto:${escapeHtml(appointment.client_email)}" style="color:${C.primary};">${escapeHtml(appointment.client_email)}</a>`)}
      ${appointment.client_phone ? infoRow('Telefon', escapeHtml(appointment.client_phone)) : ''}
    </table>
    <div style="margin-top:22px;">
      ${button(panelUrl, 'Panelden Onayla / Reddet')}
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:${C.text};line-height:1.6;">
      Danışana ancak siz onayladıktan sonra onay bilgisi gider; reddederseniz
      danışana bilgi verilir ve saat tekrar müsait hale gelir.
    </p>`,
  );

  const text = [
    `Sayın ${professional.name},`,
    '',
    'Terapimap üzerinden onayınızı bekleyen yeni bir randevu talebi var:',
    '',
    `Tarih / Saat: ${when}`,
    `Görüşme Türü: ${typeLabel}`,
    `Danışan: ${appointment.client_name}`,
    `E-posta: ${appointment.client_email}`,
    appointment.client_phone ? `Telefon: ${appointment.client_phone}` : null,
    '',
    `Onaylamak/reddetmek için: ${panelUrl}`,
    '',
    'Terapimap — terapimap.com',
  ]
    .filter((l) => l !== null)
    .join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: professional.email,
    replyTo: appointment.client_email,
    subject: `Onayınızı bekleyen randevu talebi — ${appointment.client_name} (${when})`,
    html,
    text,
  });
}

export type AppointmentToClientInput = {
  appointment: AppointmentEmailCore & { client_email: string };
  professional: AppointmentProfessionalInfo;
};

/** Danışana: randevu talebi alındı, terapist onayını bekliyor. */
export async function sendAppointmentPendingToClient({ appointment, professional }: AppointmentToClientInput) {
  const when = fmtAppointmentRange(appointment.start_at, appointment.end_at);
  const typeLabel = appointment.session_type === 'online' ? 'Online görüşme' : 'Yüz yüze görüşme';

  const html = layout(
    'RANDEVU TALEBİNİZ ALINDI',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Merhaba ${escapeHtml(appointment.client_name)},<br>
      <strong>${escapeHtml(professional.name)}</strong> ile aşağıdaki randevu talebiniz
      alındı. Terapist onayladığında size ayrıca bir e-posta ile bilgi verilecek.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${infoRow('Tarih / Saat', `<strong>${escapeHtml(when)}</strong>`)}
      ${infoRow('Görüşme Türü', escapeHtml(typeLabel))}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:${C.text};line-height:1.6;">
      Bu bir ön rezervasyondur, henüz kesinleşmemiştir.
    </p>`,
  );

  const text = [
    `Merhaba ${appointment.client_name},`,
    '',
    `${professional.name} ile randevu talebiniz alındı (henüz kesinleşmedi):`,
    '',
    `Tarih / Saat: ${when}`,
    `Görüşme Türü: ${typeLabel}`,
    '',
    'Terapist onayladığında size ayrıca e-posta ile bilgi verilecek.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: appointment.client_email,
    subject: `Randevu talebiniz alındı — ${when}`,
    html,
    text,
  });
}

/** Danışana: terapist randevuyu onayladı, artık kesinleşti. */
export async function sendAppointmentConfirmedToClient({ appointment, professional }: AppointmentToClientInput) {
  const when = fmtAppointmentRange(appointment.start_at, appointment.end_at);
  const typeLabel = appointment.session_type === 'online' ? 'Online görüşme' : 'Yüz yüze görüşme';

  const html = layout(
    'RANDEVUNUZ ONAYLANDI',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Merhaba ${escapeHtml(appointment.client_name)},<br>
      <strong>${escapeHtml(professional.name)}</strong> randevunuzu onayladı — artık kesinleşti.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.bg};border:1px solid ${C.border};border-radius:10px;">
      ${infoRow('Tarih / Saat', `<strong>${escapeHtml(when)}</strong>`)}
      ${infoRow('Görüşme Türü', escapeHtml(typeLabel))}
      ${appointment.session_type === 'online' && appointment.meeting_link
        ? infoRow('Görüşme Linki', `<a href="${escapeHtml(appointment.meeting_link)}" style="color:${C.primary};">${escapeHtml(appointment.meeting_link)}</a>`)
        : infoRow('Adres', locationBlock(professional))}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:${C.text};line-height:1.6;">
      Randevunuzu değiştirmeniz veya iptal etmeniz gerekirse, lütfen doğrudan
      ${escapeHtml(professional.name)} ile iletişime geçin.
    </p>`,
  );

  const text = [
    `Merhaba ${appointment.client_name},`,
    '',
    `${professional.name} randevunuzu onayladı:`,
    '',
    `Tarih / Saat: ${when}`,
    `Görüşme Türü: ${typeLabel}`,
    appointment.session_type === 'online' && appointment.meeting_link
      ? `Görüşme Linki: ${appointment.meeting_link}`
      : `Adres: ${[professional.clinic_name, professional.address, professional.district, professional.city].filter(Boolean).join(', ') || 'Terapist sizinle paylaşacaktır.'}`,
    '',
    'Değişiklik/iptal için doğrudan terapistinizle iletişime geçebilirsiniz.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: appointment.client_email,
    subject: `Randevunuz onaylandı — ${when}`,
    html,
    text,
  });
}

/** Danışana: randevu iptal edildi / reddedildi. */
export async function sendAppointmentCancelledToClient({ appointment, professional }: AppointmentToClientInput) {
  const when = fmtAppointmentRange(appointment.start_at, appointment.end_at);

  const html = layout(
    'RANDEVUNUZ İPTAL EDİLDİ',
    `<p style="margin:0 0 20px;font-size:14px;color:${C.text};line-height:1.7;">
      Merhaba ${escapeHtml(appointment.client_name)},<br>
      <strong>${escapeHtml(professional.name)}</strong> ile
      <strong>${escapeHtml(when)}</strong> tarihli randevunuz iptal edildi.
    </p>
    <p style="margin:0;font-size:13px;color:${C.text};line-height:1.6;">
      Dilerseniz terapistin profil sayfasından yeni bir randevu talebinde
      bulunabilirsiniz.
    </p>`,
  );

  const text = [
    `Merhaba ${appointment.client_name},`,
    '',
    `${professional.name} ile ${when} tarihli randevunuz iptal edildi.`,
    '',
    'Dilerseniz terapistin profil sayfasından yeni bir randevu talebinde bulunabilirsiniz.',
    '',
    'Terapimap — terapimap.com',
  ].join('\n');

  await getTransport().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! },
    to: appointment.client_email,
    subject: `Randevunuz iptal edildi — ${when}`,
    html,
    text,
  });
}
