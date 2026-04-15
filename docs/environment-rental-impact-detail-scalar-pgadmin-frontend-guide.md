# Environment Rental Impact Detail Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
GET /environment/me/rentals/{rentalId}
```

Muc tieu API:

- User xem chi tiet Environment Impact cua mot rental cu the.
- API chi doc 1 row tu `environmental_impact_stats`.
- API filter bat buoc theo ca `rental_id = rentalId` va `user_id = currentUser.userId`.
- API khong tinh moi impact.
- API khong tao row impact.
- API khong sua DB.
- API khong query Rental de tu tinh impact.
- Neu rental `COMPLETED` nhung chua duoc calculate, API tra `404`.
- Neu rental thuoc user khac, API cung tra `404` de khong leak rental co ton tai hay khong.
- Client khong truyen `userId`; backend lay user tu access token.

Quan trong:

```text
Endpoint nay khong co prefix /v1.
Dung dung path: /environment/me/rentals/{rentalId}
```

## 1. Chuan bi moi truong

Chay backend chinh trong `apps/server`, backend nay la service dang co Scalar:

```bash
cd D:\do_an_3\MeBike

docker compose -f apps/server/compose.dev.yml up -d db redis pgadmin

cd D:\do_an_3\MeBike\apps\server
pnpm prisma migrate deploy
pnpm exec prisma generate

cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm dev:build
```

Mo:

- Scalar: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- pgAdmin: `http://localhost:5050/browser/`

Neu can du lieu demo:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm seed:demo
```

Neu muon test sach tu dau:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm prisma migrate reset --force
pnpm seed:demo
```

## 2. Tai khoan seed demo that

Tat ca account demo duoi day dung password:

```text
Demo@123456
```

Tai khoan can dung:

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

Luu y ve data seed:

- `email` va `password` o tren la data that co dinh trong `seed-demo.ts`.
- `user_id`, `rental_id`, `policy_id`, `impact_id` duoc tao bang `uuidv7()`.
- Moi lan `migrate reset` hoac chay lai seed, UUID se thay doi.
- Khong hardcode UUID trong frontend.
- Luon lay UUID moi bang SQL trong pgAdmin theo section 10.

## 3. API lien quan trong flow test

### 3.1. Login

```text
POST /v1/auth/login
```

Body user:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Body admin:

```json
{
  "email": "admin@mebike.local",
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

### 3.2. Tao policy de co cong thuc calculate

Dung admin token:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Rental Impact Detail Test Policy",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Ky vong:

- status `201`
- response `status = "INACTIVE"`
- copy `id` lam `policyId`

### 3.3. Activate policy

Dung admin token:

```text
PATCH /environment/policies/{policyId}/activate
```

Khong co body.

Ky vong:

- status `200`
- response `status = "ACTIVE"`
- `active_to = null`

Verify:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- `average_speed_kmh = 12`
- `co2_saved_per_km = 75`
- `co2_saved_per_km_unit = "gCO2e/km"`
- `formula_config.display_unit = "gCO2e"`
- `formula_config.formula_version = "PHASE_1_TIME_SPEED"`
- `formula_config.distance_source = "TIME_SPEED"`

### 3.4. Calculate impact cho rental completed

Dung admin token:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Khong co body.

Ky vong lan dau:

```json
{
  "id": "...",
  "user_id": "...",
  "rental_id": "<rentalId>",
  "policy_id": "<policyId>",
  "estimated_distance_km": 21.4,
  "co2_saved": 1364,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "policy_id": "<policyId>",
    "policy_name": "Rental Impact Detail Test Policy",
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
  "calculated_at": "...",
  "already_calculated": false
}
```

Neu goi lai cung `rentalId`:

```json
{
  "rental_id": "<rentalId>",
  "already_calculated": true
}
```

### 3.5. API detail moi cho frontend

Dung user token:

```text
GET /environment/me/rentals/{rentalId}
```

Role hien tai:

```text
Authenticated USER only
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
Khong co query params
```

Path params:

| Param | Type | Rule |
| --- | --- | --- |
| `rentalId` | UUID | Bat buoc la UUID hop le |

## 4. Cong thuc Phase 1 de tinh expected value

Dung active policy test khuyen nghi:

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
raw_rental_minutes = 110
return_scan_buffer_minutes = 3
effective_ride_minutes = 107

estimated_distance_km = round((107 / 60) * 12, 2)
                      = 21.40

co2_saved = round(21.40 * 75 * 0.85)
          = 1364
```

