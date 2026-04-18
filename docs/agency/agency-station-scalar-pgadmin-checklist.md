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

## 1A. Quick retest cho phan moi sua nhat: bike swap + incident

Section nay dung khi team chi muon retest nhanh 2 phan vua doi logic gan nhat, khong can doc het checklist dai ben duoi.

Phan logic can xac nhan lai:

- `bike swap`
  - station `INTERNAL` -> `STAFF` cua station do confirm
  - station `AGENCY` -> account `AGENCY` cua owner do confirm
  - ca hai actor deu dung chung operator endpoints `/v1/operators/...`
- `incident`
  - chi ho tro cho station `INTERNAL`
  - account `AGENCY` khong duoc dung incident routes
  - neu tao incident ma `stationId` tro toi station `AGENCY` thi bi chan

### 1A.1. Chay lai du lieu

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm prisma migrate reset --force
pnpm seed:demo
pnpm dev
```

### 1A.2. Login cac account can dung

Dung `POST /v1/auth/login` trong Scalar.

`staff1@mebike.local`

```json
{
  "email": "staff1@mebike.local",
  "password": "Demo@123456"
}
```

`agency1@mebike.local`

```json
{
  "email": "agency1@mebike.local",
  "password": "Demo@123456"
}
```

`agency2@mebike.local`

```json
{
  "email": "agency2@mebike.local",
  "password": "Demo@123456"
}
```

`user19@mebike.local`

```json
{
  "email": "user19@mebike.local",
  "password": "Demo@123456"
}
```

### 1A.3. SQL baseline can copy de lay ID

Station + owner:

```sql
SELECT s.id, s.name, s.station_type, s.agency_id, a.name AS agency_name
FROM "Station" s
LEFT JOIN "Agency" a ON a.id = s.agency_id
ORDER BY s.name;
```

Bike swap request:

```sql
SELECT
  bsr.id,
  bsr.rental_id,
  u.email AS user_email,
  bsr.station_id,
  s.name AS station_name,
  s.station_type,
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

Bike available o station `INTERNAL`:

```sql
SELECT b.id, b.chip_id, b.status, s.id AS station_id, s.name, s.station_type
FROM "Bike" b
JOIN "Station" s ON s.id = b."stationId"
WHERE s.station_type = 'INTERNAL' AND b.status = 'AVAILABLE'
ORDER BY s.name, b.chip_id;
```

Bike available o station `AGENCY`:

```sql
SELECT b.id, b.chip_id, b.status, s.id AS station_id, s.name, s.station_type, a.name AS agency_name
FROM "Bike" b
JOIN "Station" s ON s.id = b."stationId"
LEFT JOIN "Agency" a ON a.id = s.agency_id
WHERE s.station_type = 'AGENCY' AND b.status = 'AVAILABLE'
ORDER BY s.name, b.chip_id;
```

Incident hien co:

```sql
SELECT ir.id, ir.station_id, s.name AS station_name, s.station_type, ir.status, ir.incident_type
FROM "IncidentReport" ir
LEFT JOIN "Station" s ON s.id = ir.station_id
ORDER BY ir.reported_at DESC;
```

### 1A.4. Case retest `bike swap`

Case 1: agency chi thay request cua station agency do quan ly

- Login `agency1`
- Goi `GET /v1/operators/bike-swap-requests`

Ky vong:

- `200`
- chi thay request thuoc station `AGENCY` cua `agency1`
- khong thay request cua `agency2`
- khong thay request cua station `INTERNAL`

Case 2: agency approve request cua station `AGENCY`

- Chon `bikeSwapRequestId` dang `PENDING` thuoc station cua `agency1`
- Goi `POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/approve`

Body:

```json
{}
```

Ky vong:

- `200`
- `status = CONFIRMED`
- `newBikeId != null`

SQL doi chieu:

```sql
SELECT id, status, station_id, old_bike_id, new_bike_id, reason
FROM "BikeSwapRequest"
WHERE id = '<bikeSwapRequestId>';
```

Case 3: agency reject request cua station `AGENCY`

Neu seed chi co 1 request `PENDING`, reset DB lai truoc khi test case nay.

- Login `agency1`
- Goi `POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/reject`

