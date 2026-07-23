export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  if (process.env.NODE_ENV === "production") {
    const configuredOrigin = process.env.APP_BASE_URL || process.env.BETTER_AUTH_URL;
    if (!configuredOrigin) throw new Error("PUBLIC_ORIGIN_NOT_CONFIGURED");
    const parsedOrigin = new URL(configuredOrigin);
    if (parsedOrigin.protocol !== "https:") throw new Error("PUBLIC_ORIGIN_MUST_BE_HTTPS");
    return parsedOrigin.origin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");

  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(host) || !["http", "https"].includes(protocol)) return requestUrl.origin;
  return `${protocol}://${host}`;
}
