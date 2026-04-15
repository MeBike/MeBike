# Environment Summary Scalar + pgAdmin + Frontend Guide

File nay dung cho frontend test va tich hop API:

```text
GET /environment/me/summary
```

Muc tieu API:

- User xem tong tac dong moi truong da tich luy.
- API chi doc tu bang `environmental_impact_stats`.
- API khong tinh impact moi.
- API khong doc cong don truc tiep tu `Rental`.
- API khong tao row moi, khong update DB, khong cache.
- Rental `COMPLETED` nhung chua chay calculate Environment Impact thi chua duoc tinh vao summary.

## 1. Chuan bi moi truong

Chay backend chinh trong `apps/server`, backend nay la service dang co Scalar:

```bash
cd D:\do_an_3\MeBike

docker compose -f apps/server/compose.dev.yml up -d db redis pgadmin

cd D:\do_an_3\MeBike\apps\server
pnpm prisma migrate reset --force
pnpm seed:demo

cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm dev:build
```

Mo:

- Scalar: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- pgAdmin: `http://localhost:5050/browser/`

## 2. Tai khoan seed demo that

Tat ca account demo duoi day dung password:

```text
Demo@123456
```

Tai khoan can dung cho flow nay:

```text
Admin:
email: admin@mebike.local
password: Demo@123456

User 1:
email: user01@mebike.local
password: Demo@123456

User 2:
email: user02@mebike.local
password: Demo@123456
```

Luu y:

- UUID `user_id`, `rental_id`, `policy_id` duoc seed bang `uuidv7()`, moi lan reset DB se khac.
- Khong hardcode UUID tu lan seed truoc.
- Luon lay UUID moi bang SQL trong pgAdmin.

## 3. API lien quan

### 3.1. Login

```text
POST /v1/auth/login
```

Body:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Response mau:

