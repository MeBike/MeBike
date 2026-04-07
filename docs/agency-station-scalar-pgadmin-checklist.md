# Agency/Station Scalar + pgAdmin Checklist

Checklist nay dung cho code hien tai sau khi da sua theo logic:

- `Agency` la owner + account
- `Station` la diem van hanh
- nghiep vu chay theo `stationId`
- `Agency 1:1 Station`
- `Agency.address` da bo, dia chi van hanh nam o `Station.address`
- approve agency request se tao luon `Agency + Station + Agency account` trong cung transaction
- `bike swap` duoc confirm theo owner cua station:
  - station `INTERNAL`: `STAFF` cua station confirm
  - station `AGENCY`: account `AGENCY` cua owner do confirm
- `incident` chi ho tro cho station `INTERNAL`

File nay uu tien cach test copy-paste duoc trong Scalar va doi chieu bang pgAdmin.

## 1. Reset va chay lai du lieu seed

Chay theo dung thu tu:

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm prisma migrate reset --force
pnpm seed:demo
pnpm dev
```

Mo:

- Scalar: `http://localhost:4000/docs`
- pgAdmin: `http://localhost:5050/browser/`

## 2. Tai khoan demo

Tat ca account demo dung password:

```text
Demo@123456
```

Tai khoan chinh:

- `admin@mebike.local`
- `staff1@mebike.local`
- `agency1@mebike.local`
- `agency2@mebike.local`
- `user19@mebike.local`
- `user20@mebike.local`

Luu y seed:

- `user01` den `user08` da co rental `RENTED`
- `user09` den `user18` da co reservation `PENDING`
- de test moi, uu tien `user19` tro di

## 3. Baseline SQL trong pgAdmin

Chay cac query nay truoc va giu lai ket qua de dien vao Scalar.

### 3.1. Danh sach station va owner

```sql
SELECT s.id, s.name, s.station_type, s.agency_id, a.name AS agency_name
FROM "Station" s
LEFT JOIN "Agency" a ON a.id = s.agency_id
ORDER BY s.name;
```

Ky vong:

- co station `INTERNAL`
- co dung 2 station `AGENCY`
- moi station `AGENCY` co `agency_id`

### 3.2. Demo account va org assignment

```sql
SELECT u.email, u.role, uoa.station_id, uoa.agency_id, a.name AS agency_name
FROM users u
LEFT JOIN "UserOrgAssignment" uoa ON uoa.user_id = u.id
LEFT JOIN "Agency" a ON a.id = uoa.agency_id
WHERE u.email IN (
  'admin@mebike.local',
  'staff1@mebike.local',
  'agency1@mebike.local',
  'agency2@mebike.local',
  'user19@mebike.local',
  'user20@mebike.local'
)
ORDER BY u.email;
```

Ky vong:

- `agency1` co `agency_id`
- `agency2` co `agency_id`
- `staff1` co `station_id`

### 3.3. Bike available o station agency

```sql
SELECT b.id, b.chip_id, b.status, s.id AS station_id, s.name AS station_name, a.name AS agency_name
FROM "Bike" b
JOIN "Station" s ON s.id = b."stationId"
LEFT JOIN "Agency" a ON a.id = s.agency_id
WHERE s.station_type = 'AGENCY' AND b.status = 'AVAILABLE'
ORDER BY s.name, b.chip_id;
```

Lay ra:

- `agency1StationId`
- `agency2StationId`
- `agencyBikeId1`
- `agencyBikeId2`

### 3.4. Rental dang active

```sql
SELECT r.id, u.email, r.status, r.start_station, s.name AS start_station_name, r.bike_id, b.chip_id
FROM "Rental" r
JOIN users u ON u.id = r.user_id
JOIN "Station" s ON s.id = r.start_station
JOIN "Bike" b ON b.id = r.bike_id
WHERE r.status = 'RENTED'
ORDER BY u.email;
```

### 3.5. Reservation dang active

```sql
SELECT res.id, u.email, res.status, res.station_id, s.name AS station_name, res.bike_id, b.chip_id
FROM "Reservation" res
JOIN users u ON u.id = res.user_id
JOIN "Station" s ON s.id = res.station_id
LEFT JOIN "Bike" b ON b.id = res.bike_id
WHERE res.status = 'PENDING'
ORDER BY u.email;
```

