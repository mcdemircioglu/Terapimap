/**
 * Bilgilendirme notu — içerik gövdesinin altında gösterilir.
 * Sağlık içeriği olduğu için belirgin: sol renkli şerit, ikon ve başlık.
 * Acil durum yönlendirmesi (112) ayrı, daha vurgulu bir satır olarak yer alır.
 */
export default function ArticleDisclaimer() {
  return (
    <aside
      role="note"
      className="rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 p-5"
    >
      <div className="flex gap-4">
        <svg
          className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-900">Bilgilendirme</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Bu içerik genel bilgilendirme amacıyla hazırlanmıştır; tanı veya tedavi yerine
            geçmez. Ruh sağlığınızla ilgili değerlendirme için yetkin bir uzmana başvurmanız
            önerilir.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <svg
          className="h-5 w-5 flex-shrink-0 text-red-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <p className="text-sm font-medium text-red-800">
          Acil bir durumdaysanız veya kendinize zarar verme düşünceleriniz varsa vakit
          kaybetmeden <strong>112</strong>&apos;yi arayın.
        </p>
      </div>
    </aside>
  );
}