```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Trong Scalar:

1. Bam nut auth/security.
2. Chon bearer auth.
3. Paste `data.accessToken`.
4. Khong them chu `Bearer` neu Scalar UI da tu them.

### 3.2. Summary moi truong cua user dang login

```text
GET /environment/me/summary
```

Role:

```text
USER only
```

Header:

```http
Authorization: Bearer <user_access_token>
```

Request body:

```text
Khong co body
```

Query params:

```text
Khong co query params trong Phase 1
```

Response khi chua co impact record:

```json
{
  "total_trips_counted": 0,
  "total_estimated_distance_km": 0,
  "total_co2_saved": 0,
  "co2_saved_unit": "gCO2e"
}
```

Response khi da co impact records:

```json
{
  "total_trips_counted": 2,
  "total_estimated_distance_km": 31.2,
  "total_co2_saved": 1989,
  "co2_saved_unit": "gCO2e"
}
```

### 3.3. Tao impact cho rental completed

API nay dung admin token:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Role:

```text
ADMIN
```

Body:

```text
Khong co body
```

Response lan dau tinh thanh cong:

```json
{
  "id": "...",
  "user_id": "...",
  "rental_id": "...",
  "policy_id": "...",
  "estimated_distance_km": 21.4,
  "co2_saved": 1364,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "policy_id": "...",
    "policy_name": "Summary Idempotency Test Policy",
    "average_speed_kmh": 12,
    "co2_saved_per_km": 75,
    "co2_saved_per_km_unit": "gCO2e/km",
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "raw_rental_minutes": 110,
    "effective_ride_minutes": 107,
    "estimated_distance_km": 21.4,
    "co2_saved": 1364,
    "co2_saved_unit": "gCO2e",
    "distance_source": "TIME_SPEED",
    "formula_version": "PHASE_1_TIME_SPEED"
  },
  "calculated_at": "2026-04-26T17:35:00.000Z",
  "already_calculated": false
}
```

Response khi calculate lai cung `rentalId`:

```json
{
  "id": "...",
  "user_id": "...",
  "rental_id": "...",
  "policy_id": "...",
  "estimated_distance_km": 21.4,
  "co2_saved": 1364,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "estimated_distance_km": 21.4,
    "co2_saved": 1364,
    "co2_saved_unit": "gCO2e"
  },
  "calculated_at": "...",
  "already_calculated": true
}
```

## 4. Business rule frontend can biet

- `GET /environment/me/summary` la API cong don.
- API summary chi cong tu `environmental_impact_stats`.
- API summary khong goi calculate, khong tu tao impact.
- Moi `rental_id` chi co toi da 1 row impact do unique index tren `environmental_impact_stats.rental_id`.
- Calculate cung mot `rentalId` nhieu lan se idempotent:
  - lan 1: `already_calculated = false`
  - lan sau: `already_calculated = true`
  - summary khong tang them
- Calculate `rentalId_1`, roi `rentalId_2`, roi calculate lai `rentalId_1` thi summary van la 2 trips, khong phai 3.
- User chi xem summary cua chinh account trong token.
- Admin/Staff/Agency khong duoc goi `GET /environment/me/summary`; expected `403`.
- Khong login expected `401`.

## 5. Cong thuc Phase 1 de tinh expected value

Active policy test khuyen nghi:

```json
{
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Cong thuc:

```text
raw_rental_minutes = Rental.duration hoac end_time - start_time
effective_ride_minutes = max(0, raw_rental_minutes - return_scan_buffer_minutes)
estimated_distance_km = round((effective_ride_minutes / 60) * average_speed_kmh, 2)
co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)
co2_saved_unit = "gCO2e"
```

Vi du rental duration `110` phut:

```text
effective_ride_minutes = 110 - 3 = 107
estimated_distance_km = round((107 / 60) * 12, 2) = 21.40
co2_saved = round(21.40 * 75 * 0.85) = 1364
```

## 6. Chuan bi active policy trong Scalar

Login admin:

```text
POST /v1/auth/login
```

Body:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Authorize Scalar bang admin token.

Kiem tra active policy:

```text
GET /environment/policies/active
```

Neu tra `404`, tao policy:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Summary Idempotency Test Policy",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Copy `id` cua response, sau do activate:

```text
PATCH /environment/policies/{policyId}/activate
```

Body:

```text
De trong
```

Kiem tra lai:

```text
GET /environment/policies/active
```

Ky vong:

```json
{
  "name": "Summary Idempotency Test Policy",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "co2_saved_per_km_unit": "gCO2e/km",
  "status": "ACTIVE",
  "active_to": null,
  "formula_config": {
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "display_unit": "gCO2e",
    "formula_version": "PHASE_1_TIME_SPEED",
    "distance_source": "TIME_SPEED"
  }
}
```

## 7. SQL baseline lay data seed demo that

Chay trong pgAdmin sau moi lan seed lai.

### 7.1. Lay user demo

```sql
SELECT id, email, role, account_status, verify_status
FROM users
WHERE email IN (
  'admin@mebike.local',
  'user01@mebike.local',
  'user02@mebike.local'
)
ORDER BY email;
```

Ky vong:

- `admin@mebike.local` role `ADMIN`
- `user01@mebike.local` role `USER`
- `user02@mebike.local` role `USER`

### 7.2. Lay 2 rental completed moi nhat cua user01

```sql
SELECT
  u.id AS user_id,
  u.email,
  r.id AS rental_id,
  r.status,
  r.duration,
  r.start_time,
  r.end_time,
  ROUND((GREATEST(r.duration - 3, 0)::numeric / 60) * 12, 2) AS expected_distance_km,
  ROUND(
    ROUND((GREATEST(r.duration - 3, 0)::numeric / 60) * 12, 2) * 75 * 0.85
  ) AS expected_co2_saved_g
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC
LIMIT 2;
```

Luu lai:

```text
userId = user_id
rentalId_1 = rental_id dong 1
expectedDistance_1 = expected_distance_km dong 1
expectedCo2_1 = expected_co2_saved_g dong 1

rentalId_2 = rental_id dong 2
expectedDistance_2 = expected_distance_km dong 2
expectedCo2_2 = expected_co2_saved_g dong 2
```

Neu seed demo tao rental co duration `110`, ket qua expected la:

```text
duration = 110
expected_distance_km = 21.40
expected_co2_saved_g = 1364
```

### 7.3. Lay rental completed chua calculate

Dung query nay neu muon tranh rental da co impact:

```sql
SELECT
  u.id AS user_id,
  u.email,
  r.id AS rental_id,
  r.status,
  r.duration,
  r.start_time,
  r.end_time,
  ROUND((GREATEST(r.duration - 3, 0)::numeric / 60) * 12, 2) AS expected_distance_km,
  ROUND(
    ROUND((GREATEST(r.duration - 3, 0)::numeric / 60) * 12, 2) * 75 * 0.85
  ) AS expected_co2_saved_g
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
  AND eis.id IS NULL
ORDER BY r.end_time DESC
LIMIT 2;
```

### 7.4. Xem impact records cua user01

```sql
SELECT
  eis.id,
  eis.user_id,
  u.email,
  eis.rental_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.calculated_at
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = 'user01@mebike.local'
ORDER BY eis.calculated_at DESC;
```

### 7.5. SQL summary de so voi API

```sql
SELECT
  COUNT(*) AS total_trips_counted,
  ROUND(COALESCE(SUM(eis.estimated_distance_km), 0), 2) AS total_estimated_distance_km,
  ROUND(COALESCE(SUM(eis.co2_saved), 0)) AS total_co2_saved
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = 'user01@mebike.local';
```

Response cua `GET /environment/me/summary` phai khop query nay.

## 8. Reset impact rieng cho user01 de test sach

Chi dung trong dev/test DB.

```sql
DELETE FROM environmental_impact_stats
WHERE user_id = (
  SELECT id
  FROM users
  WHERE email = 'user01@mebike.local'
);
```

Kiem tra:

```sql
SELECT COUNT(*) AS impact_count
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = 'user01@mebike.local';
```

Ky vong:

```text
impact_count = 0
```

## 9. Case 1: User chua co impact thi summary bang 0

Sau khi reset impact user01, login user01 trong Scalar:

```text
POST /v1/auth/login
```

Body:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Authorize bang user token, goi:

```text
GET /environment/me/summary
```

Ky vong:

```json
{
  "total_trips_counted": 0,
  "total_estimated_distance_km": 0,
  "total_co2_saved": 0,
  "co2_saved_unit": "gCO2e"
}
```

## 10. Case 2: Calculate 1 rental completed thi summary tang 1

Authorize bang admin token.

Goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId_1}
```

Vi du:

```text
POST /internal/environment/calculate-from-rental/019d8f7e-11b2-755e-911e-50057d7ec2be
```

Ky vong lan dau:

```json
{
  "rental_id": "<rentalId_1>",
  "estimated_distance_km": "<expectedDistance_1>",
  "co2_saved": "<expectedCo2_1>",
  "co2_saved_unit": "gCO2e",
  "already_calculated": false
}
```

Doi chieu DB:

```sql
SELECT
  rental_id,
  estimated_distance_km,
  co2_saved,
  calculated_at
