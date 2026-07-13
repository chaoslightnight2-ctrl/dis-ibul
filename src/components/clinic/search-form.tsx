import { Search } from "lucide-react";
import { treatments } from "@/data/clinics";

export function SearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/arama" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Hangi tedaviyi arıyorsunuz?
        <select name="treatment" className="rounded-md border border-slate-300 px-3 py-3 text-slate-950">
          <option value="">Tüm tedaviler</option>
          {treatments.map((treatment) => <option key={treatment}>{treatment}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Şehir
        <select name="city" className="rounded-md border border-slate-300 px-3 py-3 text-slate-950">
          <option value="">Tüm şehirler</option>
          <option>İstanbul</option>
          <option>Ankara</option>
          <option>İzmir</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Maksimum fiyat
        <input name="maxPrice" inputMode="numeric" placeholder="Örn. 20000" className="rounded-md border border-slate-300 px-3 py-3 text-slate-950" />
      </label>
      <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 md:self-end" type="submit">
        <Search className="h-4 w-4" /> {compact ? "Ara" : "Klinik ara"}
      </button>
    </form>
  );
}
