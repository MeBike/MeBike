# Environment Auto Calculate After Rental Completed Scalar + pgAdmin + Frontend Guide

File nay dung cho frontend/tester test flow moi:

```text
Auto calculate Environment Impact after rental completed
```

Muc tieu:

- Khi rental chuyen sang `COMPLETED`, backend tu enqueue job tinh Environment Impact.
- Worker xu ly job bang domain service `EnvironmentImpactService.calculateFromRental(rentalId)`.
- Backend khong goi HTTP vao chinh no qua `POST /internal/environment/calculate-from-rental/{rentalId}`.
- API internal calculate van giu lai de repair/manual trigger.
- Summary/history/detail chi doc tu bang `environmental_impact_stats`.
- Rental completed chi hien trong Environment sau khi job calculate thanh cong.
- Neu job loi hoac chua co active policy, rental van completed, payment/billing khong rollback.

Quan trong cho seed demo:

- Seed demo da tao san active rental `RENTED` cho `user01@mebike.local`.
- Theo seed hien tai, `user01@mebike.local` den `user08@mebike.local` la nhom co rental `RENTED`.
- `user09@mebike.local` den `user18@mebike.local` la nhom co pending reservation.
- Neu can tao rental moi sach hon, uu tien `user19@mebike.local` tro di, hoac dung SQL section 6.5 de chon user that khong co active rental va khong co pending reservation.
- Vi vay neu dung user01 goi `POST /v1/rentals` se gap:

```json
{
  "error": "Active rental already exists for this card",
  "details": {
    "code": "CARD_RENTAL_ACTIVE_EXISTS"
  }
}
```

- De test nhanh auto calculate, dung rental `RENTED` co san cua user01 roi complete rental do.
- Neu muon tao rental moi, phai chon user demo khac chua co rental `RENTED`.
- UUID cua user/rental/station/bike duoc seed bang `uuidv7()`, moi lan reset DB se khac. Data co dinh la email/password demo; ID phai lay bang SQL trong pgAdmin.
- Account demo co dinh va dung duoc ngay sau `pnpm seed:demo`; ID moi lan seed co the doi.

## 1. Chay moi truong

Neu can reset va seed demo lai:

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm prisma migrate reset --force
pnpm seed:demo
```

Chay HTTP server:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm dev:build
```

Chay worker trong terminal khac:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm worker
```

Mo:

- Scalar: `http://localhost:4000/docs`
- pgAdmin: `http://localhost:5050/browser/`

Neu chi chay HTTP server ma khong chay worker:

- Rental completion van success.
- Job co the nam `PENDING` trong `job_outbox`.
- Summary/history/detail chua thay impact cho toi khi worker chay thanh cong.

## 2. Account seed demo that

Tat ca account duoi day dung password:

```text
Demo@123456
```

Login bang API:

```text
POST /v1/auth/login
```

Admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

User co san active rental:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

User khac de test cross-user:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

User nen dung de tao rental moi:

```json
{
  "email": "user19@mebike.local",
  "password": "Demo@123456"
}
```

Staff operator:

```json
{
  "email": "staff1@mebike.local",
  "password": "Demo@123456"
}
```

Agency operator:

```json
{
  "email": "agency1@mebike.local",
  "password": "Demo@123456"
}
```

Data seed lien quan den case nay:

```text
user01 -> user08: da co rental RENTED, khong dung de POST /v1/rentals moi.
user09 -> user18: da co pending reservation, khong phai lua chon sach nhat de tao rental moi.
user19 -> user25: phu hop hon de tao rental moi trong Scalar.
staff1: operator cua mot station noi bo, dung de confirm PUT /v1/rentals/{rentalId}/end.
agency1: operator agency, dung de test them operator agency neu rental return ve station thuoc agency do.
```

## 3. API lien quan cho frontend

Rental:

```text
POST /v1/rentals
POST /v1/rentals/me/{rentalId}/return-slot
GET /v1/rentals/me/{rentalId}/return-slot
DELETE /v1/rentals/me/{rentalId}/return-slot
PUT /v1/rentals/{rentalId}/end
GET /v1/rentals/me
GET /v1/rentals/me/current
GET /v1/rentals/me/{rentalId}
```