FROM environmental_impact_stats
WHERE rental_id = '<rentalId_1>'::uuid;
```

Authorize lai user01 token, goi:

```text
GET /environment/me/summary
```

Ky vong:

```json
{
  "total_trips_counted": 1,
  "total_estimated_distance_km": "<expectedDistance_1>",
  "total_co2_saved": "<expectedCo2_1>",
  "co2_saved_unit": "gCO2e"
}
```

## 11. Case 3: Calculate lai cung rentalId thi khong tang summary

Authorize bang admin token.

Goi lai:

```text
POST /internal/environment/calculate-from-rental/{rentalId_1}
```

Ky vong:

```json
{
  "rental_id": "<rentalId_1>",
  "estimated_distance_km": "<expectedDistance_1>",
  "co2_saved": "<expectedCo2_1>",
  "co2_saved_unit": "gCO2e",
  "already_calculated": true
}
```

DB van chi co 1 row cho rental nay:

```sql
SELECT
  rental_id,
  COUNT(*) AS rows_per_rental,
  ROUND(SUM(estimated_distance_km), 2) AS distance_sum,
  ROUND(SUM(co2_saved)) AS co2_sum
FROM environmental_impact_stats
WHERE rental_id = '<rentalId_1>'::uuid
GROUP BY rental_id;
```

Ky vong:

```text
rows_per_rental = 1
```

Authorize user01 token, goi lai:

```text
GET /environment/me/summary
```

Ky vong van la 1 trip, khong phai 2:

```json
{
  "total_trips_counted": 1,
  "total_estimated_distance_km": "<expectedDistance_1>",
  "total_co2_saved": "<expectedCo2_1>",
  "co2_saved_unit": "gCO2e"
}
```

## 12. Case 4: Calculate 2 rental completed thi summary cong don

Authorize bang admin token.

Goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId_2}
```

Ky vong:

```json
{
  "rental_id": "<rentalId_2>",
  "estimated_distance_km": "<expectedDistance_2>",
  "co2_saved": "<expectedCo2_2>",
  "co2_saved_unit": "gCO2e",
  "already_calculated": false
}
```

Authorize user01 token, goi:

```text
GET /environment/me/summary
```

Ky vong:

