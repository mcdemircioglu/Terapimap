"""
Terapimap — CSV → Supabase import scripti
==========================================
Kullanım:
  1. pip install supabase python-dotenv
  2. .env dosyasına koy:
       SUPABASE_URL=https://xxxx.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=eyJ...
  3. python scripts/import_professionals.py professionals.csv

Not: 'status' ve 'is_verified' kolonlarının tabloda mevcut olması gerekiyor.
     Önce supabase/add_status_verified.sql dosyasını Supabase SQL Editor'da çalıştır.
"""

import csv
import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Proje kökündeki .env.local'ı bul (script hangi dizinden çalıştırılırsa çalıştırılsın)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_root, ".env.local"))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Hata: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY eksik.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Specialty: CSV display adı → (slug, name_tr, name_en) ───────────────────
SPECIALTY_MAP: dict[str, tuple[str, str, str]] = {
    "Anksiyete":                      ("anksiyete",          "Anksiyete",                    "Anxiety"),
    "Depresyon":                      ("depresyon",           "Depresyon",                    "Depression"),
    "Çift Terapisi":                  ("cift-terapisi",       "Çift Terapisi",                "Couples Therapy"),
    "Aile Terapisi":                  ("aile-terapisi",       "Aile Terapisi",                "Family Therapy"),
    "Travma ve TSSB":                 ("travma-tssb",         "Travma ve TSSB",               "Trauma & PTSD"),
    "EMDR":                           ("emdr",                "EMDR",                         "EMDR"),
    "Çocuk ve Ergen Terapisi":        ("cocuk-ergen",         "Çocuk ve Ergen Terapisi",      "Child & Adolescent Therapy"),
    "Bilişsel Davranışçı Terapi":     ("bdt",                 "Bilişsel Davranışçı Terapi",   "CBT"),
    "Şema Terapi":                    ("sema-terapi",         "Şema Terapi",                  "Schema Therapy"),
    "Oyun Terapisi":                  ("oyun-terapisi",       "Oyun Terapisi",                "Play Therapy"),
    "Cinsel Terapi":                  ("cinsel-terapi",       "Cinsel Terapi",                "Sex Therapy"),
    "Bağımlılık":                     ("bagimlilik",          "Bağımlılık",                   "Addiction"),
    "Yas Danışmanlığı":               ("yas-danismanlik",     "Yas Danışmanlığı",             "Grief Counseling"),
    "Obsesif Kompulsif Bozukluk":     ("okb",                 "Obsesif Kompulsif Bozukluk",   "OCD"),
    "Gestalt Terapi":                 ("gestalt",             "Gestalt Terapi",               "Gestalt Therapy"),
    "Mindfulness":                    ("mindfulness",         "Mindfulness",                  "Mindfulness"),
    "Sanat Terapisi":                 ("sanat-terapisi",      "Sanat Terapisi",               "Art Therapy"),
    "Panik Bozukluk":                 ("panik-bozukluk",      "Panik Bozukluk",               "Panic Disorder"),
    "Sosyal Fobi":                    ("sosyal-fobi",         "Sosyal Fobi",                  "Social Phobia"),
    "Kişilik Bozukluğu":              ("kisilik-bozuklugu",   "Kişilik Bozukluğu",            "Personality Disorder"),
    "Bipolar Bozukluk":               ("bipolar",             "Bipolar Bozukluk",             "Bipolar Disorder"),
    "Yeme Bozukluğu":                 ("yeme-bozuklugu",      "Yeme Bozukluğu",               "Eating Disorder"),
    "DEHB":                           ("dehb",                "DEHB",                         "ADHD"),
    "Otizm Spektrum Bozukluğu":       ("otizm",               "Otizm Spektrum Bozukluğu",     "Autism Spectrum"),
    "İlişki Sorunları":               ("iliski-sorunlari",    "İlişki Sorunları",             "Relationship Issues"),
    "Özgüven ve Kişisel Gelişim":     ("ozguven",             "Özgüven ve Kişisel Gelişim",   "Self-esteem"),
    "Fobiler":                        ("fobiler",             "Fobiler",                       "Phobias"),
    "Dikkat Eksikliği ve ADHD":       ("dehb",                "DEHB",                          "ADHD"),
    "Psikanalitik Terapi":            ("psikanalitik",        "Psikanalitik Terapi",           "Psychoanalytic Therapy"),
    "Nöropsikiyatri":                 ("noropsikiyatri",      "Nöropsikiyatri",                "Neuropsychiatry"),
    "Psikiyatri":                     ("psikiyatri",          "Psikiyatri",                    "Psychiatry"),
    "Ergen Terapisi":                 ("cocuk-ergen",         "Çocuk ve Ergen Terapisi",       "Child & Adolescent Therapy"),
    "Çocuk Terapisi":                 ("cocuk-ergen",         "Çocuk ve Ergen Terapisi",       "Child & Adolescent Therapy"),
    "Stres Yönetimi":                 ("stres-yonetimi",      "Stres Yönetimi",                "Stress Management"),
    "Uyku Bozukluğu":                 ("uyku-bozuklugu",      "Uyku Bozukluğu",                "Sleep Disorder"),
    "Öfke Kontrolü":                  ("ofke-kontrolu",       "Öfke Kontrolü",                 "Anger Management"),
    "Cinsellik ve Cinsel Sağlık":     ("cinsel-terapi",       "Cinsel Terapi",                 "Sex Therapy"),
    "Travma":                         ("travma-tssb",         "Travma ve TSSB",                "Trauma & PTSD"),
    "Kaygı Bozukluğu":                ("anksiyete",           "Anksiyete",                     "Anxiety"),
}

