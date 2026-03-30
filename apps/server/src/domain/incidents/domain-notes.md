# Incidents Domain – Notes & Checklist

## Intent

The Incident domain handles reporting, tracking, and resolving issues related to bikes, stations, and rentals. It facilitates communication between users who report problems and technicians who resolve them.

## Core Operations

### 1. Incident Reporting

- **User Reports**: Users can report incidents during or after a rental (`DURING_RENTAL`, `POST_RETURN`).
- **Staff/Staff Inspection**: Maintenance or field staff can report issues discovered during manual checks (`STAFF_INSPECTION`).
- **Source Determination**:
  - `DURING_RENTAL`: High severity, critical impact (e.g., bike breakage), often locks the bike.
  - `POST_RETURN`: Medium severity (minor damage discovered after a ride).
  - `STAFF_INSPECTION`: High severity, locks the bike immediately.

### 2. Automated Technician Assignment

When an incident is reported, the system automatically attempts to assign a technician:

- Searches for the nearest station based on coordinates or provided `stationId`.
- Looks for an `AVAILABLE` technician team assigned to that station.
- If a technician is found, the status is set to `ASSIGNED` immediately; otherwise, it remains `OPEN`.

### 3. Technician Workflow

- **Assignment Acceptance**: Technicians must `ACCEPT` an assignment to move the status to `ACCEPTED`.
- **Assignment Rejection**: If `REJECTED`, the system automatically looks for the NEXT nearest available technician to re-assign.
- **Progress Tracking**: Once accepted, the technician can change the status to `IN_PROGRESS` and eventually `RESOLVED`.

## Business Rules & Invariants

### Duplicate Prevention

- **Constraint**: A bike or rental cannot have more than one "active" incident at a time.
- **Active Statuses**: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `ACCEPTED`.
- **Implementation**: Enforced by a **Partial Unique Index** on `bikeId` (and optionally `rentalId`) where status is active, caught as `ActiveIncidentAlreadyExists` in the application layer.

### Permissions

- **User Role**: Can only see incidents they reported.
- **Technician Role**: Can only see incidents currently assigned to them.
- **Admin/Staff Role**: Full access to all incidents for monitoring and oversight.

## Domain Structure Checklist

### 1. Domain Types (`apps/server/src/domain/incident`)

- [x] Domain model (`IncidentRow`, `IncidentDetail`, `TechnicianAssignmentRow`).
- [x] Repository interfaces (offset pagination, search by coordinate, status updates).
- [x] Service layer for assignment logic, transition validation, and error mapping.

### 2. Infrastructure (`apps/server/src/domain/incident/repository`)

- [x] Prisma repository implementation with transaction support (`runPrismaTransaction`).
- [x] Specialized queries for detail fetching with relations.
- [x] Handling of Prisma errors (e.g., mapping `P2002` to `ActiveIncidentAlreadyExists`).

### 3. Shared Contracts (`packages/shared/src/contracts/server/incident`)

- [x] Consistent error codes (`ACTIVE_INCIDENT_EXISTS`, `INCIDENT_NOT_FOUND`, etc.).
- [x] Zod schemas for request/response payloads.
- [x] Route definitions in `queries.ts` and `mutations.ts`.
