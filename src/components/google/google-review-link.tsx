"use client";

import { useState } from "react";
import { Clipboard, ExternalLink } from "lucide-react";

const REVIEW_PREFIX = "DişçiBul üzerinden gönderildi: ";

type GoogleReviewLinkProps = {
  href: string;
  label?: string;
};

export function GoogleReviewLink({ href, label = "Google'da değerlendirme yap" }: GoogleReviewLinkProps) {
  const [message, setMessage] = useState<string>("");
  const [reviewDraft, setReviewDraft] = useState<string>("");

  const fullReviewText = `${REVIEW_PREFIX}${reviewDraft.trim()}`;

  async function copyReviewText() {
    try {
      await navigator.clipboard.writeText(fullReviewText);
      setMessage("Yorum metni panoya kopyalandı. Açılan Google sayfasındaki yorum alanına yapıştırabilirsiniz.");
    } catch {
      setMessage(`Google yorumunuzun başına şu metni ekleyin: ${fullReviewText}`);
    }
  }

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Google yorum taslağınız
        <textarea
          value={reviewDraft}
          onChange={(event) => setReviewDraft(event.target.value)}
          rows={3}
          placeholder="Deneyiminizi buraya yazın; Google'a geçmeden önce başına DişçiBul kaynak notu eklenerek kopyalanır."
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          void copyReviewText();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        <Clipboard className="h-4 w-4" /> Yorum metnini kopyala
      </button>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          void copyReviewText();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
      >
        {label} <ExternalLink className="h-4 w-4" />
      </a>
      <p className="text-xs leading-5 text-slate-500">
        {"Google yorumu Google üzerinde yazılır. Tıklayınca \"DişçiBul üzerinden gönderildi:\" ile başlayan metin panoya kopyalanır; yorumu otomatik göndermeyiz."}
      </p>
      {message ? <p className="text-xs font-medium text-teal-800">{message}</p> : null}
    </div>
  );
}