### 3.6. Bike swap request

```sql
SELECT
  bsr.id,
  bsr.rental_id,
  u.email AS user_email,
  bsr.station_id,
  s.name AS station_name,
  a.name AS agency_name,
  bsr.status,
  old_b.chip_id AS old_bike_chip_id,
  new_b.chip_id AS new_bike_chip_id,
  bsr.reason
FROM "BikeSwapRequest" bsr
LEFT JOIN users u ON u.id = bsr.user_id
LEFT JOIN "Station" s ON s.id = bsr.station_id
LEFT JOIN "Agency" a ON a.id = s.agency_id
LEFT JOIN "Bike" old_b ON old_b.id = bsr.old_bike_id
LEFT JOIN "Bike" new_b ON new_b.id = bsr.new_bike_id
ORDER BY bsr.created_at DESC;
```

Lay ra:

- `bikeSwapRequestIdAgency1` neu co request `PENDING` thuoc station cua `agency1`

## 4. Login trong Scalar

Dung `POST /v1/auth/login`.

### 4.1. Admin

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

### 4.2. Agency 1

```json
{
  "email": "agency1@mebike.local",
  "password": "Demo@123456"
}
```

### 4.3. Agency 2

```json
{
  "email": "agency2@mebike.local",
  "password": "Demo@123456"
}
```

### 4.4. User 19

```json
{
  "email": "user19@mebike.local",
  "password": "Demo@123456"
}
```

### 4.5. User 20

```json
{
  "email": "user20@mebike.local",
  "password": "Demo@123456"
}
```

Ky vong:

- `200`
- tra ve `accessToken`

## 5. Verify schema sau refactor

### 5.1. Agency khong con address

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Agency'
ORDER BY ordinal_position;
```

Ky vong:

- khong co cot `address`

### 5.2. Return confirmations khong con agency_id

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'return_confirmations'
ORDER BY ordinal_position;
```

Ky vong:

- khong co cot `agency_id`

### 5.3. Redistribution khong con target_agency_id

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'redistribution_requests'
ORDER BY ordinal_position;
```

Ky vong:

- khong co cot `target_agency_id`

## 6. Verify agency va station quan he 1:1

Login `admin`, goi:

```text
GET /v1/admin/agencies
```

Ky vong:

- moi agency co field `station`
- `station` khong null voi seed hien tai
- root agency khong co `address`
- dia chi nam trong `station.address`

Doi chieu DB:

```sql
SELECT a.id, a.name AS agency_name, s.id AS station_id, s.name AS station_name, s.address, s.station_type
FROM "Agency" a
LEFT JOIN "Station" s ON s.agency_id = a.id
ORDER BY a.name;
```

## 7. Test tao station internal

Login `admin`, goi:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Internal Demo Station",
  "address": "1 Internal Demo",
  "stationType": "INTERNAL",
  "agencyId": null,
  "totalCapacity": 20,
  "pickupSlotLimit": 10,
  "returnSlotLimit": 10,
  "latitude": 10.8101,
  "longitude": 106.7011
}
```

Ky vong:

- `201`
- `stationType = "INTERNAL"`
- `agencyId = null`

Kiem tra DB:

```sql
SELECT id, name, station_type, agency_id
FROM "Station"
WHERE name = 'Internal Demo Station';
```

## 8. Validation station agency bat buoc

Login `admin`, goi:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Agency Invalid Station",
  "address": "2 Invalid Demo",
  "stationType": "AGENCY",
  "totalCapacity": 20,
  "pickupSlotLimit": 10,
  "returnSlotLimit": 10,
  "latitude": 10.8102,
  "longitude": 106.7012
}
```

Ky vong:

- `400`
- error code kieu `STATION_AGENCY_REQUIRED`

## 9. Validation internal khong duoc co agencyId

Lay mot `agencyId` tu `GET /v1/admin/agencies`, sau do goi:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Internal Invalid Station",
  "address": "3 Invalid Demo",
  "stationType": "INTERNAL",
  "agencyId": "<agency-id>",
  "totalCapacity": 20,
  "pickupSlotLimit": 10,
  "returnSlotLimit": 10,
  "latitude": 10.8103,
  "longitude": 106.7013
}
```

