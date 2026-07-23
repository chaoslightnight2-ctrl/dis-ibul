import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function GET(request: Request, context: RouteContext<"/api/billing/iyzico/form/[id]">) {
  const user = await getRequestUser(request);
  if (!user) return new Response("Oturum gerekli", { status: 401 });
  const { id } = await context.params;
  const checkout = await prisma.billingCheckout.findFirst({
    where: { id, userId: user.id, status: "PENDING" },
    include: { clinic: { select: { name: true } }, plan: { select: { name: true } } },
  });
  if (!checkout?.checkoutFormContent) return new Response("Ödeme oturumu bulunamadı", { status: 404 });
  if (!checkout.expiresAt || checkout.expiresAt <= new Date()) return new Response("Ödeme oturumunun süresi doldu", { status: 410 });

  const title = `${checkout.clinic.name} - ${checkout.plan.name}`;
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#f8fafc;color:#0f172a;font-family:"Segoe UI",Arial,sans-serif}.shell{max-width:760px;margin:0 auto;padding:24px 16px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}.brand{font-size:20px;font-weight:700;color:#172554}.back{color:#1d4ed8;text-decoration:none;font-size:14px;font-weight:600}.panel{background:#fff;border:1px solid #dbeafe;border-radius:8px;padding:20px}.note{font-size:13px;line-height:1.6;color:#64748b;margin:0 0 18px}</style></head><body><main class="shell"><div class="top"><span class="brand">DişçiBul</span><a class="back" href="/panel/klinik/abonelik">Aboneliklere dön</a></div><section class="panel"><p class="note">Kart bilgileriniz DişçiBul sunucularına gelmez; ödeme iyzico güvenli ödeme formunda tamamlanır.</p><div id="iyzipay-checkout-form" class="responsive"></div>${checkout.checkoutFormContent}</section></main></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline' https://*.iyzipay.com https://*.iyzico.com; style-src 'unsafe-inline' https://*.iyzipay.com https://*.iyzico.com; img-src data: https://*.iyzipay.com https://*.iyzico.com; connect-src https://*.iyzipay.com https://*.iyzico.com; frame-src https://*.iyzipay.com https://*.iyzico.com; form-action https://*.iyzipay.com https://*.iyzico.com; frame-ancestors 'self'",
    },
  });
}
