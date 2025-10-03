# IoT Service HTTP Contract & Docs Guide

This file documents how the Io## 7. Command Types & When to Use Them

The API exposes **two layers of abstraction** for controlling devices:

### 7.1. State Commands (Low-level, Admin/Debug)

**Endpoint:** `POST /v1/devices/:deviceId/commands/state`

**Purpose:** Direct state manipulation for administrative purposes. Bypasses business logic but still validates state transitions via `canTransitionTo()` in the ESP32.

**Available states:**

- `available` - Device is ready for use
- `reserved` - Device is temporarily held (not yet in use)
- `booked` - Device is actively in use
- `broken` - Device is broken and needs repair
- `maintained` - Device is under maintenance
- `unavailable` - Device is offline or temporarily disabled

**Use cases:**

- Admin marking a device as broken or under maintenance
- System recovery/override scenarios
- Testing and debugging

**Example:**

```bash
# Admin marks bike as broken
POST /v1/devices/AABBCC/commands/state
{ "state": "broken" }

# Admin brings bike back online
POST /v1/devices/AABBCC/commands/state
{ "state": "available" }
```

### 7.2. Workflow Commands (High-level, User-facing)

These implement business logic with specific transition rules and additional behaviors (e.g., publishing to booking status topics).

#### 7.2.1. Booking Commands

**Endpoint:** `POST /v1/devices/:deviceId/commands/booking`

**Commands:**

- `book` - Book an available or reserved bike immediately
  - Allowed from: `STATE_AVAILABLE` or `STATE_RESERVED`
  - Transitions to: `STATE_BOOKED`
  - Use case: User starts using a bike
- `claim` - Claim a previously reserved bike
  - Allowed from: `STATE_RESERVED` only
  - Transitions to: `STATE_BOOKED`
  - Use case: User arrives and activates their reservation
- `release` - Release a bike after use
  - Allowed from: `STATE_BOOKED` only
  - Transitions to: `STATE_AVAILABLE`
  - Use case: User finishes their ride

**Example workflow:**

```bash
# User reserves a bike
POST /v1/devices/AABBCC/commands/reservation
{ "command": "reserve" }

# User arrives and claims it
POST /v1/devices/AABBCC/commands/booking
{ "command": "claim" }

# User finishes ride
POST /v1/devices/AABBCC/commands/booking
{ "command": "release" }
```

**Or simpler (no reservation):**

```bash
# User books directly
POST /v1/devices/AABBCC/commands/booking
{ "command": "book" }

# User finishes
POST /v1/devices/AABBCC/commands/booking
{ "command": "release" }
```

#### 7.2.2. Reservation Commands

**Endpoint:** `POST /v1/devices/:deviceId/commands/reservation`

**Commands:**

- `reserve` - Reserve a bike for pickup (typically 5-15 min window)
  - Allowed from: `STATE_AVAILABLE` only
  - Transitions to: `STATE_RESERVED`
- `cancel` - Cancel a reservation before claiming
  - Allowed from: `STATE_RESERVED` only
  - Transitions to: `STATE_AVAILABLE`

**Example:**

```bash
# User reserves bike
POST /v1/devices/AABBCC/commands/reservation
{ "command": "reserve" }

# User changes mind
POST /v1/devices/AABBCC/commands/reservation
{ "command": "cancel" }
```

#### 7.2.3. Maintenance Commands

**Endpoint:** `POST /v1/devices/:deviceId/commands/maintenance`

**Commands:**

- `start` - Begin maintenance on a device
  - Allowed from: `STATE_AVAILABLE`, `STATE_BROKEN`, or `STATE_UNAVAILABLE`
  - Transitions to: `STATE_MAINTAINED`
- `complete` - Complete maintenance and return to service
  - Allowed from: `STATE_MAINTAINED` only
  - Transitions to: `STATE_AVAILABLE`

**Example:**

```bash
# Start maintenance
POST /v1/devices/AABBCC/commands/maintenance
{ "command": "start" }

# Finish maintenance
POST /v1/devices/AABBCC/commands/maintenance
{ "command": "complete" }
```

### 7.3. Choosing the Right Command Type

| Scenario                     | Use This                                       |
| ---------------------------- | ---------------------------------------------- |
| User books/releases bike     | Booking commands (`book`, `release`)           |
| User reserves bike for later | Reservation commands (`reserve`, `cancel`)     |
| Admin marks bike broken      | State command (`state: "broken"`)              |
| Admin starts maintenance     | Maintenance command (`start`) or State command |
| System recovery/testing      | State commands                                 |
| Frontend user actions        | Workflow commands (booking, reservation)       |
| Backend admin panel          | State commands + workflow commands             |

### 7.4. State Transition Matrix (ESP32 Logic)

The ESP32's `canTransitionTo()` function enforces these rules:

```
FROM              → TO (allowed transitions)
──────────────────────────────────────────────
AVAILABLE         → reserved, booked, broken, maintained, unavailable
RESERVED          → available, booked
BOOKED            → available, broken, maintained, unavailable
BROKEN            → maintained, unavailable
MAINTAINED        → available, unavailable
UNAVAILABLE       → available, maintained
CONNECTED/ERROR   → available, maintained, unavailable
```

