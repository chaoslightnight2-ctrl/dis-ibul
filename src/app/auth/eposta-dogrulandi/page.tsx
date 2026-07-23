import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";

type VerifiedPageProps = { searchParams: Promise<{ error?: string }> };

export default async function VerifiedPage({ searchParams }: VerifiedPageProps) {
  const params = await searchParams;
  const failed = Boolean(params.error);
  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-12 text-center sm:px-6">
      {failed ? <CircleAlert className="mx-auto h-10 w-10 text-amber-600" /> : <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />}
      <h1 className="mt-4 text-3xl font-semibold text-blue-950">{failed ? "Bağlantı geçerli değil" : "E-posta doğrulandı"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{failed ? "Bağlantının süresi dolmuş veya bağlantı daha önce kullanılmış olabilir." : "Hesabınızın e-posta adresi başarıyla doğrulandı."}</p>
      <Link href={failed ? "/auth/eposta-dogrula" : "/auth/giris"} className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 font-semibold text-white">{failed ? "Yeni bağlantı iste" : "Giriş yap"}</Link>
    </main>
  );
}
