"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "./ui/Select";
import { CITIES } from "@/lib/cities";
import type { Specialty } from "@/types/database";

const PROF_TYPE_OPTIONS = {
  tr: [
    { value: "psychologist", label: "Psikolog" },
    { value: "clinical_psychologist", label: "Klinik Psikolog" },
    { value: "psychiatrist", label: "Psikiyatrist" },
    { value: "family_therapist", label: "Aile Terapisti" },
    { value: "counselor", label: "Psikolojik Danissman" },
  ],
  en: [
    { value: "psychologist", label: "Psychologist" },
    { value: "clinical_psychologist", label: "Clinical Psychologist" },
    { value: "psychiatrist", label: "Psychiatrist" },
    { value: "family_therapist", label: "Family Therapist" },
    { value: "counselor", label: "Counselor" },
  ],
} as const;

export default function Filters({
  locale,
  specialties,
  districts,
  selectedCity,
  selectedSpecialty,
}: {
  locale: string;
  specialties: Specialty[];
  districts: string[];
  selectedCity?: string;
  selectedSpecialty?: string;
}) {
  const t = useTranslations("filters");
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [mobileOpen, setMobileOpen] = useState(false);

  const online = params.get("online") === "1";
  const inPerson = params.get("inPerson") === "1";
  const selectedDistrict = params.get("district") ?? "";
  const selectedType = params.get("type") ?? "";

  const profTypeOptions =
    locale === "tr" ? PROF_TYPE_OPTIONS.tr : PROF_TYPE_OPTIONS.en;

  const activeCount = [
    selectedCity,
    selectedSpecialty,
    selectedDistrict,
    selectedType,
    online ? "1" : "",
    inPerson ? "1" : "",
  ].filter(Boolean).length;
  const hasActive = activeCount > 0;

  function buildUrl({
    city,
    specialty,
    district,
    type,
    isOnline,
    isInPerson,
  }: {
    city?: string;
    specialty?: string;
    district?: string;
    type?: string;
    isOnline?: boolean;
    isInPerson?: boolean;
  }) {
    // City ve specialty → clean path: /therapists/istanbul/anksiyete
    let base = "/" + locale + "/therapists";
    if (city) base += "/" + city;
    if (city && specialty) base += "/" + specialty;

    // Geri kalan filtreler query param olarak kalır
    const qs = new URLSearchParams();
    if (!city && specialty) qs.set("specialty", specialty);
    if (district) qs.set("district", district);
    if (type) qs.set("type", type);
    if (isOnline) qs.set("online", "1");
    if (isInPerson) qs.set("inPerson", "1");
    const search = qs.toString();
    return search ? base + "?" + search : base;
  }

  function nav(overrides: {
    city?: string;
    specialty?: string;
    district?: string;
    type?: string;
    isOnline?: boolean;
    isInPerson?: boolean;
  }) {
    startTransition(() =>
      router.push(
        buildUrl({
          city: selectedCity,
          specialty: selectedSpecialty,
          district: selectedDistrict || undefined,
          type: selectedType || undefined,
          isOnline: online,
          isInPerson: inPerson,
          ...overrides,
        }),
      ),
    );
  }

  function handleCityChange(newCity: string) {
    nav({ city: newCity || undefined, district: undefined });
  }

  return (
    <aside className="rounded-2xl border border-brand-100 bg-white shadow-soft">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="filter-body"
        className="flex w-full items-center justify-between p-4 text-left md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          {t("title")}
          {hasActive && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={
            "h-4 w-4 text-brand-400 transition-transform duration-200" +
            (mobileOpen ? " rotate-180" : "")
          }
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Desktop header */}
      <div className="hidden p-5 pb-0 md:block">
        <h3 className="text-sm font-semibold text-brand-900">{t("title")}</h3>
      </div>

      {/* Controls */}
      <div
        id="filter-body"
        className={
          "px-4 pb-4 md:mt-4 md:block md:px-5 md:pb-5" +
          (mobileOpen ? " block" : " hidden")
        }
      >
        <div className="space-y-4">

          {/* City */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t("city")}
            </label>
            <Select
              value={selectedCity ?? ""}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">{t("all")}</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* District — only when city is selected and has data */}
          {selectedCity && districts.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-700">
                {t("district")}
              </label>
              <Select
                value={selectedDistrict}
                onChange={(e) =>
                  nav({ district: e.target.value || undefined })
                }
              >
                <option value="">{t("all")}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Specialty */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t("specialty")}
            </label>
            <Select
              value={selectedSpecialty ?? ""}
              onChange={(e) =>
                nav({ specialty: e.target.value || undefined })
              }
            >
              <option value="">{t("all")}</option>
              {specialties.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Professional type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t("professionalType")}
            </label>
            <Select
              value={selectedType}
              onChange={(e) =>
                nav({ type: e.target.value || undefined })
              }
            >
              <option value="">{t("all")}</option>
              {profTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Online only */}
          <label className="flex items-center gap-2 text-sm text-brand-800">
            <input
              type="checkbox"
              checked={online}
              onChange={(e) => nav({ isOnline: e.target.checked })}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
            />
            {t("online")}
          </label>

          {/* In-person only */}
          <label className="flex items-center gap-2 text-sm text-brand-800">
            <input
              type="checkbox"
              checked={inPerson}
              onChange={(e) => nav({ isInPerson: e.target.checked })}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
            />
            {t("inPerson")}
          </label>

          {/* Clear all */}
          {hasActive && (
            <button
              onClick={() =>
                startTransition(() =>
                  router.push("/" + locale + "/therapists"),
                )
              }
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-3.5 w-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
              </svg>
              {t("clear")}
              {activeCount > 1 && (
                <span className="ml-0.5 text-brand-400">({activeCount})</span>
              )}
            </button>
          )}

        </div>
      </div>
    </aside>
  );
}
