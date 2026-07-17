/**
 * Bilgilendirme notu — içerik gövdesinin altında gösterilir.
 * İleride acil durum yönlendirmesi gibi ek bloklarla genişletilebilir.
 */
export default function ArticleDisclaimer() {
  return (
    <aside
      role="note"
      className="rounded-xl border border-brand-100 bg-brand-50/60 p-5 text-sm leading-relaxed text-brand-700"
    >
      <p>
        Bu içerik genel bilgilendirme amacıyla hazırlanmıştır; tanı veya tedavi yerine
        geçmez. Ruh sağlığınızla ilgili değerlendirme için yetkin bir uzmana başvurmanız
        önerilir.
      </p>
    </aside>
  );
}
