"use client";

import { ExternalLink } from "lucide-react";

type Props = {
  clinicName: string;
  city: string;
};

/**
 * Google API anahtarı bulunmayan ücretsiz mod.
 *
 * Google Maps/Arama HTML'i taranmaz ve sahte puan üretilmez. Kullanıcı yalnızca
 * klinik adı ve şehirle hazırlanmış normal Google aramasına yönlendirilir.
 */
export function GoogleRatingBadge({ clinicName, city }: Props) {
  const query = [clinicName, city].filter(Boolean).join(" ");

  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
    >
      Google yorumlarını gör <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}