Don vi:

```text
estimated_distance_km = km
co2_saved_per_km = gCO2e/km
co2_saved = gCO2e
```

## 5. Response contract cua API detail

Success:

```ts
export type EnvironmentImpactPolicySnapshot = {
  policy_id: string;
  policy_name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: "gCO2e/km";
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  distance_source: "TIME_SPEED";
  formula_version: "PHASE_1_TIME_SPEED";
  formula?: string;
};

export type EnvironmentImpactDetail = {
  id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  raw_rental_minutes: number | null;
  effective_ride_minutes: number | null;
  return_scan_buffer_minutes: number | null;
  average_speed_kmh: number | null;
  co2_saved_per_km: number | null;
  co2_saved_per_km_unit: "gCO2e/km" | null;
  confidence_factor: number | null;
  distance_source: "TIME_SPEED" | null;
  formula_version: "PHASE_1_TIME_SPEED" | null;
  policy_snapshot: EnvironmentImpactPolicySnapshot;
  calculated_at: string;
};

export type ServerErrorResponse = {
  error: string;
  details?: {
    code?: string;
    issues?: unknown[];
    [key: string]: unknown;
  };
};
```

Response mau:

```json
{
  "id": "019d9000-0000-7000-8000-000000000001",
  "rental_id": "019d9000-0000-7000-8000-000000000002",
  "policy_id": "019d9000-0000-7000-8000-000000000003",
  "estimated_distance_km": 21.4,
  "co2_saved": 1364,
  "co2_saved_unit": "gCO2e",
  "raw_rental_minutes": 110,
  "effective_ride_minutes": 107,
  "return_scan_buffer_minutes": 3,
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "co2_saved_per_km_unit": "gCO2e/km",
  "confidence_factor": 0.85,
  "distance_source": "TIME_SPEED",
  "formula_version": "PHASE_1_TIME_SPEED",
  "policy_snapshot": {
    "policy_id": "019d9000-0000-7000-8000-000000000003",
    "policy_name": "Rental Impact Detail Test Policy",
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
    "formula_version": "PHASE_1_TIME_SPEED",
    "formula": "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)"
  },
  "calculated_at": "2026-04-15T10:30:00.000Z"
}
```

Luu y cho frontend:

- Detail response khong tra `user_id`.
- `co2_saved` la gram CO2e, khong phai kg.
- Luon render kem `co2_saved_unit`.
- `estimated_distance_km` la km.
- Top-level fields nhu `raw_rental_minutes`, `confidence_factor`, `distance_source` duoc extract tu `policy_snapshot`.
- Neu data cu thieu field trong snapshot, backend co the tra `null` cho top-level field tu snapshot.
- `policy_snapshot` la source of truth cho impact da tinh tai thoi diem calculate.
- Neu policy active sau nay thay doi, impact cu van giu snapshot cu.

## 6. Flow test nhanh trong Scalar

### 6.1. Login user01

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

Copy `data.accessToken` cua user01.

### 6.2. Login admin

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

Copy `data.accessToken` cua admin.

### 6.3. Lay rentalId that trong pgAdmin

Chay SQL section 10.3 de lay rental completed cua `user01@mebike.local`.

Copy:

```text
rentalId = rental_id
expectedDistance = expected_distance_km
expectedCo2 = expected_co2_saved_g
```

### 6.4. Tao va activate policy neu chua co

Set admin token trong Scalar.

Kiem tra:

```text
GET /environment/policies/active
```

