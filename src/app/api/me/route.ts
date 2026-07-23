import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  return NextResponse.json({
    user,
    destination: user.role === "PATIENT" ? "/panel/hasta" : "/panel/klinik",
  });
}
