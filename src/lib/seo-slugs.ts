import { CITIES } from './cities';
import type { ProfessionalType } from '@/types/database';

// ─────────────────────────────────────────────────────────────────────────────
// Turkish URL slug → ProfessionalType
// ─────────────────────────────────────────────────────────────────────────────
export const PROF_TYPE_SLUG_MAP: Record<string, ProfessionalType> = {
  'psikolog':             'psychologist',
  'klinik-psikolog':      'clinical_psychologist',
  'psikiyatrist':         'psychiatrist',
  'aile-terapisti':       'family_therapist',
  'psikolojik-danisan':   'counselor',
};

export const PROF_TYPE_TR: Record<ProfessionalType, string> = {
  psychologist:          'Psikolog',
  clinical_psychologist: 'Klinik Psikolog',
  psychiatrist:          'Psikiyatrist',
  family_therapist:      'Aile Terapisti',
  counselor:             'Psikolojik Danisман',
};

export const PROF_TYPE_EN: Record<ProfessionalType, string> = {
  psychologist:          'Psychologist',
  clinical_psychologist: 'Clinical Psychologist',
  psychiatrist:          'Psychiatrist',
  family_therapist:      'Family Therapist',
  counselor:             'Counselor',
};

// ─────────────────────────────────────────────────────────────────────────────
// Parsed page types
// ─────────────────────────────────────────────────────────────────────────────
export type SeoPage =
  | { kind: 'city-proftype'; citySlug: string; cityName: string; profType: ProfessionalType }
  | { kind: 'online' }
  | { kind: 'specialty'; specialtySlug: string };

export function parseSeoSlug(slug: string): SeoPage | null {
  // 1. Online therapy landing
  if (slug === 'online-terapi') return { kind: 'online' };

  // 2. {city}-{proftype-slug}
  for (const city of CITIES) {
    for (const [ptSlug, profType] of Object.entries(PROF_TYPE_SLUG_MAP)) {
      if (slug === city.slug + '-' + ptSlug) {
        return {
          kind: 'city-proftype',
          citySlug: city.slug,
          cityName: city.name,
          profType,
        };
      }
    }
  }

  // 3. Specialty: strip common Turkish suffixes, longer first
  const specialtySlug = slug.endsWith('-terapisti')
    ? slug.slice(0, -10)   // "aile-terapisti"  → "aile"
    : slug.endsWith('-terapisi')
    ? slug.slice(0, -9)    // "emdr-terapisi"   → "emdr"
    : slug.endsWith('-uzmani')
    ? slug.slice(0, -7)    // "travma-uzmani"   → "travma"
    : slug;

  return { kind: 'specialty', specialtySlug };
}

