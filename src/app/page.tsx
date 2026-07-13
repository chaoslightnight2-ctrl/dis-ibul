import Link from "next/link";
import { ShieldCheck, Star, Stethoscope, WalletCards } from "lucide-react";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { SearchForm } from "@/components/clinic/search-form";
import { GoogleSourceNotice, MedicalNotice } from "@/components/ui/notice";
import { brand } from "@/config/brand";
import { clinics, treatments } from "@/data/clinics";

export default function Home() {
  const featured = clinics.slice(0, 2);

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">
              Türkiye için klinik keşif, fiyat araştırma ve hasta-klinik eşleştirme
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                {brand.name}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Tedavi, şehir, Google puanı, fiyat aralığı ve klinik özelliklerine göre diş hekimlerini karşılaştırın. Fiyatlar bilgilendirme amaçlıdır; kesin plan muayene sonrası belirlenir.
              </p>
            </div>
            <SearchForm />
            <GoogleSourceNotice />
          </div>
          <div className="grid content-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Doğrulanmış klinikler", "Belge ve profil moderasyonu"],
                ["Google kaynaklı puan", "Yerel sahte puan yok"],
                ["Fiyat karşılaştırma", "Min-maks ve kapsam bilgisi"],
                ["KVKK hazırlığı", "Rıza ve sağlık verisi ayrımı"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-md bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
            <MedicalNotice />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Popüler tedaviler</h2>
            <p className="mt-1 text-sm text-slate-600">MVP tedavi kataloğu ve filtreleme sözleşmesi.</p>
          </div>
          <Link href="/arama" className="text-sm font-semibold text-blue-700">Tümünü ara</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {treatments.map((treatment) => (
            <Link key={treatment} href={`/arama?treatment=${encodeURIComponent(treatment)}`} className="rounded-md border border-slate-200 bg-white p-4 font-medium text-slate-800 shadow-sm hover:border-blue-300">
              {treatment}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Yüksek Google puanlı klinikler</h2>
            <p className="text-sm text-slate-600">Sponsorlu sonuçlar açık etiketlenir; organik sonuç gibi gizlenmez.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {featured.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            [Stethoscope, "Klinik profili", "Doktor, tedavi, fiyat ve Google eşleşmesi."],
            [WalletCards, "Teklif akışı", "Klinikler birbirinin teklifini göremez."],
            [Star, "Google yönlendirme", "Değerlendirme platformda saklanmaz."],
            [ShieldCheck, "Güvenlik", "RBAC, audit log ve KVKK kayıtları için hazır model."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="rounded-md border border-slate-200 p-4">
              <Icon className="h-5 w-5 text-blue-700" />
              <p className="mt-3 font-semibold">{title as string}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
