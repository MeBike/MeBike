# Redistribution Routes

This folder contains the redistribution API routes organized for better maintainability.

## Structure

- **`queries.ts`** - All GET endpoints (read operations)
- **`mutations.ts`** - Placeholder for write operations (currently empty - all redistribution routes are GET)
- **`shared.ts`** - Shared helpers, schemas, and utilities
- **`index.ts`** - Barrel exports and aggregated `redistributionRoutes` object

## Organization

- **Queries = all GETs** - Routes that only read redistribution data
- **Mutations = all writes** - Placeholder for future write routes
- **Re-exported via index.ts** - Routes are re-exported via `redistributionRoutes` for stable API

## Usage

The `redistributionRoutes` object maintains the same API as before, with all routes available under their original names:

```typescript
import { redistributionRoutes } from './redistribution';
// Same API as before - no breaking changes
```