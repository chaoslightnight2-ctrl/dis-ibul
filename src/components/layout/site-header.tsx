import Link from "next/link";
import { Building2, Search, UserRound } from "lucide-react";
import { brand } from "@/config/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold text-blue-950">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <Link href="/arama" className="inline-flex items-center gap-1.5 hover:text-blue-700"><Search className="h-4 w-4" /> Klinik bul</Link>
          <Link href="/panel/hasta" className="inline-flex items-center gap-1.5 hover:text-blue-700"><UserRound className="h-4 w-4" /> Hasta paneli</Link>
          <Link href="/panel/klinik" className="inline-flex items-center gap-1.5 hover:text-blue-700"><Building2 className="h-4 w-4" /> Klinik paneli</Link>
          <Link href="/auth/kayit?tip=klinik" className="hover:text-blue-700">Klinik kaydı</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/giris" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50">
            Giriş
          </Link>
          <Link href="/auth/kayit" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Kayıt
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-slate-600 sm:px-6 md:hidden lg:px-8">
        <Link href="/arama" className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-blue-800">Klinik bul</Link>
        <Link href="/panel/hasta" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Hasta paneli</Link>
        <Link href="/panel/klinik" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Klinik paneli</Link>
        <Link href="/auth/kayit?tip=klinik" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Klinik kaydı</Link>
      </nav>
    </header>
  );
}