**Important:** Workflow commands add additional constraints on top of these base rules. For example, the `claim` booking command only works from `RESERVED`, even though the state machine technically allows `AVAILABLE → BOOKED`.

## 8. Useful Commands

```bash
# build shared types (must run before publishing changes)
pnpm --filter @mebike/shared build

# build iot-service (ts -> dist)
pnpm --filter iot-service build

# run in watch/dev mode
pnpm --filter iot-service dev
```

That's the full flow. When you add or modify endpoints, follow Sections 5–8 to keep the contract, implementation, and docs in sync.ses HTTP APIs using **Hono**, **@hono/zod-openapi**, and **@scalar/hono-api-reference**. Use it as a refresher the next time you touch the contract or add routes.

## 1. Packages in Play

| Package                      | Role                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `hono`                       | Minimal HTTP framework.                                                      |
| `@hono/zod-openapi`          | Generates OpenAPI metadata directly from Zod schemas/routes.                 |
| `@scalar/hono-api-reference` | Serves an interactive Scalar API reference UI for any OpenAPI JSON endpoint. |
| `zod`                        | Shared validation primitives. We extend it once with OpenAPI helpers.        |

All dependencies live in `packages/shared/package.json` (shared types) and `apps/iot-service/package.json` (service runtime).

## 2. One-Time Shared Setup

1. `packages/shared/src/zod.ts` calls `extendZodWithOpenApi` and re-exports `z`. Every schema should import from here so `.openapi()` is available.
2. Contract files live under `packages/shared/src/contracts/iot-service/`:
   - `schemas.ts` defines request/response/param bodies with Zod.
   - `routes.ts` uses `createRoute` to describe each endpoint, referencing those schemas.
   - `index.ts` re-exports everything and holds the `iotServiceOpenApi` document metadata (title, version, servers).
3. The shared entry point (`packages/shared/src/index.ts`) exports the contract, so the service (and other consumers) can import `iotServiceRoutes`, `iotServiceOpenApi`, and the related types.

## 3. Service HTTP Layer Structure

```
apps/iot-service/src/http/
├── app.ts              // creates the Hono app, registers docs + routes
├── server.ts           // wraps @hono/node-server
└── routes/
    ├── devices.ts      // /v1/health, /v1/devices, /v1/devices/:deviceId
    └── commands.ts     // POST command endpoints
```

- `createHttpApp` builds a single `OpenAPIHono` instance, mounts the OpenAPI JSON (`/docs/openapi.json`), and serves Scalar at `/docs`.
- `registerDeviceRoutes` and `registerCommandRoutes` take the app plus dependencies (device manager or command publisher) and attach handlers using `app.openapi(...)` with the shared route definitions. This keeps the handler logic decoupled from contract metadata.

## 4. Scalar UI Wiring

1. Ensure `iotServiceOpenApi` is exposed via `app.doc('/docs/openapi.json', iotServiceOpenApi)`.
2. Mount Scalar UI with:
   ```ts
   app.get(
     "/docs",
     Scalar({
       title: "IoT Service API Reference",
       url: "/docs/openapi.json",
     }),
   );
   ```
   You can pass any Scalar configuration here (themes, auth, etc.).
3. When the service runs (`pnpm --filter iot-service dev` or `start`), browse to `http://localhost:3000/docs` (or your configured host/port).

## 5. Adding a New Endpoint

1. **Define the schema** in `packages/shared/src/contracts/iot-service/schemas.ts`. Reuse existing Zod enums where possible.
2. **Add the route definition** in `routes.ts` with `createRoute`. Reference request params/body schemas and set proper response codes.
3. **Export** the new route via `iotServiceRoutes` (already done when you add to the object).
4. **Implement the handler** inside the service:
   - Create a helper (e.g., `routes/new-feature.ts`) that imports `iotServiceRoutes.yourRouteKey` and calls `app.openapi(route, handler)`.
   - Inject dependencies (publishers, managers, etc.) through the `register...` function signature.
   - Return typed responses using `c.json<Type, StatusCode>(...)` so TypeScript keeps contract enforcement.
5. **Wire the helper** in `http/app.ts` alongside other `register*Routes` calls.
6. **Rebuild** shared + service (`pnpm --filter @mebike/shared build && pnpm --filter iot-service build`). This guarantees the shared package emits fresh d.ts files for all consumers.

## 6. Runtime Notes

- MQTT updates must flow through `DeviceManager` to populate `/v1/devices`. We subscribe to wildcard topics in `src/index.ts`.
- Config values (`HTTP_HOST`, `HTTP_PORT`, etc.) are validated in `src/config/index.ts` using plain Zod (no OpenAPI extension needed there).
- Keep Scalar docs reachable by ensuring `/docs` isn’t behind auth. If you later add auth, consider exposing docs separately.

## 7. Useful Commands

```bash
# build shared types (must run before publishing changes)
pnpm --filter @mebike/shared build

# build iot-service (ts -> dist)
pnpm --filter iot-service build

# run in watch/dev mode
pnpm --filter iot-service dev
```
