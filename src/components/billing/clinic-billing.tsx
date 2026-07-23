"use client";

import { Check, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

type BillingPlan = {
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  currency: string;
  features: string[];
  trialDays: number;
  isPopular: boolean;
};

type ActiveSubscription = {
  planSlug: string;
  planName: string;
  provider: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
};

type Props = {
  plans: BillingPlan[];
  activeSubscription: ActiveSubscription | null;
  billingEnabled: boolean;
};

const errorMessages: Record<string, string> = {
  ACTIVE_PAID_SUBSCRIPTION_EXISTS: "Ücretli planınızı değiştirmek için önce mevcut aboneliği iptal edin.",
  ACTIVE_SUBSCRIPTION_NOT_FOUND: "İptal edilebilecek etkin abonelik bulunamadı.",
  BILLING_DETAILS_REQUIRED: "Ödeme için kimlik, telefon ve posta kodu alanlarını doldurun.",
  BILLING_NOT_CONFIGURED: "Online ödeme altyapısı henüz etkinleştirilmedi.",
  BILLING_PROVIDER_ERROR: "Ödeme sağlayıcısına şu anda ulaşılamıyor. Daha sonra yeniden deneyin.",
  CONFIRMATION_REQUIRED: "İşlemi onaylamanız gerekiyor.",
  EMAIL_VERIFICATION_REQUIRED: "Ödeme öncesinde e-posta adresinizi doğrulayın.",
  PAID_SUBSCRIPTION_MUST_BE_CANCELED_FIRST: "Ücretsiz plana geçmeden önce ücretli aboneliğinizi iptal edin.",
  PLAN_ALREADY_ACTIVE: "Bu plan zaten etkin.",
  PLAN_NOT_FOUND: "Seçilen plan artık kullanılamıyor.",
  VALIDATION_ERROR: "Bilgileri kontrol edip yeniden deneyin.",
};

function messageFor(error: unknown) {
  return typeof error === "string" && errorMessages[error]
    ? errorMessages[error]
    : "İşlem tamamlanamadı. Lütfen yeniden deneyin.";
}

export function ClinicBilling({ plans, activeSubscription, billingEnabled }: Props) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [cancelStep, setCancelStep] = useState(false);
  const selectedPlan = plans.find((plan) => plan.slug === selectedSlug) ?? null;
  const paidSubscriptionActive = activeSubscription?.provider === "IYZICO";

  async function activateFreePlan(plan: BillingPlan) {
    setBusySlug(plan.slug);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/clinic/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, termsAccepted: true }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "REQUEST_FAILED");
      setMessage(`${plan.name} planı etkinleştirildi.`);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(messageFor(error instanceof Error ? error.message : error));
    } finally {
      setBusySlug(null);
    }
  }

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    const form = new FormData(event.currentTarget);
    setBusySlug(selectedPlan.slug);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/clinic/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          identityNumber: form.get("identityNumber"),
          gsmNumber: form.get("gsmNumber"),
          zipCode: form.get("zipCode"),
          termsAccepted: form.get("termsAccepted") === "on",
        }),
      });
      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "REQUEST_FAILED");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setIsError(true);
      setMessage(messageFor(error instanceof Error ? error.message : error));
      setBusySlug(null);
    }
  }

  async function cancelSubscription() {
    setBusySlug("cancel");
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/clinic/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "REQUEST_FAILED");
      setCancelStep(false);
      setMessage("Abonelik iptal edildi.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(messageFor(error instanceof Error ? error.message : error));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="grid gap-8">
      {activeSubscription ? (
        <section className="border-y border-emerald-200 bg-emerald-50 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-950">{activeSubscription.planName} planı etkin</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  {activeSubscription.provider === "IYZICO" ? "Aylık yenilenen online abonelik" : "Ücretsiz plan"}
                </p>
              </div>
            </div>
            {!cancelStep ? (
              <button type="button" onClick={() => setCancelStep(true)} className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900">
                <X className="h-4 w-4" /> Aboneliği iptal et
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-emerald-950">İptal işlemini onaylıyor musunuz?</span>
                <button type="button" onClick={() => void cancelSubscription()} disabled={busySlug === "cancel"} className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {busySlug === "cancel" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Evet, iptal et
                </button>
                <button type="button" onClick={() => setCancelStep(false)} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700">Vazgeç</button>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = activeSubscription?.planSlug === plan.slug;
            const isPaid = plan.monthlyPrice > 0;
            const blockedByPaidPlan = paidSubscriptionActive && !isCurrent;
            const disabled = isCurrent || blockedByPaidPlan || (isPaid && !billingEnabled);
            return (
              <article key={plan.slug} className={`relative flex min-h-[390px] flex-col rounded-lg border bg-white p-6 ${plan.isPopular ? "border-blue-500 shadow-md" : "border-blue-100 shadow-sm"}`}>
                {plan.isPopular ? <span className="absolute right-4 top-4 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">En çok tercih edilen</span> : null}
                <div className="pr-20">
                  <h2 className="text-xl font-semibold text-blue-950">{plan.name}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-950">
                  {plan.monthlyPrice === 0 ? "Ücretsiz" : formatMoney(plan.monthlyPrice, plan.currency)}
                  {plan.monthlyPrice > 0 ? <span className="ml-1 text-sm font-normal text-slate-500">/ ay</span> : null}
                </p>
                {plan.trialDays > 0 ? <p className="mt-1 text-xs font-medium text-emerald-700">{plan.trialDays} gün deneme</p> : <div className="h-5" />}
                <ul className="mt-5 grid flex-1 content-start gap-3">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-5 text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{feature}</li>)}
                </ul>
                <button
                  type="button"
                  disabled={disabled || busySlug !== null}
                  onClick={() => isPaid ? setSelectedSlug(plan.slug) : void activateFreePlan(plan)}
                  className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${plan.isPopular ? "bg-blue-700 text-white" : "border border-blue-200 bg-blue-50 text-blue-900"}`}
                >
                  {busySlug === plan.slug ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isCurrent ? <CheckCircle2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {isCurrent ? "Mevcut plan" : blockedByPaidPlan ? "Önce mevcut planı iptal edin" : isPaid && !billingEnabled ? "Online ödeme hazırlanıyor" : isPaid ? "Ödemeye geç" : "Ücretsiz planı seç"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {selectedPlan ? (
        <section className="border-y border-blue-100 bg-white">
          <form method="post" onSubmit={startCheckout} className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold text-blue-700">Güvenli ödeme</p><h2 className="mt-1 text-2xl font-semibold text-blue-950">{selectedPlan.name}</h2></div>
              <button type="button" onClick={() => setSelectedSlug(null)} title="Kapat" aria-label="Ödeme formunu kapat" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm leading-6 text-slate-600">Bu bilgiler yasal ödeme kaydı için doğrudan iyzico’ya iletilir. DişçiBul kimlik numaranızı veya kart bilginizi saklamaz.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">T.C. kimlik / VKN<input name="identityNumber" inputMode="numeric" pattern="[0-9]{10,11}" minLength={10} maxLength={11} required autoComplete="off" className="rounded-md border border-blue-200 px-3 py-2.5" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Cep telefonu<input name="gsmNumber" type="tel" required autoComplete="tel" placeholder="05xx xxx xx xx" className="rounded-md border border-blue-200 px-3 py-2.5" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Posta kodu<input name="zipCode" inputMode="numeric" pattern="[0-9]{5}" minLength={5} maxLength={5} required autoComplete="postal-code" className="rounded-md border border-blue-200 px-3 py-2.5" /></label>
            </div>
            <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input name="termsAccepted" type="checkbox" required className="mt-1" /><span>Abonelik ücretinin her ay yenileneceğini ve iptal edene kadar tahsil edileceğini kabul ediyorum.</span></label>
            <button disabled={busySlug !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">
              {busySlug === selectedPlan.slug ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} iyzico ile güvenli ödemeye devam et
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Kart bilgileri iyzico güvenli ödeme ekranında alınır.</div>
          </form>
        </section>
      ) : null}

      {message ? <p role="status" className={`mx-auto w-full max-w-7xl px-4 text-sm font-medium sm:px-6 lg:px-8 ${isError ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </div>
  );
}
