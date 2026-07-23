export function normalizeTurkeyPhone(value: string | null | undefined) {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

export function getContactLinks(phone: string | null | undefined, whatsapp?: string | null) {
  const normalizedPhone = normalizeTurkeyPhone(phone);
  const normalizedWhatsapp = normalizeTurkeyPhone(whatsapp);
  return {
    phone: normalizedPhone,
    callHref: normalizedPhone ? `tel:${normalizedPhone}` : null,
    messageHref: normalizedPhone ? `sms:${normalizedPhone}` : null,
    whatsappHref: normalizedWhatsapp ? `https://wa.me/${normalizedWhatsapp.slice(1)}` : null,
  };
}