Neu `404`, tao policy:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Rental Impact Detail Test Policy",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Sau do activate:

```text
PATCH /environment/policies/{policyId}/activate
```

### 6.5. Goi detail truoc khi calculate

Set user01 token.

Goi:

```text
GET /environment/me/rentals/{rentalId}
```

Neu rental chua co impact, ky vong:

```text
404
```

Body:

```json
{
  "error": "Environment impact not found",
  "details": {
    "code": "ENVIRONMENT_IMPACT_NOT_FOUND"
  }
}
```

Day la dung business rule. API detail khong tu calculate.

### 6.6. Calculate rental bang admin

Set admin token.

Goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Ky vong:

- status `200`
- `rental_id = rentalId`
- `estimated_distance_km = expectedDistance`
- `co2_saved = expectedCo2`
- `co2_saved_unit = "gCO2e"`
- `already_calculated = false` neu lan dau

### 6.7. Goi detail sau khi calculate

Set user01 token.

Goi:

```text
GET /environment/me/rentals/{rentalId}
```

Ky vong:

- status `200`
- `rental_id = rentalId`
- `estimated_distance_km = expectedDistance`
- `co2_saved = expectedCo2`
- `co2_saved_unit = "gCO2e"`
- `policy_snapshot.co2_saved_unit = "gCO2e"`
- `policy_snapshot.formula_version = "PHASE_1_TIME_SPEED"`
- `distance_source = "TIME_SPEED"`

## 7. Error cases can test trong Scalar

### 7.1. Khong login

Clear bearer token.

```text
GET /environment/me/rentals/{rentalId}
```

Ky vong:

```text
401
```

Response mau:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

Frontend action:

- redirect login hoac refresh token.
- khong render stale detail nhu thanh cong.

### 7.2. Admin token bi chan voi route /me

Set admin token.

```text
GET /environment/me/rentals/{rentalId}
```

Ky vong hien tai theo middleware Environment `/me`:

```text
403
```

Response theo convention auth hien tai:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

Frontend action:

- Man hinh user Environment khong nen dung admin token.
- Route nay danh cho role `USER`.

### 7.3. rentalId khong phai UUID

Set user01 token.

```text
GET /environment/me/rentals/not-a-uuid
```

Ky vong:

```text
400
```

