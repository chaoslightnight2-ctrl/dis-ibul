import type { ReactNode } from "react";
import { brand } from "@/config/brand";

export function LegalPage({ title, updatedAt = "14 Temmuz 2026", children }: { title: string; updatedAt?: string; children: ReactNode }) {
  return <main className="min-h-[70vh] bg-blue-50/30"><article className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><header className="border-b border-blue-100 pb-6"><p className="text-sm font-semibold text-blue-700">{brand.name}</p><h1 className="mt-2 text-3xl font-semibold text-blue-950">{title}</h1><p className="mt-2 text-sm text-slate-500">Son güncelleme: {updatedAt}</p></header><div className="prose prose-slate mt-7 max-w-none space-y-7 text-sm leading-7 text-slate-700">{children}</div></article></main>;
}
