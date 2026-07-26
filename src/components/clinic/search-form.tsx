import Link from "next/link";
import { Search } from "lucide-react";
import { popularTreatments as treatmentSuggestions } from "@/config/treatments";
import { turkeyCities } from "@/config/turkey-cities";

type SearchFormProps = {
  compact?: boolean;
  initialValues?: {
    q?: string;
    city?: string;
  };
};

export function SearchForm({ compact = false, initialValues }: SearchFormProps) {
  const popularTreatments = treatmentSuggestions.slice(0, compact ? 4 : 8);
  const cityQuery = initialValues?.city ? `&city=${encodeURIComponent(initialValues.city)}` : "";

  return (
    <form action="/arama" className="relative grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className={`grid gap-3 ${compact ? "md:grid-cols-[1fr_1fr_auto]" : "md:grid-cols-[1.4fr_1fr_auto]"}`}>
        <div className="group relative grid gap-1 text-sm font-medium text-slate-700">
          <label htmlFor={compact ? "compact-clinic-query" : "clinic-query"}>Ne arıyorsunuz?</label>
          <input
            id={compact ? "compact-clinic-query" : "clinic-query"}
            name="q"
            defaultValue={initialValues?.q}
            placeholder="Tedavi, klinik veya doktor adı"
            className="rounded-md border border-blue-200 px-3 py-3 text-slate-950"
          />
          <div
            aria-label="En sık arananlar"
            className="invisible absolute left-0 top-full z-20 mt-2 w-full rounded-lg border border-blue-100 bg-white p-3 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 md:w-[36rem]"
          >
            <p className="px-1 text-xs font-semibold uppercase text-slate-500">En sık arananlar</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {popularTreatments.map((treatment) => (
                <Link
                  key={treatment}
                  href={`/arama?treatment=${encodeURIComponent(treatment)}${cityQuery}`}
                  className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-950 hover:border-blue-300"
                >
                  {treatment}
                  <Search className="h-4 w-4 shrink-0 text-blue-700" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Nerede?
          <select name="city" defaultValue={initialValues?.city ?? ""} className="rounded-md border border-blue-200 px-3 py-3 text-slate-950">
            <option value="">Tüm şehirler</option>
            {turkeyCities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 md:self-end" type="submit">
          <Search className="h-4 w-4" /> {compact ? "Ara" : "Klinik ara"}
        </button>
      </div>
    </form>
  );
}
