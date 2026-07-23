"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const errorMessages: Record<string, string> = {
  EMAIL_MISMATCH: "Bu davet farklı bir e-posta adresine gönderilmiş. Davet edilen hesapla giriş yapın.",
  INVITATION_INVALID: "Bu davetin süresi dolmuş, kullanılmış veya iptal edilmiş.",
};

export function ClinicInvitationAction({ token }: { token: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function accept() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/clinic-invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
    const data = await response.json().catch(() => null) as { error?: string; redirectTo?: string } | null;
    setSaving(false);
    if (!response.ok) return setMessage(errorMessages[data?.error ?? ""] ?? "Davet kabul edilemedi.");
    router.push(data?.redirectTo ?? "/panel/klinik");
    router.refresh();
  }

  return <div><button type="button" onClick={accept} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"><CheckCircle2 className="h-4 w-4" /> {saving ? "Ekibe katılınıyor" : "Daveti kabul et"}</button>{message ? <p role="alert" className="mt-3 text-sm text-red-700">{message}</p> : null}</div>;
}
