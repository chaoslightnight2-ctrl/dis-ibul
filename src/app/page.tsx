import Link from "next/link";
import { ArrowRight, Map, Search, UserRound } from "lucide-react";
import { SearchForm } from "@/components/clinic/search-form";
import { MedicalNotice, OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { brand } from "@/config/brand";
import { popularTreatments } from "@/config/treatments";
import { turkeyCities } from "@/config/turkey-cities";

const featuredCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep"];

export default function Home() {
  return (
    <main className="bg-blue-50/30">
      {/* Hero */}
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-normal text-blue-950 sm:text-5xl">{brand.name}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Türkiye&apos;nin dört bir yanındaki diş kliniklerini bulun, konum ve iletişim bilgilerini inceleyin.
            </p>
          </div>
          <div className="mt-7">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Hızlı erişim */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Link href="/arama" className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-6 shadow-sm transition hover:border-blue-400">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold text-blue-950"><Map className="h-5 w-5" /> Klinik ara</span>
            <span className="mt-1 block text-sm text-slate-600">Ücretsiz OpenStreetMap verisiyle Türkiye genelinde klinikleri keşfedin.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-700" />
        </Link>
        <Link href="/tedaviler" className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-6 shadow-sm transition hover:border-blue-400">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold text-blue-950"><Search className="h-5 w-5" /> Tedavi rehberi</span>
            <span className="mt-1 block text-sm text-slate-600">Tedaviler ve fiyat aralıkları hakkında bilgi alın.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-700" />
        </Link>
        <Link href="/auth/giris?tip=hasta" className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-6 shadow-sm transition hover:border-blue-400">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold text-blue-950"><UserRound className="h-5 w-5" /> Hasta girişi</span>
            <span className="mt-1 block text-sm text-slate-600">Geçmiş taleplerinizi, favorilerinizi ve bildirimlerinizi takip edin.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-700" />
        </Link>
      </section>

      {/* Popüler şehirler */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-blue-950">Popüler şehirler</h2>
            <p className="mt-1 text-sm text-slate-600">Hemen aramaya başlamak için bir şehir seçin.</p>
          </div>
          <Link href="/arama" className="hidden text-sm font-medium text-blue-700 hover:underline sm:inline">Tüm şehirler <ArrowRight className="inline h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {featuredCities.map((city) => (
            <Link
              key={city}
              href={`/arama?city=${encodeURIComponent(city)}`}
              className="flex items-center justify-between rounded-lg border border-blue-100 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
            >
              <span className="font-medium text-blue-950">{city}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {turkeyCities.filter((c) => !featuredCities.includes(c)).slice(0, 12).map((city) => (
            <Link key={city} href={`/arama?city=${encodeURIComponent(city)}`} className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700">
              {city}
            </Link>
          ))}
          <Link href="/arama" className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100">
            Tümü
          </Link>
        </div>
      </section>

      {/* Popüler tedaviler */}
      <section className="border-t border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-blue-950">Sık aranan tedaviler</h2>
              <p className="mt-1 text-sm text-slate-600">Tedaviye göre klinik arayın, fiyatları karşılaştırın.</p>
            </div>
            <Link href="/tedaviler" className="hidden text-sm font-medium text-blue-700 hover:underline sm:inline">Tüm tedaviler <ArrowRight className="inline h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {popularTreatments.map((treatment) => (
              <Link
                key={treatment}
                href={`/arama?treatment=${encodeURIComponent(treatment)}`}
                className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="text-sm font-medium text-emerald-950">{treatment}</span>
                <Search className="h-4 w-4 shrink-0 text-emerald-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Kullanıcı girişi */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/auth/giris?tip=hasta" className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-4 text-blue-900 shadow-sm">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5" /> Kullanıcı girişi</span>
            <span className="mt-1 block text-sm text-slate-600">Favori klinikleri, randevu ve teklif adımlarını takip edin.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Neden DişçiBul? */}
      <section className="border-y border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold text-blue-950">Neden DişçiBul?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100"><Map className="h-5 w-5 text-blue-700" /></div>
              <h3 className="mt-4 font-semibold text-blue-950">Ücretsiz harita verisi</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">OpenStreetMap sayesinde Türkiye&apos;deki binlerce diş kliniğine ücretsiz erişin.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100"><Search className="h-5 w-5 text-blue-700" /></div>
              <h3 className="mt-4 font-semibold text-blue-950">Tek yerde arama</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Klinik adı, şehir, ilçe veya tedaviye göre arayın; kartlardan telefon, web sitesi ve harita bağlantılarına geçin.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5 sm:col-span-2 lg:col-span-1">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100"><Search className="h-5 w-5 text-blue-700" /></div>
              <h3 className="mt-4 font-semibold text-blue-950">Tedavi bazlı arama</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Tedavi adı, şehir veya klinik adıyla arayın, ihtiyacınıza en uygun kliniği bulun.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Uyarılar */}
      <div className="mx-auto grid max-w-7xl gap-3 px-4 pb-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <MedicalNotice />
        <OpenStreetMapSourceNotice />
      </div>
    </main>
  );
}
