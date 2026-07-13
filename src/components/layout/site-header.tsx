import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold text-slate-950">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="/arama">Klinik ara</Link>
          <Link href="/karsilastir">Karşılaştır</Link>
          <Link href="/panel/klinik">Klinik paneli</Link>
          <Link href="/panel/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/giris" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Giriş
          </Link>
          <Link href="/auth/kayit" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            Kayıt
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-slate-600 sm:px-6 md:hidden lg:px-8">
        <Link href="/arama" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Klinik ara</Link>
        <Link href="/karsilastir" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Karşılaştır</Link>
        <Link href="/panel/klinik" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Klinik paneli</Link>
        <Link href="/panel/admin" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Admin</Link>
      </nav>
    </header>
  );
}
