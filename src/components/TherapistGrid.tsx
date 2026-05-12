import TherapistCard from './TherapistCard';
import type { ProfessionalWithSpecialties } from '@/types/database';

export default function TherapistGrid({
  therapists,
  locale,
}: {
  therapists: ProfessionalWithSpecialties[];
  locale: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {therapists.map((t) => (
        <TherapistCard key={t.id} therapist={t} locale={locale} />
      ))}
    </div>
  );
}