Dung dung flow frontend:

```text
User tao rental: POST /v1/rentals
User dat return slot neu UI co buoc chon tram tra: POST /v1/rentals/me/{rentalId}/return-slot
Staff/agency operator confirm xe da tra: PUT /v1/rentals/{rentalId}/end
Backend enqueue environment job sau khi confirm return thanh cong
Worker tao environmental_impact_stats
Frontend doc impact qua /environment/me/*
```

Environment user APIs:

```text
GET /environment/me/summary
GET /environment/me/history
GET /environment/me/rentals/{rentalId}
```

Environment admin APIs:

```text
POST /environment/policies
PATCH /environment/policies/{policyId}/activate
GET /environment/policies/active
POST /internal/environment/calculate-from-rental/{rentalId}
```

Frontend nen dung internal calculate API chi cho admin/repair/test, khong dung trong flow user binh thuong.

## 3A. Backend flow da sua

Flow completed hien tai di qua:

```text
PUT /v1/rentals/{rentalId}/end
-> apps/server/src/http/controllers/rentals/admin.controller.ts
-> RentalCommandService.confirmReturnByOperator
-> apps/server/src/domain/rentals/services/confirm-return.service.ts
-> finalizeRentalReturnInTx set Rental.status = COMPLETED
-> sau transaction thanh cong: enqueueEnvironmentImpactCalculationJob(...)
-> job_outbox type = environment.impact.calculateRental
-> apps/server/src/worker/environment-impact-worker.ts
-> EnvironmentImpactService.calculateFromRental(rentalId)
-> environmental_impact_stats
```

Ly do frontend can biet:

- Complete rental tra response thanh cong truoc khi impact chac chan da hien tren summary/history/detail.
- Job impact bat dong bo, nen UI can xu ly state `dang tinh` neu detail tra 404 ngay sau khi rental completed.
- Backend khong goi HTTP vao internal endpoint. Internal endpoint chi de admin repair/manual trigger.
- Idempotency nam o `environmental_impact_stats.rental_id` unique va dedupe key `environment-impact:rental:<rentalId>`.

## 4. Reset rieng data Environment de test sach

Khong xoa seed demo. Chi xoa impact va environment job:

```sql
DELETE FROM environmental_impact_stats;

DELETE FROM job_outbox
WHERE type = 'environment.impact.calculateRental';
```

Neu muon reset active policy de tao policy moi:

```sql
UPDATE environmental_impact_policies
SET status = 'INACTIVE',
    active_to = now()
WHERE status = 'ACTIVE';
```

## 5. Tao active Environment Policy de expected de tinh

Dung admin token.

Goi:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Auto Impact Test Policy 12kmh 100g",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 100,
  "return_scan_buffer_minutes": 0,
  "confidence_factor": 1
}
```

Response se co `id`. Copy vao:

```text
policyId = <response.id>
```

Goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Kiem tra active policy trong Scalar:

```text
GET /environment/policies/active
```

Kiem tra active policy trong pgAdmin:

```sql
SELECT
  id,
  name,
  status,
  average_speed_kmh,
  co2_saved_per_km,
  formula_config,
  active_from,
  active_to,
  created_at,
  updated_at
FROM environmental_impact_policies
WHERE status = 'ACTIVE'
ORDER BY active_from DESC NULLS LAST, created_at DESC;
```

Voi policy tren:

```text
average_speed_kmh = 12
co2_saved_per_km = 100
return_scan_buffer_minutes = 0
confidence_factor = 1
```

Neu rental duration 60 phut:

```text
raw_rental_minutes = 60
effective_ride_minutes = 60
estimated_distance_km = round((60 / 60) * 12, 2) = 12.00
co2_saved = round(12 * 100 * 1) = 1200 gCO2e
```

## 6. SQL lay ID that tu seed demo

### 6.1. Lay user IDs

```sql
SELECT id, email, role, account_status, verify_status
FROM users
WHERE email IN (
  'admin@mebike.local',
  'user01@mebike.local',
  'user02@mebike.local',
  'staff1@mebike.local',
  'agency1@mebike.local'
)
ORDER BY email;
```

### 6.2. Lay station cua staff1

```sql
SELECT
  staff.id AS staff_id,
  staff.email,
  uoa.station_id,
  s.name AS station_name,
  s.address,
  s.total_capacity,
  s.return_slot_limit