Body:

```json
{
  "reason": "Reject for demo"
}
```

Ky vong:

- `200`
- `status = REJECTED`
- `reason = "Reject for demo"`

SQL doi chieu:

```sql
SELECT id, status, reason
FROM "BikeSwapRequest"
WHERE id = '<bikeSwapRequestId>';
```

Case 4: staff khong duoc approve bike swap cua station `AGENCY`

- Login `staff1`
- Dung chinh `bikeSwapRequestId` thuoc station `AGENCY`
- Goi `POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/approve`

Body:

```json
{}
```

Ky vong:

- request bi chan
- thuong se la `404` voi y nghia `staff` khong co quyen tren request do

Case 5: staff approve bike swap cua station `INTERNAL`

Case nay can `bikeSwapRequestIdInternal` thuoc station `INTERNAL`.
Neu seed chua co san, tao request pending bang flow user dang thue xe o station `INTERNAL`, sau do login `staff1` va goi:

`POST /v1/operators/bike-swap-requests/{bikeSwapRequestIdInternal}/approve`

Body:

```json
{}
```

Ky vong:

- `200`
- `status = CONFIRMED`
- `newBikeId != null`

=> Rule can xac nhan o day:

- station `INTERNAL` -> `STAFF` confirm
- station `AGENCY` -> `AGENCY` confirm

### 1A.5. Case retest `incident`

Case 1: account `AGENCY` bi chan khoi incident list

- Login `agency1`
- Goi `GET /v1/incidents`

Ky vong:

- bi chan
- khong duoc list incident

Case 2: account `AGENCY` bi chan khoi incident detail

- Login `agency1`
- Goi `GET /v1/incidents/{incidentId}`

Ky vong:

- bi chan
- khong doc duoc incident detail

Case 3: account `AGENCY` bi chan khoi create incident

- Login `agency1`
- Goi `POST /v1/incidents`

Body:

```json
{
  "bikeId": "<bikeId-o-agency-station>",
  "stationId": "<agency1StationId>",
  "incidentType": "FLAT_TIRE",
  "description": "Agency should not create incident",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

Ky vong:

- bi chan
- khong tao row moi

Case 4: user tao incident o station `AGENCY` bi chan

- Login `user19`
- Goi `POST /v1/incidents`

Body:

```json
{
  "bikeId": "<bikeId-o-agency-station>",
  "stationId": "<agency1StationId>",
  "incidentType": "FLAT_TIRE",
  "description": "Agency station should not accept incident handling",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

Ky vong:

- `400`
- response giong:

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

SQL doi chieu:

```sql
SELECT
  ir.id,
  ir.station_id,
  s.station_type,
  ir.status,
  ir.incident_type
FROM "IncidentReport" ir
LEFT JOIN "Station" s ON s.id = ir.station_id
WHERE ir.station_id = '<agency1StationId>'
ORDER BY ir.reported_at DESC;
```

Ky vong:

- khong co row moi tu request bi chan nay

Case 5: user tao incident o station `INTERNAL` van duoc

- Chon `internalStationId` va `bikeId` thuoc station `INTERNAL`
- Login `user19` hoac `user20`
- Goi `POST /v1/incidents`

Body:

```json
{
  "bikeId": "<bikeId-o-internal-station>",
  "stationId": "<internalStationId>",
  "incidentType": "BRAKE_ISSUE",
  "description": "Internal station incident should be accepted",
  "latitude": 10.7769,
  "longitude": 106.7009
}
```

Ky vong:

- `201`
- incident duoc tao thanh cong

SQL doi chieu:

```sql
SELECT
  ir.id,
  ir.station_id,
  s.station_type,
  ir.status,
  ir.incident_type
FROM "IncidentReport" ir
LEFT JOIN "Station" s ON s.id = ir.station_id
WHERE ir.station_id = '<internalStationId>'
ORDER BY ir.reported_at DESC;
```

Ky vong:

- co row moi
- `station_type = INTERNAL`

Case 6: user list/get incident internal van hoat dong

- Goi `GET /v1/incidents`
- Goi `GET /v1/incidents/{incidentId}`

Ky vong:

- xem duoc incident internal vua tao

### 1A.6. Thu tu test nhanh de tranh ton thoi gian

1. Reset DB + seed.
2. Chay SQL baseline.
3. Test `agency list bike swap`.
4. Test `agency approve bike swap`.
5. Reset DB neu muon test `agency reject`.
6. Test `staff` khong approve duoc request cua station `AGENCY`.
7. Test `incident`: agency bi chan list/create.
8. Test user tao incident o station `AGENCY` bi chan.
9. Test user tao incident o station `INTERNAL` thanh cong.

Neu chi can retest nhanh sau khi pull code, co the chi chay section `1A` nay.

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
GET /v1/operators/bike-swap-requests
```

Ky vong:

- chi thay request thuoc station cua `agency1`
- cung mot operator route duoc dung chung:
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
POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/approve
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
POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/reject
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
POST /v1/operators/bike-swap-requests/{bikeSwapRequestId}/approve
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
  "stationReturnSlotLimit": 18,
  "description": "New agency request for VINCOM Thu Duc"
}
```

Ky vong:

- `201`
- `status = "PENDING"`
- response co day du `requesterEmail`, `agencyName`, `stationName`, `stationAddress`
- chua tao `Agency`, `Station`, hay account `AGENCY`

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
  station_return_slot_limit,
  status
FROM "AgencyRequest"
ORDER BY created_at DESC;
```

Lay `agencyRequestId` vua tao.

Luu y exact station location uniqueness:

- submit se bi chan som neu da co `Station` cung exact `address + latitude + longitude`
- loi tra ve HTTP `400` voi `details.code = "STATION_LOCATION_ALREADY_EXISTS"`
- rule nay khong lien quan `pickupSlotLimit`; agency request chi dung `stationReturnSlotLimit`

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
- station moi dung `return_slot_limit` tu `stationReturnSlotLimit`

Luu y duplicate location khi approve:

- approve van phai handle `STATION_LOCATION_ALREADY_EXISTS` du submit da pre-check
- ly do: pending request cu co the da ton tai truoc rule moi, hoac race condition xay ra giua submit va approve
- neu approve fail vi duplicate location thi transaction rollback, request van `PENDING`, khong tao `Agency`, `Station`, hay account `AGENCY`

## 21A. Verify exact station location uniqueness cho agency request

Section nay verify phan moi sua: agency request submit va agency request approve
dong bo duplicate exact station location voi station/admin agency provisioning flow.

Rule duplicate location la exact match tren:

```text
Station.address + Station.latitude + Station.longitude
```

Response duplicate ky vong:

```json
{
  "error": "Station address and coordinates already exist",
  "details": {
    "code": "STATION_LOCATION_ALREADY_EXISTS",
    "address": "20 Demo Duplicate Submit Street, Thu Duc, TP.HCM",
    "latitude": 10.848601,
    "longitude": 106.771701
  }
}
```

### 21A.1. Submit agency request bi reject neu station exact location da ton tai

Tao station truoc bang Scalar:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Demo Existing Exact Location 01",
  "address": "20 Demo Duplicate Submit Street, Thu Duc, TP.HCM",
  "stationType": "INTERNAL",
  "totalCapacity": 20,
  "returnSlotLimit": 20,
  "latitude": 10.848601,
  "longitude": 106.771701
}
```

Ky vong: HTTP `201`.

Submit agency request cung exact location:

```text
POST /v1/agency-requests
```

Body:

```json
{
  "requesterEmail": "demo-submit-dup-01@example.com",
  "agencyName": "Demo Submit Duplicate Agency 01",
  "stationName": "Ga Demo Submit Duplicate 01",
  "stationAddress": "20 Demo Duplicate Submit Street, Thu Duc, TP.HCM",
  "stationLatitude": 10.848601,
  "stationLongitude": 106.771701,
  "stationTotalCapacity": 20,
  "stationReturnSlotLimit": 18
}
```

Ky vong:

- HTTP `400`
- `details.code = "STATION_LOCATION_ALREADY_EXISTS"`
- response co `address`, `latitude`, `longitude`

Kiem tra DB:

```sql
SELECT id, status, requester_email, agency_name
FROM "AgencyRequest"
WHERE requester_email = 'demo-submit-dup-01@example.com';
```

Ky vong: `0 rows`.

### 21A.2. Exact match phai trung ca address + latitude + longitude

Cung address nhung khac toa do van duoc submit:

```json
{
  "requesterEmail": "demo-same-address-diff-coord-01@example.com",
  "agencyName": "Demo Same Address Diff Coord Agency 01",
  "stationName": "Ga Same Address Diff Coord 01",
  "stationAddress": "20 Demo Duplicate Submit Street, Thu Duc, TP.HCM",
  "stationLatitude": 10.848602,
  "stationLongitude": 106.771702,
  "stationTotalCapacity": 20,
  "stationReturnSlotLimit": 18
}
```

Khac address nhung cung toa do van duoc submit:

```json
{
  "requesterEmail": "demo-diff-address-same-coord-01@example.com",
  "agencyName": "Demo Diff Address Same Coord Agency 01",
  "stationName": "Ga Diff Address Same Coord 01",
  "stationAddress": "21 Demo Different Address Street, Thu Duc, TP.HCM",
  "stationLatitude": 10.848601,
  "stationLongitude": 106.771701,
  "stationTotalCapacity": 20,
  "stationReturnSlotLimit": 18
}
```

Ky vong: ca 2 request deu HTTP `201`, `status = "PENDING"`.

Kiem tra DB:

```sql
SELECT requester_email, status, station_address, station_latitude, station_longitude
FROM "AgencyRequest"
WHERE requester_email IN (
  'demo-same-address-diff-coord-01@example.com',
  'demo-diff-address-same-coord-01@example.com'
)
ORDER BY requester_email;
```

Ky vong: 2 rows `PENDING`.

### 21A.3. Approve pending request cu bi reject neu location da co station

Case nay mo phong pending request cu, vi public submit hien da chan duplicate
truoc khi tao request.

Tao station truoc bang Scalar:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Demo Existing Legacy Approve Location 01",
  "address": "30 Demo Legacy Duplicate Street, Thu Duc, TP.HCM",
  "stationType": "INTERNAL",
  "totalCapacity": 20,
  "returnSlotLimit": 20,
  "latitude": 10.775001,
  "longitude": 106.699001
}
```

Tao legacy pending request bang pgAdmin. Luu y phai set `id` thu cong vi
`@default(uuid(7))` la Prisma-side default, insert truc tiep SQL se khong tu
sinh id.

```sql
DELETE FROM "AgencyRequest"
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7d1001'::uuid
   OR requester_email = 'demo-legacy-approve-dup-01@example.com';

