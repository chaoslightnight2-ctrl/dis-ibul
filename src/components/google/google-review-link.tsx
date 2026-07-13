"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

const REVIEW_PREFIX = "DişçiBul üzerinden gönderildi: ";

type GoogleReviewLinkProps = {
  href: string;
  label?: string;
};

export function GoogleReviewLink({ href, label = "Google'da değerlendirme yap" }: GoogleReviewLinkProps) {
  const [message, setMessage] = useState<string>("");

  async function copyPrefix() {
    try {
      await navigator.clipboard.writeText(REVIEW_PREFIX);
      setMessage("Kaynak notu panoya kopyalandı. Google yorumunuzun başına yapıştırabilirsiniz.");
    } catch {
      setMessage(`Google yorumunuzun başına şu metni ekleyin: ${REVIEW_PREFIX}`);
    }
  }

  return (
    <div className="grid gap-2">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          void copyPrefix();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
      >
        {label} <ExternalLink className="h-4 w-4" />
      </a>
      <p className="text-xs leading-5 text-slate-500">
        {"Google yorumu Google üzerinde yazılır. Tıklayınca \"DişçiBul üzerinden gönderildi:\" metni panoya kopyalanır; yorumu otomatik göndermeyiz."}
      </p>
      {message ? <p className="text-xs font-medium text-teal-800">{message}</p> : null}
    </div>
  );
}
