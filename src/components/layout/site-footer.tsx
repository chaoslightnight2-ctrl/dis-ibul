import Link from "next/link";
import { CookieSettingsButton } from "@/components/privacy/cookie-consent";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return <footer className="border-t border-blue-100 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="font-semibold text-blue-950">{brand.name}</p><p className="mt-1 text-xs text-slate-500">Tıbbi acil durum hizmeti değildir. Acil durumda 112’yi arayın.</p></div><nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><Link href="/hukuki/kvkk" className="hover:text-blue-700">KVKK</Link><Link href="/hukuki/gizlilik" className="hover:text-blue-700">Gizlilik</Link><Link href="/hukuki/kullanim-kosullari" className="hover:text-blue-700">Kullanım koşulları</Link><Link href="/hukuki/cerezler" className="hover:text-blue-700">Çerezler</Link><CookieSettingsButton /></nav></div></footer>;
}