INSERT INTO "AgencyRequest" (
  id,
  requester_email,
  requester_phone,
  agency_name,
  agency_address,
  agency_contact_phone,
  station_name,
  station_address,
  station_latitude,
  station_longitude,
  station_total_capacity,
  station_return_slot_limit,
  status,
  description,
  updated_at
)
VALUES (
  '019b17bd-d130-7e7d-be69-91ceef7d1001'::uuid,
  'demo-legacy-approve-dup-01@example.com',
  '0912345678',
  'Demo Legacy Approve Duplicate Agency 01',
  '30 Demo Legacy Duplicate Street, Thu Duc, TP.HCM',
  '0987654321',
  'Ga Demo Legacy Approve Duplicate 01',
  '30 Demo Legacy Duplicate Street, Thu Duc, TP.HCM',
  10.775001,
  106.699001,
  20,
  18,
  'PENDING',
  'Legacy pending request for duplicate approve demo',
  now()
)
RETURNING id;
```

Approve bang Scalar:

```text
POST /v1/admin/agency-requests/019b17bd-d130-7e7d-be69-91ceef7d1001/approve
```

Body:

```json
{}
```

Ky vong:

- HTTP `400`
- `details.code = "STATION_LOCATION_ALREADY_EXISTS"`
- request van `PENDING`
- khong tao `Agency`, `Station`, hay account `AGENCY` moi

Kiem tra DB:

```sql
SELECT id, status, reviewed_by_user_id, reviewed_at,
       approved_agency_id, created_agency_user_id
