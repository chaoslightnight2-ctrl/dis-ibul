import Link from "next/link";
import { Bell, MessageSquareText, Search, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { brand } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const panelHref = "/panel/hasta";
  const panelLabel = "Tedavi sürecim";
  const audiencePath = "/panel/hasta";
  const unreadNotifications = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-xl font-semibold text-blue-950">{brand.name}</Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <Link href="/arama" className="inline-flex items-center gap-1.5 hover:text-blue-700"><Search className="h-4 w-4" /> Klinik bul</Link>
          {user ? (
            <Link href={panelHref} className="inline-flex items-center gap-1.5 hover:text-blue-700">
              <UserRound className="h-4 w-4" /> {panelLabel}
            </Link>
          ) : null}
        </nav>
        <div className="flex min-w-0 items-center gap-2">
          {user ? (
            <>
              <Link href={`${audiencePath}/mesajlar`} aria-label="Mesajlar" title="Mesajlar" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-blue-50 hover:text-blue-700"><MessageSquareText className="h-4 w-4" /></Link>
              <Link href={`${audiencePath}/bildirimler`} aria-label={`${unreadNotifications} okunmamış bildirim`} title="Bildirimler" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Bell className="h-4 w-4" />{unreadNotifications ? <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-blue-700 px-0.5 text-[9px] font-semibold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}</Link>
              <Link href={panelHref} className="max-w-36 truncate rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50">{user.name}</Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/auth/giris" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50">Giriş</Link>
              <Link href="/auth/kayit" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Kayıt</Link>
            </>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-slate-600 sm:px-6 md:hidden lg:px-8">
        <Link href="/arama" className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-blue-800">Klinik bul</Link>
        {user ? <><Link href={panelHref} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">{panelLabel}</Link><Link href={`${audiencePath}/mesajlar`} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Mesajlar</Link><Link href={`${audiencePath}/bildirimler`} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5">Bildirimler{unreadNotifications ? ` (${unreadNotifications})` : ""}</Link></> : null}
      </nav>
    </header>
  );
}
