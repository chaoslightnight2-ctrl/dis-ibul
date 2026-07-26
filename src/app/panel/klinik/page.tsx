import Link from "next/link";
import { BarChart3, Bell, CalendarClock, CalendarCog, CheckCircle2, Clock, CreditCard, Eye, FileDown, MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";
import { AppointmentStatusAction, QuoteResponseForm } from "@/components/clinic/request-actions";
import { ClinicProfileForm, SubmitClinicReviewButton, TreatmentCapabilityManager, TreatmentPriceForm } from "@/components/clinic/clinic-settings";
import { ClinicSwitcher } from "@/components/clinic/clinic-switcher";
import { GoogleBusinessSettings } from "@/components/clinic/google-business-settings";
import { formatDate, formatMoney } from "@/lib/format";
import { getActiveClinicMembership } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isGoogleBusinessConfigured } from "@/services/google/business-profile";

const verificationLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_SUBMISSION: "Başvuru tamamlanıyor",
  IN_REVIEW: "İncelemede",
  ADDITIONAL_DOCUMENT_REQUIRED: "Ek belge gerekli",
  VERIFIED: "Doğrulandı",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıya alındı",
};

const appointmentLabels: Record<string, string> = {
  PENDING: "Yeni talep",
  VIEWED_BY_CLINIC: "Görüldü",
  INFO_REQUESTED: "Ek bilgi istendi",
  APPROVED: "Onaylandı",
  ALTERNATIVE_TIME_PROPOSED: "Alternatif saat önerildi",
  PATIENT_CONFIRMED: "Hasta onayladı",
  CANCELLED: "İptal edildi",
  COMPLETED: "Tamamlandı",
  NO_SHOW: "Katılım olmadı",
};

