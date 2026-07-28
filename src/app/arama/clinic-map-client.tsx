"use client";

import dynamic from "next/dynamic";
import type { OpenStreetMapClinic } from "@/domain/types";

const ClinicMap = dynamic(
  () => import("@/components/map/clinic-map").then((mod) => mod.ClinicMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-blue-100 bg-blue-50/30 text-sm text-slate-500">
        Harita yükleniyor…
      </div>
    ),
  },
);

type ClinicMapClientProps = {
  clinics: OpenStreetMapClinic[];
  totalClinics: number;
};

export function ClinicMapClient({ clinics, totalClinics }: ClinicMapClientProps) {
  const markers = clinics
    .filter((c) => c.latitude && c.longitude)
    .map((c) => ({
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.formattedAddress,
      phone: c.phone,
    }));

  return <ClinicMap clinics={markers} totalClinics={totalClinics} />;
}