Ky vong:

- `400`
- error code kieu `STATION_AGENCY_FORBIDDEN`

## 10. Validation 1 agency chi co 1 station

Lay `agencyId` cua mot agency da co station, roi goi:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Agency Duplicate Station",
  "address": "4 Invalid Demo",
  "stationType": "AGENCY",
  "agencyId": "<agency-id-da-co-station>",
  "totalCapacity": 20,
  "pickupSlotLimit": 10,
  "returnSlotLimit": 10,
  "latitude": 10.8104,
  "longitude": 106.7014
}
```

Ky vong:

- `400`
- error code kieu `STATION_AGENCY_ALREADY_ASSIGNED`

## 11. Verify public station list

Goi:

```text
GET /v1/stations
```

Ky vong:

- co ca station internal va station agency
- item station agency co:
  - `stationType = "AGENCY"`
  - `agencyId != null`

Co the filter:

```text
GET /v1/stations?stationType=AGENCY
```

## 12. Reservation tai agency station

Dung `user19`.

### 12.1. Kiem tra user19 dang rong

Goi:

```text
GET /v1/rentals/me/current
GET /v1/reservations/me
```

Ky vong:

- khong co active rental
- khong co reservation `PENDING`

### 12.2. Tao reservation

Lay:

- `agencyBikeId1`
- `agency1StationId` hoac `agency2StationId`

Goi:

```text
POST /v1/reservations
```

Body:

```json
{
  "bikeId": "<agencyBikeId1>",
  "stationId": "<agencyStationId>",
  "reservationOption": "ONE_TIME"
}
```

Ky vong:

- `200`
- reservation tao thanh cong
- response co `stationId` dung voi agency station

Kiem tra DB:

```sql
SELECT id, user_id, bike_id, station_id, status
FROM "Reservation"
ORDER BY created_at DESC;
```

## 13. Start rental tai agency station

Dung `user20` de tranh vung voi reservation cua `user19`.

Lay mot bike `AVAILABLE` khac tu query 3.3.

Goi:

```text
POST /v1/rentals
```

Body:

```json
{
  "bikeId": "<agencyBikeId2>",
  "startStationId": "<agencyStationId>"
}
```

Ky vong:

- `200`
- rental moi co `status = "RENTED"`
- `startStationId` la agency station

Kiem tra DB:

```sql
SELECT id, user_id, bike_id, start_station, end_station, status
FROM "Rental"
ORDER BY created_at DESC;
```

Giu lai `rentalId` cua `user20`.

## 14. User tao return slot ve agency station

Van login `user20`, goi:

```text
POST /v1/rentals/me/{rentalId}/return-slot
```

Body:

```json
{
  "stationId": "<agency1StationId>"
}
```

Ky vong:

- `200`

Kiem tra DB:

```sql
SELECT id, rental_id, station_id, status, reserved_from
FROM return_slot_reservations
ORDER BY created_at DESC;
```

Ky vong:

- co row moi
- `rental_id` dung
- `station_id = <agency1StationId>`

## 15. Agency confirm return thanh cong

Login `agency1`, goi:

```text
PUT /v1/rentals/{rentalId}/end
```

Body:

```json
{
  "stationId": "<agency1StationId>",
  "confirmationMethod": "MANUAL",
  "confirmedAt": "2026-04-07T10:00:00.000Z"
}
```

Ky vong:

- `200`
- rental doi `status = "COMPLETED"`

Kiem tra DB:

```sql
SELECT id, rental_id, station_id, confirmed_by_user_id, confirmation_method, handover_status
FROM return_confirmations
ORDER BY created_at DESC;
```

Kiem tra them rental:

```sql
SELECT id, status, end_station, end_time
FROM "Rental"
WHERE id = '<rentalId>';
```

## 16. Agency confirm return sai owner bi chan

Dung mot rental khac da tao return slot ve station cua `agency2`.

Login `agency1` nhung goi:

```text
PUT /v1/rentals/{rentalId}/end
```

Body:

```json
{
  "stationId": "<agency2StationId>",
  "confirmationMethod": "MANUAL",
  "confirmedAt": "2026-04-07T10:05:00.000Z"
}
```

Ky vong:

- `403` hoac payload co `ACCESS_DENIED`

## 17. Agency list bike swap requests

Login `agency1`, goi:

```text
GET /v1/agency/bike-swap-requests
```

Ky vong:

- chi thay request thuoc station cua `agency1`
- staff route va agency route khong dung chung:
  - `STAFF` chi xu ly request o station `INTERNAL` ma ho duoc assign
  - `AGENCY` chi xu ly request o station `AGENCY` thuoc `agencyId` cua ho

Doi chieu DB:

```sql
SELECT
  bsr.id,
  bsr.rental_id,
  u.email AS user_email,
  bsr.station_id,
  s.name AS station_name,
  a.name AS agency_name,
  bsr.status,
  old_b.chip_id AS old_bike_chip_id,
  new_b.chip_id AS new_bike_chip_id,
  bsr.reason
