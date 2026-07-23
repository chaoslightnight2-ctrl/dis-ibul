"use client";

import Link from "next/link";
import { MessageSquareText, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ConversationSummary = {
  id: string;
  title: string;
  subtitle: string;
  clinicSlug: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { id: string; body: string; createdAt: string } | null;
};

type Message = {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  readAt: string | null;
  createdAt: string;
};

type ConversationDetail = {
  conversation: { id: string; title: string; subtitle: string; clinicSlug: string };
  messages: Message[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MessagingInbox({
  audience,
  initialConversationId,
}: {
  audience: "patient" | "clinic";
  initialConversationId?: string;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "");
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/conversations", { cache: "no-store" });
    if (!response.ok) throw new Error("Konuşmalar yüklenemedi.");
    const data = await response.json() as { conversations: ConversationSummary[] };
    setConversations(data.conversations);
    setSelectedId((current) => current || data.conversations[0]?.id || "");
  }, []);

  const loadMessages = useCallback(async (conversationId: string, quiet = false) => {
    if (!conversationId) {
      setDetail(null);
      return;
    }
    if (!quiet) setLoading(true);
    const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 404 ? "Bu konuşmaya erişiminiz yok." : "Mesajlar yüklenemedi.");
    setDetail(await response.json() as ConversationDetail);
    if (!quiet) setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadConversations()
        .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Konuşmalar yüklenemedi."))
        .finally(() => active && setLoading(false));
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const initialTimer = window.setTimeout(() => {
      void loadMessages(selectedId)
        .then(() => loadConversations())
        .catch((caught: unknown) => active && setError(caught instanceof Error ? caught.message : "Mesajlar yüklenemedi."));
    }, 0);
    const timer = window.setInterval(() => {
      void loadMessages(selectedId, true).catch(() => undefined);
      void loadConversations().catch(() => undefined);
    }, 15_000);
    return () => {
      active = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadConversations, loadMessages, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [detail?.messages.length]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = String(data.get("body") ?? "").trim();
    if (!body) return;

    setSending(true);
    setError("");
    const response = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!response.ok) {
      setError(response.status === 429 ? "Çok hızlı mesaj gönderiyorsunuz. Biraz bekleyin." : "Mesaj gönderilemedi.");
      return;
    }
    form.reset();
    await Promise.all([loadMessages(selectedId), loadConversations()]);
  }

  async function refresh() {
    setError("");
    try {
      await Promise.all([loadConversations(), selectedId ? loadMessages(selectedId) : Promise.resolve()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mesajlar yenilenemedi.");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm lg:grid lg:min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-blue-100 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between border-b border-blue-100 px-4">
          <div><h2 className="font-semibold text-blue-950">Konuşmalar</h2><p className="text-xs text-slate-500">{conversations.length} klinik görüşmesi</p></div>
          <button type="button" onClick={refresh} aria-label="Mesajları yenile" title="Mesajları yenile" className="grid h-9 w-9 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="max-h-72 overflow-y-auto lg:max-h-[554px]">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50/70 ${selectedId === conversation.id ? "bg-blue-50" : "bg-white"}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-950">{conversation.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.subtitle}</span></span>
                {conversation.unreadCount ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-700 px-1 text-[11px] font-semibold text-white">{conversation.unreadCount}</span> : null}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500"><span className="truncate">{conversation.lastMessage?.body ?? "Henüz mesaj yok"}</span><span className="shrink-0">{formatDate(conversation.updatedAt)}</span></span>
            </button>
          ))}
          {!conversations.length && !loading ? <div className="px-5 py-10 text-center"><MessageSquareText className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Henüz konuşmanız yok</p><p className="mt-1 text-xs leading-5 text-slate-500">Bir randevu veya teklif talebi oluşturduğunuzda ilgili klinikle güvenli görüşme burada açılır.</p></div> : null}
        </div>
      </aside>

      <section className="flex min-h-[520px] min-w-0 flex-col">
        {detail ? (
          <>
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-blue-100 px-4 py-3 sm:px-5">
              <div className="min-w-0"><h2 className="truncate font-semibold text-blue-950">{detail.conversation.title}</h2><p className="truncate text-xs text-slate-500">{detail.conversation.subtitle}</p></div>
              {audience === "patient" ? <Link href={`/klinikler/${detail.conversation.clinicSlug}`} className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900">Klinik profili</Link> : null}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-5">
              {detail.messages.length ? detail.messages.map((message) => (
                <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] rounded-lg px-3 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${message.mine ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                    {!message.mine ? <p className="mb-1 text-xs font-semibold text-blue-700">{message.senderName}</p> : null}
                    <p className="whitespace-pre-wrap break-words leading-6">{message.body}</p>
                    <p className={`mt-1 text-right text-[11px] ${message.mine ? "text-blue-100" : "text-slate-400"}`}>{formatDate(message.createdAt)}{message.mine && message.readAt ? " · Okundu" : ""}</p>
                  </div>
                </div>
              )) : <div className="grid min-h-72 place-items-center text-center"><div><MessageSquareText className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Görüşmeyi başlatın</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Randevu zamanı, tedavi kapsamı veya teklif ayrıntısı hakkında kliniğe yazabilirsiniz.</p></div></div>}
              <div ref={endRef} />
            </div>
            <form method="post" onSubmit={sendMessage} className="border-t border-blue-100 bg-white p-3 sm:p-4">
              <div className="flex items-end gap-2">
                <label className="sr-only" htmlFor="message-body">Mesajınız</label>
                <textarea id="message-body" name="body" required maxLength={2000} rows={2} placeholder="Mesajınızı yazın" className="min-h-12 flex-1 resize-none rounded-md border border-blue-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button disabled={sending} aria-label="Mesaj gönder" title="Mesaj gönder" className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-400"><Send className="h-5 w-5" /></button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-4 text-slate-500"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" /> Acil durumlarda mesaj beklemeyin; 112’yi arayın. Mesajlar tıbbi tanı yerine geçmez.</p>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center"><div><MessageSquareText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">Bir konuşma seçin</p><p className="mt-1 text-xs text-slate-500">Mesaj geçmişi burada görüntülenir.</p></div></div>
        )}
        {loading ? <div className="absolute sr-only" aria-live="polite">Mesajlar yükleniyor</div> : null}
        {error ? <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