Response co:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR"
  }
}
```

Frontend action:

- validate rental id truoc khi goi API.
- neu route param rong/invalid, dieu huong ve history/list.

### 7.4. Rental completed nhung chua calculate

Lay rental completed chua co impact bang SQL section 10.4.

Set user01 token.

```text
GET /environment/me/rentals/{uncalculatedRentalId}
```

Ky vong:

```text
404
```

Body:

```json
{
  "error": "Environment impact not found",
  "details": {
    "code": "ENVIRONMENT_IMPACT_NOT_FOUND"
  }
}
```

Frontend action:

- hien empty state trong detail:

```text
Environment impact for this trip is not available yet.
```

- khong goi calculate tu user app.

### 7.5. Rental thuoc user khac

1. Dung admin token calculate rental cua `user02`.
2. Set token `user01`.
3. Goi detail bang `rentalId` cua user02.

```text
GET /environment/me/rentals/{rentalIdUser02}
```

Ky vong:

```text
404
```

Body:

```json
{
  "error": "Environment impact not found",
  "details": {
    "code": "ENVIRONMENT_IMPACT_NOT_FOUND"
  }
}
```

Ly do:

- Backend filter ca `rental_id` va `user_id`.
- Khong tra `403` de tranh leak thong tin rental cua user khac co ton tai.

### 7.6. UUID hop le nhung rental/impact khong ton tai

Set user01 token.

```text
GET /environment/me/rentals/018fa200-0000-7000-8000-000000000404
```

Ky vong:

```text
404
```

Body:

```json
{
  "error": "Environment impact not found",
  "details": {
    "code": "ENVIRONMENT_IMPACT_NOT_FOUND"
  }
}
```

### 7.7. DB error hoac loi server

Ky vong:

```text
500
```

Frontend action:

- hien toast/thong bao loi chung.
- cho retry thu cong.
- khong tao fake impact record o local state.

## 8. Business rules frontend can nho

- Detail la man doc 1 impact record da tinh.
- Detail khong phai calculate endpoint.
- Detail khong phai rental detail endpoint.
- Detail khong join Rental trong Phase 1.
- Rental completed nhung chua calculate thi detail `404`.
- Rental cua user khac thi detail `404`, khong phai `403`.
- User app khong truyen `userId`.
- User app khong tu tinh CO2 saved.
- `co2_saved` la gram CO2e.
- `estimated_distance_km` la km.
- Cac metadata cong thuc duoc lay tu `policy_snapshot`.
- `policy_snapshot` co the khac active policy hien tai neu policy da thay doi sau luc calculate.

## 9. Data seed demo va gia tri expected

Seed demo co cac account co dinh:

```text
admin@mebike.local / Demo@123456
user01@mebike.local / Demo@123456
user02@mebike.local / Demo@123456
```

Trong `seed-demo.ts`, completed rentals duoc tao cho cac user demo. UUID khong co dinh, nhung voi policy test:

```text
average_speed_kmh = 12
co2_saved_per_km = 75
return_scan_buffer_minutes = 3
confidence_factor = 0.85
```

SQL section 10.3 se tu tinh:

```text
expected_distance_km
expected_co2_saved_g
raw_rental_minutes
effective_ride_minutes
```

Vi du neu rental co `duration = 110`:

```text
raw_rental_minutes = 110
effective_ride_minutes = 107
expected_distance_km = 21.40
expected_co2_saved_g = 1364
```

Vi du neu rental co `duration = 20`:

```text
raw_rental_minutes = 20
effective_ride_minutes = 17
expected_distance_km = 3.40
expected_co2_saved_g = 217
```

Vi du neu rental co `duration = 120`:

```text
raw_rental_minutes = 120
effective_ride_minutes = 117
expected_distance_km = 23.40
expected_co2_saved_g = 1492
```

## 10. pgAdmin SQL baseline

Mo pgAdmin:

```text
http://localhost:5050/browser/
```

Tai khoan pgAdmin mac dinh trong compose:

```text
email: admin@example.com
password: adminadmin
```

Database compose dev:

```text
host: db
database: mebike_dev
user: mebike
password: mebike
```

Neu pgAdmin chay ngoai compose network, host co the la:

```text
localhost
```

### 10.1. Lay user demo

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

### 10.2. Kiem tra active policy

```sql
SELECT
  id,
  name,
  average_speed_kmh,
  co2_saved_per_km,
  status,
  active_from,
  active_to,
  formula_config,
  created_at,
  updated_at
FROM environmental_impact_policies
WHERE status = 'ACTIVE'
ORDER BY active_from DESC NULLS LAST, updated_at DESC, created_at DESC;
```

Neu query rong:

- `GET /environment/policies/active` tra `404`.
- `POST /internal/environment/calculate-from-rental/{rentalId}` tra `404 ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND`.
- Can tao + activate policy truoc khi calculate.

### 10.3. Lay rental completed cua user01 kem expected value

Dung query nay sau moi lan seed lai:

```sql
SELECT
  u.id AS user_id,
  u.email,
  r.id AS rental_id,
  r.status,
  r.duration AS raw_rental_minutes,
  GREATEST(COALESCE(r.duration, 0) - 3, 0) AS effective_ride_minutes,
  r.start_time,
  r.end_time,
  ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) AS expected_distance_km,
  ROUND(
    ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) * 75 * 0.85
  ) AS expected_co2_saved_g,
  eis.id AS existing_impact_id
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC NULLS LAST, r.start_time DESC
LIMIT 10;
```

Lay cac gia tri:

```text
userId = user_id
rentalId = rental_id
rawRentalMinutes = raw_rental_minutes
effectiveRideMinutes = effective_ride_minutes
expectedDistance = expected_distance_km
expectedCo2 = expected_co2_saved_g
existingImpactId = existing_impact_id
```

Neu `existing_impact_id` la `null`, rental do chua calculate.

### 10.4. Lay rental completed chua calculate cua user01

Dung query nay de test case detail 404 truoc calculate:

```sql
SELECT
  u.id AS user_id,
  u.email,
  r.id AS rental_id,
  r.status,
  r.duration AS raw_rental_minutes,
  GREATEST(COALESCE(r.duration, 0) - 3, 0) AS effective_ride_minutes,
  r.start_time,
  r.end_time,
  ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) AS expected_distance_km,
  ROUND(
    ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) * 75 * 0.85
  ) AS expected_co2_saved_g
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
  AND eis.id IS NULL