// Pre-known slugs for generateStaticParams (specialty slugs are DB-driven, handled separately)
export function getKnownSeoSlugs(): string[] {
  const slugs: string[] = ['online-terapi'];
  for (const city of CITIES) {
    for (const ptSlug of Object.keys(PROF_TYPE_SLUG_MAP)) {
      slugs.push(city.slug + '-' + ptSlug);
    }
  }
  return slugs;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO copy factory
// ─────────────────────────────────────────────────────────────────────────────
export type SeoContent = {
  h1: string;
  intro: string;
  metaTitle: string;
  metaDesc: string;
  faqs: { q: string; a: string }[];
};

export function getCityProfTypeContent(
  cityName: string,
  profType: ProfessionalType,
  locale: string,
): SeoContent {
  const labelTR = PROF_TYPE_TR[profType];
  const labelEN = PROF_TYPE_EN[profType];
  const labelLower = labelTR.toLowerCase();

  if (locale === 'tr') {
    return {
      h1: cityName + ' ' + labelTR,
      intro: cityName + "'da uzman bir " + labelLower + " ariyorsaniz dogru yerdesiniz. Terapimap uzerinde " + cityName + "'in farkli ilcelerinde hizmet veren, alaninda deneyimli " + labelLower + "leri inceleyebilir, uzmanlik alanlarini ve seans ucretlerini karsilastiabilirsiniz. Cevrimici veya yuz yuze gorusme secenegine gore filtreleyerek size en uygun uzmani bulun.",
      metaTitle: cityName + ' ' + labelTR + ' | ' + cityName + "'da " + labelTR + ' Ara — Terapimap',
      metaDesc: cityName + "'da uzman " + labelLower + "leri inceleyin. Uzmanlik alani, seans ucreti ve gorusme turune gore filtreleyin. Terapimap'ta " + cityName + ' ' + labelLower + ' listesi.',
      faqs: [
        {
          q: cityName + "'da psikolog/terapist ucreti ne kadar?",
          a: cityName + "'da seans ucretleri uzmanin deneyimine ve uzmanlik alanina gore farklilik gosterir. Terapimap'ta her uzmanin profilinde ucret araligini gorebilirsiniz.",
        },
        {
          q: cityName + "'da nasil psikolog bulunur?",
          a: "Terapimap'ta sehir, uzmanlik alani ve gorusme turu (yuz yuze / cevrimici) filtrelerini kullanarak " + cityName + "'daki uzmanlari kolayca listeleyebilirsiniz.",
        },
        {
          q: cityName + "'da online seans secenegi var mi?",
          a: "Evet, " + cityName + "'daki bircok uzman video veya telefon araciligiyla cevrimici seans sunmaktadir. Filtreden 'Sadece cevrimici gorusen' secenegini etkinlestirerek bu uzmanlara ulasabilirsiniz.",
        },
        {
          q: 'Ilk terapi seansi nasil olur?',
          a: 'Ilk seans genellikle bir tanisma ve degerlendirme seansidir. Terapist sizinle sorunlarinizi, beklentilerinizi ve hedeflerinizi konusur. Seans ortalama 50-60 dakika surer.',
        },
      ],
    };
  }

  return {
    h1: labelEN + ' in ' + cityName,
    intro: 'Looking for a ' + labelEN.toLowerCase() + ' in ' + cityName + '? Browse verified specialists on Terapimap, compare their specialties and fees, and filter by in-person or online sessions to find the right match.',
    metaTitle: labelEN + ' in ' + cityName + ' | Find a ' + labelEN + ' — Terapimap',
    metaDesc: 'Browse the best ' + labelEN.toLowerCase() + 's in ' + cityName + '. Filter by specialty, session fee and session type. Terapimap.',
    faqs: [
      {
        q: 'How much does a therapist cost in ' + cityName + '?',
        a: 'Fees in ' + cityName + ' vary by experience and specialty. You can see the fee range on each therapist profile page on Terapimap.',
      },
      {
        q: 'How do I find a therapist in ' + cityName + '?',
        a: "Use Terapimap's city, specialty and session-type filters to browse " + labelEN.toLowerCase() + 's in ' + cityName + '.',
      },
      {
        q: 'Are there online therapists in ' + cityName + '?',
        a: 'Yes — many therapists in ' + cityName + ' offer video or phone sessions. Enable the "Online sessions only" filter to find them.',
      },
      {
        q: 'What happens in the first therapy session?',
        a: 'The first session is typically an intake — your therapist discusses your concerns, expectations and goals. It usually lasts 50-60 minutes.',
      },
    ],
  };
}

export function getOnlineContent(locale: string): SeoContent {
  if (locale === 'tr') {
    return {
      h1: 'Online Terapi',
      intro: 'Online terapi, nerede olursaniz olun profesyonel psikolojik destek almanizi saglar. Video gorusme ya da telefon araciligiyla Turkiye genelinde uzman psikolog, klinik psikolog ve psikoterapistlerle baglanti kurabilirsiniz. Terapimap cevrimici gorusme sunan uzmanlari kesfetmenizi saglar.',
      metaTitle: 'Online Terapi | Cevrimici Psikolog ve Terapist Ara — Terapimap',
      metaDesc: 'Online terapi icin Turkiye genelinde psikolog ve terapistleri inceleyin. Video ve telefon gorusmesi sunan uzmanlari kolayca bulun. Terapimap.',
      faqs: [
        {
          q: 'Online terapi guvenli mi?',
          a: 'Evet. Guvenli platformlar uzerinden yurutulen online terapi, yuz yuze terapiyle ayni etik ve gizlilik standartlarina tabidir. Tum terapistler lisansli uzmanlardir.',
        },
        {
          q: 'Online terapi yuz yuze terapi kadar etkili midir?',
          a: 'Arastirmalar, basta anksiyete ve depresyon olmak uzere bircok sorunda online terapinin yuz yuze terapi kadar etkili oldugunu gostermektedir.',
        },
        {
          q: 'Online terapi seans ucreti ne kadar?',
          a: 'Seans ucretleri terapistin deneyimine ve uzmanlik alanina gore farklilasar. Her uzmanin profil sayfasinda ucret araligini gorebilirsiniz.',
        },
        {
          q: 'Online terapi seanslari nasil yapilir?',
          a: 'Cogu terapist Zoom, Google Meet ya da kendi guvenli platformlari uzerinden seans yapmaktadir. Baslamadan once terapistinizle kullanilacak platformu konusabilirsiniz.',
        },
      ],
    };
  }

  return {
    h1: 'Online Therapy',
    intro: 'Online therapy connects you with a licensed mental health professional wherever you are. Browse psychologists, clinical psychologists and therapists across Turkey who offer video and phone sessions on Terapimap.',
    metaTitle: 'Online Therapy | Find an Online Therapist — Terapimap',
    metaDesc: 'Find the best online therapists in Turkey. Browse psychologists and therapists offering video and phone sessions. Terapimap.',
    faqs: [
      {
        q: 'Is online therapy safe?',
        a: 'Yes. Online therapy follows the same ethical and confidentiality standards as in-person therapy. All therapists are licensed professionals.',
      },
      {
        q: 'Is online therapy as effective as in-person therapy?',
        a: 'Research shows online therapy is as effective as in-person therapy for many conditions, including anxiety and depression.',
      },
      {
        q: 'How much does online therapy cost?',
        a: "Fees vary by therapist experience and specialty. You can see the fee range on each therapist's profile page on Terapimap.",
      },
      {
        q: 'How do online therapy sessions work?',
        a: "Most therapists use secure video conferencing platforms. You'll discuss the platform with your therapist before getting started.",
      },
    ],
  };
}

export function getSpecialtyContent(
  specialtyName: string,
  locale: string,
): SeoContent {
  if (locale === 'tr') {
    return {
      h1: specialtyName + ' Uzmanlari',
      intro: specialtyName + ' alaninda uzmanlasmis psikolog ve terapistleri Terapimap uzerinde bulabilirsiniz. Sehir, gorusme turu ve diger filtreler ile size en uygun uzmani kesfedin. Hem yuz yuze hem de cevrimici gorusme secenekleri mevcuttur.',
      metaTitle: specialtyName + ' Uzmani Terapist | ' + specialtyName + ' Terapisti Ara — Terapimap',
      metaDesc: specialtyName + ' uzmani psikolog ve terapistleri inceleyin. Sehir ve gorusme turune gore filtreleyin. Terapimap.',
      faqs: [
        {
          q: specialtyName + ' terapisi nedir?',
          a: specialtyName + ', profesyonel bir terapistle yurutulen, belirli psikolojik sorunlari ele alan terapotik bir yaklasimdir. Uygulanan teknikler ve surec, terapistin egitimine gore farklilik gosterebilir.',
        },
        {
          q: specialtyName + ' terapisi kimler icin uygundur?',
          a: specialtyName + ' terapisi bu alanda destek almak isteyen herkes icin uygundur. Uygulunlugu degerlendirmek icin uzmanla bir tanisma seansi yapmaniz onerilir.',
        },
        {
          q: specialtyName + ' seans sureci nasil isler?',
          a: 'Ilk seans degerlendirme icerir; terapist size ve ihtiyaclariniza uygun bir terapi plani olusturur. Seans sikligi ve suresi terapisten terapiste degisir.',
        },
        {
          q: specialtyName + ' icin nasil terapist secilir?',
          a: "Terapimap'ta uzmanlik alani filtresini kullanarak " + specialtyName + ' alaninda deneyimli terapistleri bulabilir, sehir ve gorusme turune gore daha da daraltabilirsiniz.',
        },
      ],
    };
  }

  return {
    h1: specialtyName + ' Specialists',
    intro: 'Find psychologists and therapists specialising in ' + specialtyName + ' on Terapimap. Filter by city, session type and more to discover the right specialist for you — both in-person and online sessions available.',
    metaTitle: specialtyName + ' Therapist | Find a ' + specialtyName + ' Specialist — Terapimap',
    metaDesc: 'Browse ' + specialtyName + ' specialists and therapists. Filter by city and session type. Terapimap.',
    faqs: [
      {
        q: 'What is ' + specialtyName + ' therapy?',
        a: specialtyName + ' is a therapeutic approach that addresses specific psychological challenges under the guidance of a trained specialist. Techniques and duration vary by therapist.',
      },
      {
        q: 'Who is ' + specialtyName + ' therapy for?',
        a: 'Anyone seeking support in this area. An initial consultation can help determine if it is the right fit for your needs.',
      },
      {
        q: 'What does the ' + specialtyName + ' process look like?',
        a: 'The first session is an intake assessment. Your therapist then creates a personalised plan. Session frequency and duration vary.',
      },
      {
        q: 'How do I find a ' + specialtyName + ' therapist?',
        a: "Use Terapimap's specialty filter to find therapists with expertise in " + specialtyName + ', then narrow by city and session type.',
      },
    ],
  };
}
