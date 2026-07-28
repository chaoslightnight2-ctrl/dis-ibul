"use client";

import dynamic from "next/dynamic";
import type { OpenStreetMapClinic } from "@/domain/types";

type DirectoryMapClinic = {
  sourceRef: string;
  name: string;
  formattedAddress: string;
  phone: string | null;
  latitude: number;
  longitude: number;
};

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
  directoryClinics: DirectoryMapClinic[];
  totalClinics: number;
};

export function ClinicMapClient({ clinics, directoryClinics, totalClinics }: ClinicMapClientProps) {
  const osmMarkers = clinics
    .filter((c) => c.latitude && c.longitude)
    .map((c) => ({
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.formattedAddress,
      phone: c.phone,
    }));

  const directoryMarkers = directoryClinics.map((clinic) => ({
    name: clinic.name,
    latitude: clinic.latitude,
    longitude: clinic.longitude,
    address: clinic.formattedAddress,
    phone: clinic.phone,
  }));

  const seen = new Set<string>();
  const markers = [...directoryMarkers, ...osmMarkers].filter((clinic) => {
    const key = `${clinic.name.toLocaleLowerCase("tr-TR")}|${clinic.latitude.toFixed(5)}|${clinic.longitude.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return <ClinicMap clinics={markers} totalClinics={totalClinics} />;
}
