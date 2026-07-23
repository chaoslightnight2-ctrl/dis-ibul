"use client";

import { Settings2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

const cookieName = "discibul_consent";

function currentConsent() {
  if (typeof document === "undefined") return null;
  const value = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.split("=").slice(1).join("=");
  return value ? decodeURIComponent(value) : null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const consent = currentConsent();
      setAnalytics(consent === "v1.analytics");
      setVisible(!consent);
    }, 0);
    const openSettings = () => { setSettingsOpen(true); setVisible(true); };
    window.addEventListener("discibul:open-cookie-settings", openSettings);
    return () => { window.clearTimeout(initialize); window.removeEventListener("discibul:open-cookie-settings", openSettings); };
  }, []);

  function save(allowAnalytics: boolean) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${cookieName}=${allowAnalytics ? "v1.analytics" : "v1.necessary"}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setAnalytics(allowAnalytics);
    setVisible(false);
    setSettingsOpen(false);
    window.location.reload();
  }

  if (!visible) return null;
  return <aside role="dialog" aria-modal="true" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-blue-200 bg-white p-5 shadow-2xl sm:bottom-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h2 id="cookie-title" className="font-semibold text-blue-950">Çerez tercihleri</h2><p className="mt-1 text-sm leading-6 text-slate-600">Zorunlu çerezler oturum ve güvenlik için kullanılır. Analitik çerezleri yalnızca izin verirseniz etkinleşir.</p></div>{currentConsent() ? <button type="button" onClick={() => setVisible(false)} aria-label="Tercih merkezini kapat" title="Kapat" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button> : null}</div>{settingsOpen ? <div className="mt-4 grid gap-3 border-y border-blue-100 py-4"><label className="flex items-start justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-900">Zorunlu</span><span className="block text-xs leading-5 text-slate-500">Oturum, güvenlik ve tercih kaydı.</span></span><input type="checkbox" checked disabled aria-label="Zorunlu çerezler her zaman açık" /></label><label className="flex items-start justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-900">Analitik</span><span className="block text-xs leading-5 text-slate-500">Hangi klinik profillerinin görüntülendiğini toplu olarak ölçer.</span></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label></div> : null}<div className="mt-4 flex flex-wrap gap-2">{settingsOpen ? <button type="button" onClick={() => save(analytics)} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Tercihleri kaydet</button> : <><button type="button" onClick={() => save(true)} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Tümünü kabul et</button><button type="button" onClick={() => save(false)} className="rounded-md border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800">Yalnızca zorunlu</button><button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700"><Settings2 className="h-4 w-4" /> Ayarla</button></>}</div></div></div></aside>;
}

export function CookieSettingsButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("discibul:open-cookie-settings"))} className="text-sm text-slate-500 hover:text-blue-700">Çerez tercihleri</button>;
}
