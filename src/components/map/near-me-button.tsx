"use client";

import { useState } from "react";
import { Crosshair, LoaderCircle } from "lucide-react";

export function NearMeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Tarayıcınız konum paylaşımını desteklemiyor.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 300_000,
        });
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);

      if (!res.ok) throw new Error("Konum adresi şu anda çözümlenemedi. Lütfen şehir seçerek arayın.");

      const data = await res.json();
      const city = typeof data.city === "string" ? data.city : "";
      const district = typeof data.district === "string" ? data.district : "";

      if (!city) throw new Error("Şehir bulunamadı");

      // Navigate to search with city/district
      const params = new URLSearchParams({ city });
      if (district) params.set("district", district);
      window.location.href = `/arama?${params.toString()}`;
    } catch (err) {
      setStatus("error");
      const geolocationCode = typeof err === "object" && err && "code" in err ? Number(err.code) : 0;
      if (geolocationCode) {
        if (geolocationCode === 1) setErrorMsg("Konum izni verilmedi.");
        else if (geolocationCode === 3) setErrorMsg("Konum alınamadı, süre aştı.");
        else setErrorMsg("Konum alınamadı.");
      } else {
        setErrorMsg(err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "Konum servisine ulaşılamadı. Lütfen şehir seçerek arayın.");
      }
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4" />
        )}
        {status === "loading" ? "Konum alınıyor..." : "Yakınımdaki klinikler"}
      </button>
      {status === "error" && errorMsg ? (
        <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
      ) : null}
    </div>
  );
}