```json
{
  "total_trips_counted": 2,
  "total_estimated_distance_km": "<expectedDistance_1 + expectedDistance_2>",
  "total_co2_saved": "<expectedCo2_1 + expectedCo2_2>",
  "co2_saved_unit": "gCO2e"
}
```

SQL tinh tong chinh xac:

```sql
SELECT
  COUNT(*) AS total_trips_counted,
  ROUND(COALESCE(SUM(estimated_distance_km), 0), 2) AS total_estimated_distance_km,
  ROUND(COALESCE(SUM(co2_saved), 0)) AS total_co2_saved
FROM environmental_impact_stats
WHERE rental_id IN (
  '<rentalId_1>'::uuid,
  '<rentalId_2>'::uuid
);
```

## 13. Case 5: Calculate rental 1, rental 2, rental 1 lai thi van la 2 trips

Day la case idempotency quan trong.

Thu tu thao tac:

1. Reset impact user01.
2. Calculate `rentalId_1`.
3. Calculate `rentalId_2`.
4. Calculate lai `rentalId_1`.
5. Goi summary.

Lan calculate lai `rentalId_1` phai tra:

```json
{
  "rental_id": "<rentalId_1>",
  "already_calculated": true
}
```

Summary expected:

```json
{
  "total_trips_counted": 2,
  "total_estimated_distance_km": "<expectedDistance_1 + expectedDistance_2>",
  "total_co2_saved": "<expectedCo2_1 + expectedCo2_2>",
  "co2_saved_unit": "gCO2e"
}
```

Khong duoc thanh:

```json
{
  "total_trips_counted": 3
}
```

Query xac nhan trong pgAdmin:

```sql
SELECT
  rental_id,
  COUNT(*) AS rows_per_rental,
  ROUND(SUM(estimated_distance_km), 2) AS distance_sum,
  ROUND(SUM(co2_saved)) AS co2_sum
FROM environmental_impact_stats
WHERE rental_id IN (
  '<rentalId_1>'::uuid,
  '<rentalId_2>'::uuid
)
GROUP BY rental_id
ORDER BY rental_id;
```

Ky vong:

```text
Moi rental_id co rows_per_rental = 1
Tong so row = 2
```

## 14. Case 6: Rental completed chua calculate thi chua nam trong summary

Reset impact user01:

```sql
DELETE FROM environmental_impact_stats
WHERE user_id = (
  SELECT id
  FROM users
  WHERE email = 'user01@mebike.local'
);
```

Lay 2 rental completed nhung chi calculate `rentalId_1`.

Goi summary:

```text
GET /environment/me/summary
```

Ky vong:

```json
{
  "total_trips_counted": 1,
  "total_estimated_distance_km": "<expectedDistance_1>",
  "total_co2_saved": "<expectedCo2_1>",
  "co2_saved_unit": "gCO2e"
}
```

Mac du user co `rentalId_2` status `COMPLETED`, summary khong tinh `rentalId_2` vi chua co row trong `environmental_impact_stats`.

## 15. Case 7: User khac khong thay data cua user01

Reset impact user01 va user02 neu can:

```sql
DELETE FROM environmental_impact_stats
WHERE user_id IN (
  SELECT id
  FROM users
  WHERE email IN ('user01@mebike.local', 'user02@mebike.local')
);
```

Calculate 1 hoac 2 rental cua user01.

Login `user02@mebike.local`:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Authorize bang user02 token, goi:

```text
GET /environment/me/summary
```

Neu user02 chua co impact, expected:

```json
{
  "total_trips_counted": 0,
  "total_estimated_distance_km": 0,
  "total_co2_saved": 0,
  "co2_saved_unit": "gCO2e"
}
```

Khong duoc thay tong cua user01.

## 16. Case 8: Khong login bi 401

Trong Scalar, clear bearer token.

Goi:

```text
GET /environment/me/summary
```

Ky vong:

```text
401
```

Response dang:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

## 17. Case 9: Admin/Staff/Agency bi 403

Login admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Authorize bang admin token.

Goi:

```text
GET /environment/me/summary
```

Ky vong:

```text
403
```

Ly do:

- API nay chi cho role `USER`.
- Admin van dung API admin/policy/calculate rieng, khong dung API summary cua user.

## 18. Frontend integration notes

### 18.1. Khi nao goi summary

Frontend user app nen goi:

```text
GET /environment/me/summary
```

Tai cac man:

- Profile/Me dashboard
- Environmental impact widget
- Ride history summary
- Home screen statistic card

