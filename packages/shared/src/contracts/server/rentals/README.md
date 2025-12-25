# MeBike Rental Contracts

This directory contains the comprehensive type-safe contracts for the MeBike rental management system, following the same patterns established for stations.

## Files Structure

- **`models.ts`** - Core rental data models and request/response schemas
- **`errors.ts`** - Rental-specific error codes and error detail schemas
- **`schemas.ts`** - Shared schemas (date ranges, etc.)
- **`index.ts`** - Barrel exports for all rental contracts

## Core Rental Models

### Base Rental Schema
```typescript
interface Rental {
  id: string;
  userId: string;
  bikeId?: string;
  startStation: string;
  endStation?: string;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  duration: number; // minutes
  totalPrice?: number;
  subscriptionId?: string;
  status: "RENTED" | "COMPLETED" | "CANCELLED" | "RESERVED";
  createdAt: string;
  updatedAt: string;
}
```

### Key Response Models

1. **`RentalWithPrice`** - Base rental with calculated pricing (used for creation)
2. **`RentalDetail`** - Full rental with populated user, bike, and station data
3. **`RentalWithPricing`** - Enhanced rental with detailed pricing breakdown
4. **`RentalListItem`** - Compact rental for paginated lists

### Request Models

- **`CreateRentalRequest`** - User rental creation
- **`StaffCreateRentalRequest`** - Admin/staff rental creation
- **`CardTapRentalRequest`** - NFC card tap rentals
- **`EndRentalRequest`** - End rental session
- **`UpdateRentalRequest`** - Admin rental updates
- **`CancelRentalRequest`** - Rental cancellation

## API Endpoints Covered

### User-Facing Endpoints
- `POST /v1/rentals` - Create rental
- `GET /v1/rentals/me` - User's rental list
- `GET /v1/rentals/me/current` - Active rentals
- `GET /v1/rentals/me/counts` - Rental counts by status
- `GET /v1/rentals/me/{rentalId}` - Rental details
- `PUT /v1/rentals/me/{rentalId}/end` - End rental

### Admin/Staff Endpoints
- `POST /v1/rentals/staff-create` - Create rental by staff
- `POST /v1/rentals/sos/{sosId}` - Create rental from SOS
- `GET /v1/rentals` - All rentals (admin view)
- `GET /v1/rentals/{rentalId}` - Rental details (admin)
- `PUT /v1/rentals/{rentalId}` - Update rental
- `PUT /v1/rentals/{rentalId}/end` - End rental (admin)
- `POST /v1/rentals/{rentalId}/cancel` - Cancel rental
- `GET /v1/rentals/users/{userId}` - Rentals by user
- `GET /v1/rentals/by-phone/{number}/active` - Active rentals by phone

### Card Tap Integration
- `POST /v1/rentals/card-rental` - Process NFC card tap rentals

### Analytics & Statistics
- `GET /v1/rentals/dashboard-summary` - Dashboard metrics
- `GET /v1/rentals/summary` - Rental status counts
- `GET /v1/rentals/stats/revenue` - Revenue analytics
- `GET /v1/rentals/stats/station-activity` - Station usage metrics

## Error Handling

The rental system uses comprehensive error codes with detailed context:

### Access & Permission
- `CANNOT_END_OTHER_RENTAL` - Permission denied
- `ACCESS_DENIED` - Resource access denied
- `CANNOT_CREATE_RENTAL_WITH_SOS_STATUS` - SOS workflow restriction
- `CANNOT_END_RENTAL_WITH_SOS_STATUS` - SOS workflow restriction

### Resource Not Found
- `RENTAL_NOT_FOUND` - Rental ID lookup failed
- `NOT_FOUND_RENTED_RENTAL` - Active rental lookup failed
- `USER_NOT_FOUND` - User validation failed
- `BIKE_NOT_FOUND` - Bike validation failed
- `STATION_NOT_FOUND` - Station validation failed
- `SOS_NOT_FOUND` - SOS alert not found