FROM users staff
JOIN "UserOrgAssignment" uoa ON uoa.user_id = staff.id
JOIN "Station" s ON s.id = uoa.station_id
WHERE staff.email = 'staff1@mebike.local';
```

Copy:

```text
staff1StationId = <station_id>
```

### 6.3. Kiem tra capacity cua station return

```sql
SELECT
  s.id,
  s.name,
  s.total_capacity,
  s.return_slot_limit,
  COUNT(b.id) AS total_bikes,
  (
    SELECT COUNT(*)
    FROM return_slot_reservations rsr
    WHERE rsr.station_id = s.id
      AND rsr.status = 'ACTIVE'
  ) AS active_return_slots,
  s.total_capacity
    - COUNT(b.id)
    - (
      SELECT COUNT(*)
      FROM return_slot_reservations rsr
      WHERE rsr.station_id = s.id
        AND rsr.status = 'ACTIVE'
    ) AS physical_remaining
FROM "Station" s
LEFT JOIN "Bike" b ON b."stationId" = s.id
WHERE s.id = '<staff1StationId>'::uuid
GROUP BY s.id, s.name, s.total_capacity, s.return_slot_limit;
```

Neu `physical_remaining <= 0`, tang tam capacity de test:

```sql
UPDATE "Station"
SET total_capacity = total_capacity + 10,
    return_slot_limit = return_slot_limit + 10
WHERE id = '<staff1StationId>'::uuid
RETURNING id, name, total_capacity, return_slot_limit;
```

### 6.3A. Lay station cua agency1 neu can test agency operator

```sql
SELECT
  agency_user.id AS agency_user_id,
  agency_user.email,
  uoa.agency_id,
  s.id AS station_id,
  s.name AS station_name,
  s.station_type,
  s.total_capacity,
  s.return_slot_limit
FROM users agency_user
JOIN "UserOrgAssignment" uoa ON uoa.user_id = agency_user.id
JOIN "Station" s ON s.agency_id = uoa.agency_id
WHERE agency_user.email = 'agency1@mebike.local'
  AND s.station_type = 'AGENCY';
```

Copy:

```text
agency1StationId = <station_id>
```

### 6.4. Lay rental RENTED co san cua user01

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.user_id,
  r.bike_id,
  b.bike_number,
  b.chip_id,
  r.status,
  r.start_station,
  r.start_time,
  r.duration,
  r.end_time
FROM "Rental" r
JOIN users u ON u.id = r.user_id
JOIN "Bike" b ON b.id = r.bike_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'RENTED'
ORDER BY r.start_time DESC
LIMIT 1;
```

Copy:

```text
user01ActiveRentalId = <rental_id>
user01Id = <user_id>
```

### 6.5. Lay user demo chua co active rental va pending reservation de tao rental moi

Dung query nay neu muon test `POST /v1/rentals` ma khong bi `CARD_RENTAL_ACTIVE_EXISTS`.

```sql
SELECT u.id, u.email, u.role
FROM users u
WHERE u.role = 'USER'
  AND u.account_status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM "Rental" r
    WHERE r.user_id = u.id
      AND r.status = 'RENTED'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "Reservation" rv
    WHERE rv.user_id = u.id
      AND rv.status = 'PENDING'
  )
ORDER BY u.email
LIMIT 5;
```

Voi seed demo moi, ket qua thuong se bat dau tu:

```text
user19@mebike.local
user20@mebike.local
user21@mebike.local
```

Tat ca user demo co password:

```text
Demo@123456
```

### 6.6. Lay bike AVAILABLE tai station staff1

Chu y: bang `"Bike"` dung column camelCase `"stationId"` chua khong phai `station_id`.