FROM "BikeSwapRequest" bsr
LEFT JOIN users u ON u.id = bsr.user_id
LEFT JOIN "Station" s ON s.id = bsr.station_id
LEFT JOIN "Agency" a ON a.id = s.agency_id
LEFT JOIN "Bike" old_b ON old_b.id = bsr.old_bike_id
LEFT JOIN "Bike" new_b ON new_b.id = bsr.new_bike_id
ORDER BY bsr.created_at DESC;
```

Lay `bikeSwapRequestIdAgency1` cua request `PENDING`.

## 18. Agency approve bike swap

Login `agency1`, goi:

```text
POST /v1/agency/bike-swap-requests/{bikeSwapRequestId}/approve
```

Body:

```json
{}
```

Ky vong:

- `200`
- request doi `status = "CONFIRMED"`
- `newBikeId` khong null
- request nay phai thuoc station `AGENCY` cua chinh account agency dang login

Kiem tra DB:

```sql
SELECT id, status, old_bike_id, new_bike_id, reason
FROM "BikeSwapRequest"
WHERE id = '<bikeSwapRequestId>';
```

## 19. Agency reject bike swap

Neu seed chi co 1 request `PENDING`, cach sach nhat la:

1. reset DB + seed lai
2. login lai `agency1`
3. dung request `PENDING` do de test reject

Goi:

```text
POST /v1/agency/bike-swap-requests/{bikeSwapRequestId}/reject
```

Body:

```json
{
  "reason": "Reject for demo"
}
```

Ky vong:

- `200`
- `status = "REJECTED"`
- `reason = "Reject for demo"`

Kiem tra DB:

```sql
SELECT id, status, reason
FROM "BikeSwapRequest"
WHERE id = '<bikeSwapRequestId>';
```

## 19A. Staff approve bike swap o station internal

Login `staff1` neu station cua `staff1` co request pending phu hop. Neu khong thi tao request pending moi tren station internal roi goi:

```text
POST /v1/staff/bike-swap-requests/{bikeSwapRequestId}/approve
```

Body:

```json
{}
```

Ky vong:

- `200`
- request doi `status = "CONFIRMED"`
- `newBikeId` khong null

Luu y:

- route nay chi dung cho station `INTERNAL`
- staff khong duoc confirm request cua station `AGENCY`

## 20. Submit agency request moi

Route nay hien tai bat buoc co `requesterEmail`, ke ca khi dang login.

Goi:

```text
POST /v1/agency-requests
```

Body:

```json
{
  "requesterEmail": "ops-vincom-thuduc@example.com",
  "requesterPhone": "0901234567",
  "agencyName": "VINCOM Thu Duc",
  "agencyAddress": "Le Van Viet, Thu Duc, Ho Chi Minh City",
  "agencyContactPhone": "0901234567",
  "stationName": "Ga VINCOM Thu Duc",
  "stationAddress": "Tang 1 VINCOM Thu Duc, Le Van Viet, Thu Duc",
  "stationLatitude": 10.8495,
  "stationLongitude": 106.7712,
  "stationTotalCapacity": 20,
  "stationPickupSlotLimit": 10,
  "stationReturnSlotLimit": 10,
  "description": "New agency request for VINCOM Thu Duc"
}
```

Ky vong:

- `201`
- `status = "PENDING"`
- response co day du `requesterEmail`, `agencyName`, `stationName`, `stationAddress`

Kiem tra DB:

```sql
SELECT
  id,
  requester_email,
  agency_name,
  station_name,
  station_address,
  station_latitude,
  station_longitude,
  station_total_capacity,
  station_pickup_slot_limit,
  station_return_slot_limit,
  status
