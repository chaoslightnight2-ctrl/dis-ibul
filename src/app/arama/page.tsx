import Link from "next/link";
import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
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
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-blue-950">Klinik bul</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Tedavi, şehir, bütçe ve ilk muayene bilgisini seçin. Sonuç kartlarında randevu ve fiyat teklifi için doğrudan aksiyon alabilirsiniz.
              </p>
            </div>
            <Link href="/panel/hasta" className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Hasta paneline git
            </Link>
          </div>
          <div className="mt-5">
            <SearchForm compact />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[310px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-blue-100 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-blue-950">Filtreleri kolaylaştır</h2>
          </div>
          <form className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Klinik, doktor veya işlem
              <input name="q" defaultValue={filters.q} placeholder="Örn. implant, ortodonti" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Şehir
              <select name="city" defaultValue={filters.city} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                <option value="">Tüm şehirler</option>
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Tedavi
              <input name="treatment" defaultValue={filters.treatment} placeholder="Örn. Tek diş implantı" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Maksimum tedavi fiyatı
                <input name="maxPrice" defaultValue={filters.maxPrice} inputMode="numeric" placeholder="Örn. 20000" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Maksimum ilk muayene
                <input name="maxExamFee" defaultValue={filters.maxExamFee} inputMode="numeric" placeholder="Örn. 500" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
              </label>
            </div>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <input name="freeInitialExam" value="true" type="checkbox" defaultChecked={filters.freeInitialExam} />
                Ücretsiz ilk muayene
              </label>
              <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <input name="verifiedOnly" value="true" type="checkbox" defaultChecked={filters.verifiedOnly} />
                Sadece doğrulanmış klinikler
              </label>
              <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <input name="openNow" value="true" type="checkbox" defaultChecked={filters.openNow} />
                Şu an açık olanlar
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Sıralama
              <select name="sort" defaultValue={filters.sort ?? "recommended"} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                <option value="recommended">Önerilen</option>
                <option value="nearest">Konuma en yakın</option>
                <option value="rating">En yüksek Google puanı</option>
                <option value="reviews">En fazla Google yorumu</option>
                <option value="lowest-price">En düşük fiyat</option>
                <option value="soonest">En yakın randevu</option>
              </select>
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800">
              <Filter className="h-4 w-4" /> Sonuçları güncelle
            </button>
            <Link href="/arama" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <RotateCcw className="h-4 w-4" /> Filtreleri temizle
            </Link>
          </form>
          <div className="mt-4"><GoogleSourceNotice /></div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold text-blue-950">{results.length} klinik bulundu</p>
              <p className="mt-1 text-sm text-slate-600">Karttaki ana butonla randevu isteyebilir, ikinci butonla fiyat teklifi alabilirsiniz.</p>
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Google yorumları dış kaynaktan gösterilir</div>
          </div>
          {results.length ? results.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />) : (
            <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
              <h2 className="font-semibold text-blue-950">Sonuç bulunamadı</h2>
              <p className="mt-2 text-sm text-slate-600">Bütçe sınırını yükseltin, ücretsiz ilk muayene filtresini kapatın veya farklı bir şehir deneyin.</p>
              <Link href="/arama" className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Tüm klinikleri göster</Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
