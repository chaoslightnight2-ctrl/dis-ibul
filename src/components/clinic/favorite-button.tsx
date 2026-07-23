"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({ clinicSlug, initialFavorite }: { clinicSlug: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/favorites/${clinicSlug}`, { method: favorite ? "DELETE" : "POST" });
    setBusy(false);
    if (!response.ok) {
      setMessage("Favori güncellenemedi.");
      return;
    }
    setFavorite((value) => !value);
  }

  return (
    <div className="grid gap-1">
      <button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={favorite} className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${favorite ? "border-red-200 bg-red-50 text-red-700" : "border-slate-300 text-slate-700"}`}>
        <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /> {favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      </button>
      {message ? <p role="status" className="text-xs text-red-700">{message}</p> : null}
    </div>
  );
}