# ─── professional_type Türkçe → İngilizce ────────────────────────────────────
PROF_TYPE_MAP: dict[str, str] = {
    "Psikolog":            "psychologist",
    "Uzman Psikolog":      "psychologist",
    "Klinik Psikolog":     "clinical_psychologist",
    "Uzman Klinik Psikolog": "clinical_psychologist",
    "Psikiyatrist":        "psychiatrist",
    "Psikoterapist":       "psychologist",
    "Danışman":            "counselor",
    "Aile Terapisti":      "family_therapist",
    "Aile Danışmanı":      "family_therapist",
}

# ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

def slugify_city(city: str) -> str:
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    return city.translate(tr).lower().strip().replace(" ", "-")


def parse_specialties(raw: str) -> list[str]:
    if not raw or not raw.strip():
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]


def bool_val(v: str) -> bool:
    return str(v).strip().lower() in ("true", "1", "yes", "evet")


# ─── Adım 1: Tüm specialty'leri upsert et, slug→id map döndür ────────────────

def ensure_specialties(all_names: set[str]) -> dict[str, str]:
    """Specialties tablosuna eksik olanları ekle, display_name → id map döndür."""
    # Önce mevcut specialty'leri çek
    existing = supabase.table("specialties").select("id,name,slug").execute()
    existing_by_name = {row["name"]: row["id"] for row in existing.data}
    existing_by_slug = {row["slug"]: row["id"] for row in existing.data}

    # Eksik olanları tek tek insert et (duplicate'ten kaçınmak için)
    for spec_name in all_names:
        if spec_name not in SPECIALTY_MAP:
            continue
        slug, name_tr, _ = SPECIALTY_MAP[spec_name]
        if name_tr in existing_by_name or slug in existing_by_slug:
            continue  # zaten var
        try:
            result = supabase.table("specialties").insert({"slug": slug, "name": name_tr}).execute()
            if result.data:
                existing_by_name[name_tr] = result.data[0]["id"]
        except Exception as e:
            print(f"  WARN specialty insert '{name_tr}': {e}")

    # Güncel listeyi tekrar çek
    result = supabase.table("specialties").select("id,name").execute()
    return {row["name"]: row["id"] for row in result.data}