### Bike Availability
- `BIKE_IN_USE` - Bike currently rented
- `BIKE_IS_BROKEN` - Bike needs maintenance
- `BIKE_IS_MAINTAINED` - Bike under maintenance
- `BIKE_IS_RESERVED` - Bike reserved by other user
- `UNAVAILABLE_BIKE` - General unavailability
- `INVALID_BIKE_STATUS` - Invalid bike status

### Payment & Wallet
- `NOT_ENOUGH_BALANCE_TO_RENT` - Insufficient wallet balance
- `USER_NOT_HAVE_WALLET` - Wallet not set up

### Time & Validation
- `END_DATE_CANNOT_BE_IN_FUTURE` - Future end time
- `END_TIME_MUST_GREATER_THAN_START_TIME` - Invalid time range
- `INVALID_END_TIME_FORMAT` - Invalid ISO format
- `INVALID_RENTAL_STATUS` - Invalid status transition
- `INVALID_OBJECT_ID` - Invalid MongoDB ObjectId

### Status Transitions
- `CANNOT_EDIT_THIS_RENTAL_WITH_STATUS` - Edit restriction
- `CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS` - Cancel restriction
- `UPDATED_STATUS_NOT_ALLOWED` - Invalid target status
- `CANNOT_CANCEL_WITH_BIKE_STATUS` - Bike status conflict
- `CANNOT_EDIT_BIKE_STATUS_TO` - Invalid bike status update

### Data Validation
- `CANNOT_END_WITHOUT_END_STATION` - Missing end station
- `CANNOT_END_WITHOUT_END_TIME` - Missing end time
- `PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON` - Empty update
- `MUST_END_AT_START_STATION` - Station requirement

### Card Tap Errors
- `CARD_RENTAL_ACTIVE_EXISTS` - Active rental conflict
- `USER_NOT_FOUND_FOR_CARD` - Unregistered card
- `BIKE_NOT_FOUND_FOR_CHIP` - Invalid bike chip
- `BIKE_MISSING_STATION` - Bike not assigned to station
- `BIKE_NOT_AVAILABLE_FOR_RENTAL` - Bike not available

### System Errors
- `RENTAL_UPDATE_FAILED` - Database update failure
- `BIKE_UPDATE_FAILED` - Bike update failure

## Data Types & Conversions

### MongoDB to JSON Conversions
- **ObjectId → string**: All IDs converted to strings
- **Decimal128 → number**: Prices converted using parseFloat()
- **Int32 → number**: Duration fields converted to numbers
- **Date → ISO string**: Dates remain Date objects, serialize as ISO strings

### Status Enums
- **RentalStatus**: English status strings ("RENTED", "COMPLETED", "CANCELLED", "RESERVED")
- **BikeStatus**: English bike status strings ("AVAILABLE", "BROKEN", etc.)
- **UserRole**: English role strings ("USER", "STAFF", "ADMIN", "SOS")
- **VerifyStatus**: English verification strings ("UNVERIFIED", "VERIFIED", "BANNED")

## Integration Notes

1. **ISO Date Format**: All dates use ISO 8601 format (legacy dd-mm-yyyy parsing not supported)
2. **Pagination**: Uses standard MongoDB pagination with page/limit/total
3. **Response Envelope**: Follows standard `{message, result}` or `{data, pagination}` patterns
4. **Error Envelope**: Standard `{error, details}` with typed error codes
5. **Messages**: Error codes in English; user-facing messages can be localized by clients

## Usage Example

```typescript
import {
  RentalWithPriceSchema,
  RentalErrorCodeSchema,
  CreateRentalRequestSchema
} from "@mebike/shared/contracts/server/rentals";

// Type-safe rental creation
const createRentalRequest: CreateRentalRequest = {
  bikeId: "665fd6e36b7e5d53f8f3d2c9",
  subscriptionId: "optional-subscription-id"
};

// Type-safe error handling
if (error.details?.code === RentalErrorCodeSchema.enum.BIKE_IN_USE) {
  console.log(`Bike ${error.details.bikeId} is currently rented`);
}
```

These contracts provide complete type safety for the rental management system and ensure frontend-backend API consistency.
