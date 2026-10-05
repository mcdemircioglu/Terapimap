/**
 * ⭐ Danışan Değerlendirmeleri kartı — server component.
 * Yalnızca admin onaylı (status='approved') yorumları gösterir (bkz.
 * getApprovedReviewsForProfessional). Hiç onaylı yorum yoksa da kart
 * gösterilir — boş durum + "Değerlendirme Yaz" CTA'sı her zaman burada.
 */
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import ReviewButton from '@/components/therapist/ReviewButton';
import { StarIcon } from '@/components/ui/icons';
import type { PublicReview } from '@/types/database';

type Props = {
  professionalId: string;
  reviews: PublicReview[];
  average: number | null;
  count: number;
  locale: string;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-accent-500' : 'text-brand-100'}`}
        />
      ))}
    </div>
  );
}

export default async function ReviewsCard({ professionalId, reviews, average, count, locale }: Props) {
  const [t, tReview] = await Promise.all([
    getTranslations({ locale, namespace: 'detail' }),
    getTranslations({ locale, namespace: 'review' }),
  ]);

  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-brand-900">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <StarIcon className="h-[18px] w-[18px]" />
            </span>
            {t('reviewsTitle')}
          </h2>
          {count > 0 && average !== null ? (
            <div className="mt-2 flex items-center gap-2">
              <StarRow rating={Math.round(average)} />
              <span className="text-sm font-semibold text-brand-900">{average.toFixed(1)}</span>
              <span className="text-sm text-brand-500">{t('basedOn', { count })}</span>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-brand-600">{t('noReviews')}</p>
          )}
        </div>

        <ReviewButton
          professionalId={professionalId}
          label={t('reviewsCta')}
          subtitle={tReview('subtitle')}
          closeLabel={tReview('close')}
        />
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-5 divide-y divide-brand-100">
          {reviews.map((review) => (
            <li key={review.id} className="pt-5 first:pt-0 first:border-0 border-t border-brand-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-brand-900">{review.displayName}</span>
                  {review.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('verifiedClient')}
                    </span>
                  )}
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-700">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