export default async function ClinicPanelPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const user = await requireUser(["CLINIC_MANAGER", "DENTIST", "MODERATOR", "SUPER_ADMIN"]);
  const membership = await getActiveClinicMembership(user.id);

  if (!membership) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-lg border border-amber-200 bg-amber-50 p-6"><h1 className="text-2xl font-semibold text-amber-950">Bağlı klinik bulunamadı</h1><p className="mt-2 text-sm leading-6 text-amber-900">Hesabınızda klinik yetkisi var ancak henüz bir klinik ekibine bağlanmamış. DişçiBul şu anda yeni klinik başvurusu almıyor.</p></div></main>;
  }

  const clinic = membership.clinic;
  const [appointments, quoteRequests, prices, analytics, teamCount, treatmentOptions, treatmentCapabilities, unreadNotifications, conversations, memberships, googleBusiness, googleConnection] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: { clinicId: clinic.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.quoteRequestClinic.findMany({
      where: { clinicId: clinic.id },
      include: { quoteRequest: { include: { attachments: { where: { deletedAt: null, scanStatus: "CLEAN" }, select: { id: true, originalName: true, sizeBytes: true } } } }, response: true },
      orderBy: { quoteRequest: { createdAt: "desc" } },
      take: 20,
    }),
    prisma.treatmentPrice.findMany({
      where: { clinicId: clinic.id },
      include: { treatment: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      where: { clinicId: clinic.id },
      _count: { _all: true },
    }),
    prisma.clinicTeamMember.count({ where: { clinicId: clinic.id } }),
    prisma.treatment.findMany({
      select: { slug: true, name: true, pricingUnit: true },
      orderBy: { name: "asc" },
    }),
    prisma.clinicTreatment.findMany({
      where: { clinicId: clinic.id, status: "APPROVED" },
      select: { availability: true, treatment: { select: { slug: true } } },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.conversation.findMany({ where: { clinicId: clinic.id }, select: { id: true, userId: true } }),
    prisma.clinicTeamMember.findMany({ where: { userId: user.id }, include: { clinic: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.googleBusinessOauthConnection.findUnique({
      where: { clinicId: clinic.id },
      select: { googleLocationName: true, googleLocationTitle: true, lastSyncedAt: true, lastError: true, revokedAt: true },
    }),
    prisma.googlePlaceConnection.findUnique({
      where: { clinicId: clinic.id },
      select: { googleRating: true, googleUserRatingsTotal: true, googleSyncStatus: true },
    }),
  ]);
  const oauthResult = (await searchParams).google ?? null;
  const conversationByPatient = new Map(conversations.map((conversation) => [conversation.userId, conversation.id]));

  const analyticsMap = new Map(analytics.map((item) => [item.type, item._count._all]));
  const openAppointments = appointments.filter((item) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(item.status)).length;
  const unansweredQuotes = quoteRequests.filter((item) => !item.response).length;
  const responseRate = quoteRequests.length ? Math.round(((quoteRequests.length - unansweredQuotes) / quoteRequests.length) * 100) : 0;
  const statCards = [
    { label: "Profil görüntülenmesi", value: String(analyticsMap.get("PROFILE_VIEW") ?? 0), detail: "Son ölçülen toplam", icon: Eye },
    { label: "Açık randevu", value: String(openAppointments), detail: `${appointments.length} toplam talep`, icon: CalendarClock },
    { label: "Yanıt bekleyen teklif", value: String(unansweredQuotes), detail: `%${responseRate} yanıt oranı`, icon: MessageSquareText },
    { label: "Ekip üyesi", value: String(teamCount), detail: "Klinik erişimi olan kullanıcı", icon: UsersRound },
  ];

  const setupItems = [
    { label: "Klinik temel bilgileri", done: Boolean(clinic.name && clinic.city && clinic.district && clinic.phone) },
    { label: "İlk muayene ücreti", done: clinic.freeInitialExam || clinic.firstExamFee !== null },
    { label: "En az bir tedavi fiyatı", done: prices.length > 0 },
    { label: "Google işletme bağlantısı", done: Boolean(googleBusiness?.googleLocationName && googleConnection?.googleSyncStatus === "OK") },
    { label: "Klinik doğrulaması", done: clinic.verificationStatus === "VERIFIED" },
  ];
  const completion = Math.round((setupItems.filter((item) => item.done).length / setupItems.length) * 100);

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-sm font-semibold text-blue-700">Klinik yönetimi</p><h1 className="mt-2 text-3xl font-semibold text-blue-950">{clinic.name}</h1><p className="mt-2 text-sm text-slate-600">{clinic.city}, {clinic.district} · {user.name} olarak giriş yaptınız</p></div>
            <div className="flex flex-wrap items-center gap-3">
              <ClinicSwitcher activeClinicId={clinic.id} memberships={memberships.map((item) => ({ clinicId: item.clinicId, name: item.clinic.name, role: item.role }))} />
              <Link href="/panel/klinik/organizasyon" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-900"><UsersRound className="h-4 w-4" /> Organizasyon</Link>
              <Link href="/panel/klinik/operasyon" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-900"><CalendarCog className="h-4 w-4" /> Operasyon</Link>
              <Link href="/panel/klinik/mesajlar" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-900"><MessageSquareText className="h-4 w-4" /> Hasta mesajları</Link>
              <Link href="/panel/klinik/bildirimler" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-900"><Bell className="h-4 w-4" /> Bildirimler{unreadNotifications ? ` (${unreadNotifications})` : ""}</Link>
              {membership.role === "CLINIC_MANAGER" ? <Link href="/panel/klinik/abonelik" className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900"><CreditCard className="h-4 w-4" /> Plan ve abonelik</Link> : null}
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{verificationLabels[clinic.verificationStatus]}</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, detail, icon: Icon }) => <div key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-blue-950">{value}</p></div><Icon className="h-5 w-5 text-blue-700" /></div><p className="mt-3 text-xs text-slate-500">{detail}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8">
        <div className="min-w-0 space-y-8">
          {membership.role === "CLINIC_MANAGER" ? (
            <section className="grid gap-5">
              <ClinicProfileForm clinic={{
                name: clinic.name,
                description: clinic.description ?? "",
                foundingYear: clinic.foundingYear,
                city: clinic.city,
                district: clinic.district,
                neighborhood: clinic.neighborhood ?? "",
                address: clinic.address,
                phone: clinic.phone ?? "",
                whatsapp: clinic.whatsapp ?? "",
                email: clinic.email ?? "",
                website: clinic.website ?? "",
                freeInitialExam: clinic.freeInitialExam,
                firstExamFee: clinic.firstExamFee === null ? null : Number(clinic.firstExamFee),
                initialExamIncludes: clinic.initialExamIncludes,
                languages: clinic.languages,
                paymentOptions: clinic.paymentOptions,
                emergencyService: clinic.emergencyService,
                wheelchairAccess: clinic.wheelchairAccess,
                parking: clinic.parking,
                onlineConsultation: clinic.onlineConsultation,
                childFriendly: clinic.childFriendly,
                sedation: clinic.sedation,
              }} />
              <TreatmentCapabilityManager
                treatments={treatmentOptions}
                capabilities={treatmentCapabilities.map((item) => ({ slug: item.treatment.slug, availability: item.availability }))}
              />
              <TreatmentPriceForm treatments={treatmentOptions} />
            </section>
          ) : null}

          <section>
            <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Randevu talepleri</h2></div>
            {appointments.length ? <div className="mt-4 grid gap-3">{appointments.map((appointment) => <article key={appointment.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{appointment.requesterName}</p><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{appointmentLabels[appointment.status]}</span></div><p className="mt-1 text-sm text-slate-600">{appointment.treatmentName} · {appointment.requesterPhone}</p><p className="mt-1 text-xs text-slate-500">{formatDate(appointment.createdAt.toISOString())}{appointment.preferredDate ? ` · Tercih: ${formatDate(appointment.preferredDate.toISOString())}` : ""}</p>{appointment.note ? <p className="mt-2 text-sm text-slate-600">Not: {appointment.note}</p> : null}{appointment.userId && conversationByPatient.get(appointment.userId) ? <Link href={`/panel/klinik/mesajlar?konusma=${conversationByPatient.get(appointment.userId)}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"><MessageSquareText className="h-4 w-4" /> Hastaya mesaj yaz</Link> : null}</div><AppointmentStatusAction id={appointment.id} currentStatus={appointment.status} /></div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white p-6 text-center text-sm text-slate-500">Henüz randevu talebi yok.</div>}
          </section>

          <section>
            <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Fiyat teklifi talepleri</h2></div>
            {quoteRequests.length ? <div className="mt-4 grid gap-3">{quoteRequests.map((item) => <article key={item.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{item.quoteRequest.requesterName}</p><p className="mt-1 text-sm text-slate-600">{item.quoteRequest.treatmentName} · {item.quoteRequest.city}</p><p className="mt-1 text-xs text-slate-500">{item.quoteRequest.requesterPhone} · {item.quoteRequest.requesterEmail} · {formatDate(item.quoteRequest.createdAt.toISOString())}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.response ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{item.response ? "Teklif iletildi" : "Yanıt bekliyor"}</span></div><p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item.quoteRequest.complaint}</p>{item.quoteRequest.attachments.length ? <div className="mt-3 flex flex-wrap gap-2">{item.quoteRequest.attachments.map((file) => <a key={file.id} href={`/api/private-files/${file.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"><FileDown className="h-3.5 w-3.5" />{file.originalName} · {Math.max(1, Math.ceil(file.sizeBytes / 1024))} KB</a>)}</div> : null}<div className="mt-3 flex flex-wrap items-center gap-2"><QuoteResponseForm id={item.id} hasResponse={Boolean(item.response)} />{item.quoteRequest.userId && conversationByPatient.get(item.quoteRequest.userId) ? <Link href={`/panel/klinik/mesajlar?konusma=${conversationByPatient.get(item.quoteRequest.userId)}`} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700"><MessageSquareText className="h-4 w-4" /> Hastayla görüş</Link> : null}</div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white p-6 text-center text-sm text-slate-500">Henüz teklif talebi yok.</div>}
          </section>

          <section>
            <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Fiyat kayıtları</h2></div>
            {prices.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-blue-100 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b border-blue-100 bg-blue-50/60 text-xs text-slate-500"><tr><th className="px-4 py-3">Tedavi</th><th className="px-4 py-3">Fiyat</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Kapsam</th><th className="px-4 py-3">Güncelleme</th></tr></thead><tbody className="divide-y divide-slate-100">{prices.map((price) => <tr key={price.id}><td className="px-4 py-3 font-medium text-slate-950">{price.treatment.name}</td><td className="px-4 py-3 text-slate-700">{price.fixedPrice ? formatMoney(Number(price.fixedPrice)) : `${formatMoney(Number(price.minPrice ?? 0))} - ${formatMoney(Number(price.maxPrice ?? 0))}`}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${price.moderationStatus === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{price.moderationStatus === "APPROVED" ? "Yayında" : price.moderationStatus === "PENDING" ? "İncelemede" : price.moderationStatus}</span></td><td className="px-4 py-3 text-slate-600">{price.packageContent ?? "Kapsam bilgisi eksik"}</td><td className="px-4 py-3 text-slate-500">{formatDate(price.updatedAt.toISOString())}</td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Henüz tedavi fiyatı eklenmedi. Profil yayına alınmadan önce en az bir güncel fiyat ve kapsam bilgisi ekleyin.</div>}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          {membership.role === "CLINIC_MANAGER" ? <GoogleBusinessSettings
            configured={isGoogleBusinessConfigured()}
            connected={Boolean(googleBusiness && !googleBusiness.revokedAt)}
            locationTitle={googleBusiness?.googleLocationTitle ?? null}
            locationName={googleBusiness?.googleLocationName ?? null}
            rating={googleConnection?.googleRating === null || googleConnection?.googleRating === undefined ? null : Number(googleConnection.googleRating)}
            reviewCount={googleConnection?.googleUserRatingsTotal ?? null}
            lastSyncedAt={googleBusiness?.lastSyncedAt?.toISOString() ?? null}
            lastError={googleBusiness?.lastError ?? null}
            oauthResult={oauthResult}
          /> : null}
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-700" /><h2 className="font-semibold text-blue-950">Profil hazırlığı</h2></div><span className="text-sm font-semibold text-blue-700">%{completion}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full bg-blue-700" style={{ width: `${completion}%` }} /></div><div className="mt-4 grid gap-3">{setupItems.map((item) => <div key={item.label} className="flex gap-2 text-sm"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.done ? "text-emerald-700" : "text-slate-300"}`} /><span className={item.done ? "text-slate-700" : "text-slate-500"}>{item.label}</span></div>)}</div></div>
          {membership.role === "CLINIC_MANAGER" && clinic.verificationStatus !== "IN_REVIEW" ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-semibold text-emerald-950">Yayın onayı</h2><p className="mt-1 text-sm leading-6 text-emerald-900">Profil ve fiyat bilgilerini tamamladıktan sonra moderasyon incelemesine gönderin.</p><div className="mt-4"><SubmitClinicReviewButton /></div></div> : null}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-semibold text-emerald-950">Yetkili klinik görünümü</p><p className="mt-1 text-sm leading-6 text-emerald-900">Bu ekranda yalnızca ekibine bağlı olduğunuz kliniğin hasta talepleri gösterilir.</p></div></div></div>
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-700" /><h2 className="font-semibold text-blue-950">Operasyon özeti</h2></div><p className="mt-3 text-sm leading-6 text-slate-600">Önce {unansweredQuotes} yanıtsız teklif ve {openAppointments} açık randevu talebini sonuçlandırın. Hızlı ve açık yanıtlar hasta deneyimini doğrudan iyileştirir.</p></div>
        </aside>
      </section>
    </main>
  );
}
