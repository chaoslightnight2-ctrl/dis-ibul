"use client";

import { useEffect, useState, useRef } from "react";
import { Star, ExternalLink, LoaderCircle } from "lucide-react";
import { getCachedRating } from "@/lib/ratings-cache";

type Props = {
  clinicName: string;
  city: string;
};

type RatingResult = { rating: number; reviewCount: number; sourceUrl: string } | null;
type RatingData = RatingResult | undefined; // undefined = loading, null = yok

export function GoogleRatingBadge({ clinicName, city }: Props) {
  const [data, setData] = useState<RatingData>(undefined);
  const [fetchError, setFetchError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchRating() {
      // Önce client-side cache'e bak
      const cached = getCachedRating(clinicName, city);
      if (cached !== undefined) {
        if (!cancelled) setData(cached);
        return;
      }

      try {
        const res = await fetch(
          `/api/google/rating?name=${encodeURIComponent(clinicName)}&city=${encodeURIComponent(city)}`,
        );
        if (!res.ok) { if (!cancelled) setFetchError(true); return; }
        const json = await res.json();
        if (!cancelled) {
          setData(json?.rating ? json as RatingResult : null);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      }
    }

    fetchRating();
    return () => { cancelled = true; };
  }, [clinicName, city]);

  // Yükleniyor
  if (data === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <LoaderCircle className="h-3 w-3 animate-spin" />
        Puan alınıyor...
      </span>
    );
  }

  // Puan yok / hata
  if (!data || fetchError) {
    return (
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(clinicName + " " + city)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
      >
        Google&apos;da puanı gör <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  // Puan var ⭐
  return (
    <a
      href={data.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
    >
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {data.rating.toFixed(1)}
      <span className="text-amber-600">({data.reviewCount})</span>
    </a>
  );
}
