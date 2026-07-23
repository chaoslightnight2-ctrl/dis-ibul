"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Link2, RefreshCw, Unlink } from "lucide-react";

type Location = {
  resourceName: string;
  title: string;
  phone: string | null;
  address: string;
};

type Props = {
  configured: boolean;
  connected: boolean;
  locationTitle: string | null;
  locationName: string | null;
  rating: number | null;
  reviewCount: number | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  oauthResult: string | null;
};

const oauthMessages: Record<string, string> = {
  connected: "Google hesabı bağlandı. Şimdi bu kliniğe ait işletmeyi seçin.",
  denied: "Google bağlantı izni verilmedi.",
  "invalid-state": "Bağlantı isteğinin süresi doldu. Yeniden deneyin.",
  "session-expired": "Oturum süresi doldu. Yeniden giriş yaptıktan sonra deneyin.",
  unauthorized: "Bu klinik için yönetici yetkisi bulunamadı.",
  "refresh-token-missing": "Google kalıcı erişim izni vermedi. Bağlantıyı yeniden başlatın.",
  "connection-failed": "Google hesabı bağlanamadı. Yapılandırmayı ve hesabın yetkisini kontrol edin.",
  "configuration-missing": "Google İşletme Profili bağlantısı sunucuda etkin değil.",
};

export function GoogleBusinessSettings(props: Props) {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState(props.locationName ?? "");
  const [busy, setBusy] = useState<"locations" | "save" | "sync" | "disconnect" | null>(null);
  const [message, setMessage] = useState(props.oauthResult ? oauthMessages[props.oauthResult] ?? "" : "");

  async function loadLocations() {
    setBusy("locations");
    setMessage("");
    const response = await fetch("/api/clinic/google-business/locations", { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { locations?: Location[]; error?: string };
    setBusy(null);
    if (!response.ok) {
      setMessage(payload.error === "TOKEN_REFRESH_401" ? "Google erişimi sona ermiş. Hesabı yeniden bağlayın." : "Yetkili işletmeler alınamadı.");
      return;
    }
    setLocations(payload.locations ?? []);
    if (!selected && payload.locations?.length === 1) setSelected(payload.locations[0].resourceName);
    setMessage(payload.locations?.length ? "Google hesabınızdaki işletmeler listelendi." : "Bu Google hesabında yönetebildiğiniz işletme bulunamadı.");
  }

  async function saveLocation() {
    if (!selected) return;
    setBusy("save");
    setMessage("");
    const response = await fetch("/api/clinic/google-business/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceName: selected }),
    });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setBusy(null);
    setMessage(response.ok ? "İşletme bağlandı; puan ve son yorumlar güncellendi." : payload.error === "LOCATION_ALREADY_CONNECTED" ? "Bu Google işletmesi başka bir kliniğe bağlı." : "İşletme bağlanamadı.");
    if (response.ok) router.refresh();
  }

  async function sync() {
    setBusy("sync");
    setMessage("");
    const response = await fetch("/api/clinic/google-business/sync", { method: "POST" });
    setBusy(null);
    setMessage(response.ok ? "Google puanı ve yorumlar güncellendi." : "Senkronizasyon tamamlanamadı. Google erişimini kontrol edin.");
    if (response.ok) router.refresh();
  }

  async function disconnect() {
    if (!window.confirm("Google İşletme Profili bağlantısı ve alınan yorumlar kaldırılsın mı?")) return;
    setBusy("disconnect");
    const response = await fetch("/api/clinic/google-business", { method: "DELETE" });
    setBusy(null);
    setMessage(response.ok ? "Google bağlantısı kaldırıldı." : "Bağlantı kaldırılamadı.");
    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div>
          <h2 className="font-semibold text-blue-950">Google İşletme Profili</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Yalnızca yönettiğiniz doğrulanmış işletmeyi bağlayın. Google puanı ve en son 50 yorum resmi API üzerinden alınır.</p>
        </div>
      </div>

      {!props.configured ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">Bağlantı sunucuda henüz etkinleştirilmedi. Google Cloud OAuth bilgileri ve Business Profile API erişimi yapılandırılmalı.</p>
      ) : !props.connected ? (
        <a href="/api/clinic/google-business/connect" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          <Link2 className="h-4 w-4" /> Google hesabını bağla
        </a>
      ) : (
        <div className="mt-4 grid gap-3">
          {props.locationName ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
              <p className="font-semibold">{props.locationTitle || "Bağlı Google işletmesi"}</p>
              <p className="mt-1">{props.rating === null ? "Puan bilgisi yok" : `${props.rating.toFixed(1)} / 5`} · {props.reviewCount ?? 0} değerlendirme</p>
              <p className="mt-1 text-xs text-emerald-800">Son güncelleme: {props.lastSyncedAt ? new Date(props.lastSyncedAt).toLocaleString("tr-TR") : "Henüz yapılmadı"}</p>
              {props.lastError ? <p className="mt-2 text-xs font-medium text-red-700">Son hata: {props.lastError}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadLocations} disabled={busy !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 disabled:opacity-50">
              <Building2 className="h-4 w-4" /> {busy === "locations" ? "İşletmeler alınıyor" : props.locationName ? "İşletmeyi değiştir" : "İşletmeleri getir"}
            </button>
            {props.locationName ? <button type="button" onClick={sync} disabled={busy !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy === "sync" ? "animate-spin" : ""}`} /> Yorumları güncelle</button> : null}
            <button type="button" onClick={disconnect} disabled={busy !== null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><Unlink className="h-4 w-4" /> Bağlantıyı kaldır</button>
          </div>

          {locations.length ? (
            <div className="grid gap-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700">Bu kliniğe ait işletme
                <select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-10 w-full min-w-0 max-w-full rounded-md border border-blue-200 px-3 py-2">
                  <option value="">İşletme seçin</option>
                  {locations.map((location) => <option key={location.resourceName} value={location.resourceName}>{location.title} · {location.address}</option>)}
                </select>
              </label>
              <button type="button" onClick={saveLocation} disabled={!selected || busy !== null} className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === "save" ? "Doğrulanıyor ve senkronize ediliyor" : "Seçilen işletmeyi bağla"}</button>
            </div>
          ) : null}
        </div>
      )}
      {message ? <p aria-live="polite" className="mt-3 text-sm font-medium text-blue-800">{message}</p> : null}
    </section>
  );
}