```sql
SELECT
  b.id AS bike_id,
  b.bike_number,
  b.chip_id,
  b.status,
  b."stationId" AS station_id
FROM "Bike" b
WHERE b."stationId" = '<staff1StationId>'::uuid
  AND b.status = 'AVAILABLE'
ORDER BY b.bike_number
LIMIT 1;
```

Neu khong co bike available, ep 1 bike ve station staff1 de test:

```sql
UPDATE "Bike"
SET status = 'AVAILABLE',
    "stationId" = '<staff1StationId>'::uuid,
    updated_at = now()
WHERE id = (
  SELECT b.id
  FROM "Bike" b
  ORDER BY b.bike_number
  LIMIT 1
)
RETURNING
  id AS bike_id,
  bike_number,
  chip_id,
  status,
  "stationId" AS station_id;
```

Copy:

```text
availableBikeId = <bike_id>
```

## 7. Case 1 - Auto calculate thanh cong bang rental RENTED co san cua user01

Case nay khuyen nghi de test nhanh voi seed demo vi user01 da co rental `RENTED`.

### 7.1. Chuan bi rental duration 60 phut de expected chinh xac

```sql
UPDATE "Rental"
SET start_time = '2026-04-15T09:00:00.000Z',
    duration = NULL
WHERE id = '<user01ActiveRentalId>'::uuid
RETURNING id, status, start_time, duration;
```

### 7.2. Complete rental trong Scalar

Neu frontend muon test dung buoc user chon tram tra truoc, authorize bang `user01` token va goi:

```text
POST /v1/rentals/me/{rentalId}/return-slot
```

Param:

```text
rentalId = <user01ActiveRentalId>
```

Body:

```json
{
  "stationId": "<staff1StationId>"
}
```

Expected:

```text
status = ACTIVE
stationId = <staff1StationId>
```

Sau do authorize lai bang `staff1` token de confirm return.

Goi:

```text
PUT /v1/rentals/{rentalId}/end
```

Param:

```text
rentalId = <user01ActiveRentalId>
```

Body:

```json
{
  "stationId": "<staff1StationId>",
  "confirmedAt": "2026-04-15T10:00:00.000Z",
  "confirmationMethod": "MANUAL"
}
```

Expected response:

```text
status = COMPLETED
duration = 60
```

### 7.3. Kiem tra rental trong pgAdmin

```sql
SELECT id, user_id, status, duration, start_time, end_time
FROM "Rental"
WHERE id = '<user01ActiveRentalId>'::uuid;
```

Expected:

```text
status = COMPLETED
duration = 60
start_time = 2026-04-15 09:00:00+00
end_time = 2026-04-15 10:00:00+00
```

### 7.4. Kiem tra outbox job

```sql
SELECT id, type, dedupe_key, payload, status, attempts, last_error, created_at, updated_at
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<user01ActiveRentalId>';
```

Expected:

```text
type = environment.impact.calculateRental
payload.rentalId = <user01ActiveRentalId>
status = PENDING neu worker chua dispatch
status = SENT neu worker da dispatch
```

### 7.5. Kiem tra impact

Neu worker dang chay, doi vai giay roi query:

```sql
SELECT
  id,
  user_id,
  rental_id,
  policy_id,
  estimated_distance_km,
  co2_saved,
  policy_snapshot,
  calculated_at
FROM environmental_impact_stats
WHERE rental_id = '<user01ActiveRentalId>'::uuid;
```

Expected voi policy section 5:

```text
estimated_distance_km = 12.00
co2_saved = 1200.0000
policy_snapshot.raw_rental_minutes = 60
policy_snapshot.effective_ride_minutes = 60
policy_snapshot.co2_saved_unit = gCO2e
```

Query nhanh field JSON:

```sql
SELECT
  rental_id,
  estimated_distance_km,
  co2_saved,
  policy_snapshot->>'raw_rental_minutes' AS raw_rental_minutes,
  policy_snapshot->>'effective_ride_minutes' AS effective_ride_minutes,
  policy_snapshot->>'co2_saved_unit' AS co2_saved_unit
FROM environmental_impact_stats
WHERE rental_id = '<user01ActiveRentalId>'::uuid;
```

