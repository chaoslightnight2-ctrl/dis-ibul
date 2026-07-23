export function GoogleAttribution({ className = "" }: { className?: string }) {
  return (
    <span
      translate="no"
      aria-label="Google Maps"
      className={`whitespace-nowrap text-[13px] font-normal tracking-normal text-[#5e5e5e] ${className}`}
    >
      Google Maps
    </span>
  );
}

export function GoogleRankingNotice() {
  return (
    <p className="text-xs leading-5 text-slate-500">
      Google Maps işletme sonuçları öncelikle aramayla ilgililik, konum ve işletmenin bilinirliği dikkate alınarak sıralanır.{" "}
      <a
        href="https://support.google.com/business/answer/7091"
        target="_blank"
        rel="noreferrer"
        className="font-medium text-blue-700 underline underline-offset-2"
      >
        Sıralama hakkında bilgi
      </a>
    </p>
  );
}
