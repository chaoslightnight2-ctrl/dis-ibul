import Link from "next/link";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { MedicalNotice, OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { brand } from "@/config/brand";
import { getPublishedClinics } from "@/services/clinics/public-clinics";

export default async function Home() {
  const featured = (await getPublishedClinics()).slice(0, 3);

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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-blue-950">Klinikler</h2>
            <p className="mt-1 text-sm text-slate-600">Klinikleri ilk muayene, fiyat aralığı ve uygunluk bilgileriyle inceleyin.</p>
          </div>
          <Link href="/arama" className="text-sm font-semibold text-blue-700">Tüm klinikleri gör</Link>
        </div>
        {featured.length ? (
          <div className="grid gap-4">
            {featured.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center text-sm text-slate-600">
            Yayındaki klinikler burada listelenecek.
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <Link href="/auth/giris?tip=hasta" className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-4 text-blue-900 shadow-sm">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold"><UserRound className="h-5 w-5" /> Hasta girişi</span>
            <span className="mt-1 block text-sm text-slate-600">Randevu, teklif, favori ve yorum adımlarını takip edin.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/auth/giris?tip=klinik" className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-4 text-emerald-900 shadow-sm">
          <span>
            <span className="inline-flex items-center gap-2 font-semibold"><Building2 className="h-5 w-5" /> Klinik girişi</span>
            <span className="mt-1 block text-sm text-slate-600">Talepleri, fiyatları, randevu kapasitesini ve istatistikleri yönetin.</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
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
        <OpenStreetMapSourceNotice />
      </div>
    </main>
  );
}