## 8. Case 2 - Tao rental moi bang user khong co active rental

Dung case nay de test full user create rental -> staff complete -> auto impact.

### 8.1. Lay free user va login

Chay SQL section 6.5. Voi seed demo moi, uu tien user tu `user19@mebike.local` tro di. Vi du ket qua co:

```text
freeUserEmail = user19@mebike.local
```

Login Scalar:

```json
{
  "email": "<freeUserEmail>",
  "password": "Demo@123456"
}
```

### 8.2. Lay bike available

Chay SQL section 6.6.

### 8.3. Tao rental

Authorize bang token cua free user.

Goi:

```text
POST /v1/rentals
```

Body:

```json
{
  "bikeId": "<availableBikeId>",
  "startStationId": "<staff1StationId>"
}
```

Expected:

```text
status = RENTED
```

Copy:

```text
newRentalId = <response.id>
newRentalOwnerEmail = <freeUserEmail>
```

De expected 60 phut:

```sql
UPDATE "Rental"
SET start_time = '2026-04-15T09:00:00.000Z',
    duration = NULL
WHERE id = '<newRentalId>'::uuid
RETURNING id, status, start_time, duration;
```

### 8.4. Complete rental

Neu UI co buoc user chon tram tra, authorize bang token cua free user va goi truoc:

```text
POST /v1/rentals/me/{newRentalId}/return-slot
```

Body:

```json
{
  "stationId": "<staff1StationId>"
}
```

Sau do authorize bang `staff1` token.

```text
PUT /v1/rentals/{newRentalId}/end
```

Body:

```json
{
  "stationId": "<staff1StationId>",
  "confirmedAt": "2026-04-15T10:00:00.000Z",
  "confirmationMethod": "MANUAL"
}
```

Expected:

```text
status = COMPLETED
```

Kiem tra job + impact nhu section 7.4 va 7.5, thay rental id bang `<newRentalId>`.

## 8A. Case 2A - Agency operator confirm return

Dung case nay neu frontend co man hinh operator agency. Endpoint van la:

```text
PUT /v1/rentals/{rentalId}/end
```

Khac biet:

- Login operator bang `agency1@mebike.local`.
- `stationId` phai la station thuoc agency1, lay bang SQL section 6.3A.
- Neu dung sai station, backend tra `403 ACCESS_DENIED`.

Lay bike available tai station agency1:

```sql
SELECT
  b.id AS bike_id,
  b.bike_number,
  b.chip_id,
  b.status,
  b."stationId" AS station_id
FROM "Bike" b
WHERE b."stationId" = '<agency1StationId>'::uuid
  AND b.status = 'AVAILABLE'
ORDER BY b.bike_number
LIMIT 1;
```

Dung user free tu section 6.5, tao rental:

```json
{
  "bikeId": "<agencyAvailableBikeId>",
  "startStationId": "<agency1StationId>"
}
```

Neu UI co return slot, user goi:

```text
POST /v1/rentals/me/{agencyRentalId}/return-slot
```

Body:

```json
{
  "stationId": "<agency1StationId>"
}
```

Agency1 confirm return:

```text
PUT /v1/rentals/{agencyRentalId}/end
```

Body:

```json
{
  "stationId": "<agency1StationId>",
  "confirmedAt": "2026-04-15T10:00:00.000Z",
  "confirmationMethod": "MANUAL"
}
```

Expected:

```text
Rental.status = COMPLETED
job_outbox.dedupe_key = environment-impact:rental:<agencyRentalId>
environmental_impact_stats co 1 row sau khi worker xu ly thanh cong
```

## 9. Case 3 - Summary / history / detail sau auto calculate

Authorize bang token cua owner rental.

Neu test Case 1 thi owner la `user01@mebike.local`.
Neu test Case 2 thi owner la `<freeUserEmail>`.

### 9.1. Summary

```text
GET /environment/me/summary
```

Neu da reset impact section 4 va chi calculate 1 rental 60 phut, expected:

```json
{
  "total_trips_counted": 1,
  "total_estimated_distance_km": 12,
  "total_co2_saved": 1200,
  "co2_saved_unit": "gCO2e"
}
```

