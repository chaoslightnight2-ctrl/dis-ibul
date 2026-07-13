import { ClinicCard } from "@/components/clinic/clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { GoogleSourceNotice } from "@/components/ui/notice";
import { clinicSearchSchema } from "@/domain/validation";
import { searchClinics } from "@/services/search/clinic-search";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters = clinicSearchSchema.parse({
    q: first(params.q),
    city: first(params.city),
    district: first(params.district),
    treatment: first(params.treatment),
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    minGoogleRating: first(params.minGoogleRating),
    verifiedOnly: first(params.verifiedOnly),
    openNow: first(params.openNow),
    freeInitialExam: first(params.freeInitialExam),
    maxExamFee: first(params.maxExamFee),
    sort: first(params.sort),
  });
  const results = searchClinics(filters);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Klinik arama</h1>
        <p className="mt-1 text-sm text-slate-600">Şehir, tedavi, fiyat ve Google puanı filtreleri.</p>
        <form className="mt-4 grid gap-3">
          <input name="q" defaultValue={filters.q} placeholder="Klinik, doktor veya işlem" className="rounded-md border border-slate-300 px-3 py-2" />
          <select name="city" defaultValue={filters.city} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">Tüm şehirler</option>
            <option>İstanbul</option>
            <option>Ankara</option>
            <option>İzmir</option>
          </select>
          <input name="treatment" defaultValue={filters.treatment} placeholder="Tedavi" className="rounded-md border border-slate-300 px-3 py-2" />
          <input name="maxPrice" defaultValue={filters.maxPrice} placeholder="Maks. fiyat" className="rounded-md border border-slate-300 px-3 py-2" />
          <input name="maxExamFee" defaultValue={filters.maxExamFee} placeholder="Maks. ilk muayene ücreti" className="rounded-md border border-slate-300 px-3 py-2" />
          <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-700">
            <input name="freeInitialExam" value="true" type="checkbox" defaultChecked={filters.freeInitialExam} />
            Ücretsiz ilk muayene
          </label>
          <select name="minGoogleRating" defaultValue={filters.minGoogleRating} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">Google puanı</option>
            <option value="4">4,0+</option>
            <option value="4.5">4,5+</option>
            <option value="4.8">4,8+</option>
          </select>
          <select name="sort" defaultValue={filters.sort ?? "recommended"} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="recommended">Önerilen</option>
            <option value="nearest">Konuma en yakın</option>
            <option value="rating">En yüksek Google puanı</option>
            <option value="reviews">En fazla Google yorumu</option>
            <option value="lowest-price">En düşük fiyat</option>
            <option value="soonest">En yakın randevu</option>
          </select>
          <button className="rounded-md bg-blue-700 px-3 py-2 font-semibold text-white">Filtrele</button>
        </form>
        <div className="mt-4"><GoogleSourceNotice /></div>
      </aside>
      <section className="space-y-4">
        <SearchForm compact />
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">{results.length} klinik listeleniyor.</p>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">Harita görünümü için PostGIS katmanı hazır</div>
        </div>
        {results.length ? results.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="font-semibold text-slate-950">Sonuç bulunamadı</h2>
            <p className="mt-2 text-sm text-slate-600">Filtreleri genişletin veya farklı bir şehir deneyin.</p>
          </div>
        )}
      </section>
    </main>
  );
}
