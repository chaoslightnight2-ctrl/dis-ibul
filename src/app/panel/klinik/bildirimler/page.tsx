import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { requireUser } from "@/lib/session";

export default async function ClinicNotificationsPage() {
  await requireUser(["CLINIC_MANAGER", "DENTIST"]);
  return <main className="min-h-[70vh] bg-blue-50/30"><section className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><Link href="/panel/klinik" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" /> Klinik paneline dön</Link><NotificationsCenter audience="clinic" /></section></main>;
}
