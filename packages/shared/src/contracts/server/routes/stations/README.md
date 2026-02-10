# Station Routes

This folder contains the station API routes organized for better maintainability.

## Structure

- **`queries.ts`** - All GET endpoints (read operations)
- **`mutations.ts`** - Placeholder for write operations (currently empty - all stations routes are GET)
- **`shared.ts`** - Shared helpers, schemas, and utilities
- **`index.ts`** - Barrel exports and aggregated `stationsRoutes` object

## Organization

- **Queries = all GETs** - All station routes are read operations (no mutations currently)
- **Mutations = all writes** - Empty placeholder for future write operations
- **Re-exported via index.ts** - All routes are re-exported and aggregated into the `stationsRoutes` object

## Usage

The `stationsRoutes` object maintains the same API as before, with all 9 routes available under their original names:

```typescript
import { stationsRoutes } from './stations';
// Same API as before - no breaking changes
```

## Routes

All 9 station routes are GET endpoints:
- `listStations` - GET /v1/stations
- `getStation` - GET /v1/stations/{stationId}
- `getStationStats` - GET /v1/stations/{stationId}/stats
- `getAllStationsRevenue` - GET /v1/stations/revenue
- `getBikeRevenueByStation` - GET /v1/stations/bike-revenue
- `getHighestRevenueStation` - GET /v1/stations/highest-revenue
- `getNearbyStations` - GET /v1/stations/nearby
- `getStationAlerts` - GET /v1/stations/alerts
- `getNearestAvailableBike` - GET /v1/stations/nearest-available-bike