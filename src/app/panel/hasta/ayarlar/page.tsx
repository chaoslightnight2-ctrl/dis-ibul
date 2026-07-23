import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";
import { AccountSettings } from "@/components/account/account-settings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type Preferences = {
  appointmentUpdates?: boolean;
  quoteUpdates?: boolean;
  productNews?: boolean;
};

export default async function PatientSettingsPage() {
  const user = await requireUser(["PATIENT"]);
  const [profile, pendingDeletion] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { userId: user.id } }),
    prisma.dataDeletionRequest.findFirst({ where: { userId: user.id, status: "PENDING" } }),
  ]);
  const stored = (profile?.notificationPreferences ?? {}) as Preferences;
  const initialPreferences = {
    appointmentUpdates: stored.appointmentUpdates ?? true,
    quoteUpdates: stored.quoteUpdates ?? true,
    productNews: stored.productNews ?? profile?.marketingConsent ?? false,
  };

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/panel/hasta" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><ArrowLeft className="h-4 w-4" /> Tedavi sürecime dön</Link>
          <h1 className="mt-4 text-3xl font-semibold text-blue-950">Hesap ve gizlilik</h1>
          <p className="mt-2 text-sm text-slate-600">Bildirimlerinizi ve kişisel veri taleplerinizi tek yerden yönetin.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-slate-700">{user.email}</span>
            <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 ${user.emailVerified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
              {user.emailVerified ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
              {user.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulanmadı"}
            </span>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <AccountSettings initialPreferences={initialPreferences} hasPendingDeletion={Boolean(pendingDeletion)} />
      </div>
    </main>
  );
}
