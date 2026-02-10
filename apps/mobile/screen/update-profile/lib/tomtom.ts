const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

export type TomTomAddressSuggestion = {
  address: string;
  latitude: number;
  longitude: number;
};

export async function fetchTomTomReverseGeocode(latitude: string, longitude: string) {
  try {
    if (!TOMTOM_API_KEY) {
      return "";
    }
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.JSON?key=${TOMTOM_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.addresses?.[0]?.address?.freeformAddress || "";
  }
  catch {
    return "";
  }
}

export async function fetchTomTomAddressSuggest(addressText: string): Promise<TomTomAddressSuggestion[]> {
  try {
    if (!TOMTOM_API_KEY) {
      return [];
    }
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(addressText)}.JSON?key=${TOMTOM_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map((r: any) => ({
      address: r.address?.freeformAddress,
      latitude: r.position?.lat,
      longitude: r.position?.lon,
    })).filter((r: any) => Boolean(r.address) && Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
  }
  catch {
    return [];
  }
}
