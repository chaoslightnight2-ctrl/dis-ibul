import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Search, UserRound } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { GoogleSourceNotice, MedicalNotice } from "@/components/ui/notice";
import { brand } from "@/config/brand";
import { clinics, treatments } from "@/data/clinics";

const simpleSteps = [
  ["Tedaviyi seç", "İmplant, kaplama, şeffaf plak veya çocuk diş hekimliği gibi aradığın işlemi seç."],
  ["Klinikleri karşılaştır", "İlk muayene ücreti, fiyat aralığı, Google puanı ve en yakın randevuyu gör."],
  ["Randevu ya da teklif iste", "İstersen direkt randevu iste, istersen birkaç klinikten fiyat teklifi al."],
];

export default function Home() {
  const featured = clinics.slice(0, 2);

  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-normal text-blue-950 sm:text-5xl">{brand.name}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Diş kliniği bul, ilk muayene ücretini gör, randevu veya fiyat teklifi iste.
            </p>
          </div>

          <div className="mt-7">
            <SearchForm />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/auth/giris?tip=hasta" className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
              <span className="inline-flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5" /> Hasta girişi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/giris?tip=klinik" className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <span className="inline-flex items-center gap-2 font-semibold"><Building2 className="h-5 w-5" /> Klinik girişi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {simpleSteps.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-semibold text-blue-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-blue-950">En sık arananlar</h2>
            <p className="mt-1 text-sm text-slate-600">Tek tıkla filtrelenmiş arama açılır.</p>
          </div>
          <Link href="/arama" className="text-sm font-semibold text-blue-700">Tüm klinikleri gör</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {treatments.slice(0, 8).map((treatment) => (
            <Link key={treatment} href={`/arama?treatment=${encodeURIComponent(treatment)}`} className="flex items-center justify-between rounded-md border border-blue-100 bg-white p-4 font-medium text-slate-800 shadow-sm hover:border-blue-300">
              {treatment}
              <Search className="h-4 w-4 text-blue-700" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-blue-950">Örnek klinikler</h2>
          <p className="mt-1 text-sm text-slate-600">Kartlarda fiyat, ilk muayene, Google puanı ve randevu aksiyonu sade şekilde gösterilir.</p>
        </div>
        <div className="grid gap-4">
          {featured.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div>
            <h2 className="font-semibold text-blue-950">Klinik misiniz?</h2>
            <p className="mt-1 text-sm text-slate-600">Kayıt olun; talepler, fiyatlar, randevu kapasitesi ve istatistikleri panelden yönetin.</p>
          </div>
          <Link href="/auth/kayit?tip=klinik" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Klinik kaydı oluştur <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:px-6 md:grid-cols-2 lg:px-8">
        <MedicalNotice />
        <GoogleSourceNotice />
      </div>
    </main>
  );
}
