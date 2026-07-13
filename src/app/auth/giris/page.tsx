export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Giriş</h1>
        <p className="mt-1 text-sm text-slate-600">{"Faz 1 ekranı. Gerçek session provider Faz 2'de bağlanacak."}</p>
        <label className="mt-5 grid gap-1 text-sm font-medium">E-posta<input type="email" className="rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="mt-3 grid gap-1 text-sm font-medium">Şifre<input type="password" className="rounded-md border border-slate-300 px-3 py-2" /></label>
        <button type="button" disabled className="mt-5 w-full rounded-md bg-slate-300 px-3 py-2 font-semibold text-slate-700">
          {"Güvenli giriş Faz 2'de bağlanacak"}
        </button>
      </form>
    </main>
  );
}
