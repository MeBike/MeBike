import ky from "ky";

import { log } from "@lib/log";

type MapboxReverseGeocodeContext = {
  name?: string;
};

type MapboxReverseGeocodeFeature = {
  properties?: {
    name?: string;
    full_address?: string;
    context?: {
      street?: MapboxReverseGeocodeContext;
      neighborhood?: MapboxReverseGeocodeContext;
      locality?: MapboxReverseGeocodeContext;
      place?: MapboxReverseGeocodeContext;
      district?: MapboxReverseGeocodeContext;
      region?: MapboxReverseGeocodeContext;
      country?: MapboxReverseGeocodeContext;
    };
  };
};

type MapboxReverseGeocodeResponse = {
  features?: MapboxReverseGeocodeFeature[];
};

export type MapboxReverseGeocodeResult = {
  label: string;
  street: string | null;
  district: string | null;
  city: string | null;
  placeName: string | null;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const mapboxKy = ky.create({
  retry: { limit: 0 },
  timeout: 15000,
});

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

function dedupeParts(parts: Array<string | null>) {
  const seen = new Set<string>();

  return parts.filter((part): part is string => {
    if (!part) {
      return false;
    }

    const normalizedKey = part.toLocaleLowerCase("vi-VN");

    if (seen.has(normalizedKey)) {
      return false;
    }

    seen.add(normalizedKey);
    return true;
  });
}

function buildReverseGeocodeLabel(feature: MapboxReverseGeocodeFeature | null | undefined) {
  const properties = feature?.properties;

  if (!properties) {
    return null;
  }

  const street = normalizeText(properties.context?.street?.name)
    ?? normalizeText(properties.name);
  const district = normalizeText(properties.context?.neighborhood?.name)
    ?? normalizeText(properties.context?.locality?.name)
    ?? normalizeText(properties.context?.district?.name);
  const city = normalizeText(properties.context?.place?.name)
    ?? normalizeText(properties.context?.region?.name);
  const placeName = normalizeText(properties.full_address);

  const primaryParts = dedupeParts([street, district, city]);

  if (primaryParts.length >= 2) {
    return {
      label: primaryParts.slice(0, 2).join(", "),
      street,
      district,
      city,
      placeName,
    } satisfies MapboxReverseGeocodeResult;
  }

  const fallbackParts = dedupeParts([
    district,
    city,
    placeName?.split(",").slice(0, 2).join(", ") ?? null,
  ]);

  if (fallbackParts.length === 0) {
    return null;
  }

  return {
    label: fallbackParts.slice(0, 2).join(", "),
    street,
    district,
    city,
    placeName,
  } satisfies MapboxReverseGeocodeResult;
}

export async function fetchMapboxReverseGeocode(
  coords: Coordinates,
): Promise<MapboxReverseGeocodeResult | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    log.warn("Mapbox access token missing for reverse geocoding", {
      env: "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN",
    });
    return null;
  }

  const url = new URL(
    "https://api.mapbox.com/search/geocode/v6/reverse",
  );
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "vi");

  let json: MapboxReverseGeocodeResponse;
  try {
    json = await mapboxKy.get(url.toString()).json<MapboxReverseGeocodeResponse>();
  }
  catch (error) {
    log.warn("Mapbox reverse geocode request failed", {
      error: String(error),
    });
    return null;
  }

  return buildReverseGeocodeLabel(json.features?.[0]);
}