# ─── Adım 2: Ana import ───────────────────────────────────────────────────────

def import_professionals(csv_path: str) -> None:
    # utf-8-sig: BOM karakterini otomatik atar (Excel CSV'leri için)
    for enc in ("utf-8-sig", "utf-8", "cp1254"):
        try:
            with open(csv_path, newline="", encoding=enc) as f:
                sample = f.read(4096)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
            with open(csv_path, newline="", encoding=enc) as f:
                rows = list(csv.DictReader(f, dialect=dialect))
            if rows and "slug" in rows[0]:
                print(f"CSV encoding: {enc}, delimiter: '{dialect.delimiter}'")
                break
        except Exception:
            continue
    else:
        print("Hata: CSV okunamadı.")
        sys.exit(1)

    print(f"Toplam {len(rows)} satır bulundu.")

    # Tüm specialty isimlerini topla
    all_spec_names: set[str] = set()
    for row in rows:
        all_spec_names.update(parse_specialties(row.get("normalized_specialties", "")))

    specialty_id_map = ensure_specialties(all_spec_names)
    print(f"Specialty hazır: {len(specialty_id_map)} adet\n")

    success, errors = 0, 0

    for row in rows:
        slug = row.get("slug", "").strip()
        if not slug:
            print(f"  SKIP satır {row.get('source_row')}: slug boş")
            errors += 1
            continue

        city = row.get("city", "").strip()

        prof_data = {
            "slug":              slug,
            "name":              row.get("name", "").strip(),
            "title":             row.get("title", "").strip() or None,
            "professional_type": PROF_TYPE_MAP.get(
                                     row.get("professional_type", "").strip(),
                                     "psychologist"
                                 ),
            "clinic_name":       row.get("clinic_name", "").strip() or None,
            "city":              city,
            "district":          row.get("district", "").strip() or None,
            "is_online":         bool_val(row.get("is_online", "false")),
            "is_in_person":      bool_val(row.get("is_in_person", "true")),
            "about":             row.get("about", "").strip() or None,
            "phone":             row.get("phone", "").strip() or None,
            "website_url":       row.get("website_url", "").strip() or None,
            "email":             row.get("email", "").strip() or None,
            "source_url":        row.get("source_url", "").strip() or None,
            "image_url":         None,
            "is_featured":       False,
            "is_verified":       False,
            "status":            "pending",
        }

        try:
            result = supabase.table("professionals").upsert(
                prof_data, on_conflict="slug"
            ).execute()

            if not result.data:
                print(f"  ERROR satır {row.get('source_row')}: upsert veri dönmedi")
                errors += 1
                continue

            prof_id = result.data[0]["id"]

            # Specialty join kayıtları
            spec_names = parse_specialties(row.get("normalized_specialties", ""))
            spec_links = []
            for name in spec_names:
                spec_id = specialty_id_map.get(name)
                if spec_id:
                    spec_links.append({
                        "professional_id": prof_id,
                        "specialty_id":    spec_id,
                    })
                else:
                    print(f"  WARN slug={slug}: specialty bulunamadı → '{name}'")

            if spec_links:
                supabase.table("professional_specialties").upsert(
                    spec_links,
                    on_conflict="professional_id,specialty_id"
                ).execute()

            success += 1
            if success % 50 == 0:
                print(f"  {success}/{len(rows)} tamamlandı...")

        except Exception as e:
            print(f"  ERROR satır {row.get('source_row')} (slug={slug}): {e}")
            errors += 1

    print(f"\n{'='*40}")
    print(f"Tamamlandı: {success} başarılı, {errors} hata.")
    print(f"{'='*40}")


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python import_professionals.py <csv_dosyası>")
        print("Örnek:    python import_professionals.py professionals_full.csv")
        sys.exit(1)

    csv_file = sys.argv[1]
    if not os.path.exists(csv_file):
        print(f"Hata: '{csv_file}' bulunamadı.")
        sys.exit(1)

    import_professionals(csv_file)
