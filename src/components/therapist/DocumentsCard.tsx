/**
 * 📎 Belgeler kartı — terapistin yüklediği diploma/sertifika/ek fotoğraf gibi
 * belgeleri gösterir. Yalnızca en az bir belge varsa render edilir (bkz.
 * profile.tsx). Belgeler admin ön-onayı olmadan yayınlanır — terapist
 * panelden yükler yüklemez burada görünür.
 */
import { Card } from '@/components/ui/Card';
import type { TherapistDocument } from '@/types/database';

type Props = {
  documents: TherapistDocument[];
  locale: string;
};

export default function DocumentsCard({ documents, locale }: Props) {
  if (!documents || documents.length === 0) return null;

  const title = locale === 'tr' ? 'Belgeler' : 'Documents';
  const hint =
    locale === 'tr'
      ? 'Diploma, sertifika ve ek belgeler'
      : 'Diplomas, certificates and supporting documents';

  return (
    <Card className="p-6 md:p-8">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-brand-900">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-brand-600">{hint}</p>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {documents.map((doc) => (
          <li key={doc.url}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              {doc.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.url}
                  alt={doc.name}
                  className="h-11 w-11 flex-shrink-0 rounded-lg object-cover ring-1 ring-brand-100"
                />
              ) : (
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 ring-1 ring-brand-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-800">
                {doc.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
