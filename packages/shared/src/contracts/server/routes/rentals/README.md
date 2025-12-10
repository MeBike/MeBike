# Rental Routes

This folder contains the rental API routes organized into queries and mutations for better maintainability.

## Structure

- **`queries.ts`** - All GET endpoints (read operations)
- **`mutations.ts`** - All POST/PUT endpoints (write operations)
- **`shared.ts`** - Shared helpers, schemas, and utilities used by both files
- **`index.ts`** - Barrel exports and aggregated `rentalsRoutes` object

## Organization

- **Queries = all GETs** - Routes that only read data
- **Mutations = all writes** - Routes that create, update, or delete data
- **Re-exported via index.ts** - All routes are re-exported and aggregated into the `rentalsRoutes` object to maintain backward compatibility

## Usage

The `rentalsRoutes` object maintains the same API as before, with all 20 routes available under their original names:

```typescript
import { rentalsRoutes } from './rentals';
// Same API as before - no breaking changes
```