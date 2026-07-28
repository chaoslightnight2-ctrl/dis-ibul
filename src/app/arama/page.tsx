import Link from "next/link";
import { Filter, MapIcon, RotateCcw, SlidersHorizontal } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { GooglePlaceCard } from "@/components/google/google-place-card";
import { DirectoryClinicCard } from "@/components/clinic/directory-clinic-card";
import { OsmClinicCard } from "@/components/clinic/osm-clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { NearMeButton } from "@/components/map/near-me-button";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { turkeyCities } from "@/config/turkey-cities";
import { clinicSearchSchema } from "@/domain/validation";
import { searchClinics } from "@/services/search/clinic-search";
import { ClinicMapClient } from "./clinic-map-client";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SortOption = "name" | "district";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSort(value: string | undefined): SortOption {
  return value === "district" ? value : "name";
}

const externalStatusMessage = {
  location_not_found: "Bu şehir veya ilçe OpenStreetMap üzerinde bulunamadı. Yazımı kontrol edip yeniden deneyin.",
  rate_limited: "Ücretsiz harita servisinin kullanım sınırına ulaşıldı. Kısa bir süre sonra yeniden deneyin.",
  unavailable: "OpenStreetMap klinik aramasına şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.",
  skipped: "",
  ok: "",
} as const;

