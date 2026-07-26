import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brand } from "@/config/brand";
import { popularTreatments } from "@/config/treatments";
import { Search, Stethoscope } from "lucide-react";

export const metadata: Metadata = {
  title: `${brand.name} | Tüm Tedaviler ve Fiyat Bilgileri`,
  description: "Diş tedavileri hakkında bilgi alın, size uygun kliniği bulun. İmplant, kaplama, kanal tedavisi, ortodonti ve daha fazlası.",
  openGraph: {
    title: `${brand.name} | Tedavi Rehberi`,
    description: "Diş tedavileri hakkında bilgi alın, size uygun kliniği bulun.",
    type: "website",
    locale: "tr_TR",
    siteName: brand.name,
  },
};

export default async function TreatmentsPage() {
  const categories = await prisma.treatmentCategory.findMany({
    include: {
      treatments: {
        include: {
          _count: { select: { prices: { where: { moderationStatus: "APPROVED" } } } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalTreatments = categories.reduce((sum, cat) => sum + cat.treatments.length, 0);

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-blue-950">Tedavi rehberi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Diş tedavileri hakkında bilgi alın, tedaviye göre klinik arayın. {totalTreatments} tedavi kategoriler altında listeleniyor.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Popüler tedaviler */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-950">En sık aranan tedaviler</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {popularTreatments.map((treatment) => (
              <Link
                key={treatment}
                href={`/arama?treatment=${encodeURIComponent(treatment)}`}
                className="flex items-center justify-between rounded-lg border border-blue-100 bg-white p-4 shadow-sm transition hover:border-blue-400"
              >
                <span className="text-sm font-medium text-blue-950">{treatment}</span>
                <Search className="h-4 w-4 shrink-0 text-blue-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Kategorilere göre tedaviler */}
        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-semibold text-blue-950">
              {category.name}
              {category.description ? <span className="ml-2 text-sm font-normal text-slate-500">{category.description}</span> : null}
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {category.treatments.map((treatment) => (
                <Link
                  key={treatment.id}
                  href={`/arama?treatment=${encodeURIComponent(treatment.name)}`}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">{treatment.name}</span>
                  </span>
                  {treatment._count.prices > 0 ? (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{treatment._count.prices} fiyat</span>
                  ) : (
                    <Search className="h-4 w-4 text-blue-500" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
            <Stethoscope className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 font-semibold text-blue-950">Tedavi kategorisi bulunamadı</h2>
            <p className="mt-2 text-sm text-slate-600">Tedavi listesi veritabanına yüklendiğinde burada görünecektir.</p>
          </div>
        )}
      </section>
    </main>
  );
}