FROM "AgencyRequest"
ORDER BY created_at DESC;
```

Lay `agencyRequestId` vua tao.

## 21. Admin approve agency request va auto-create station

Login `admin`, goi:

```text
POST /v1/admin/agency-requests/{agencyRequestId}/approve
```

Body:

```json
{
  "description": "Approved, agency account and station have been provisioned."
}
```

Ky vong:

- `200`
- request doi `status = "APPROVED"`
- tao moi:
  - `Agency`
  - `Station`
  - account `AGENCY`

Kiem tra DB:

```sql
SELECT
  id,
  agency_name,
  station_name,
  status,
  approved_agency_id,
  created_agency_user_id
FROM "AgencyRequest"
ORDER BY created_at DESC;
```

```sql
SELECT
  a.id,
  a.name AS agency_name,
  s.id AS station_id,
  s.name AS station_name,
  s.address,
  s.station_type
FROM "Agency" a
LEFT JOIN "Station" s ON s.agency_id = a.id
WHERE a.name = 'VINCOM Thu Duc';
```

Ky vong:

- agency moi da co station moi
- station moi co `station_type = 'AGENCY'`

## 22. Verify agency API khong con dung address o root

Login `admin`, goi:

```text
GET /v1/admin/agencies
```

Ky vong item response co dang:

```json
{
  "id": "...",
  "name": "Demo Agency Main",
  "contactPhone": "02873000001",
  "status": "ACTIVE",
  "station": {
    "id": "...",
    "name": "...",
    "address": "...",
    "latitude": 10.8,
    "longitude": 106.7,
    "stationType": "AGENCY"
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

Luu y:

- `address` nam trong `station`
- root agency khong con `address`

## 23. Incident

Logic moi:

- `incident` chi cho station `INTERNAL`
- account `AGENCY` khong duoc dung incident routes
- neu tao incident ma bike/station resolve ra station `AGENCY` thi bi chan

### 23.1. Agency account bi chan khoi incident list

Login `agency1`, goi:

```text
GET /v1/incidents
```

Ky vong:

- `403`

### 23.2. User tao incident voi bike o agency station bi chan

Tu query 3.3, lay:

- `agencyBikeId1`
- `agency1StationId`

Login `user19` hoac user hop le, goi:

```text
POST /v1/incidents
```

Body:

```json
{
  "bikeId": "<agencyBikeId1>",
  "stationId": "<agency1StationId>",
  "incidentType": "FLAT_TIRE",
  "description": "Agency station should not accept incident handling",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

Ky vong:

- `400`
- error code `INCIDENT_INTERNAL_STATION_REQUIRED`

Co the doi chieu nhu sau:

```json
{
  "error": "Incidents are only supported at internal stations",
  "details": {
    "code": "INCIDENT_INTERNAL_STATION_REQUIRED",
    "stationId": "<agency1StationId>",
    "stationType": "AGENCY"
  }
}
```

## 24. Thu tu test de de theo doi nhat

Thu tu khuyen nghi:

1. reset DB va seed
2. chay baseline SQL
3. login lay token
4. verify schema
5. verify agency/station 1:1
6. test create/update station validation
7. test reservation o agency station
8. test rental o agency station
9. test return slot
10. test agency confirm return success
11. test agency confirm return fail
12. test bike swap list/approve/reject theo dung owner type
13. test incident bi chan o agency station
14. test submit agency request
15. test approve agency request va auto-create station

## 25. Ghi chu khi test

- Khong hardcode UUID tu lan seed truoc. Moi lan reset DB nen lay lai ID bang SQL baseline.
- Neu da approve bike swap request roi thi muon test reject phai reset lai DB hoac tao request pending moi.
- `POST /v1/agency-requests` bat buoc co `requesterEmail`.
- `PUT /v1/rentals/{rentalId}/end` hien tai chi hop le cho `STAFF` hoac `AGENCY`, khong con `ADMIN`.
- `incident` khong con ho tro `AGENCY` role va khong duoc tao o station `AGENCY`.
