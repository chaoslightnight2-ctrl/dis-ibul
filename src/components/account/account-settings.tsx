"use client";

import { Download, Save, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

type Preferences = {
  appointmentUpdates: boolean;
  quoteUpdates: boolean;
  productNews: boolean;
};

type AccountSettingsProps = {
  initialPreferences: Preferences;
  hasPendingDeletion: boolean;
};

export function AccountSettings({ initialPreferences, hasPendingDeletion }: AccountSettingsProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [pendingDeletion, setPendingDeletion] = useState(hasPendingDeletion);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"preferences" | "deletion" | "cancel" | null>(null);

  async function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    setBusy("preferences");
    setMessage("");
    const response = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    setBusy(null);
    setMessage(response.ok ? "Bildirim tercihleri kaydedildi." : "Tercihler kaydedilemedi. Lütfen tekrar deneyin.");
  }

  async function requestDeletion() {
    if (!confirmed) return;
    setBusy("deletion");
    setMessage("");
    const response = await fetch("/api/account/deletion-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "HESABIMI_SIL" }),
    });
    setBusy(null);
    if (response.ok) {
      setPendingDeletion(true);
      setConfirmed(false);
      setMessage("Hesap silme talebiniz alındı.");
    } else {
      setMessage("Silme talebi oluşturulamadı. Lütfen tekrar deneyin.");
    }
  }

  async function cancelDeletion() {
    setBusy("cancel");
    setMessage("");
    const response = await fetch("/api/account/deletion-request", { method: "DELETE" });
    setBusy(null);
    if (response.ok) {
      setPendingDeletion(false);
      setMessage("Hesap silme talebi iptal edildi.");
    } else {
      setMessage("Talep iptal edilemedi. Lütfen tekrar deneyin.");
    }
  }

  const options: Array<{ key: keyof Preferences; title: string; detail: string }> = [
    { key: "appointmentUpdates", title: "Randevu güncellemeleri", detail: "Klinik talebinizi gördüğünde veya durumu değiştirdiğinde." },
    { key: "quoteUpdates", title: "Fiyat teklifi güncellemeleri", detail: "Seçtiğiniz kliniklerden yeni bir teklif geldiğinde." },
    { key: "productNews", title: "DişçiBul yenilikleri", detail: "Yeni özellikler ve isteğe bağlı tanıtım iletileri." },
  ];

  return (
    <div className="grid gap-10">
      <section aria-labelledby="notification-heading">
        <h2 id="notification-heading" className="text-xl font-semibold text-blue-950">Bildirim tercihleri</h2>
        <p className="mt-1 text-sm text-slate-600">Hangi hesap güncellemelerini almak istediğinizi seçin.</p>
        <form method="post" onSubmit={savePreferences} className="mt-5 grid gap-3">
          {options.map((option) => (
            <label key={option.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-blue-100 bg-white p-4">
              <span>
                <span className="block font-medium text-slate-950">{option.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{option.detail}</span>
              </span>
              <input
                type="checkbox"
                checked={preferences[option.key]}
                onChange={(event) => setPreferences((current) => ({ ...current, [option.key]: event.target.checked }))}
                className="mt-1 h-5 w-5 shrink-0 accent-blue-700"
              />
            </label>
          ))}
          <button disabled={busy !== null} className="mt-1 inline-flex w-fit items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400">
            <Save className="h-4 w-4" /> {busy === "preferences" ? "Kaydediliyor" : "Tercihleri kaydet"}
          </button>
        </form>
      </section>

      <section aria-labelledby="data-heading" className="border-t border-blue-100 pt-8">
        <h2 id="data-heading" className="text-xl font-semibold text-blue-950">Hesap verilerim</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Profilinizi, taleplerinizi, tekliflerinizi, favorilerinizi ve onay kayıtlarınızı JSON dosyası olarak indirebilirsiniz.</p>
        <a href="/api/account/export" download className="mt-4 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">
          <Download className="h-4 w-4" /> Verilerimi indir
        </a>
      </section>

      <section aria-labelledby="deletion-heading" className="border-t border-red-100 pt-8">
        <h2 id="deletion-heading" className="text-xl font-semibold text-slate-950">Hesap silme</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Talebiniz incelemeye alınır. Sağlık hizmeti süreci, güvenlik ve yasal saklama zorunlulukları bulunan kayıtlar süreleri dolana kadar erişimi kısıtlı biçimde korunabilir.</p>
        {pendingDeletion ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-950">Silme talebiniz inceleniyor.</p>
            <p className="mt-1 text-sm text-amber-900">İşlem başlamadan talebinizi buradan iptal edebilirsiniz.</p>
            <button type="button" onClick={cancelDeletion} disabled={busy !== null} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-950 disabled:text-slate-500">
              <Undo2 className="h-4 w-4" /> {busy === "cancel" ? "İptal ediliyor" : "Silme talebini iptal et"}
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="flex max-w-2xl items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-red-700" />
              Hesabıma erişimi kaybedeceğimi ve aktif taleplerimin etkilenebileceğini anlıyorum.
            </label>
            <button type="button" onClick={requestDeletion} disabled={!confirmed || busy !== null} className="inline-flex w-fit items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:border-slate-200 disabled:text-slate-400">
              <Trash2 className="h-4 w-4" /> {busy === "deletion" ? "Talep oluşturuluyor" : "Hesabımı silme talebi oluştur"}
            </button>
          </div>
        )}
      </section>

      {message ? <p aria-live="polite" className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{message}</p> : null}
    </div>
  );
}
