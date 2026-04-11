# Redistribution Contracts

This directory contains the type-safe redistribution contracts for the MeBike system.

## Files Structure

- `models.ts` - Core redistribution data models, request/response schemas, and DTOs
- `errors.ts` - Redistribution-specific error codes and payload schemas
- `schemas.ts` - Shared input schemas and validators (date range, UUID, etc.)
- `index.ts` - Barrel exports for all redistribution contracts

## Core Redistribution Models

### Redistribution Request
- `RedistributionRequestSchema`
- `RedistributionRequestDetailSchema`
- `RedistributionRequestListItemSchema`
- `RedistributionRequestListResponseSchema`
- `CreateRedistributionRequestSchema`

### Item / Station / Agency / Bike shapes
- `RedistributionRequestItemSchema`
- `RedistributionRequestItemDetailSchema`
- `RedistributionStationSchema` / `RedistributionStationSummarySchema`
- `RedistributionAgencySchema` / `RedistributionAgencySummarySchema`
- `RedistributionBikeSchema`
- `RedistributionUserSummarySchema` / `RedistributionUserDetailSchema`

## Error Handling

### Codes
- `REDISTRIBUTION_REQUEST_NOT_FOUND`
- `INSUFFICIENT_AVAILABLE_BIKES`

### Schemas
- `RedistributionReqErrorCodeSchema`
- `RedistributionReqErrorDetailSchema`
- `RedistributionReqErrorResponseSchema`

## Common Shared Schemas

- `RedistributionIsoDateTimeStringSchema`
- `RedistributionDateRangeQuerySchema`
- `RedistributionRequestIdParamSchema`
- `RedistributionRequestListQuerySchema`

## Integration Notes

1. **ISO Date Format**: All dates use ISO 8601 format (legacy dd-mm-yyyy parsing not supported)
2. **Pagination**: Uses standard MongoDB pagination with page/limit/total
3. **Response Envelope**: Follows standard `{message, result}` or `{data, pagination}` patterns
4. **Error Envelope**: Standard `{error, details}` with typed error codes
5. **Messages**: Error codes in English; user-facing messages can be localized by clients

## Usage

```ts
import {
  RedistributionRequestSchema,
  RedistributionRequestDetailSchema,
  CreateRedistributionRequestSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestListResponseSchema,
} from "@mebike/shared/contracts/server/redistribution";

// Example data shape
const payload: CreateRedistributionRequest = {
  sourceStationId: "...",
  targetStationId: "...",
  items: [{ bikeId: "...", quantity: 1 }],
};
```

These contracts are used to keep Redistribtution APIs and frontend clients fully type-safe and aligned with backend validation.