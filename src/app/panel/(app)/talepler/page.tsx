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
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-brand-900">{lead.name}</h3>
                  <p className="text-xs text-brand-400">
                    {lead.sent_at ? fmtDateTime(lead.sent_at) : fmtDateTime(lead.created_at)}
                  </p>
                </div>
                {lead.therapist_contacted_at ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    İletişime geçildi · {fmtDateTime(lead.therapist_contacted_at)}
                  </span>
                ) : (
                  <LeadContactButton leadId={lead.id} />
                )}
              </div>

              <p className="mb-3 whitespace-pre-line text-sm text-brand-700">{lead.message}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-500">
                <a href={`mailto:${lead.email}`} className="hover:text-brand-800">
                  {lead.email}
                </a>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="hover:text-brand-800">
                    {lead.phone}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
