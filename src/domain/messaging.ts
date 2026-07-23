import { z } from "zod";

export const messageBodySchema = z.object({
  body: z.string().trim().min(1).max(2_000),
});

export const appointmentStatusCopy: Record<string, { title: string; body: string }> = {
  VIEWED_BY_CLINIC: { title: "Randevu talebiniz görüntülendi", body: "Klinik talebinizi incelemeye başladı." },
  INFO_REQUESTED: { title: "Klinik ek bilgi istiyor", body: "Randevu talebiniz için klinikle mesajlaşabilirsiniz." },
  APPROVED: { title: "Randevu talebiniz onaylandı", body: "Randevu ayrıntılarını klinikle mesajlaşarak netleştirin." },
  ALTERNATIVE_TIME_PROPOSED: { title: "Klinik alternatif saat önerdi", body: "Yeni saat önerisini değerlendirmek için kliniğe yazın." },
  CANCELLED: { title: "Randevu talebi iptal edildi", body: "Ayrıntılar için klinikle mesajlaşabilirsiniz." },
  COMPLETED: { title: "Randevunuz tamamlandı", body: "Geçmiş olsun. Deneyiminizi Google üzerinden değerlendirebilirsiniz." },
  NO_SHOW: { title: "Randevuya katılım kaydı güncellendi", body: "Bir hata olduğunu düşünüyorsanız klinikle iletişime geçin." },
};

export function messagingPath(audience: "patient" | "clinic", conversationId?: string) {
  const base = audience === "patient" ? "/panel/hasta/mesajlar" : "/panel/klinik/mesajlar";
  return conversationId ? `${base}?konusma=${encodeURIComponent(conversationId)}` : base;
}

export function notificationPath(audience: "patient" | "clinic") {
  return audience === "patient" ? "/panel/hasta/bildirimler" : "/panel/klinik/bildirimler";
}

export function messagePreview(body: string, maxLength = 120) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}
