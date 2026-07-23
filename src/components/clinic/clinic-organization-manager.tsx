"use client";

import { useRouter } from "next/navigation";
import { Archive, Building2, Pencil, Plus, Send, Stethoscope, UsersRound, X } from "lucide-react";
import { useState } from "react";

type Branch = { id: string; name: string; city: string; district: string; address: string; phone: string | null; email: string | null; isMain: boolean };
type Dentist = { id: string; fullName: string; title: string; university: string | null; graduationYear: number | null; experienceYears: number; about: string | null; languages: string[]; acceptsChildren: boolean; acceptsInternationalPatients: boolean; onlineConsultation: boolean; verificationStatus: string };
type Member = { id: string; userId: string; role: string; user: { name: string; email: string } };
type Invitation = { id: string; email: string; role: string; expiresAt: string };

const errorMessages: Record<string, string> = {
  ALREADY_A_MEMBER: "Bu kullanıcı zaten klinik ekibinde.",
  CANNOT_INVITE_SELF: "Kendinize davet gönderemezsiniz.",
  EMAIL_DELIVERY_UNAVAILABLE: "Bu e-posta için teslim yöntemi bulunamadı.",
  INVITATION_EMAIL_FAILED: "Davet e-postası gönderilemedi.",
  LAST_MANAGER_REQUIRED: "Klinikte en az bir yönetici kalmalıdır.",
  VALIDATION_ERROR: "Alanları kontrol edip tekrar deneyin.",
};

async function apiRequest(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(errorMessages[data?.error ?? ""] ?? "İşlem tamamlanamadı.");
  return data;
}