Frontend khong can gui `userId`.

### 18.2. Display fields

Map response:

```text
total_trips_counted -> so chuyen da tinh moi truong
total_estimated_distance_km -> tong km uoc tinh
total_co2_saved -> tong gram CO2e tiet kiem
co2_saved_unit -> don vi, hien tai luon la gCO2e
```

Vi du UI:

```text
2 trips counted
31.2 km estimated
1,989 gCO2e saved
```

Neu muon doi sang kg tren UI:

```text
kgCO2e = total_co2_saved / 1000
```

Nhung API source of truth van la gram va `co2_saved_unit = "gCO2e"`.

### 18.3. Fetch example

```ts
type EnvironmentSummary = {
  total_trips_counted: number;
  total_estimated_distance_km: number;
  total_co2_saved: number;
  co2_saved_unit: "gCO2e";
};

export async function getMyEnvironmentSummary(accessToken: string) {
  const response = await fetch(`${baseUrl}/environment/me/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load environment summary: ${response.status}`);
  }

  return await response.json() as EnvironmentSummary;
}
```

### 18.4. Empty state

Neu response la:

```json
{
  "total_trips_counted": 0,
  "total_estimated_distance_km": 0,
  "total_co2_saved": 0,
  "co2_saved_unit": "gCO2e"
}
```

Frontend nen hien:

```text
No counted environmental impact yet.
```

Khong nen hien loi vi day la trang thai hop le.

### 18.5. Luu y quan trong cho frontend

- Khong goi calculate API tu user app.
- `POST /internal/environment/calculate-from-rental/{rentalId}` la admin/internal flow.
- User app chi doc summary.
- Neu user vua hoan thanh rental nhung summary chua tang, ly do co the la backend/job/admin chua calculate impact cho rental do.

## 19. Checklist test nhanh sau seed

1. Reset DB va chay `pnpm seed:demo`.
2. Login admin.
3. Tao va activate policy neu chua co active policy.
4. Chay SQL lay 2 rental completed cua `user01@mebike.local`.
5. Reset impact user01 ve 0.
6. Login user01, goi summary, expected 0.
7. Login admin, calculate `rentalId_1`.
8. Login user01, goi summary, expected 1 trip.
9. Login admin, calculate lai `rentalId_1`, expected `already_calculated = true`.
10. Login user01, goi summary, expected van 1 trip.
11. Login admin, calculate `rentalId_2`.
12. Login user01, goi summary, expected 2 trips va tong distance/co2.
13. Login admin, calculate lai `rentalId_1`.
14. Login user01, goi summary, expected van 2 trips, khong phai 3.
15. Doi chieu SQL summary voi response API.
16. Clear token, goi summary, expected 401.
17. Login admin, goi summary, expected 403.

## 20. Troubleshooting

### 20.1. Summary tra 0 du user co rental completed

Kiem tra rental da co impact chua:

```sql
SELECT
  r.id AS rental_id,
  r.status,
  eis.id AS impact_id
FROM "Rental" r
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC;
```

Neu `impact_id` null thi summary chua tinh rental do. Can chay calculate API cho rental.

### 20.2. Calculate tra 404 active policy not found

Can tao va activate policy:

```text
POST /environment/policies
PATCH /environment/policies/{policyId}/activate
```

### 20.3. Calculate tra 409 rental not completed

Rental do khong co status `COMPLETED`.

Lay rental khac bang:

```sql
SELECT r.id, r.status, r.duration, r.end_time
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC;
```

### 20.4. Summary cua user01 khong khop expected trong docs

Docs khong hardcode UUID va tong cuoi cung vi seed sinh UUID moi moi lan va DB co the da co impact cu.

Dung query nay lam source of truth:

```sql
SELECT
  COUNT(*) AS total_trips_counted,
  ROUND(COALESCE(SUM(eis.estimated_distance_km), 0), 2) AS total_estimated_distance_km,
  ROUND(COALESCE(SUM(eis.co2_saved), 0)) AS total_co2_saved
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = 'user01@mebike.local';
```

### 20.5. Calculate cung rentalId ma tao 2 rows

Khong nen xay ra. Kiem tra:

```sql
SELECT rental_id, COUNT(*) AS count
FROM environmental_impact_stats
GROUP BY rental_id
HAVING COUNT(*) > 1;
```

Ky vong:

```text
Khong co row nao
```

Neu co row, unique index hoac migration DB dang sai.

