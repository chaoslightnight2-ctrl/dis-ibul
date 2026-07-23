import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { MessagingInbox } from "@/components/messaging/messaging-inbox";
import { requireUser } from "@/lib/session";

export default async function PatientMessagesPage({ searchParams }: { searchParams: Promise<{ konusma?: string | string[] }> }) {
  await requireUser(["PATIENT"]);
  const params = await searchParams;
  const conversationId = Array.isArray(params.konusma) ? params.konusma[0] : params.konusma;

  return <main className="min-h-[70vh] bg-blue-50/30"><section className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><Link href="/panel/hasta" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" /> Tedavi sürecime dön</Link><div className="mt-4 flex items-center gap-3"><MessageSquareText className="h-6 w-6 text-blue-700" /><div><h1 className="text-2xl font-semibold text-blue-950">Klinik mesajlarım</h1><p className="mt-1 text-sm text-slate-600">Randevu ve teklif ayrıntılarını ilgili klinikle güvenli biçimde görüşün.</p></div></div></div></section><section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><MessagingInbox audience="patient" initialConversationId={conversationId} /></section></main>;
}
