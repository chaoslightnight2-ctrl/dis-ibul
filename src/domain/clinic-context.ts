export const ACTIVE_CLINIC_COOKIE = "discibul_active_clinic";

export function clinicIdFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === ACTIVE_CLINIC_COOKIE)?.slice(1).join("=");
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.length <= 100 ? decoded : null;
  } catch {
    return null;
  }
}
