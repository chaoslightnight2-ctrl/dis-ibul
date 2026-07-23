import Link from "next/link";
import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { GoogleClinicCard } from "@/components/clinic/google-clinic-card";
import { OsmClinicCard } from "@/components/clinic/osm-clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { turkeyCities } from "@/config/turkey-cities";
import { clinicSearchSchema } from "@/domain/validation";
import { searchClinics } from "@/services/search/clinic-search";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const externalStatusMessage = {
  needs_location: "İnternetteki klinikleri aramak için şehir seçin. Ücretsiz servis yalnızca doğrudan kullanıcı aramalarında ve sınırlı bir bölgede çalıştırılır.",
  location_not_found: "Bu şehir veya ilçe OpenStreetMap üzerinde bulunamadı. Yazımı kontrol edip yeniden deneyin.",
  rate_limited: "Ücretsiz harita servisinin kullanım sınırına ulaşıldı. Kısa bir süre sonra yeniden deneyin.",
  unavailable: "OpenStreetMap klinik aramasına şu anda ulaşılamıyor. DişçiBul klinikleri gösterilmeye devam ediyor.",
  skipped: "Kaynak filtresinde yalnızca DişçiBul seçili.",
  ok: "",
} as const;

const googleStatusMessage = {
  not_configured: "Google Places anahtarı yapılandırılmadığı için puan ve yorumlar uygulama içine alınamıyor. Klinik keşfi ücretsiz OpenStreetMap verisiyle devam ediyor; her karttan Google aramasına geçebilirsiniz.",
  rate_limited: "Google Places için belirlenen aylık ücretsiz koruma kotası doldu. Ek ücret oluşmaması için arama OpenStreetMap kaynağına geçirildi.",
  unavailable: "Google Places hizmetine ulaşılamadığı için arama OpenStreetMap kaynağıyla tamamlandı.",
  ok: "",
  skipped: "",
} as const;

