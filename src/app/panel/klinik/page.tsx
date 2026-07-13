import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
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

const todayTasks = [
  { title: "6 talebe cevap ver", body: "Öncelikli hasta talepleri bekliyor.", action: "Talepleri aç", tone: "blue" },
  { title: "İlk muayene bilgisini kontrol et", body: `${clinic.freeInitialExam ? "Ücretsiz" : formatMoney(clinic.firstExamFee)} olarak yayında.`, action: "Ücreti düzenle", tone: "emerald" },
  { title: "2 eksik profil alanı", body: "Doktor fotoğrafı ve hafta sonu kapasitesi tamamlanmalı.", action: "Eksikleri gör", tone: "amber" },
];

const metrics = [
  { label: "Profil tamamlığı", value: "%92", detail: "Yayın için güçlü", icon: CheckCircle2 },
  { label: "Açık talep", value: "14", detail: "6 talep bugün cevap bekliyor", icon: MessageSquareText },
  { label: "Ortalama cevap", value: `${clinic.responseTimeHours} saat`, detail: "Hedef 4 saatin altı", icon: Clock },
  { label: "Google puanı", value: clinic.google.rating ? clinic.google.rating.toFixed(1) : "Yok", detail: "Yorumlar Google'a gider", icon: Star },
];

const requests = [
  { patient: "Aylin K.", need: "İmplant ön değerlendirme", budget: "35.000 - 55.000 TL", status: "Öncelikli", time: "18 dk önce" },
  { patient: "Mert S.", need: "Şeffaf plak fiyat bilgisi", budget: "45.000 - 70.000 TL", status: "Yanıt taslağı hazır", time: "1 saat önce" },
  { patient: "Selin A.", need: "Çocuk diş hekimi randevusu", budget: "İlk muayene", status: "Randevu öner", time: "3 saat önce" },
];

const setupItems = [
  "Ruhsat ve vergi bilgisi doğrulandı",
  "Doktor profilleri eklendi",
  "İlk muayene kapsamı hastaya görünür",
  "Google yorum bağlantısı hazır",
  "KVKK rıza metni panelde kayıtlı",
];

export default function ClinicPanelPage() {
  return (
    <main className="bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">DişçiBul Klinik Yönetimi</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-blue-950">Bugün ne yapmalıyım?</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {clinic.name} için hasta talepleri, fiyat bilgisi, doktor profilleri ve Google yorum yönlendirmesi tek ekranda.
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Doğrulanmış klinik hesabı
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {todayTasks.map((task) => (
              <div key={task.title} className={`rounded-lg border p-4 shadow-sm ${task.tone === "emerald" ? "border-emerald-200 bg-emerald-50" : task.tone === "amber" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
                <p className="font-semibold text-slate-950">{task.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{task.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800">
                  {task.action} <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.45fr_0.9fr] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-xl font-semibold text-blue-950">Gelen hasta talepleri</h2>
                <p className="mt-1 text-sm text-slate-600">Her talepte önerilen hızlı aksiyon var. Klinikler birbirinin teklifini göremez.</p>
              </div>
              <span className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Toplu yanıt şablonu</span>
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
                  <div className="grid gap-2 sm:grid-cols-2">
                    <span className="rounded-md bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white">Teklif hazırla</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800">Randevu öner</span>
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
              <p className="mt-2 text-sm leading-6 text-slate-600">Bu hafta hasta talebine açılabilecek uygunluk.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <UsersRound className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-semibold text-blue-950">Doktor görünürlüğü</h2>
              <p className="mt-2 text-2xl font-semibold text-blue-950">{clinic.doctors.length} profil</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Uzmanlık bilgisi arama sonuçlarında kullanılır.</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-950">Fiyat ve kapsam yönetimi</h2>
            <p className="mt-1 text-sm text-slate-600">Hastanın gördüğü her fiyatın kapsamı açık yazılır; kesin plan muayene sonrası onaylanır.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-blue-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Tedavi</th>
                    <th className="py-3 pr-4">Fiyat</th>
                    <th className="py-3 pr-4">Kapsam</th>
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
                      <td className="py-3 pr-4 text-slate-700">{price.includes.join(", ")}</td>
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
              <h2 className="font-semibold text-blue-950">Kurulum kontrolü</h2>
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
              Hasta yorum yazmak istediğinde kliniğin Google yorum sayfası açılır. Kopyalanan metnin başına &quot;DişçiBul üzerinden gönderildi:&quot; eklenir.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="font-semibold text-amber-950">Tamamlanacaklar</h2>
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