FROM "AgencyRequest"
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7d1001'::uuid;
```

Ky vong: `status = 'PENDING'`, cac cot review/approve/user la `NULL`.

```sql
SELECT id, name
FROM "Agency"
WHERE name = 'Demo Legacy Approve Duplicate Agency 01';
```

Ky vong: `0 rows`.

### 21A.4. Race condition: request tao truoc, station trung tao sau

Submit request truoc khi location co station:

```text
POST /v1/agency-requests
```

Body:

```json
{
  "requesterEmail": "demo-race-approve-dup-01@example.com",
  "requesterPhone": "0912345678",
  "agencyName": "Demo Race Approve Duplicate Agency 01",
  "agencyAddress": "40 Demo Race Duplicate Street, Thu Duc, TP.HCM",
  "agencyContactPhone": "0987654321",
  "stationName": "Ga Demo Race Approve Duplicate 01",
  "stationAddress": "40 Demo Race Duplicate Street, Thu Duc, TP.HCM",
  "stationLatitude": 10.842201,
  "stationLongitude": 106.828501,
  "stationTotalCapacity": 20,
  "stationReturnSlotLimit": 18
}
```

Ky vong: HTTP `201`, copy `id`.

Tao station trung exact location:

```text
POST /v1/stations
```

Body:

```json
{
  "name": "Demo Station Created During Race 01",
  "address": "40 Demo Race Duplicate Street, Thu Duc, TP.HCM",
  "stationType": "INTERNAL",
  "totalCapacity": 20,
  "returnSlotLimit": 20,
  "latitude": 10.842201,
  "longitude": 106.828501
}
```

Approve request vua tao:

```text
POST /v1/admin/agency-requests/{id}/approve
```

Body:

```json
{}
```

Ky vong: HTTP `400`, `details.code = "STATION_LOCATION_ALREADY_EXISTS"`.

Kiem tra DB:

```sql
SELECT id, status, reviewed_by_user_id, reviewed_at,
       approved_agency_id, created_agency_user_id
FROM "AgencyRequest"
WHERE requester_email = 'demo-race-approve-dup-01@example.com';
```

Ky vong: request van `PENDING`, cac cot review/approve/user la `NULL`.

```sql
SELECT id, name, address, station_type, agency_id, latitude, longitude
FROM "Station"
WHERE address = '40 Demo Race Duplicate Street, Thu Duc, TP.HCM'
  AND latitude = 10.842201
  AND longitude = 106.828501;
```

Ky vong: chi co station tao de mo phong race; khong co agency station moi tu
approve.

### 21A.5. Kiem tra DB unique constraint

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Station'
  AND indexname = 'uq_station_exact_location';
```

Ky vong: co index `uq_station_exact_location` tren `address`, `latitude`,
`longitude`.

```sql
SELECT address, latitude, longitude, COUNT(*) AS total
FROM "Station"
GROUP BY address, latitude, longitude
HAVING COUNT(*) > 1;
```

Ky vong: `0 rows`.

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
16. test submit agency request duplicate exact station location
17. test approve agency request duplicate exact station location va race condition

## 25. Ghi chu khi test

- Khong hardcode UUID tu lan seed truoc. Moi lan reset DB nen lay lai ID bang SQL baseline.
- Neu da approve bike swap request roi thi muon test reject phai reset lai DB hoac tao request pending moi.
- `POST /v1/agency-requests` bat buoc co `requesterEmail`.
- `POST /v1/agency-requests` se reject neu da co `Station` cung exact `address + latitude + longitude`.
- `POST /v1/admin/agency-requests/{id}/approve` van phai handle duplicate exact station location de chong pending request cu va race condition.
- Loi duplicate station location phai la HTTP `400` voi `details.code = "STATION_LOCATION_ALREADY_EXISTS"`.
- `PUT /v1/rentals/{rentalId}/end` hien tai chi hop le cho `STAFF` hoac `AGENCY`, khong con `ADMIN`.
- `incident` khong con ho tro `AGENCY` role va khong duoc tao o station `AGENCY`.
- `bike swap` da duoc gop thanh operator routes chung `/v1/operators/bike-swap-requests...`; quyen duoc resolve theo role dang dang nhap va owner cua station.
