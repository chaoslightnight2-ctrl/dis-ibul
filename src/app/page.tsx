import Link from "next/link";
import { ArrowRight, Building2, CalendarCheck, CheckCircle2, ClipboardList, Search, UserRound } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { GoogleSourceNotice, MedicalNotice } from "@/components/ui/notice";
import { brand } from "@/config/brand";
import { clinics, treatments } from "@/data/clinics";

const patientSteps = [
  ["1", "Tedavini seç", "İmplant, zirkonyum, şeffaf plak veya çocuk diş hekimliği."],
  ["2", "Ücret ve uygunluğu gör", "İlk muayene, fiyat aralığı ve en yakın randevu tek kartta."],
  ["3", "Randevu ya da teklif iste", "Kliniklerden yanıt al, sonra Google üzerinden değerlendir."],
];

export default function Home() {
  const featured = clinics.slice(0, 2);

  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-12">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/arama" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-800">
                <UserRound className="h-4 w-4" /> Hasta olarak klinik bul
              </Link>
              <Link href="/auth/kayit?tip=klinik" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">
                <Building2 className="h-4 w-4" /> Klinik olarak kaydol
              </Link>
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-blue-950 sm:text-5xl">
                {brand.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Diş kliniği bulmayı kısa ve anlaşılır hale getirir: tedaviyi seç, fiyat ve ilk muayene bilgisini gör, randevu ya da teklif iste.
              </p>
            </div>
            <SearchForm />
            <div className="grid gap-3 sm:grid-cols-3">
              {patientSteps.map(([step, title, body]) => (
                <div key={step} className="rounded-md border border-blue-100 bg-white p-4 shadow-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">{step}</span>
                  <p className="mt-3 font-semibold text-blue-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="grid content-start gap-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-700" />
                <h2 className="font-semibold text-blue-950">Bugün en hızlı başlangıç</h2>
              </div>
              <div className="mt-4 grid gap-2">
                <Link href="/arama?freeInitialExam=true" className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm">
                  Ücretsiz ilk muayeneli klinikler <ArrowRight className="h-4 w-4 text-blue-700" />
                </Link>
                <Link href="/fiyat-teklifi" className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm">
                  Birden fazla klinikten teklif al <ArrowRight className="h-4 w-4 text-blue-700" />
                </Link>
                <Link href="/panel/klinik" className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm">
                  Klinik paneli demosunu aç <ArrowRight className="h-4 w-4 text-blue-700" />
                </Link>
              </div>
            </div>
            <MedicalNotice />
            <GoogleSourceNotice />
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-blue-950">Tek tıkla başla</h2>
            <p className="mt-1 text-sm text-slate-600">En sık aranan tedaviler doğrudan filtrelenmiş aramaya gider.</p>
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
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-blue-950">Öne çıkan klinikler</h2>
            <p className="text-sm text-slate-600">Kartlarda ilk muayene, fiyat aralığı, Google puanı ve hızlı aksiyonlar birlikte görünür.</p>
          </div>
          <Link href="/panel/hasta" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800">
            Hasta panelini gör <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4">
          {featured.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            [CalendarCheck, "Hasta için kolay takip", "Randevu, teklif, favori ve yorum adımları tek panelde."],
            [Building2, "Klinik için günlük iş listesi", "Yanıt bekleyen talepler, fiyat güncelleme ve Google yorum akışı aynı ekranda."],
            [CheckCircle2, "Güvenli akış", "Doğrulama, KVKK rızası ve Google kaynaklı puan bilgisi açık gösterilir."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="rounded-md border border-blue-100 bg-blue-50/50 p-4">
              <Icon className="h-5 w-5 text-blue-700" />
              <p className="mt-3 font-semibold text-blue-950">{title as string}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