ORDER BY r.end_time DESC NULLS LAST, r.start_time DESC
LIMIT 10;
```

### 10.5. Lay rental completed cua user02 de test user isolation

```sql
SELECT
  u.id AS user_id,
  u.email,
  r.id AS rental_id,
  r.status,
  r.duration AS raw_rental_minutes,
  GREATEST(COALESCE(r.duration, 0) - 3, 0) AS effective_ride_minutes,
  r.start_time,
  r.end_time,
  ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) AS expected_distance_km,
  ROUND(
    ROUND((GREATEST(COALESCE(r.duration, 0) - 3, 0)::numeric / 60) * 12, 2) * 75 * 0.85
  ) AS expected_co2_saved_g,
  eis.id AS existing_impact_id
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE u.email = 'user02@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC NULLS LAST, r.start_time DESC
LIMIT 10;
```

### 10.6. Xem impact record theo rentalId

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
WHERE rental_id = '<rental-id>'::uuid;
```

So sanh voi API detail:

- `id` = `id`
- `rental_id` = `rental_id`
- `policy_id` = `policy_id`
- `estimated_distance_km` = `estimated_distance_km`
- `co2_saved` = `co2_saved`
- `calculated_at` = `calculated_at`
- `policy_snapshot.raw_rental_minutes` = `raw_rental_minutes`
- `policy_snapshot.effective_ride_minutes` = `effective_ride_minutes`
- `policy_snapshot.return_scan_buffer_minutes` = `return_scan_buffer_minutes`
- `policy_snapshot.average_speed_kmh` = `average_speed_kmh`
- `policy_snapshot.co2_saved_per_km` = `co2_saved_per_km`
- `policy_snapshot.confidence_factor` = `confidence_factor`
- `policy_snapshot.distance_source` = `distance_source`
- `policy_snapshot.formula_version` = `formula_version`

### 10.7. Kiem tra current user co dung chu record

```sql
SELECT
  eis.id,
  eis.user_id,
  u.email,
  eis.rental_id
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE eis.rental_id = '<rental-id>'::uuid
  AND u.email = 'user01@mebike.local';
```

Ky vong:

- Neu rental do cua `user01`, query tra 1 row.
- Neu rental do cua user khac, query rong.

### 10.8. Kiem tra user isolation truc tiep bang SQL

```sql
SELECT
  u.email,
  eis.rental_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.calculated_at
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email IN ('user01@mebike.local', 'user02@mebike.local')
ORDER BY u.email, eis.calculated_at DESC;
```

Ky vong:

- Token `user01` chi xem duoc rows email `user01@mebike.local`.
- Token `user02` chi xem duoc rows email `user02@mebike.local`.

### 10.9. Reset impact rieng cho user01 de test sach

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

### 10.10. Tao active policy co id co dinh bang SQL neu can setup nhanh

Chi dung trong local/dev khi can setup nhanh va khong muon tao policy qua Scalar.

