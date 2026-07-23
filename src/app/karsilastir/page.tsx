import Link from "next/link";
import { CompareSelectionSync } from "@/components/clinic/compare-button";
import { formatMoney } from "@/lib/format";
import { getPublishedClinics } from "@/services/clinics/public-clinics";

type ComparePageProps = {
  searchParams: Promise<{ clinics?: string }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { clinics: selected } = await searchParams;
  const clinics = await getPublishedClinics();
  const selectedSlugs = selected?.split(",").filter(Boolean).slice(0, 4) ?? [];
  const selectedClinics = clinics.filter((clinic) => selectedSlugs.includes(clinic.slug));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CompareSelectionSync clinicSlugs={selectedClinics.map((clinic) => clinic.slug)} />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Klinik karşılaştırma</h1>
          <p className="mt-1 text-sm text-slate-600">En fazla dört klinik yan yana karşılaştırılır.</p>
        </div>
        <Link href="/arama" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Klinik ekle</Link>
      </div>
      {selectedClinics.length ? <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4">Kriter</th>
              {selectedClinics.map((clinic) => {
                const remaining = selectedSlugs.filter((slug) => slug !== clinic.slug);
                return <th key={clinic.slug} className="p-4"><span className="block">{clinic.name}</span><Link href={remaining.length ? `/karsilastir?clinics=${encodeURIComponent(remaining.join(","))}` : "/karsilastir"} className="mt-2 inline-flex text-xs font-medium text-red-700">Listeden çıkar</Link></th>;
              })}
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
              ["Uzaklık", (slug: string) => {
                const distance = selectedClinics.find((item) => item.slug === slug)?.distanceKm;
                return distance === null || distance === undefined ? "Konum izniyle hesaplanır" : `${distance} km`;
              }],
              ["Seçilen tedavi fiyatı", (slug: string) => {
                const price = selectedClinics.find((item) => item.slug === slug)?.prices[0];
                if (!price) return "-";
                return price.fixedPrice ? formatMoney(price.fixedPrice, price.currency) : `${formatMoney(price.minPrice ?? 0, price.currency)} - ${formatMoney(price.maxPrice ?? 0, price.currency)}`;
              }],
              ["İlk muayene ücreti", (slug: string) => {
                const clinic = selectedClinics.find((item) => item.slug === slug);
                return clinic?.freeInitialExam ? "Ücretsiz" : clinic?.firstExamFee === null || clinic?.firstExamFee === undefined ? "Belirtilmedi" : formatMoney(clinic.firstExamFee);
              }],
              ["Muayene kapsamı", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.initialExamIncludes.join(", ") ?? "-"],
              ["Taksit / ödeme", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.financingOptions.join(", ") || "Belirtilmedi"],
              ["Sedasyon", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.sedation ? "Var" : "Yok"],
              ["Otopark", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.parking ? "Var" : "Yok"],
              ["Engelli erişimi", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.wheelchairAccess ? "Var" : "Yok"],
              ["İlk uygun randevu", (slug: string) => {
                const availableAt = selectedClinics.find((item) => item.slug === slug)?.nextAvailableAt;
                return availableAt ? new Date(availableAt).toLocaleDateString("tr-TR") : "Klinikten bilgi alın";
              }],
              ["Teklif dönüş süresi", (slug: string) => {
                const hours = selectedClinics.find((item) => item.slug === slug)?.responseTimeHours;
                return hours === null || hours === undefined ? "Henüz ölçülmedi" : `${hours} saat`;
              }],
              ["Doğrulama", (slug: string) => selectedClinics.find((item) => item.slug === slug)?.verified ? "Doğrulanmış" : "İncelemede"],
            ].map(([label, getter]) => (
              <tr key={label as string}>
                <th className="p-4 font-medium text-slate-700">{label as string}</th>
                {selectedClinics.map((clinic) => <td key={clinic.slug} className="p-4 text-slate-700">{(getter as (slug: string) => string)(clinic.slug)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div> : <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-8 text-center"><h2 className="font-semibold text-blue-950">Karşılaştırılacak klinik seçilmedi</h2><p className="mt-2 text-sm text-slate-600">Arama sonuçlarından en fazla dört kliniği karşılaştırma listesine ekleyin.</p><Link href="/arama" className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Klinik seç</Link></div>}
    </main>
  );
}
