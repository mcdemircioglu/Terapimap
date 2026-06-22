import { notFound } from 'next/navigation';
import { getServiceClient } from '@/lib/supabase/server';
import VerificationRequestForm from '@/components/VerificationRequestForm';

export default async function ProfilDogrulaPage({
  params: { professionalId },
}: {
  params: { professionalId: string };
}) {
  const supabase = getServiceClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, title, city, district, slug, is_verified, image_url')
    .eq('id', professionalId)
    .maybeSingle();

  if (!professional) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/60 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Doğrulama</h1>
          <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto">
            Terapimap&apos;teki profilinizi sahiplenmek, bilgilerinizi güncellemek veya profil kaldırma talebinde bulunmak için aşağıdaki formu doldurun.
          </p>
        </div>

        {/* Therapist summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6 flex items-center gap-4">
          {professional.image_url ? (
            <img
              src={professional.image_url}
              alt={professional.name}
              className="w-14 h-14 rounded-full object-cover bg-gray-100 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-700 font-bold text-lg">
              {professional.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{professional.name}</p>
            {professional.title && <p className="text-sm text-brand-600">{professional.title}</p>}
            <p className="text-sm text-gray-500">
              {professional.city}{professional.district ? ` · ${professional.district}` : ''}
            </p>
          </div>
          {professional.is_verified && (
            <span className="ml-auto flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Doğrulanmış
            </span>
          )}
        </div>

        <VerificationRequestForm professionalId={professional.id} professionalName={professional.name} />
      </div>
    </main>
  );
}
