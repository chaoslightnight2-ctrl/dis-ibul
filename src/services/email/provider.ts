import { prisma } from "@/lib/prisma";

type ActionEmailKind = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "CLINIC_INVITATION";

type ActionEmail = {
  userId: string;
  recipient: string;
  recipientName: string;
  kind: ActionEmailKind;
  actionUrl: string;
};

type ProviderResult = { messageId: string | null };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getContent(email: ActionEmail) {
  const isVerification = email.kind === "EMAIL_VERIFICATION";
  const isInvitation = email.kind === "CLINIC_INVITATION";
  const title = isInvitation ? "Klinik ekibi daveti" : isVerification ? "E-posta adresinizi doğrulayın" : "Şifrenizi yenileyin";
  const description = isInvitation
    ? "Bir klinik yöneticisi sizi DişçiBul klinik ekibine davet etti. Daveti yalnızca bu e-posta adresiyle giriş yaptıktan sonra kabul edebilirsiniz."
    : isVerification
      ? "DişçiBul hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın."
      : "DişçiBul hesabınız için bir şifre yenileme isteği aldık.";
  const button = isInvitation ? "Daveti görüntüle" : isVerification ? "E-postamı doğrula" : "Şifremi yenile";
  const safeName = escapeHtml(email.recipientName);
  const safeUrl = escapeHtml(email.actionUrl);

  return {
    subject: `DişçiBul | ${title}`,
    text: `Merhaba ${email.recipientName},\n\n${description}\n\n${email.actionUrl}\n\nBu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.`,
    html: `<!doctype html><html lang="tr"><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #dbeafe;border-radius:8px;padding:28px"><p style="margin:0 0 18px;color:#1d4ed8;font-weight:700">DişçiBul</p><h1 style="font-size:24px;line-height:1.3;margin:0 0 12px">${title}</h1><p style="line-height:1.7;margin:0 0 8px">Merhaba ${safeName},</p><p style="line-height:1.7;margin:0 0 22px;color:#475569">${description}</p><a href="${safeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px">${button}</a><p style="font-size:12px;line-height:1.6;color:#64748b;margin:24px 0 0">Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz. Bağlantıyı kimseyle paylaşmayın.</p></div></div></body></html>`,
  };
}

async function sendWithResend(email: ActionEmail): Promise<ProviderResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_CONFIGURATION_MISSING");

  const content = getContent(email);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `discibul-${email.kind.toLowerCase()}-${email.userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      from,
      to: [email.recipient],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  const result = await response.json().catch(() => null) as { id?: string; name?: string } | null;
  if (!response.ok) throw new Error(result?.name || `RESEND_HTTP_${response.status}`);
  return { messageId: result?.id ?? null };
}

async function sendWithMock(email: ActionEmail): Promise<ProviderResult> {
  if (process.env.NODE_ENV !== "production") {
    const debugUrl = process.env.EMAIL_MOCK_LOG_ACTION_URL === "true" ? ` ${email.actionUrl}` : "";
    console.info(`[email:mock] ${email.kind} user:${email.userId}${debugUrl}`);
  }
  return { messageId: `mock-${crypto.randomUUID()}` };
}

export function isEmailDeliveryEnabled() {
  return process.env.EMAIL_PROVIDER !== "disabled";
}

export async function sendActionEmail(email: ActionEmail) {
  const provider = (process.env.EMAIL_PROVIDER || "mock").toLowerCase();
  if (!new Set(["mock", "resend"]).has(provider)) throw new Error("UNSUPPORTED_EMAIL_PROVIDER");
  const delivery = await prisma.emailDelivery.create({
    data: {
      userId: email.userId,
      kind: email.kind,
      provider,
    },
  });

  try {
    const result = provider === "resend" ? await sendWithResend(email) : await sendWithMock(email);
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        providerMessageId: result.messageId,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "EMAIL_PROVIDER_ERROR";
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", errorCode },
    });
    throw error;
  }
}
