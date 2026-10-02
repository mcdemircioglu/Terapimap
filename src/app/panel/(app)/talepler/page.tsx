import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { LeadContactButton } from '@/components/panel/LeadContactButton';

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default async function PanelLeadsPage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/panel/giris');

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return (
      <Card className="p-6">
        <h1 className="mb-2 text-lg font-semibold text-brand-900">Profil bulunamadı</h1>
        <p className="text-sm text-brand-600">
          Hesabınıza bağlı bir terapist profili bulunamadı. Lütfen Terapimap ekibiyle
          iletişime geçin.
        </p>
      </Card>
    );
  }

  // RLS zaten yalnızca admin'in onaylayıp gönderdiği (sent_at dolu) kendi
  // taleplerini döner — moderasyon bekleyen talepler burada görünmez.
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, message, created_at, sent_at, therapist_contacted_at')
    .eq('professional_id', professional.id)
    // Randevu takviminden gelen, bilgilendirme amaçlı kaydedilen talepleri
    // burada göstermiyoruz — terapist bunları zaten "Randevularım" sekmesinde
    // görüyor; aksi halde aynı danışan burada tekrar görünür.
    .or('source.is.null,source.neq.randevu_takvimi')
    .order('sent_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Talepler</h1>
        <p className="text-sm text-brand-500">
          Terapimap ekibinin size ilettiği danışan talepleri burada listelenir.
        </p>
      </div>

      {!leads || leads.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-brand-500">Henüz size iletilmiş bir talep yok.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-brand-100 pb-3">
                <p className="text-xs text-brand-400">
                  {lead.sent_at ? fmtDateTime(lead.sent_at) : fmtDateTime(lead.created_at)}
                </p>
                {lead.therapist_contacted_at ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    İletişime geçildi · {fmtDateTime(lead.therapist_contacted_at)}
                  </span>
                ) : (
                  <LeadContactButton leadId={lead.id} />
                )}
              </div>

              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">
                    Ad Soyad
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-brand-900">{lead.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">
                    E-posta
                  </dt>
                  <dd className="mt-0.5 text-sm text-brand-700">
                    <a href={`mailto:${lead.email}`} className="hover:text-brand-900 hover:underline">
                      {lead.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">
                    Telefon
                  </dt>
                  <dd className="mt-0.5 text-sm text-brand-700">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="hover:text-brand-900 hover:underline">
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-brand-300">—</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Mesaj</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-700">
                  {lead.message}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
