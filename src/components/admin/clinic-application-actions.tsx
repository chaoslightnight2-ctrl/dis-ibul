"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Decision = "VERIFIED" | "ADDITIONAL_DOCUMENT_REQUIRED" | "REJECTED";

export function ClinicApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [message, setMessage] = useState("");

  async function decide(decision: Decision) {
    if (decision !== "VERIFIED" && !note.trim()) {
      setMessage("Ek belge veya ret kararı için açıklama yazın.");
      return;
    }
    setBusy(decision);
    setMessage("");
    const response = await fetch(`/api/admin/clinic-applications/${applicationId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note.trim() || undefined }),
    });
    const data = await response.json() as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setMessage(data.error === "PROFILE_INCOMPLETE" ? "Klinik profili veya fiyat bilgisi eksik." : "Karar kaydedilemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid min-w-64 gap-2">
      <label className="grid gap-1 text-xs font-medium text-slate-600">
        Moderasyon notu
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900" />
      </label>
      <div className="grid grid-cols-3 gap-1">
        <button type="button" disabled={Boolean(busy)} onClick={() => void decide("VERIFIED")} className="rounded-md bg-emerald-700 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Onayla</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => void decide("ADDITIONAL_DOCUMENT_REQUIRED")} className="rounded-md border border-amber-300 px-2 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50">Belge iste</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => void decide("REJECTED")} className="rounded-md border border-red-300 px-2 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">Reddet</button>
      </div>
      {message ? <p role="status" className="text-xs text-red-700">{message}</p> : null}
    </div>
  );
}
