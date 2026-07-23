"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useState } from "react";

export function ClinicSwitcher({ activeClinicId, memberships }: { activeClinicId: string; memberships: Array<{ clinicId: string; name: string; role: string }> }) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  if (memberships.length < 2) return null;

  async function change(clinicId: string) {
    setSwitching(true);
    const response = await fetch("/api/clinic/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId }),
    });
    setSwitching(false);
    if (response.ok) router.refresh();
  }

  return <label className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950"><Building2 className="h-4 w-4 text-blue-700" /><span className="sr-only">Aktif klinik</span><select value={activeClinicId} onChange={(event) => change(event.target.value)} disabled={switching} className="max-w-56 bg-transparent font-semibold outline-none disabled:text-slate-400">{memberships.map((membership) => <option key={membership.clinicId} value={membership.clinicId}>{membership.name} · {membership.role === "CLINIC_MANAGER" ? "Yönetici" : "Hekim"}</option>)}</select></label>;
}
