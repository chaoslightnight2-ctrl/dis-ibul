"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type ClinicMapMarker = {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
};

export function ClinicMap({ clinics, totalClinics }: { clinics: ClinicMapMarker[]; totalClinics?: number }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || clinics.length === 0) return;

    let destroyed = false;
    let mapInstance: { remove: () => void } | null = null;

    async function initMap() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (destroyed || !mapRef.current) return;

      // Fix default marker icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add markers
      const bounds = L.latLngBounds([]);

      for (const clinic of clinics) {
        const marker = L.marker([clinic.latitude, clinic.longitude]).addTo(map);
        const popupHtml = [
          '<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.5;max-width:220px">',
          `<strong style="font-size:14px">${escHtml(clinic.name)}</strong>`,
          "<br/>",
          `<span style="color:#64748b">${escHtml(clinic.address)}</span>`,
          clinic.phone ? `<br/><a href="tel:${escHtml(clinic.phone)}" style="color:#1d4ed8;font-weight:500">${escHtml(clinic.phone)}</a>` : "",
          "</div>",
        ].join("");
        marker.bindPopup(popupHtml);
        bounds.extend([clinic.latitude, clinic.longitude]);
      }

      if (clinics.length === 1) {
        map.setView([clinics[0].latitude, clinics[0].longitude], 15);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      mapInstance = map;
    }

    initMap();

    return () => {
      destroyed = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, [clinics]);

  if (clinics.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50/30 text-sm text-slate-500">
        <MapPin className="mr-2 h-4 w-4" />
        Haritada gösterilecek klinik bulunamadı
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-blue-100 shadow-sm">
      <div ref={mapRef} className="h-[400px] w-full" />
      <div className="border-t border-blue-100 bg-white px-4 py-2 text-xs text-slate-500">
        Toplam {totalClinics ?? clinics.length} klinik içinde konumu bulunan kayıtlar haritada gösteriliyor
      </div>
    </div>
  );
}

function escHtml(str: string) {
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