export const dynamic = "force-dynamic";

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
    minGoogleReviews: first(params.minGoogleReviews),
    verifiedOnly: first(params.verifiedOnly),
    openNow: first(params.openNow),
    freeInitialExam: first(params.freeInitialExam),
    maxExamFee: first(params.maxExamFee),
    source: first(params.source),
    sort: first(params.sort),
  });
  const results = await searchClinics(filters);
  const total = results.registeredClinics.length + results.googlePlaces.length + results.osmClinics.length;
  const needsInternetLocation = results.externalStatus === "needs_location" && filters.source === "internet";

  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-blue-950">Diş kliniği bul</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                81 ilin tamamında şehir seçerek arayın; DişçiBul kliniklerini fiyat ve randevu bilgileriyle, diğer klinikleri internet kaynaklarıyla inceleyin.
              </p>
            </div>
            <Link href="/panel/hasta" className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Hasta paneline git
            </Link>
          </div>
          <div className="mt-5"><SearchForm compact initialValues={{ q: filters.q, city: filters.city, maxPrice: filters.maxPrice, source: filters.source }} /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[310px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-blue-100 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-blue-950">Sonuçları filtrele</h2>
          </div>
          <form className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Klinik, doktor veya işlem
              <input name="q" defaultValue={filters.q} placeholder="Örn. implant, ortodonti" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Kaynak
              <select name="source" defaultValue={filters.source} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                <option value="all">Tüm klinikler</option>
                <option value="discibul">DişçiBul klinikleri</option>
                <option value="internet">İnternet kaynaklarındaki klinikler</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Şehir
                <select name="city" defaultValue={filters.city ?? ""} required={filters.source === "internet"} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                  <option value="">Tüm DişçiBul şehirleri</option>
                  {turkeyCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                İlçe
                <input name="district" defaultValue={filters.district} placeholder="Örn. Kadıköy" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Tedavi
              <input name="treatment" defaultValue={filters.treatment} placeholder="Örn. implant veya ortodonti" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
            </label>
            <fieldset className="grid gap-3 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-xs font-semibold text-slate-600">Google puanı bulunan klinikler</legend>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                En düşük Google Maps puanı
                <select name="minGoogleRating" defaultValue={filters.minGoogleRating ?? ""} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                  <option value="">Puan fark etmez</option>
                  <option value="4">4,0 ve üzeri</option>
                  <option value="4.5">4,5 ve üzeri</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                En az yorum sayısı
                <input name="minGoogleReviews" defaultValue={filters.minGoogleReviews} inputMode="numeric" placeholder="Örn. 100" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
              </label>
            </fieldset>
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
                <input name="freeInitialExam" value="true" type="checkbox" defaultChecked={filters.freeInitialExam} /> Ücretsiz ilk muayene
              </label>
              <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <input name="verifiedOnly" value="true" type="checkbox" defaultChecked={filters.verifiedOnly} /> Sadece doğrulanmış klinikler
              </label>
              <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <input name="openNow" value="true" type="checkbox" defaultChecked={filters.openNow} /> Şu an açık olanlar
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Sıralama
              <select name="sort" defaultValue={filters.sort ?? "recommended"} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                <option value="recommended">Önerilen</option>
                <option value="nearest">Konuma en yakın</option>
                <option value="rating">En yüksek puan</option>
                <option value="reviews">En fazla yorum</option>
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
          {results.externalProvider === "osm" || results.googleStatus === "not_configured" ? <div className="mt-4"><OpenStreetMapSourceNotice /></div> : null}
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <p className="font-semibold text-blue-950">{total} klinik bulundu</p>
            <p className="mt-1 text-sm text-slate-600">DişçiBul kliniklerinde randevu ve fiyat teklifi alabilir; diğer kliniklerin konum ve iletişim bilgilerini inceleyebilirsiniz.</p>
            {externalStatusMessage[results.externalStatus] ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{externalStatusMessage[results.externalStatus]}</p> : null}
            {googleStatusMessage[results.googleStatus] ? <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{googleStatusMessage[results.googleStatus]}</p> : null}
          </div>

          {results.registeredClinics.length ? (
            <section className="space-y-4">
              <div><h2 className="text-xl font-semibold text-blue-950">DişçiBul klinikleri</h2><p className="mt-1 text-sm text-slate-600">Fiyat, muayene ve randevu bilgileri klinik tarafından yönetilir.</p></div>
              {results.registeredClinics.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
            </section>
          ) : null}

          {results.googlePlaces.length ? (
            <section className="space-y-4">
              <div className="border-b border-blue-100 pb-3"><h2 className="text-xl font-semibold text-blue-950">Google&apos;da bulunan diğer klinikler</h2><p className="mt-1 text-sm text-slate-600">Puan, değerlendirme sayısı, telefon ve adres Google Places tarafından sağlanır.</p></div>
              {results.googlePlaces.map((place) => <GoogleClinicCard key={place.placeId} place={place} />)}
            </section>
          ) : null}

          {results.osmClinics.length ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-blue-100 pb-3">
                <div><h2 className="text-xl font-semibold text-blue-950">İnternette bulunan diğer klinikler</h2><p className="mt-1 text-sm text-slate-600">Ücretsiz topluluk verisi; puan ve yorum içermez.</p></div>
                <OpenStreetMapAttribution />
              </div>
              {results.osmClinics.map((clinic) => <OsmClinicCard key={`${clinic.osmType}-${clinic.osmId}`} clinic={clinic} />)}
            </section>
          ) : null}

          {!total ? (
            <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
              <h2 className="font-semibold text-blue-950">{needsInternetLocation ? "Şehir seçerek başlayın" : "Sonuç bulunamadı"}</h2>
              <p className="mt-2 text-sm text-slate-600">{needsInternetLocation ? "İnternetteki klinikler tüm ülke taranmadan, yalnızca seçtiğiniz şehir veya ilçede aranır." : "Filtreleri azaltın ya da farklı bir şehir ve ilçe deneyin."}</p>
              <Link href="/arama" className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Tüm DişçiBul kliniklerini göster</Link>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
