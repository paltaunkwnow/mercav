export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("es")} km`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function cityThreadKey(city: string, countryCode: string) {
  return `city:${slugify(city)}-${countryCode.toLowerCase()}`;
}

export function placeThreadKey(slug: string) {
  return `place:${slug}`;
}

/**
 * Approximate Shabbat window from coordinates, without a zmanim API.
 * Candle lighting is 18 minutes before Friday sunset; Motzaei Shabbat is 42 minutes after Saturday sunset.
 */
export function shabbatWindow(lat: number, lng: number, now = new Date()) {
  const local = new Date(now.getTime() + (lng / 15) * 3_600_000);
  const weekday = local.getUTCDay();
  const hours = local.getUTCHours() + local.getUTCMinutes() / 60;
  const sunset = approxSunsetHour(lat, local);
  const candles = sunset - 18 / 60;
  const tzeit = sunset + 42 / 60;
  const active = (weekday === 5 && hours >= candles) || (weekday === 6 && hours < tzeit);
  return { active, candles: toClock(candles), havdalah: toClock(tzeit) };
}

function toClock(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function approxSunsetHour(lat: number, local: Date): number {
  const start = Date.UTC(local.getUTCFullYear(), 0, 0);
  const day = Math.floor(
    (Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - start) / 86_400_000,
  );
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 365) * (day - 81)) * (Math.PI / 180);
  const latRad = (lat * Math.PI) / 180;
  const cosH =
    (Math.sin((-0.83 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));
  if (cosH >= 1) return 12;
  if (cosH <= -1) return 18;
  return 12 + (Math.acos(cosH) * 180) / Math.PI / 15;
}
