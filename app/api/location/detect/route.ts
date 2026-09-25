import { NextResponse } from "next/server";
import { detectLocation } from "@/lib/location";
import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "";
  
  const location = await detectLocation(ip);
  
  if (location) {
    return NextResponse.json({ success: true, data: location });
  }
  
  return NextResponse.json({ success: false, error: "No se pudo detectar la ubicación" }, { status: 500 });
}
// creado por Patodev y Invertilo
