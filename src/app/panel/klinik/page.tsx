import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  MessageSquareText,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { clinics } from "@/data/clinics";
import { formatMoney } from "@/lib/format";

const clinic = clinics[0];

const metrics = [
  { label: "Profil tamamlığı", value: "%92", detail: "Fiyat ve Google bağlantısı aktif", icon: CheckCircle2 },
  { label: "Açık teklif talebi", value: "14", detail: "6 talep bugün cevap bekliyor", icon: MessageSquareText },
  { label: "Ortalama cevap", value: `${clinic.responseTimeHours} saat`, detail: "Hedef: 4 saatin altında kalmak", icon: Clock },
  { label: "Google puanı", value: clinic.google.rating ? clinic.google.rating.toFixed(1) : "Yok", detail: "Yorumlar Google sayfasına yönlenir", icon: Star },
];

const requests = [
  { patient: "Aylin K.", need: "İmplant ön değerlendirme", budget: "35.000 - 55.000 TL", status: "Öncelikli", time: "18 dk önce" },
  { patient: "Mert S.", need: "Şeffaf plak fiyat bilgisi", budget: "45.000 - 70.000 TL", status: "Yanıt taslağı hazır", time: "1 saat önce" },
  { patient: "Selin A.", need: "Çocuk diş hekimi randevusu", budget: "İlk muayene", status: "Randevu öner", time: "3 saat önce" },
];

const setupItems = [
  "Ruhsat ve vergi bilgisi doğrulandı",
  "Doktor profilleri ve uzmanlık alanları eklendi",
  "İlk muayene kapsamı hastaya görünür",
  "Google yorum yönlendirme bağlantısı hazır",
  "KVKK aydınlatma ve rıza metni panelde kayıtlı",
];

export default function ClinicPanelPage() {
  return (
    <main className="bg-blue-50/40">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">DişçiBul Klinik Yönetimi</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-blue-950">Klinik çalışma paneli</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {clinic.name} için demo panel. Talep karşılama, ilk muayene ücreti, fiyat kapsamı, doktor görünürlüğü ve Google yorum yönlendirmesi buradan yönetilir.
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Doğrulanmış klinik hesabı
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, icon: Icon }) => (
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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-blue-950">Gelen hasta talepleri</h2>
                <p className="mt-1 text-sm text-slate-600">Klinikler birbirinin teklifini göremez; hasta sadece kendi aldığı yanıtları karşılaştırır.</p>
              </div>
              <span className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Yanıt şablonlarını yönet</span>
            </div>
            <div className="mt-5 divide-y divide-slate-200">
              {requests.map((request) => (
                <div key={request.patient} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{request.patient}</p>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{request.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{request.need}</p>
                    <p className="mt-1 text-xs text-slate-500">{request.budget} · {request.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800">Teklif hazırla</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Randevu öner</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <CreditCard className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-semibold text-blue-950">İlk muayene</h2>
              <p className="mt-2 text-2xl font-semibold text-blue-950">{clinic.freeInitialExam ? "Ücretsiz" : formatMoney(clinic.firstExamFee)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{clinic.initialExamIncludes.join(", ")}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <CalendarClock className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-semibold text-blue-950">Randevu kapasitesi</h2>
              <p className="mt-2 text-2xl font-semibold text-blue-950">32 slot</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Bu hafta hasta talebine açılabilecek tahmini uygunluk.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <UsersRound className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-semibold text-blue-950">Doktor görünürlüğü</h2>
              <p className="mt-2 text-2xl font-semibold text-blue-950">{clinic.doctors.length} profil</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Uzmanlık, deneyim ve tedavi eşleşmesi arama sonuçlarında kullanılır.</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-950">Fiyat ve kapsam yönetimi</h2>
            <p className="mt-1 text-sm text-slate-600">Hastaya görünen fiyatlar bilgilendirme amaçlıdır; kesin plan muayene sonrası onaylanır.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-blue-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Tedavi</th>
                    <th className="py-3 pr-4">Aralık</th>
                    <th className="py-3 pr-4">Finansman</th>
                    <th className="py-3 pr-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinic.prices.map((price) => (
                    <tr key={price.treatmentSlug}>
                      <td className="py-3 pr-4 font-medium text-slate-950">{price.treatmentName}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {typeof price.fixedPrice === "number" ? formatMoney(price.fixedPrice) : `${formatMoney(price.minPrice ?? 0)} - ${formatMoney(price.maxPrice ?? 0)}`}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{clinic.financingOptions.slice(0, 2).join(", ")}</td>
                      <td className="py-3 pr-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">Yayında</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <h2 className="font-semibold text-blue-950">Kurulum kontrol listesi</h2>
            </div>
            <div className="mt-4 space-y-3">
              {setupItems.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-700" />
              <h2 className="font-semibold text-blue-950">Google yorum akışı</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Değerlendirme yazan hasta kliniğin Google yorum sayfasına gider. Yorum taslağı kopyalanırken başına &quot;DişçiBul üzerinden gönderildi:&quot; eklenir.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="font-semibold text-amber-950">Eksik görünen alanlar</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950">
              <li>2 doktor için profil fotoğrafı eklenebilir.</li>
              <li>Ortodonti fiyat notu 30 gün sonra yenilenmeli.</li>
              <li>Hafta sonu randevu kapasitesi netleştirilmeli.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
