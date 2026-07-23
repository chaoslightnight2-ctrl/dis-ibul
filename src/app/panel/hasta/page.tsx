import Link from "next/link";
import { Bell, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, FileDown, Heart, MessageSquareText, Search, Settings, ShieldCheck } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const appointmentLabels: Record<string, string> = {
  PENDING: "Klinik yanıtı bekleniyor",
  VIEWED_BY_CLINIC: "Klinik talebi gördü",
  INFO_REQUESTED: "Ek bilgi bekleniyor",
  APPROVED: "Randevu onaylandı",
  ALTERNATIVE_TIME_PROPOSED: "Alternatif saat önerildi",
  PATIENT_CONFIRMED: "Hasta onayladı",
  CANCELLED: "İptal edildi",
  COMPLETED: "Tamamlandı",
  NO_SHOW: "Katılım olmadı",
};

export default async function PatientPanelPage() {
  const user = await requireUser(["PATIENT"]);
  const [appointments, quotes, favorites, unreadNotifications, conversations] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: { userId: user.id },
      include: { clinic: { select: { name: true, slug: true, city: true, district: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.quoteRequest.findMany({
      where: { userId: user.id },
      include: {
        attachments: { where: { deletedAt: null, scanStatus: "CLEAN" }, select: { id: true, originalName: true, sizeBytes: true } },
        selectedClinics: {
          include: {
            clinic: { select: { id: true, name: true, slug: true } },
            response: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { clinic: { select: { name: true, slug: true, city: true, district: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.conversation.findMany({ where: { userId: user.id }, select: { id: true, clinicId: true } }),
  ]);
  const conversationByClinic = new Map(conversations.map((conversation) => [conversation.clinicId, conversation.id]));

  const receivedOffers = quotes.reduce((total, quote) => total + quote.selectedClinics.filter((item) => item.response).length, 0);
  const activeAppointments = appointments.filter((item) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(item.status)).length;
  const stats = [
    { label: "Aktif randevu", value: String(activeAppointments), detail: "Klinik yanıtlarını buradan takip edin", icon: CalendarClock },
    { label: "Teklif talebi", value: String(quotes.length), detail: `${receivedOffers} klinik yanıtı alındı`, icon: MessageSquareText },
    { label: "Favori klinik", value: String(favorites.length), detail: "Kaydettiğiniz klinikler", icon: Heart },
    { label: "Yeni bildirim", value: String(unreadNotifications), detail: "Randevu, teklif ve mesaj güncellemeleri", icon: Bell },
  ];

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">Hasta hesabı</p>
              <h1 className="mt-2 text-3xl font-semibold text-blue-950">Merhaba, {user.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Randevularınız, fiyat teklifleriniz ve kaydettiğiniz klinikler tek yerde.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/panel/hasta/mesajlar" className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800"><MessageSquareText className="h-4 w-4" /> Mesajlar</Link>
              <Link href="/panel/hasta/bildirimler" className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800"><Bell className="h-4 w-4" /> Bildirimler{unreadNotifications ? ` (${unreadNotifications})` : ""}</Link>
              <Link href="/panel/hasta/ayarlar" className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800"><Settings className="h-4 w-4" /> Hesap ayarları</Link>
              <Link href="/arama" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Klinik bul <Search className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-blue-950">{value}</p></div><Icon className="h-5 w-5 text-blue-700" /></div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-6">
          <div className="border-b border-blue-100 pb-4">
            <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Randevu taleplerim</h2></div>
            {appointments.length ? (
              <div className="mt-4 grid gap-3">
                {appointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><Link href={`/klinikler/${appointment.clinic.slug}`} className="font-semibold text-slate-950 hover:text-blue-700">{appointment.clinic.name}</Link><p className="mt-1 text-sm text-slate-600">{appointment.treatmentName} · {appointment.clinic.city}, {appointment.clinic.district}</p></div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{appointmentLabels[appointment.status]}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Oluşturma: {formatDate(appointment.createdAt.toISOString())}{appointment.preferredDate ? ` · Tercih: ${formatDate(appointment.preferredDate.toISOString())}` : ""}</p>
                    {conversationByClinic.get(appointment.clinicId) ? <Link href={`/panel/hasta/mesajlar?konusma=${conversationByClinic.get(appointment.clinicId)}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"><MessageSquareText className="h-4 w-4" /> Kliniğe mesaj yaz</Link> : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white p-6 text-center"><p className="font-medium text-slate-800">Henüz randevu talebiniz yok</p><p className="mt-1 text-sm text-slate-500">Bir klinik seçip uygun gün için talep oluşturabilirsiniz.</p><Link href="/arama" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Kliniklere git <ChevronRight className="h-4 w-4" /></Link></div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Fiyat tekliflerim</h2></div>
            {quotes.length ? (
              <div className="mt-4 grid gap-3">
                {quotes.map((quote) => {
                  const responses = quote.selectedClinics.filter((item) => item.response).length;
                  return (
                    <article key={quote.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="font-semibold text-slate-950">{quote.treatmentName}</p><p className="mt-1 text-xs text-slate-500">Talep: {formatDate(quote.createdAt.toISOString())}</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${responses ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{responses ? `${responses} yanıt geldi` : "Yanıt bekleniyor"}</span>
                      </div>
                      {quote.attachments.length ? <div className="mt-3 flex flex-wrap gap-2">{quote.attachments.map((file) => <a key={file.id} href={`/api/private-files/${file.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"><FileDown className="h-3.5 w-3.5" />{file.originalName} · {Math.max(1, Math.ceil(file.sizeBytes / 1024))} KB</a>)}</div> : null}
                      <div className="mt-4 grid gap-3">
                        {quote.selectedClinics.map((item) => {
                          const response = item.response;
                          const price = response
                            ? response.estimatedMinPrice !== null && response.estimatedMaxPrice !== null
                              ? `${formatMoney(Number(response.estimatedMinPrice))} - ${formatMoney(Number(response.estimatedMaxPrice))}`
                              : response.estimatedMinPrice !== null
                                ? `${formatMoney(Number(response.estimatedMinPrice))} başlangıç`
                                : "Muayene sonrası"
                            : null;
                          return (
                            <div key={item.id} className="rounded-md border border-slate-200 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Link href={`/klinikler/${item.clinic.slug}`} className="font-medium text-blue-800">{item.clinic.name}</Link>
                                <span className={`text-xs font-medium ${response ? "text-emerald-700" : "text-amber-700"}`}>{response ? "Teklif hazır" : "Yanıt bekleniyor"}</span>
                              </div>
                              {response ? (
                                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                  <div><p className="text-xs text-slate-500">Tahmini fiyat</p><p className="font-semibold text-slate-950">{price}</p></div>
                                  <div><p className="text-xs text-slate-500">Tahmini seans</p><p className="font-medium">{response.estimatedSessions ? `${response.estimatedSessions} seans` : "Belirtilmedi"}</p></div>
                                  <div className="sm:col-span-2"><p className="text-xs text-slate-500">Dahil olanlar</p><p>{response.includedItems}</p></div>
                                  {response.note ? <div className="sm:col-span-2"><p className="text-xs text-slate-500">Klinik notu</p><p>{response.note}</p></div> : null}
                                  <p className="text-xs text-slate-500 sm:col-span-2">Yanıt: {formatDate(response.createdAt.toISOString())}</p>
                                </div>
                              ) : null}
                              {conversationByClinic.get(item.clinic.id) ? <Link href={`/panel/hasta/mesajlar?konusma=${conversationByClinic.get(item.clinic.id)}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700"><MessageSquareText className="h-3.5 w-3.5" /> Klinikle görüş</Link> : null}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white p-6 text-center"><p className="font-medium text-slate-800">Henüz teklif talebiniz yok</p><p className="mt-1 text-sm text-slate-500">Aynı tedavi için en fazla dört klinikten ayrı ayrı teklif isteyebilirsiniz.</p><Link href="/arama" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Tedavi ara <ChevronRight className="h-4 w-4" /></Link></div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-semibold text-emerald-950">Verileriniz hesabınıza bağlı</p><p className="mt-1 text-sm leading-6 text-emerald-900">Talepler yalnızca sizin hesabınızda ve ilgili kliniğin yetkili ekranında görünür.</p></div></div></div>
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><ShieldCheck className="h-5 w-5 text-blue-700" /><p className="mt-3 font-semibold text-blue-950">Google yorumları</p><p className="mt-1 text-sm leading-6 text-slate-600">Yorum DişçiBul içinde tutulmaz. Klinik profilindeki buton sizi doğrudan Google yorum sayfasına götürür.</p></div>
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-blue-950">Favorilerim</h2>{favorites.length ? <div className="mt-3 grid gap-3">{favorites.map(({ clinic }) => <Link key={clinic.slug} href={`/klinikler/${clinic.slug}`} className="rounded-md border border-blue-100 p-3 text-sm"><span className="font-medium text-slate-900">{clinic.name}</span><span className="mt-1 block text-xs text-slate-500">{clinic.city}, {clinic.district}</span></Link>)}</div> : <p className="mt-2 text-sm text-slate-500">Klinik profillerinden favorilerinize ekleyebilirsiniz.</p>}</div>
        </aside>
      </section>
    </main>
  );
}