export function ClinicOrganizationManager({
  branches,
  dentists,
  members,
  invitations,
  canManage,
  currentUserId,
}: {
  branches: Branch[];
  dentists: Dentist[];
  members: Member[];
  invitations: Invitation[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"branches" | "dentists" | "team">("branches");
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function run(operation: () => Promise<unknown>, success: string) {
    setSaving(true);
    setMessage("");
    try {
      await operation();
      setMessage(success);
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = {
      name: String(values.get("name") ?? ""), city: String(values.get("city") ?? ""), district: String(values.get("district") ?? ""),
      address: String(values.get("address") ?? ""), phone: String(values.get("phone") ?? ""), email: String(values.get("email") ?? ""), isMain: values.get("isMain") === "on",
    };
    const ok = await run(() => apiRequest(editingBranch ? `/api/clinic/branches/${editingBranch.id}` : "/api/clinic/branches", editingBranch ? "PATCH" : "POST", body), editingBranch ? "Şube güncellendi." : "Şube eklendi.");
    if (ok) { setEditingBranch(null); form.reset(); }
  }

  async function saveDentist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = {
      fullName: String(values.get("fullName") ?? ""), title: String(values.get("title") ?? ""), university: String(values.get("university") ?? ""),
      graduationYear: values.get("graduationYear") ? Number(values.get("graduationYear")) : null,
      experienceYears: Number(values.get("experienceYears") || 0), about: String(values.get("about") ?? ""),
      languages: String(values.get("languages") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      acceptsChildren: values.get("acceptsChildren") === "on", acceptsInternationalPatients: values.get("acceptsInternationalPatients") === "on", onlineConsultation: values.get("onlineConsultation") === "on",
    };
    const ok = await run(() => apiRequest(editingDentist ? `/api/clinic/dentists/${editingDentist.id}` : "/api/clinic/dentists", editingDentist ? "PATCH" : "POST", body), editingDentist ? "Hekim bilgileri güncellendi ve incelemeye gönderildi." : "Hekim eklendi ve incelemeye gönderildi.");
    if (ok) { setEditingDentist(null); form.reset(); }
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const ok = await run(() => apiRequest("/api/clinic/team/invitations", "POST", { email: String(values.get("email") ?? ""), role: String(values.get("role") ?? "DENTIST") }), "Davet gönderildi ve 72 saat geçerli.");
    if (ok) form.reset();
  }

  async function archive(url: string, prompt: string, success: string) {
    if (!window.confirm(prompt)) return;
    await run(() => apiRequest(url, "DELETE"), success);
  }

  const tabs = [
    { id: "branches" as const, label: "Şubeler", count: branches.length, icon: Building2 },
    { id: "dentists" as const, label: "Diş hekimleri", count: dentists.length, icon: Stethoscope },
    { id: "team" as const, label: "Ekip ve yetkiler", count: members.length, icon: UsersRound },
  ];

  return <div><div className="flex gap-1 overflow-x-auto border-b border-blue-100" role="tablist">{tabs.map(({ id, label, count, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setMessage(""); }} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === id ? "border-blue-700 text-blue-800" : "border-transparent text-slate-500 hover:text-blue-700"}`}><Icon className="h-4 w-4" /> {label} <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{count}</span></button>)}</div>
    {message ? <p role="status" className={`mt-4 rounded-md px-4 py-3 text-sm ${message.includes("tamamlanamadı") || message.includes("kontrol") || message.includes("bulunamadı") || message.includes("kalmalıdır") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p> : null}

    {tab === "branches" ? <section className="py-6"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-blue-950">Klinik şubeleri</h2><p className="mt-1 text-sm text-slate-600">Adres ve iletişim bilgilerini şube bazında yönetin.</p></div>{canManage && !editingBranch ? <button type="button" onClick={() => setEditingBranch({ id: "", name: "", city: "", district: "", address: "", phone: "", email: "", isMain: branches.length === 0 })} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Şube ekle</button> : null}</div>
      {canManage && editingBranch ? <form key={editingBranch.id || "new"} onSubmit={saveBranch} className="mt-5 grid gap-3 border-y border-blue-100 bg-blue-50/40 py-5 sm:grid-cols-2"><h3 className="font-semibold text-blue-950 sm:col-span-2">{editingBranch.id ? "Şubeyi düzenle" : "Yeni şube"}</h3><input name="name" required minLength={2} defaultValue={editingBranch.name} placeholder="Şube adı" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="phone" defaultValue={editingBranch.phone ?? ""} placeholder="Telefon" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="city" required defaultValue={editingBranch.city} placeholder="Şehir" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="district" required defaultValue={editingBranch.district} placeholder="İlçe" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="email" type="email" defaultValue={editingBranch.email ?? ""} placeholder="E-posta" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm text-slate-700"><input name="isMain" type="checkbox" defaultChecked={editingBranch.isMain} /> Ana şube</label><textarea name="address" required minLength={10} rows={2} defaultValue={editingBranch.address} placeholder="Açık adres" className="rounded-md border border-blue-200 px-3 py-2 text-sm sm:col-span-2" /><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400">Kaydet</button><button type="button" onClick={() => setEditingBranch(null)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><X className="h-4 w-4" /> Vazgeç</button></div></form> : null}
      <div className="mt-5 grid gap-3">{branches.map((branch) => <article key={branch.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-slate-950">{branch.name}</h3>{branch.isMain ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">Ana şube</span> : null}</div><p className="mt-1 text-sm text-slate-600">{branch.address}</p><p className="mt-1 text-xs text-slate-500">{branch.city}, {branch.district}{branch.phone ? ` · ${branch.phone}` : ""}{branch.email ? ` · ${branch.email}` : ""}</p></div>{canManage ? <div className="flex gap-1"><button type="button" onClick={() => setEditingBranch(branch)} aria-label={`${branch.name} şubesini düzenle`} title="Düzenle" className="grid h-9 w-9 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => archive(`/api/clinic/branches/${branch.id}`, `${branch.name} şubesini arşivlemek istediğinize emin misiniz?`, "Şube arşivlendi.")} aria-label={`${branch.name} şubesini arşivle`} title="Arşivle" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><Archive className="h-4 w-4" /></button></div> : null}</div></article>)}{!branches.length && !editingBranch ? <p className="rounded-lg border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500">Henüz şube kaydı yok.</p> : null}</div></section> : null}

    {tab === "dentists" ? <section className="py-6"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-blue-950">Diş hekimleri</h2><p className="mt-1 text-sm text-slate-600">Hekim profilleri moderasyon onayından sonra yayınlanır.</p></div>{canManage && !editingDentist ? <button type="button" onClick={() => setEditingDentist({ id: "", fullName: "", title: "Diş Hekimi", university: "", graduationYear: null, experienceYears: 0, about: "", languages: ["Türkçe"], acceptsChildren: false, acceptsInternationalPatients: false, onlineConsultation: false, verificationStatus: "DRAFT" })} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Hekim ekle</button> : null}</div>
      {canManage && editingDentist ? <form key={editingDentist.id || "new"} onSubmit={saveDentist} className="mt-5 grid gap-3 border-y border-blue-100 bg-blue-50/40 py-5 sm:grid-cols-2"><h3 className="font-semibold text-blue-950 sm:col-span-2">{editingDentist.id ? "Hekimi düzenle" : "Yeni hekim"}</h3><input name="fullName" required defaultValue={editingDentist.fullName} placeholder="Ad soyad" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="title" required defaultValue={editingDentist.title} placeholder="Unvan" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="university" defaultValue={editingDentist.university ?? ""} placeholder="Üniversite" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="graduationYear" type="number" min="1950" max={new Date().getFullYear()} defaultValue={editingDentist.graduationYear ?? ""} placeholder="Mezuniyet yılı" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="experienceYears" type="number" min="0" max="70" defaultValue={editingDentist.experienceYears} placeholder="Deneyim yılı" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="languages" required defaultValue={editingDentist.languages.join(", ")} placeholder="Diller: Türkçe, İngilizce" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><textarea name="about" rows={3} maxLength={2500} defaultValue={editingDentist.about ?? ""} placeholder="Hekim hakkında" className="rounded-md border border-blue-200 px-3 py-2 text-sm sm:col-span-2" /><div className="flex flex-wrap gap-4 text-sm text-slate-700 sm:col-span-2"><label className="flex items-center gap-2"><input name="acceptsChildren" type="checkbox" defaultChecked={editingDentist.acceptsChildren} /> Çocuk hasta kabulü</label><label className="flex items-center gap-2"><input name="acceptsInternationalPatients" type="checkbox" defaultChecked={editingDentist.acceptsInternationalPatients} /> Uluslararası hasta</label><label className="flex items-center gap-2"><input name="onlineConsultation" type="checkbox" defaultChecked={editingDentist.onlineConsultation} /> Online görüşme</label></div><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400">Kaydet</button><button type="button" onClick={() => setEditingDentist(null)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><X className="h-4 w-4" /> Vazgeç</button></div></form> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{dentists.map((dentist) => <article key={dentist.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{dentist.fullName}</h3><p className="mt-1 text-sm text-slate-600">{dentist.title} · {dentist.experienceYears} yıl deneyim</p><p className="mt-1 text-xs text-slate-500">{dentist.languages.join(", ")}</p><span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${dentist.verificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{dentist.verificationStatus === "VERIFIED" ? "Yayında" : "İncelemede"}</span></div>{canManage ? <div className="flex gap-1"><button type="button" onClick={() => setEditingDentist(dentist)} aria-label={`${dentist.fullName} bilgilerini düzenle`} title="Düzenle" className="grid h-9 w-9 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => archive(`/api/clinic/dentists/${dentist.id}`, `${dentist.fullName} kaydını arşivlemek istediğinize emin misiniz?`, "Hekim arşivlendi.")} aria-label={`${dentist.fullName} kaydını arşivle`} title="Arşivle" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><Archive className="h-4 w-4" /></button></div> : null}</div></article>)}{!dentists.length && !editingDentist ? <p className="rounded-lg border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500 sm:col-span-2">Henüz hekim kaydı yok.</p> : null}</div></section> : null}

    {tab === "team" ? <section className="py-6"><div><h2 className="text-xl font-semibold text-blue-950">Ekip ve yetkiler</h2><p className="mt-1 text-sm text-slate-600">Yöneticiler tüm klinik ayarlarını, diş hekimleri hasta talepleri ve mesajları yönetebilir.</p></div>{canManage ? <form method="post" onSubmit={invite} className="mt-5 grid gap-3 border-y border-blue-100 bg-blue-50/40 py-5 sm:grid-cols-[1fr_200px_auto]"><input name="email" type="email" required placeholder="Ekip üyesinin e-postası" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><select name="role" className="rounded-md border border-blue-200 px-3 py-2 text-sm"><option value="DENTIST">Diş hekimi</option><option value="CLINIC_MANAGER">Klinik yöneticisi</option></select><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"><Send className="h-4 w-4" /> Davet gönder</button></form> : null}
      <div className="mt-5 overflow-x-auto rounded-lg border border-blue-100 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-blue-100 bg-blue-50/60 text-xs text-slate-500"><tr><th className="px-4 py-3">Ekip üyesi</th><th className="px-4 py-3">Yetki</th>{canManage ? <th className="px-4 py-3 text-right">İşlem</th> : null}</tr></thead><tbody className="divide-y divide-slate-100">{members.map((member) => <tr key={member.id}><td className="px-4 py-3"><p className="font-medium text-slate-950">{member.user.name}{member.userId === currentUserId ? " (siz)" : ""}</p><p className="text-xs text-slate-500">{member.user.email}</p></td><td className="px-4 py-3">{canManage ? <select defaultValue={member.role} onChange={(event) => run(() => apiRequest(`/api/clinic/team/${member.id}`, "PATCH", { role: event.target.value }), "Ekip yetkisi güncellendi.")} className="rounded-md border border-blue-200 px-2 py-1.5 text-sm"><option value="DENTIST">Diş hekimi</option><option value="CLINIC_MANAGER">Klinik yöneticisi</option></select> : member.role === "CLINIC_MANAGER" ? "Klinik yöneticisi" : "Diş hekimi"}</td>{canManage ? <td className="px-4 py-3 text-right"><button type="button" onClick={() => archive(`/api/clinic/team/${member.id}`, `${member.user.name} ekipten çıkarılsın mı?`, "Ekip üyesi çıkarıldı.")} aria-label={`${member.user.name} adlı kullanıcıyı ekipten çıkar`} title="Ekipten çıkar" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50 ml-auto"><X className="h-4 w-4" /></button></td> : null}</tr>)}</tbody></table></div>
      {invitations.length ? <div className="mt-6"><h3 className="font-semibold text-blue-950">Bekleyen davetler</h3><div className="mt-3 grid gap-2">{invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm"><div><p className="font-medium text-amber-950">{invitation.email}</p><p className="text-xs text-amber-800">{invitation.role === "CLINIC_MANAGER" ? "Klinik yöneticisi" : "Diş hekimi"} · {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(invitation.expiresAt))} tarihine kadar</p></div>{canManage ? <button type="button" onClick={() => archive(`/api/clinic/team/invitations/${invitation.id}`, "Bu davet iptal edilsin mi?", "Davet iptal edildi.")} className="inline-flex items-center gap-1 text-xs font-semibold text-red-700"><X className="h-3.5 w-3.5" /> İptal et</button> : null}</div>)}</div></div> : null}</section> : null}
  </div>;
}