Doi chieu DB:

```sql
SELECT
  COUNT(*) AS total_trips_counted,
  COALESCE(SUM(eis.estimated_distance_km), 0) AS total_estimated_distance_km,
  COALESCE(SUM(eis.co2_saved), 0) AS total_co2_saved
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = '<ownerEmail>';
```

### 9.2. History

```text
GET /environment/me/history
```

Expected:

```text
items co rental_id = <rentalId>
co2_saved_unit = gCO2e
```

Doi chieu DB:

```sql
SELECT
  eis.id,
  eis.rental_id,
  eis.policy_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.policy_snapshot,
  eis.calculated_at
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = '<ownerEmail>'
ORDER BY eis.calculated_at DESC;
```

### 9.3. Detail

```text
GET /environment/me/rentals/{rentalId}
```

Expected voi rental 60 phut:

```text
rental_id = <rentalId>
estimated_distance_km = 12
co2_saved = 1200
co2_saved_unit = gCO2e
raw_rental_minutes = 60
effective_ride_minutes = 60
```

## 10. Case 4 - Idempotency, khong duplicate impact

Sau khi auto calculate da tao impact, authorize bang admin token va goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Expected response:

```text
already_calculated = true
```

DB phai van chi co 1 impact row:

```sql
SELECT rental_id, COUNT(*) AS rows_per_rental
FROM environmental_impact_stats
WHERE rental_id = '<rentalId>'::uuid
GROUP BY rental_id;
```

Expected:

```text
rows_per_rental = 1
```

Outbox cung khong duplicate active job cho rental:

```sql
SELECT COUNT(*) AS job_count
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<rentalId>';
```

Expected:

```text
job_count = 1
```

## 11. Case 5 - Worker khong chay thi impact chua hien

Dung de frontend hieu behavior bat dong bo.

1. Dung worker terminal.
2. Tao/complete rental moi theo section 8.
3. Goi summary/history/detail ngay lap tuc.

Expected:

```text
Rental da COMPLETED
GET /environment/me/rentals/{rentalId} co the tra 404 ENVIRONMENT_IMPACT_NOT_FOUND
summary/history chua co rental moi
```

Kiem tra DB:

```sql
SELECT id, type, dedupe_key, status, attempts, last_error
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<rentalId>';

SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats
WHERE rental_id = '<rentalId>'::uuid;
```

Expected:

```text
job_outbox.status = PENDING
impact_count = 0
```

Chay lai worker:

```bash
pnpm worker
```

Doi vai giay, expected:

```text
job_outbox.status = SENT
impact_count = 1
summary/history/detail thay data
```

## 12. Case 6 - Khong co active policy

Dung de test business rule: rental completion khong bi rollback.

### 12.1. Tat active policy

```sql
UPDATE environmental_impact_policies
SET status = 'INACTIVE',
    active_to = now()
WHERE status = 'ACTIVE';
```

### 12.2. Tao va complete rental moi

Dung section 8 de tao rental moi voi free user, roi complete.

Expected response complete:

```text
status = COMPLETED
```

### 12.3. Kiem tra DB

```sql
SELECT id, user_id, status, duration, start_time, end_time
FROM "Rental"
WHERE id = '<rentalNoPolicyId>'::uuid;

SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats
WHERE rental_id = '<rentalNoPolicyId>'::uuid;

SELECT id, type, dedupe_key, payload, status, attempts, last_error
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<rentalNoPolicyId>';
```

Expected:

```text
Rental.status = COMPLETED
impact_count = 0
Worker log co "No active environment policy found"
```

Luu y:

```text
job_outbox.status co the da la SENT vi outbox chi ghi nhan viec dispatch job sang worker queue.
Neu EnvironmentImpactService loi trong worker, xem worker terminal log de thay "No active environment policy found".
job_outbox.last_error chu yeu dung cho loi dispatch outbox, khong phai moi loi xu ly trong worker.
```

Sau case nay, tao/activate lai policy section 5 de test cac case khac.

## 13. Case 7 - RENTED rental khong trigger impact

Lay rental `RENTED` bat ky:

```sql
SELECT r.id, r.user_id, u.email, r.status
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE r.status = 'RENTED'
ORDER BY u.email
LIMIT 1;
```

Khong complete rental nay.

Kiem tra:

```sql
SELECT COUNT(*) AS job_count
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<rentedRentalId>';

SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats
WHERE rental_id = '<rentedRentalId>'::uuid;
```

Expected:

```text
job_count = 0
impact_count = 0
```

Neu admin goi manual:

```text
POST /internal/environment/calculate-from-rental/{rentedRentalId}
```

Expected:

```text
HTTP 409
details.code = ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED
```

## 14. Case 8 - CANCELLED rental khong trigger impact

Lay rental `CANCELLED` tu seed demo:

```sql
SELECT r.id, r.user_id, u.email, r.status
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE r.status = 'CANCELLED'
ORDER BY r.updated_at DESC
LIMIT 1;
```

Kiem tra:

```sql
SELECT COUNT(*) AS job_count
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<cancelledRentalId>';

SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats
WHERE rental_id = '<cancelledRentalId>'::uuid;
```

Expected:

```text
job_count = 0
impact_count = 0
```

Neu admin goi manual:

```text
POST /internal/environment/calculate-from-rental/{cancelledRentalId}
```

Expected:

```text
HTTP 409
details.code = ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED
```

## 15. Case 9 - User khac khong xem duoc impact detail

Sau khi rental cua `user01@mebike.local` da co impact, login `user02@mebike.local`.

Goi:

```text
GET /environment/me/rentals/{user01RentalId}
```

Expected:

```text
HTTP 404
details.code = ENVIRONMENT_IMPACT_NOT_FOUND
```

Doi chieu DB:

```sql
SELECT eis.rental_id, eis.user_id, u.email
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE eis.rental_id = '<user01RentalId>'::uuid;
```

Expected:

```text
email = user01@mebike.local
```

## 16. Case 10 - Role non-user khong dung duoc Environment user APIs

Login admin hoac staff, goi:

```text
GET /environment/me/summary
GET /environment/me/history
GET /environment/me/rentals/{rentalId}
```

Expected:

```text
HTTP 403
```

Frontend can an menu/user Environment screen cho account khong phai `USER`.

## 17. Case 11 - Active policy API quyen admin

User token goi:

```text
POST /environment/policies
PATCH /environment/policies/{policyId}/activate
GET /environment/policies
GET /environment/policies/active
```

Expected:

```text
HTTP 403
```

Admin token moi duoc dung cac API policy/config.

## 18. Case 12 - Invalid rental id

User token goi:

```text
GET /environment/me/rentals/not-a-uuid
```

Expected:

```text
HTTP 400
```

Admin token goi:

```text
POST /internal/environment/calculate-from-rental/not-a-uuid
```

Expected:

```text
HTTP 400
```

## 19. Frontend integration notes

### 19.1. Sau rental completed

Flow frontend nen hieu:

```text
1. User/staff/admin hoan thanh rental.
2. Backend response rental status COMPLETED.
3. Backend enqueue environment job.
4. Worker tinh impact bat dong bo.
5. Summary/history/detail chi co data sau khi impact row duoc tao.
```

UI khong nen assume summary tang ngay lap tuc trong cung request complete rental.

### 19.2. Detail 404 sau completed la hop le

Neu frontend goi:

```text
GET /environment/me/rentals/{rentalId}
```

va nhan:

```text
HTTP 404 ENVIRONMENT_IMPACT_NOT_FOUND
```

thi co the la:

- worker chua xu ly xong
- khong co active policy luc job chay
- job failed
- rental khong thuoc user hien tai

UI nen hien state dang tinh/to be updated, khong nen coi la rental khong ton tai.

### 19.3. Polling goi y

Sau khi complete rental, frontend co the:

```text
GET /environment/me/rentals/{rentalId}
```

poll 2-3 lan, moi lan cach 1-2 giay.

Neu van 404:

- hien "Impact is being calculated" hoac an card impact.
- summary/history se tu cap nhat khi user reload/poll sau.