const googleStatusMessage = {
  not_configured: "",
  rate_limited: "Google Places için belirlenen aylık ücretsiz koruma kotası doldu. Ek ücret oluşmaması için arama OpenStreetMap kaynağına geçirildi.",
  unavailable: "Google Places hizmetine ulaşılamadığı için arama OpenStreetMap kaynağıyla tamamlandı.",
  ok: "",
  skipped: "",
} as const;

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const hasActiveSearch = params.city || params.q || params.district || params.treatment;
  const sortBy = parseSort(first(params.sort));

  const filters = clinicSearchSchema.parse({
    q: first(params.q),
    city: first(params.city),
    district: first(params.district),
    treatment: first(params.treatment),
    minGoogleRating: first(params.minGoogleRating),
    minGoogleReviews: first(params.minGoogleReviews),
    source: first(params.source),
  });
  const results = await searchClinics(filters);
  // Sıralama
  const sortedOsm = [...results.osmClinics].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "tr");
    if (sortBy === "district") return (a.district ?? "").localeCompare(b.district ?? "", "tr");
    if (sortBy === "google-rating") return (b.googleRating ?? -1) - (a.googleRating ?? -1) || (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0);
    if (sortBy === "google-reviews") return (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0) || (b.googleRating ?? -1) - (a.googleRating ?? -1);
    return 0;
  });

  const sortedRegistered = [...results.registeredClinics].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "tr");
    if (sortBy === "district") return a.district.localeCompare(b.district, "tr");
    if (sortBy === "google-rating") return (b.google.rating ?? -1) - (a.google.rating ?? -1) || (b.google.reviewCount ?? 0) - (a.google.reviewCount ?? 0);
    if (sortBy === "google-reviews") return (b.google.reviewCount ?? 0) - (a.google.reviewCount ?? 0) || (b.google.rating ?? -1) - (a.google.rating ?? -1);
    return 0;
  });

  const sortedGooglePlaces = [...results.googlePlaces].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "tr");
    if (sortBy === "district") return (a.district ?? "").localeCompare(b.district ?? "", "tr");
    if (sortBy === "google-rating") return (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
    if (sortBy === "google-reviews") return b.reviewCount - a.reviewCount || (b.rating ?? -1) - (a.rating ?? -1);
    return 0;
  });

  const sortedDirectory = [...results.directoryClinics].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "tr");
    if (sortBy === "district") return (a.district ?? "").localeCompare(b.district ?? "", "tr");
    if (sortBy === "google-rating") return (b.googleRating ?? -1) - (a.googleRating ?? -1) || (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0);
    if (sortBy === "google-reviews") return (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0) || (b.googleRating ?? -1) - (a.googleRating ?? -1);
    return 0;
  });

  const total = sortedRegistered.length + sortedGooglePlaces.length + sortedOsm.length + sortedDirectory.length;

  const breadcrumbItems = [
    ...(filters.city ? [{ label: filters.city, href: `/arama?city=${encodeURIComponent(filters.city)}` }] : []),
    ...(filters.treatment ? [{ label: filters.treatment, href: `/arama?treatment=${encodeURIComponent(filters.treatment)}` }] : []),
    ...(hasActiveSearch ? [] : [{ label: "Klinik ara" }]),
  ];

  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-blue-950">
                {filters.city
                  ? `${filters.city} diş klinikleri`
                  : filters.treatment
                    ? `${filters.treatment} tedavisi`
                    : "Diş kliniği bul"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {filters.city
                  ? `${filters.city}${filters.district ? `, ${filters.district}` : ""} bölgesindeki diş kliniklerini keşfedin.`
                  : "Türkiye genelindeki diş kliniklerini keşfedin veya şehir seçerek daraltın."}
              </p>
            </div>
          </div>
          <div className="mt-5"><SearchForm compact initialValues={{ q: filters.q, city: filters.city }} /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[310px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-blue-100 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-blue-950">Filtrele</h2>
          </div>

          {/* Yakınımdaki Klinikler */}
          <div className="mt-4">
            <NearMeButton />
          </div>

          <form className="mt-4 grid gap-3" id="search-form">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Klinik, doktor veya işlem
              <input name="q" defaultValue={filters.q} placeholder="Örn. implant, ortodonti" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Şehir
                <select name="city" defaultValue={filters.city ?? ""} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
                  <option value="">Tüm şehirler</option>
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
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800">
              <Filter className="h-4 w-4" /> Sonuçları güncelle
            </button>
            <Link href="/arama" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <RotateCcw className="h-4 w-4" /> Filtreleri temizle
            </Link>
          </form>
          {results.externalProvider === "osm" || results.googleStatus === "not_configured" ? <div className="mt-4"><OpenStreetMapSourceNotice /></div> : null}
        </aside>

        <section className="space-y-5">
          {/* Sonuç özeti */}
          <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-blue-950">
                  {total > 0 ? `${total} klinik bulundu` : "Sonuç bulunamadı"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {total > 0
                    ? "Klinik ismine tıklayarak haritada görüntüleyebilir, iletişim bilgilerine ulaşabilirsiniz."
                    : "Farklı bir arama terimi deneyin veya şehir seçerek daraltın."}
                </p>
              </div>
              {total > 0 ? (
                <form method="GET" action="/arama" className="flex items-center gap-2">
                  {/* Taşı: mevcut filtreleri koru */}
                  {filters.q ? <input type="hidden" name="q" defaultValue={filters.q} /> : null}
                  {filters.city ? <input type="hidden" name="city" defaultValue={filters.city} /> : null}
                  {filters.district ? <input type="hidden" name="district" defaultValue={filters.district} /> : null}
                  {filters.treatment ? <input type="hidden" name="treatment" defaultValue={filters.treatment} /> : null}
                  <label htmlFor="sort-select" className="text-sm text-slate-600">Sırala:</label>
                  <select
                    id="sort-select"
                    name="sort"
                    className="rounded-md border border-blue-200 px-2 py-1.5 text-sm text-slate-950"
                    defaultValue={sortBy}
                  >
                    <option value="name">İsme göre</option>
                    <option value="district">İlçeye göre</option>
                  </select>
                  <button type="submit" className="rounded-md bg-blue-700 px-2.5 py-1.5 text-xs font-medium text-white">Uygula</button>
                </form>
              ) : null}
            </div>
            {!total && externalStatusMessage[results.externalStatus] ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{externalStatusMessage[results.externalStatus]}</p> : null}
            {googleStatusMessage[results.googleStatus] ? <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{googleStatusMessage[results.googleStatus]}</p> : null}
          </div>

          {/* DişçiBul indeksindeki klinikler */}
          {sortedRegistered.length ? (
            <section className="space-y-4">
              <div className="border-b border-blue-100 pb-3">
                <h2 className="text-xl font-semibold text-blue-950">DişçiBul klinik indeksi</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Yayındaki klinik kayıtlarından bulunan {sortedRegistered.length} sonuç.
                </p>
              </div>
              {sortedRegistered.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
            </section>
          ) : null}

          {/* Harita — OSM klinikleri haritada işaretlenir */}
          {sortedOsm.length > 0 && sortedOsm.some((c) => c.latitude && c.longitude) ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-700" />
                <h2 className="text-xl font-semibold text-blue-950">Harita görünümü</h2>
              </div>
              <ClinicMapClient clinics={sortedOsm} />
            </section>
          ) : null}

          {/* Google Places — yıldız puanlarıyla birlikte */}
          {sortedGooglePlaces.length ? (
            <section className="space-y-4">
              <div className="border-b border-amber-100 pb-3">
                <h2 className="text-xl font-semibold text-blue-950">Google Places sonuçları</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Google Places kaynağından alınan puan ve yorumlarla birlikte {sortedGooglePlaces.length} klinik.
                </p>
              </div>
              {sortedGooglePlaces.map((place) => <GooglePlaceCard key={place.placeId} place={place} />)}
            </section>
          ) : null}

          {sortedDirectory.length ? (
            <section className="space-y-4">
              <div className="border-b border-cyan-100 pb-3">
                <h2 className="text-xl font-semibold text-blue-950">Resmi kamu dizini</h2>
                <p className="mt-1 text-sm text-slate-600">
                  İl Sağlık Müdürlüğü gibi resmi kaynaklardan veritabanına alınan {sortedDirectory.length} klinik.
                </p>
              </div>
              {sortedDirectory.map((clinic) => <DirectoryClinicCard key={clinic.sourceRef} clinic={clinic} />)}
            </section>
          ) : null}

          {/* OSM Klinik listesi */}
          {sortedOsm.length ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-blue-100 pb-3">
                <div>
                  <h2 className="text-xl font-semibold text-blue-950">
                    {filters.city ? `${filters.city} klinikleri` : "Türkiye geneli klinikler"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {sortedGooglePlaces.length
                      ? "OpenStreetMap verisiyle bulunan ek klinikler (puan içermez)."
                      : "Ücretsiz topluluk verisi; puan ve yorum içermez."}
                  </p>
                </div>
                <OpenStreetMapAttribution />
              </div>
              {sortedOsm.map((clinic) => <OsmClinicCard key={`${clinic.osmType}-${clinic.osmId}`} clinic={clinic} />)}
            </section>
          ) : null}

          {!total ? (
            <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
              <h2 className="font-semibold text-blue-950">Sonuç bulunamadı</h2>
              <p className="mt-2 text-sm text-slate-600">Farklı bir arama terimi deneyin veya şehir seçerek daraltın.</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
