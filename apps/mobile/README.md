# Mobile (apps/mobile)

This is the Expo / React Native app.

## Dev setup

From repo root:

```bash
pnpm install
```

Then from `apps/mobile`:

```bash
pnpm dev
```

## Environment (.env)

This project uses Expo public env vars (`EXPO_PUBLIC_*`).

1) Create `apps/mobile/.env` from the example:

```bash
cp .env.example .env
```

2) Fill values.

Notes:

- `apps/mobile/.env` is ignored by git (root `.gitignore` ignores `.env`).
- If you don't set `EXPO_PUBLIC_API_BASE_URL`, the app defaults to:
  - Android emulator: `http://10.0.2.2:4000`
  - iOS simulator / web: `http://localhost:4000`
  - Physical device: you should set it to your LAN IP, e.g. `http://192.168.x.x:4000`

## Mapbox (required for Android builds)

There are 2 different tokens:

1) Mapbox access token (runtime)
- Used by the app to render maps and call the Mapbox APIs.
- Set in `apps/mobile/.env` as `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.

2) Mapbox downloads token (build-time, Android)
- Required by `@rnmapbox/maps` to download native artifacts from Mapbox Maven.
- Provide it via one of these:

Recommended (global): `~/.gradle/gradle.properties`

```properties
MAPBOX_DOWNLOADS_TOKEN=YOUR_TOKEN
```

Alternative (per-project, git-ignored): `apps/mobile/android/gradle.properties`

```properties
MAPBOX_DOWNLOADS_TOKEN=YOUR_TOKEN
```

Also supported via environment variables during build:

- `MAPBOX_DOWNLOADS_TOKEN`
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`

Important:

- Do NOT commit tokens.
- `apps/mobile/android/gradle.properties` is git-ignored via `apps/mobile/.gitignore` (`/android`).
