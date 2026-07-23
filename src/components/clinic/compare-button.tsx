"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompare } from "lucide-react";

const STORAGE_KEY = "discibul:compare";

function readSelection() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function CompareButton({ clinicSlug }: { clinicSlug: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  function compare() {
    const selection = readSelection();
    const next = selection.includes(clinicSlug)
      ? selection
      : [...selection, clinicSlug].slice(-4);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setMessage(next.length === 4 && !selection.includes(clinicSlug) ? "Karşılaştırma listesi dört klinikle sınırlandı." : "");
    router.push(`/karsilastir?clinics=${encodeURIComponent(next.join(","))}`);
  }

  return (
    <div className="grid gap-1">
      <button type="button" onClick={compare} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
        <GitCompare className="h-4 w-4" /> Karşılaştır
      </button>
      {message ? <p role="status" className="text-xs text-amber-700">{message}</p> : null}
    </div>
  );
}

export function CompareSelectionSync({ clinicSlugs }: { clinicSlugs: string[] }) {
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clinicSlugs.slice(0, 4)));
  }, [clinicSlugs]);

  return null;
}