```sql
UPDATE environmental_impact_policies
SET status = 'INACTIVE',
    active_to = NOW(),
    updated_at = NOW()
WHERE status = 'ACTIVE';

INSERT INTO environmental_impact_policies (
  id,
  name,
  average_speed_kmh,
  co2_saved_per_km,
  status,
  active_from,
  active_to,
  formula_config,
  created_at,
  updated_at
)
VALUES (
  '018fa200-0000-7000-8000-000000000101'::uuid,
  'Rental Impact Detail Test Policy',
  12.00,
  75.0000,
  'ACTIVE'::"AccountStatus",
  NOW(),
  NULL,
  '{
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "display_unit": "gCO2e",
    "formula_version": "PHASE_1_TIME_SPEED",
    "distance_source": "TIME_SPEED"
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    average_speed_kmh = EXCLUDED.average_speed_kmh,
    co2_saved_per_km = EXCLUDED.co2_saved_per_km,
    status = 'ACTIVE'::"AccountStatus",
    active_from = NOW(),
    active_to = NULL,
    formula_config = EXCLUDED.formula_config,
    updated_at = NOW();
```

## 11. Frontend integration sample

### 11.1. Fetch function

```ts
export type EnvironmentImpactPolicySnapshot = {
  policy_id: string;
  policy_name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: "gCO2e/km";
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  raw_rental_minutes: number;
  effective_ride_minutes: number;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  distance_source: "TIME_SPEED";
  formula_version: "PHASE_1_TIME_SPEED";
  formula?: string;
};

export type EnvironmentImpactDetail = {
  id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  raw_rental_minutes: number | null;
  effective_ride_minutes: number | null;
  return_scan_buffer_minutes: number | null;
  average_speed_kmh: number | null;
  co2_saved_per_km: number | null;
  co2_saved_per_km_unit: "gCO2e/km" | null;
  confidence_factor: number | null;
  distance_source: "TIME_SPEED" | null;
  formula_version: "PHASE_1_TIME_SPEED" | null;
  policy_snapshot: EnvironmentImpactPolicySnapshot;
  calculated_at: string;
};

export type ServerErrorResponse = {
  error: string;
  details?: {
    code?: string;
    issues?: Array<{
      path?: string;
      message: string;
      code?: string;
      expected?: unknown;
      received?: unknown;
    }>;
    [key: string]: unknown;
  };
};

export async function getMyRentalEnvironmentImpact(
  baseUrl: string,
  token: string,
  rentalId: string,
): Promise<EnvironmentImpactDetail> {
  const response = await fetch(
    `${baseUrl}/environment/me/rentals/${rentalId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw body as ServerErrorResponse;
  }

  return body as EnvironmentImpactDetail;
}
```

### 11.2. Error handling example

```ts
try {
  const impact = await getMyRentalEnvironmentImpact(
    apiBaseUrl,
    accessToken,
    rentalId,
  );

  setImpact(impact);
} catch (error) {
  const body = error as ServerErrorResponse;

  if (body.details?.code === "ENVIRONMENT_IMPACT_NOT_FOUND") {
    setImpact(null);
    setEmptyReason("Environment impact for this trip is not available yet.");
    return;
  }

  if (body.details?.code === "VALIDATION_ERROR") {
    showToast("Invalid rental id.");
    navigateBackToHistory();
    return;
  }

  if (body.details?.code === "UNAUTHORIZED") {
    showToast("Please sign in again.");
    redirectToLogin();
    return;
  }

  showToast("Could not load environment impact.");
}
```

### 11.3. Format helpers

```ts
export function formatCo2Saved(value: number, unit: "gCO2e") {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kgCO2e`;
  }

  return `${Math.round(value)} ${unit}`;
}

export function formatDistanceKm(value: number) {
  return `${value.toLocaleString()} km`;
}

export function formatMinutes(value: number | null) {
  return value === null ? "-" : `${value} min`;
}

export function formatNullableNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toLocaleString()}${suffix}`;
}
```

## 12. UI mapping goi y

Man detail khi user bam mot trip trong Environment history nen dung:

| UI label | API field | Unit / note |
| --- | --- | --- |
| CO2 saved | `co2_saved` | use `co2_saved_unit`, raw unit la `gCO2e` |
| Estimated distance | `estimated_distance_km` | km |
| Calculated at | `calculated_at` | datetime |
| Raw rental minutes | `raw_rental_minutes` | minutes, nullable |
| Effective ride minutes | `effective_ride_minutes` | minutes, nullable |
| Return buffer | `return_scan_buffer_minutes` | minutes, nullable |
| Average speed | `average_speed_kmh` | km/h, nullable |
| CO2 factor | `co2_saved_per_km` | use `co2_saved_per_km_unit`, nullable |
| Confidence factor | `confidence_factor` | ratio 0-1, nullable |
| Distance source | `distance_source` | Phase 1: `TIME_SPEED`, nullable |
| Formula version | `formula_version` | Phase 1: `PHASE_1_TIME_SPEED`, nullable |
| Policy name | `policy_snapshot.policy_name` | snapshot at calculation time |

Suggested UI states:

Loading:

```text
Loading trip environment impact...
```

Empty 404:

```text
Environment impact for this trip is not available yet.
```

401:

```text
Your session has expired. Please sign in again.
```

403:

```text
This account cannot access user environment impact.
```

Generic error:

```text
Could not load environment impact. Please try again.
```

## 13. Quan he voi Environment history

Frontend flow khuyen nghi:

1. Goi `GET /environment/me/history`.
2. Render list trips da co impact.
3. Khi user bam item history, lay `item.rental_id`.
4. Goi:

```text
GET /environment/me/rentals/{item.rental_id}
```

5. Render detail.

Luu y:

- History chi tra subset field de list nhanh.
- Detail tra day du `policy_snapshot` va cac field top-level de render detail.
- Date filter cua history dung UTC boundary; xem `docs/environment-history-scalar-pgadmin-frontend-guide.md` section `Date Filter Timezone Rule`.
- Neu detail tra `404` cho item vua bam, co the do data bi xoa/reset trong dev, frontend nen refetch history.

## 14. Checklist test nhanh cho frontend

1. Chay backend va mo Scalar.
2. Chay `pnpm seed:demo` neu chua co data demo.
3. Login admin `admin@mebike.local`.
4. Login user `user01@mebike.local`.
5. Chay SQL section 10.1 lay user demo.
6. Kiem tra active policy bang `GET /environment/policies/active`.
7. Neu chua co active policy, tao + activate policy theo section 3.2 va 3.3.
8. Chay SQL section 10.4 lay rental completed chua calculate cua user01.
9. Set user01 token, goi detail truoc calculate, expected `404 ENVIRONMENT_IMPACT_NOT_FOUND`.
10. Set admin token, calculate rental bang `POST /internal/environment/calculate-from-rental/{rentalId}`.
11. Confirm calculate response `co2_saved_unit = "gCO2e"`.
12. Set user01 token, goi `GET /environment/me/rentals/{rentalId}`.
13. Confirm status `200`.
14. Confirm response `rental_id = rentalId`.
15. Confirm response `estimated_distance_km = expected_distance_km` tu SQL.
16. Confirm response `co2_saved = expected_co2_saved_g` tu SQL.
17. Confirm response `co2_saved_unit = "gCO2e"`.
18. Confirm response `policy_snapshot.co2_saved_unit = "gCO2e"`.
19. Confirm response `policy_snapshot.co2_saved_per_km_unit = "gCO2e/km"`.
20. Confirm response `distance_source = "TIME_SPEED"`.
21. Confirm response `formula_version = "PHASE_1_TIME_SPEED"`.
22. Doi chieu SQL section 10.6 voi response detail.
23. Test invalid UUID: `/environment/me/rentals/not-a-uuid` -> `400`.
24. Test clear token -> `401`.
25. Test admin token -> `403`.
26. Calculate rental cua user02.
27. Set token user01, goi detail rental user02 -> `404`.
28. Set token user02, goi detail rental user02 -> `200`.
29. Test UUID hop le nhung khong ton tai -> `404`.
30. Test completed rental chua calculate -> `404`.

## 15. Checklist code UI

- Khong hardcode UUID.
- Khong hardcode userId.
- Khong them `/v1` vao endpoint nay.
- Khong gui request body.
- Khong gui query params.
- Khong goi calculate API tu user app khi detail 404.
- Khong tu tinh CO2 saved tren frontend.
- Hien unit cho CO2 saved.
- Hien unit cho distance.
- Handle `null` cho metadata tu snapshot.
- Treat `404 ENVIRONMENT_IMPACT_NOT_FOUND` la empty/not-ready state, khong phai crash.
- Treat rental cua user khac la `404`, khong phai `403`.
- Neu token het han, handle `401`.
- Neu role khong dung, handle `403`.
- Neu user di tu history sang detail ma detail 404, refetch history.

## 16. Troubleshooting

### 16.1. Scalar khong thay endpoint moi

Kiem tra:

```text
http://localhost:4000/docs/openapi.json
```

Tim:

```text
/environment/me/rentals/{rentalId}
```

Neu khong co:

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm dev:build
```

