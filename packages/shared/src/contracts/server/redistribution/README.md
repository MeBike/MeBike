# Redistribution Contracts

This directory contains the type-safe redistribution contracts for the MeBike system.

## Files Structure

- `models.ts` - Core redistribution data models, request/response schemas, and DTOs
- `errors.ts` - Redistribution-specific error codes and payload schemas
- `schemas.ts` - Shared input schemas and validators (date range, UUID, etc.)
- `index.ts` - Barrel exports for all redistribution contracts

## Features

The redistribution domain manages the movement of bikes between stations to ensure optimal bike availability across the network.

### 1. Request Lifecycle
- **Creation**: Staff members can initiate a redistribution request from their current station to a target station.
- **Approval/Rejection**: Managers at the **target station** must review and approve or reject incoming requests.
- **Cancellation**: The original creator can cancel a request as long as it is still in the `PENDING_APPROVAL` state.
- **Transit**: Once approved, staff can start the transit process. Bikes are automatically marked as unavailable and removed from the source station's inventory at this stage.
- **Completion**: Upon delivery, staff at the target station confirm the receipt. The system supports full or partial completion if only a subset of requested bikes are successfully delivered.

### 2. Validation & Constraints
- **Availability Check**: Source stations must have the requested number of `AVAILABLE` bikes.
- **Capacity Check**: Target stations must have enough `EMPTY SLOTS` to accommodate the incoming bikes.
- **Safety Margin**: A minimum of 10 bikes must remain at the source station after a redistribution request is fulfilled to maintain local service levels.
- **Single Request Constraint**: Only one active (non-terminal) redistribution request is allowed per source station at a time to prevent logistical conflicts.

### 3. Role-Based Access
- **Admin**: Full system-wide visibility and management of all redistribution requests.
- **Manager**: Responsible for approving/rejecting requests targeting their station and monitoring station-wide history.
- **Staff**: Can create requests, start transits, and confirm completions for their assigned station.
- **Agency**: Specialized view for agency-affiliated staff to track relevant movements.

## Error Handling

### Common Error Codes
- `REDISTRIBUTION_REQUEST_NOT_FOUND`: The specified request ID does not exist.
- `INSUFFICIENT_AVAILABLE_BIKES`: Source station doesn't have enough bikes to fulfill the request.
- `INSUFFICIENT_EMPTY_SLOTS`: Target station is full or lacks enough slots.
- `EXCEEDED_MIN_BIKES_AT_STATION`: Fulfillment would drop source station below the safety margin (10 bikes).
- `UNAUTHORIZED_ACCESS`: User lacks permission for the specific request or operation.
- `INCOMPLETED_REDISTRIBUTION_REQUEST_EXISTS`: An active request already exists for the source station.

### Error Response Schema
All errors follow a standard structure:
```json
{
  "error": "Error message string",
  "details": {
    "code": "ERROR_CODE_CONSTANT",
    "requestId": "uuid",
    "...": "additional context fields"
  }
}
```

## Integration Notes

1. **ISO Date Format**: All timestamps use ISO 8601 format.
2. **Atomic Transactions**: Operations like creating a request or starting transit are wrapped in Prisma transactions to ensure data consistency between bike statuses and request logs.
3. **Implicit Station Context**: Most endpoints derive the `stationId` from the authenticated user's organizational assignment (OrgAssignment).

## Usage Example

```ts
import { 
  CreateRedistributionRequestSchema, 
  RedistributionRequestDetailSchema 
} from "@mebike/shared/contracts/server/redistribution";

// Create Request Payload
const payload = {
  sourceStationId: "019b...1",
  targetStationId: "019b...2",
  requestedQuantity: 5,
  reason: "High demand at target station"
};
```