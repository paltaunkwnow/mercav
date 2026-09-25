export async function detectLocation(ip: string) {
  try {
    const safeIp = /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-f0-9:]+$/i.test(ip) ? ip : "";
    const url = safeIp && safeIp !== "::1" && safeIp !== "127.0.0.1"
      ? `https://ipapi.co/${encodeURIComponent(safeIp)}/json/`
      : `https://ipapi.co/json/`;
      
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch location");
    
    const data = await response.json();
    return {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      timezone: data.timezone,
      currency: data.currency
    };
  } catch (error) {
    console.error("Error detecting location:", error);
    return null;
  }
}
// creado por pato dev y askforvini
