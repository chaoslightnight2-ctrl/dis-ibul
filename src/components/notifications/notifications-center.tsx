"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function safeInternalHref(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function NotificationsCenter({ audience }: { audience: "patient" | "clinic" }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications?limit=50", { cache: "no-store" });
    if (!response.ok) throw new Error("Bildirimler yüklenemedi.");
    const data = await response.json() as { notifications: NotificationItem[]; unreadCount: number };
    setItems(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void load()
        .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Bildirimler yüklenemedi."))
        .finally(() => active && setLoading(false));
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function openNotification(item: NotificationItem) {
    setError("");
    if (!item.readAt) {
      const response = await fetch(`/api/notifications/${encodeURIComponent(item.id)}/read`, { method: "PATCH" });
      if (!response.ok) return setError("Bildirim güncellenemedi.");
      setItems((current) => current.map((value) => value.id === item.id ? { ...value, readAt: new Date().toISOString() } : value));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    const href = safeInternalHref(item.href);
    if (href) router.push(href);
  }

  async function markAllRead() {
    setError("");
    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    if (!response.ok) return setError("Bildirimler güncellenemedi.");
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    setUnreadCount(0);
  }

  if (loading) return <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">Bildirimler yükleniyor…</div>;

  return (
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-4 py-4 sm:px-5">
        <div><h2 className="font-semibold text-blue-950">Bildirimler</h2><p className="mt-0.5 text-xs text-slate-500">{unreadCount ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}</p></div>
        <button type="button" onClick={markAllRead} disabled={!unreadCount} className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400"><CheckCheck className="h-4 w-4" /> Tümünü okundu say</button>
      </div>
      {items.length ? <div className="divide-y divide-slate-100">{items.map((item) => (
        <button key={item.id} type="button" onClick={() => openNotification(item)} className={`block w-full px-4 py-4 text-left hover:bg-blue-50/70 sm:px-5 ${item.readAt ? "bg-white" : "bg-blue-50/50"}`}>
          <span className="flex items-start gap-3"><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md ${item.readAt ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-700"}`}><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-start justify-between gap-2"><span className="font-medium text-slate-950">{item.title}</span><span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span></span>{item.body ? <span className="mt-1 block text-sm leading-6 text-slate-600">{item.body}</span> : null}</span>{!item.readAt ? <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-700" aria-label="Okunmamış" /> : null}</span>
        </button>
      ))}</div> : <div className="px-6 py-14 text-center"><Bell className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Henüz bildirim yok</p><p className="mt-1 text-xs text-slate-500">Randevu, teklif ve mesaj güncellemeleri burada görünür.</p></div>}
      {error ? <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p> : null}
      <div className="border-t border-blue-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">{audience === "patient" ? "Yalnızca hesabınıza ait hasta işlemleri gösterilir." : "Yalnızca yetkili olduğunuz klinik işlemleri gösterilir."}</div>
    </section>
  );
}
