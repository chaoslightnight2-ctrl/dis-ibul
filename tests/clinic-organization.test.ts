import { describe, expect, it } from "vitest";
import {
  clinicBranchSchema,
  clinicDentistSchema,
  clinicTeamInvitationSchema,
  clinicTeamRoleSchema,
} from "../src/domain/validation";
import { clinicIdFromCookieHeader } from "../src/domain/clinic-context";

describe("clinic organization validation", () => {
  it("normalizes optional branch contact fields", () => {
    const branch = clinicBranchSchema.parse({
      name: "Kadıköy Şubesi",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mahallesi Test Sokak No 10",
      phone: "",
      email: "",
      isMain: true,
    });
    expect(branch.phone).toBeNull();
    expect(branch.email).toBeNull();
    expect(clinicBranchSchema.safeParse({ ...branch, address: "kısa" }).success).toBe(false);
  });

  it("requires a usable dentist profile and at least one language", () => {
    const base = {
      fullName: "Dr. Deniz Yılmaz",
      title: "Diş Hekimi",
      university: "Marmara Üniversitesi",
      graduationYear: 2018,
      experienceYears: 8,
      about: "Restoratif tedaviler alanında çalışır.",
      languages: ["Türkçe"],
      acceptsChildren: true,
      acceptsInternationalPatients: false,
      onlineConsultation: false,
    };
    expect(clinicDentistSchema.safeParse(base).success).toBe(true);
    expect(clinicDentistSchema.safeParse({ ...base, languages: [] }).success).toBe(false);
  });

  it("limits invitations and membership roles to clinic roles", () => {
    expect(clinicTeamInvitationSchema.parse({ email: "TEST@EXAMPLE.COM", role: "DENTIST" }).email).toBe("test@example.com");
    expect(clinicTeamInvitationSchema.safeParse({ email: "test@example.com", role: "PATIENT" }).success).toBe(false);
    expect(clinicTeamRoleSchema.safeParse({ role: "SUPER_ADMIN" }).success).toBe(false);
  });
});

describe("active clinic cookie parsing", () => {
  it("reads only the exact active-clinic cookie and rejects oversized values", () => {
    expect(clinicIdFromCookieHeader("foo=bar; discibul_active_clinic=clinic-123; theme=light")).toBe("clinic-123");
    expect(clinicIdFromCookieHeader(`discibul_active_clinic=${"x".repeat(101)}`)).toBeNull();
    expect(clinicIdFromCookieHeader("discibul_active_clinic=%E0%A4%A")).toBeNull();
  });
});
