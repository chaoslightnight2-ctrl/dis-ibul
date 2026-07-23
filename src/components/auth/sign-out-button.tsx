"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      title="Çıkış yap"
      aria-label="Çıkış yap"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 text-blue-800 hover:bg-blue-50"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
