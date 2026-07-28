"use client";

import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
  name: string;
};

export function OsmDetailMap({ latitude, longitude, name }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    let destroyed = false;
    let mapInstance: { remove: () => void } | null = null;

    async function initMap() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (destroyed || !mapRef.current) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap katkıda bulunanlar",
        maxZoom: 19,
      }).addTo(map);
      L.marker([latitude, longitude], { icon }).addTo(map).bindPopup(name);
      mapInstance = map;
    }

    void initMap();
    return () => {
      destroyed = true;
      mapInstance?.remove();
      mapInstance = null;
    };
  }, [latitude, longitude, name]);

  return <div ref={mapRef} className="h-72 w-full" aria-label={`${name} konumu`} />;
}
