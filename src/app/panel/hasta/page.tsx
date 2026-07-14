import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Heart,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { clinics } from "@/data/clinics";
import { formatDate, formatMoney } from "@/lib/format";

const clinic = clinics[0];

const patientStats = [
  { label: "Aktif randevu isteği", value: "1", detail: "Yanıt bekleniyor", icon: CalendarClock },
  { label: "Alınan teklif", value: "2", detail: "Karşılaştırmaya hazır", icon: MessageSquareText },
  { label: "Favori klinik", value: "3", detail: "Son baktıkların kaydedildi", icon: Heart },
  { label: "Yorum adımı", value: "1", detail: "Google sayfasına yönlenir", icon: Star },
];

const plainExplanations = [
  ["Randevu isteği", "Klinikten gün ve saat için dönüş beklendiğini gösterir."],
  ["Fiyat teklifi", "Kliniklerin verdiği tahmini fiyatları yan yana görmeyi sağlar."],
  ["Favori klinik", "Daha sonra tekrar bakmak istediğin klinikleri kaydeder."],
  ["Google yorumu", "Yorum platformda tutulmaz; kliniğin Google sayfasına yönlendirir."],
];

const nextActions = [
  { title: "Randevu talebini tamamla", body: `${clinic.name} için en yakın uygunluk ${formatDate(clinic.nextAvailableAt)}.`, href: `/randevu-talebi?clinic=${clinic.slug}`, action: "Randevuya git" },
  { title: "Fiyat teklifi al", body: "Aynı tedavi için birkaç klinikten yanıt iste.", href: `/fiyat-teklifi?clinics=${clinic.slug}`, action: "Teklif iste" },
  { title: "Klinikleri karşılaştır", body: "İlk muayene, fiyat aralığı, Google puanı ve uygunluğu birlikte gör.", href: `/karsilastir?clinics=${clinic.slug}`, action: "Karşılaştır" },
  { title: "Google yorumu yaz", body: "Tedavi sonrası yorum doğrudan Google sayfasında açılır.", href: `/klinikler/${clinic.slug}`, action: "Yorum akışını aç" },
];

export default function PatientPanelPage() {
  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                <UserRound className="h-4 w-4" /> Hasta oturumu
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-blue-950">Tedavi sürecim</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Bu panel sadece hastaya yöneliktir: randevular, fiyat teklifleri, favori klinikler ve Google yorum adımları burada takip edilir.
              </p>
            </div>
            <Link href="/arama" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Klinik bul <Search className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {patientStats.map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-blue-950">{value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-blue-700" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl font-semibold text-blue-950">Sıradaki adımlarım</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Nereden devam edeceğin belli olsun diye en önemli işlemler sıraya kondu. Bir işlem tamamlandığında sonraki adım öne çıkar.
            </p>
            <div className="mt-4 grid gap-3">
              {nextActions.map((action) => (
                <Link key={action.title} href={action.href} className="grid gap-3 rounded-md border border-blue-100 p-4 hover:border-blue-300 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{action.body}</p>
                  </div>
                  <span className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
                    {action.action} <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-950">Bu bilgiler ne işe yarar?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {plainExplanations.map(([title, body]) => (
                <div key={title} className="rounded-md border border-blue-100 bg-blue-50/50 p-4">
                  <p className="font-semibold text-blue-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-950">Hasta modu açık</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900">Klinik işletme istatistikleri bu panelde gösterilmez; sadece kullanıcının tedavi süreci görünür.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
            <p className="mt-3 font-semibold text-blue-950">Güvenli yönlendirme</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Yorum yazma adımı platform içinde saklanmaz; kliniğin Google yorum sayfasına açılır.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