Sau do refresh Scalar.

### 16.2. Detail tra 404 du rental completed

Kiem tra rental da co impact chua:

```sql
SELECT
  r.id AS rental_id,
  r.status,
  r.duration,
  eis.id AS impact_id
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN environmental_impact_stats eis ON eis.rental_id = r.id
WHERE u.email = 'user01@mebike.local'
  AND r.id = '<rental-id>'::uuid;
```

Neu `impact_id` la `null`, can calculate bang admin/internal endpoint.

### 16.3. Calculate tra 404 active policy not found

Kiem tra:

```sql
SELECT id, name, status, active_from, active_to
FROM environmental_impact_policies
ORDER BY created_at DESC;
```

Can co policy hop le:

```text
status = ACTIVE
active_from IS NULL OR active_from <= now()
active_to IS NULL OR active_to > now()
```

### 16.4. Detail user01 xem rental user02 ma tra 404

Day la dung. API khong leak data rental cua user khac.

Kiem tra bang SQL:

```sql
SELECT
  eis.rental_id,
  u.email
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE eis.rental_id = '<rental-id-user02>'::uuid;
```

Neu email la `user02@mebike.local`, token `user01` se phai nhan `404`.

### 16.5. Expected value khong khop

Kiem tra active policy tai thoi diem calculate:

```sql
SELECT id, name, average_speed_kmh, co2_saved_per_km, formula_config
FROM environmental_impact_policies
WHERE id = (
  SELECT policy_id
  FROM environmental_impact_stats
  WHERE rental_id = '<rental-id>'::uuid
);
```

Kiem tra snapshot:

```sql
SELECT policy_snapshot
FROM environmental_impact_stats
WHERE rental_id = '<rental-id>'::uuid;
```

Response detail phai theo `policy_snapshot`, khong phai active policy hien tai neu active policy da thay doi sau do.

## 17. Business boundaries

API detail chi lam:

- validate `rentalId` la UUID
- lay current user tu token
- query `environmental_impact_stats` theo `user_id` va `rental_id`
- format response detail
- tra `404` neu khong tim thay

API detail khong lam:

- khong query Rental de tinh
- khong trigger calculate
- khong tao impact
- khong update impact
- khong update Rental
- khong update policy
- khong tra data cua user khac
- khong nhan `userId` tu client

## 18. Lien ket voi cac guide Environment khac

Nen doc kem cac file:

- `docs/environment-summary-scalar-pgadmin-frontend-guide.md`
- `docs/environment-history-scalar-pgadmin-frontend-guide.md`
- `docs/environment-impact-calculate-scalar-pgadmin-frontend-guide.md`
- `docs/environment-active-policy-scalar-pgadmin-frontend-guide.md`

Flow frontend user app nen la:

```text
GET /environment/me/summary
GET /environment/me/history
GET /environment/me/rentals/{rentalId}
```

Flow admin/internal de tao data impact nen la:

```text
POST /environment/policies
PATCH /environment/policies/{policyId}/activate
POST /internal/environment/calculate-from-rental/{rentalId}
```
