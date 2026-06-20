export async function detectLocation(ip: string) {
  try {
    const url = ip && ip !== "::1" && ip !== "127.0.0.1" 
      ? `https://ipapi.co/${ip}/json/` 
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