### 19.4. Source of truth

Frontend chi render Environment data tu:

```text
GET /environment/me/summary
GET /environment/me/history
GET /environment/me/rentals/{rentalId}
```

Khong tu tinh CO2 o frontend.
Khong goi internal calculate trong user flow.

### 19.5. Don vi

```text
co2_saved = gram CO2e
co2_saved_unit = gCO2e
```

Khong co field `co2_saved_g`.

## 20. SQL debug nhanh

### 20.1. Rental + impact + job theo rental id

```sql
SELECT
  r.id,
  u.email,
  r.status,
  r.duration,
  r.start_time,
  r.end_time,
  eis.id AS impact_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  jo.id AS job_id,
  jo.status AS job_status,
  jo.attempts AS job_attempts,
  jo.last_error AS job_last_error
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
LEFT JOIN job_outbox jo ON jo.dedupe_key = 'environment-impact:rental:' || r.id::text
WHERE r.id = '<rentalId>'::uuid;
```

### 20.2. Tat ca job environment gan nhat

```sql
SELECT id, type, dedupe_key, payload, status, attempts, last_error, created_at, updated_at
FROM job_outbox
WHERE type = 'environment.impact.calculateRental'
ORDER BY created_at DESC
LIMIT 20;
```

### 20.3. Tat ca impact gan nhat

```sql
SELECT
  eis.id,
  u.email,
  eis.rental_id,
  eis.policy_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.policy_snapshot,
  eis.calculated_at
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
ORDER BY eis.calculated_at DESC
LIMIT 20;
```

## 21. Checklist test nhanh cho QA/frontend

1. Login admin, user01, staff1.
2. Reset impact/job environment bang SQL section 4.
3. Tao active policy section 5.
4. Lay `staff1StationId` section 6.2.
5. Lay `user01ActiveRentalId` section 6.4.
6. Update start_time rental ve `2026-04-15T09:00:00.000Z`.
7. Neu UI co return slot, user01 goi `POST /v1/rentals/me/{rentalId}/return-slot`.
8. Staff1 complete rental luc `2026-04-15T10:00:00.000Z`.
9. Kiem tra rental `COMPLETED`.
10. Kiem tra job outbox co `environment-impact:rental:<rentalId>`.
11. Kiem tra impact co `estimated_distance_km = 12`, `co2_saved = 1200`.
12. User01 goi summary/history/detail va confirm data.
13. Admin goi manual calculate lai va confirm `already_calculated = true`.
14. User02 goi detail rental user01 va confirm `404`.
15. Dung worker, complete rental moi bang user19/free user, confirm impact chua co va job `PENDING`.
16. Chay worker lai, confirm impact xuat hien.

## 22. Loi thuong gap

### 22.1. `CARD_RENTAL_ACTIVE_EXISTS`

Nguyen nhan:

- Dung `user01@mebike.local` de tao rental moi trong khi seed demo da co rental `RENTED`.

Cach xu ly:

- Dung rental `RENTED` co san cua user01 de complete.
- Hoac chon free user bang SQL section 6.5.

### 22.2. SQL loi `b.station_id does not exist`

Bang `"Bike"` dung column `"stationId"`, khong phai `station_id`.

Dung:

```sql
b."stationId"
```

Khong dung:

```sql
b.station_id
```

### 22.3. Detail 404 sau khi complete

Kiem tra:

```sql
SELECT id, type, dedupe_key, status, attempts, last_error
FROM job_outbox
WHERE dedupe_key = 'environment-impact:rental:<rentalId>';

SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats
WHERE rental_id = '<rentalId>'::uuid;
```

Neu job `PENDING`, hay chay worker.
Neu worker log `No active environment policy found`, tao va activate policy roi manual repair bang:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

### 22.4. Summary khong tang

Summary chi cong tu `environmental_impact_stats`. Kiem tra rental da co impact row chua:

```sql
SELECT
  r.id AS rental_id,
  r.status,
  eis.id AS impact_id
FROM "Rental" r
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE r.id = '<rentalId>'::uuid;
```

Neu `impact_id IS NULL`, summary chua tinh rental do.
