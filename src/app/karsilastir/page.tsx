import Link from "next/link";
import { clinics } from "@/data/clinics";
import { formatMoney } from "@/lib/format";

type ComparePageProps = {
  searchParams: Promise<{ clinics?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { clinics: selected } = await searchParams;
  const selectedSlugs = selected?.split(",").filter(Boolean).slice(0, 4) ?? clinics.slice(0, 3).map((clinic) => clinic.slug);
  const selectedClinics = clinics.filter((clinic) => selectedSlugs.includes(clinic.slug));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Klinik karşılaştırma</h1>
          <p className="mt-1 text-sm text-slate-600">En fazla dört klinik yan yana karşılaştırılır.</p>
        </div>
        <Link href="/arama" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Klinik ekle</Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4">Kriter</th>
              {selectedClinics.map((clinic) => <th key={clinic.slug} className="p-4">{clinic.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[
              ["Google puanı", (slug: string) => {
                const clinic = selectedClinics.find((item) => item.slug === slug);
                return clinic?.google.rating ? `${clinic.google.rating} / 5 (${clinic.google.reviewCount} yorum)` : "Alınamıyor";
              }],
              ["Konum", (slug: string) => {
                const clinic = selectedClinics.find((item) => item.slug === slug);
                return `${clinic?.city}, ${clinic?.district}`;
              }],
              ["Uzaklık", (slug: string) => `${selectedClinics.find((item) => item.slug === slug)?.distanceKm} km`],
              ["Seçilen tedavi fiyatı", (slug: string) => {
                const price = selectedClinics.find((item) => item.slug === slug)?.prices[0];
                if (!price) return "-";
                return price.fixedPrice ? formatMoney(price.fixedPrice, price.currency) : `${formatMoney(price.minPrice ?? 0, price.currency)} - ${formatMoney(price.maxPrice ?? 0, price.currency)}`;
              }],
              ["Taksit / ödeme", () => "Kredi kartı, nakit; taksit bilgisi klinikten doğrulanmalı"],
              ["Sedasyon", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.sedation ? "Var" : "Yok"],
              ["Otopark", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.parking ? "Var" : "Yok"],
              ["Engelli erişimi", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.wheelchairAccess ? "Var" : "Yok"],
              ["İlk uygun randevu", (slug: string) => new Date(selectedClinics.find((item) => item.slug === slug)?.nextAvailableAt ?? "").toLocaleDateString("tr-TR")],
              ["Teklif dönüş süresi", (slug: string) => `${selectedClinics.find((item) => item.slug === slug)?.responseTimeHours} saat`],
              ["Doğrulama", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.verified ? "Doğrulanmış" : "İncelemede"],
            ].map(([label, getter]) => (
              <tr key={label as string}>
                <th className="p-4 font-medium text-slate-700">{label as string}</th>
                {selectedClinics.map((clinic) => <td key={clinic.slug} className="p-4 text-slate-700">{(getter as (slug: string) => string)(clinic.slug)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
