import Mapbox from "@rnmapbox/maps";

import { log } from "./log";

let initialized = false;

export function initMapbox() {
  if (initialized)
    return;
  initialized = true;

  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    log.warn("Mapbox access token missing", {
      env: "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN",
    });
    return;
  }

  Mapbox.setAccessToken(token);
}
