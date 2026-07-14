"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { treatments } from "@/data/clinics";

export function SearchForm({ compact = false }: { compact?: boolean }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const popularTreatments = treatments.slice(0, compact ? 4 : 8);

  return (
    <form action="/arama" className="relative grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className={`grid gap-3 ${compact ? "md:grid-cols-[1fr_1fr_auto]" : "md:grid-cols-[1.4fr_1fr_1fr_auto]"}`}>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Ne arıyorsunuz?
          <input
            name="q"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 160)}
            placeholder="Tedavi, klinik veya doktor adı"
            className="rounded-md border border-blue-200 px-3 py-3 text-slate-950"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Nerede?
          <select name="city" className="rounded-md border border-blue-200 px-3 py-3 text-slate-950">
            <option value="">Tüm şehirler</option>
            <option>İstanbul</option>
            <option>Ankara</option>
            <option>İzmir</option>
          </select>
        </label>
        {!compact ? (
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Bütçe sınırı
            <input name="maxPrice" inputMode="numeric" placeholder="Örn. 20000" className="rounded-md border border-blue-200 px-3 py-3 text-slate-950" />
          </label>
        ) : null}
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 md:self-end" type="submit">
          <Search className="h-4 w-4" /> {compact ? "Ara" : "Klinik ara"}
        </button>
      </div>

      {showSuggestions ? (
        <div className="absolute left-4 right-4 top-[92px] z-10 rounded-lg border border-blue-100 bg-white p-3 shadow-lg md:top-[88px]">
          <p className="px-1 text-xs font-semibold uppercase text-slate-500">En sık arananlar</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {popularTreatments.map((treatment) => (
              <Link
                key={treatment}
                href={`/arama?treatment=${encodeURIComponent(treatment)}`}
                className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-950 hover:border-blue-300"
              >
                {treatment}
                <Search className="h-4 w-4 text-blue-700" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <label className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
            <input name="freeInitialExam" value="true" type="checkbox" />
            Ücretsiz ilk muayene
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800">
            <input name="openNow" value="true" type="checkbox" />
            Şu an açık
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800">
            <input name="verifiedOnly" value="true" type="checkbox" />
            Doğrulanmış klinikler
          </label>
        </div>
      ) : null}
    </form>
  );
}
