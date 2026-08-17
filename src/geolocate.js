const API_BASE = 'https://api.restcountries.com/ip/v1';

/**
 * Resolves an IP address to location/network data via the REST Countries IP API.
 * Never throws — returns null on any failure (unresolvable/private IP, network
 * error, bad API key) so a lookup can still be recorded with just the raw IP.
 */
export async function geolocateIp(ip) {
  const apiKey = process.env.COUNTRIES_API_KEY;
  if (!apiKey || !ip || ip === 'unknown') return null;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(ip)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const body = await res.json();
    const location = body?.data?.objects?.[0]?.location;
    if (!location) return null;

    return {
      country: location.country?.name ?? null,
      city: location.city?.name ?? null,
      continent: location.continent?.name ?? null,
    };
  } catch (err) {
    console.warn('geolocateIp: lookup failed', err);
    return null;
  }
}
