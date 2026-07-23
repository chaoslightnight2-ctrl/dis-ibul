import { cn } from "@/lib/format";

export function OpenStreetMapAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://www.openstreetmap.org/copyright"
      target="_blank"
      rel="noreferrer"
      className={cn("text-xs font-medium text-blue-700 underline", className)}
    >
      © OpenStreetMap katkıda bulunanları
    </a>
  );
}
