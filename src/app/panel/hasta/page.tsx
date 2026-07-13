import Link from "next/link";
import { CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Heart, MessageSquareText, Star } from "lucide-react";
import { clinics } from "@/data/clinics";
import { formatDate, formatMoney } from "@/lib/format";

const clinic = clinics[0];

const nextActions = [
  { title: "Randevu talebini tamamla", body: `${clinic.name} için en yakın uygunluk ${formatDate(clinic.nextAvailableAt)}.`, href: `/randevu-talebi?clinic=${clinic.slug}` },
  { title: "Fiyat teklifi al", body: "Aynı tedavi için birkaç klinikten yanıt iste.", href: `/fiyat-teklifi?clinics=${clinic.slug}` },
  { title: "Google yorumu yaz", body: "Tedavi sonrası yorum doğrudan Google sayfasında açılır.", href: `/klinikler/${clinic.slug}` },
];

export default function PatientPanelPage() {
  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">Hasta paneli</p>
              <h1 className="mt-2 text-3xl font-semibold text-blue-950">Diş tedavi sürecini tek yerden takip et</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Favori klinikler, randevu istekleri, fiyat teklifleri ve değerlendirme adımları tek ekranda görünür.
              </p>
            </div>
            <Link href="/arama" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Klinik bul <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl font-semibold text-blue-950">Sıradaki adımlar</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {nextActions.map((action) => (
                <Link key={action.title} href={action.href} className="grid gap-2 rounded-md border border-blue-100 p-4 hover:border-blue-300 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{action.body}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-700" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-950">Favori klinik özeti</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-slate-950">{clinic.name}</p>
                <p className="mt-1 text-sm text-slate-600">{clinic.city}, {clinic.district} · {clinic.google.rating?.toFixed(1) ?? "-"} Google puanı</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">İlk muayene: {clinic.freeInitialExam ? "Ücretsiz" : formatMoney(clinic.firstExamFee)}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">Doğrulanmış klinik</span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">Yanıt: {clinic.responseTimeHours} saat</span>
                </div>
              </div>
              <Link href={`/klinikler/${clinic.slug}`} className="rounded-md border border-blue-200 px-3 py-2 text-center text-sm font-semibold text-blue-800">Profili aç</Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {[
            [CalendarClock, "1 randevu isteği", "Yanıt bekleniyor"],
            [MessageSquareText, "2 teklif taslağı", "Karşılaştırmaya hazır"],
            [Heart, "3 favori klinik", "Son baktıkların kaydedildi"],
            [Star, "Yorum adımı", "Google sayfasına yönlendirilir"],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-blue-700" />
              <p className="mt-3 font-semibold text-blue-950">{title as string}</p>
              <p className="mt-1 text-sm text-slate-600">{body as string}</p>
            </div>
          ))}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p className="text-sm leading-6 text-emerald-900">Hasta tarafında karmaşık menü yok: arama, favori, randevu, teklif ve yorum tek akışta ilerler.</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
