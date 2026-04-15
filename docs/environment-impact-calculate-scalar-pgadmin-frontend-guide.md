# Environment Impact Calculate From Rental Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Muc tieu API:

- Tinh Environment Impact cho mot rental da `COMPLETED`.
- Lay rental duration, active environment policy, tinh estimated distance va CO2 saved theo cong thuc Phase 1.
- Luu ket qua vao `environmental_impact_stats`.
- Idempotent theo `rentalId`: goi lai nhieu lan khong tao trung record.
- Day la endpoint internal/worker. Hien tai duoc bao ve tam bang role `ADMIN` vi backend chua co internal API key middleware ro rang.
- API nay khong update `Rental`.
- API nay khong anh huong rental/payment flow.
- API nay khong trigger backfill/recalculation du lieu cu.
- API nay khong update summary table trong Phase 1.

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

## 2. Tai khoan test

Neu da chay `pnpm seed:demo`, dung admin demo:

```text
email: admin@mebike.local
password: Demo@123456
```

Login trong Scalar bang:

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

Ky vong:

- status `200`
- response co `data.accessToken`
- copy `accessToken` de authorize API admin/internal

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

1. Bam nut auth/security cua Scalar.
2. Chon bearer auth.
3. Paste token vao o token.
4. Khong them chu `Bearer` neu UI da tu them.

## 3. API can tich hop

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Role:

```text
ADMIN only tam thoi
```

Ly do:

- Endpoint nay ve nghiep vu la internal/worker.
- Codebase hien tai chua co internal API key middleware ro rang.
- Backend dang dung `requireAdminMiddleware` de test Phase 1 trong Scalar.

Header:

```http
Authorization: Bearer <admin_access_token>
```

Path param:

```text
rentalId: UUID
```

Request body:

```text
Khong co body trong Phase 1
```

## 4. Data active policy dung de test

Cong thuc Phase 1 can active policy. Dung dung data nay de co ket qua de tinh:

```json
{
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Y nghia:

- `average_speed_kmh = 12` km/h
- `co2_saved_per_km = 75` gCO2e/km
- `return_scan_buffer_minutes = 3` phut
- `confidence_factor = 0.85`
- `co2_saved` tong se duoc luu bang don vi `gCO2e`

### 4.1. Tao policy bang Scalar

Goi:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Ky vong:

- status `201`
- response co `status = "INACTIVE"`
- copy `id` cua policy vua tao

Response mau:

```json
{
  "id": "019d8f66-7eed-7414-8913-538768c91749",
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "co2_saved_per_km_unit": "gCO2e/km",
  "status": "INACTIVE",
  "active_from": null,
  "active_to": null,
  "formula_config": {
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "display_unit": "gCO2e",
    "formula_version": "PHASE_1_TIME_SPEED",
    "distance_source": "TIME_SPEED"
  },
  "created_at": "2026-04-15T04:20:00.000Z",
  "updated_at": "2026-04-15T04:20:00.000Z"
}
```

### 4.2. Activate policy bang Scalar

Goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Vi du:

```text
PATCH /environment/policies/019d8f66-7eed-7414-8913-538768c91749/activate
```

Khong co body.

Ky vong:

- status `200`
- response co `status = "ACTIVE"`
- `active_to = null`

### 4.3. Check active policy

Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- response la policy dang `ACTIVE`
- `co2_saved_per_km_unit = "gCO2e/km"`
- `formula_config.display_unit = "gCO2e"`
- `formula_config.formula_version = "PHASE_1_TIME_SPEED"`
- `formula_config.distance_source = "TIME_SPEED"`

## 5. Data rental COMPLETED dung de test

API chi tinh cho rental co:

```text
status = COMPLETED
```

Lay rental thật tu DB bang pgAdmin:

```sql
SELECT r.id, r.user_id, r.duration, r.start_time, r.end_time, r.status
FROM "Rental" r
LEFT JOIN environmental_impact_stats eis
  ON eis.rental_id = r.id
WHERE r.status = 'COMPLETED'
  AND eis.id IS NULL
ORDER BY r.end_time DESC NULLS LAST, r.start_time DESC
LIMIT 10;
```

Chon mot row va copy `id` lam `rentalId`.

Neu muon test dung case mau `duration = 23`, query:

```sql
SELECT r.id, r.user_id, r.duration, r.start_time, r.end_time, r.status
FROM "Rental" r
LEFT JOIN environmental_impact_stats eis
  ON eis.rental_id = r.id
WHERE r.status = 'COMPLETED'
  AND r.duration = 23
  AND eis.id IS NULL
ORDER BY r.end_time DESC NULLS LAST, r.start_time DESC
LIMIT 10;
```

Neu khong co rental `duration = 23`, dung rental bat ky co `status = COMPLETED`. Ket qua CO2 se khac tuy duration.

## 6. Test calculate lan dau trong Scalar

Goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Vi du:

```text
POST /internal/environment/calculate-from-rental/019d8e43-e1e9-7426-81f0-a7427d236c7b
```

Khong co body.

Response mau voi rental co `duration = 130`:

```json
{
  "id": "019d8f68-ab90-7e99-8f66-ad4af3c01809",
  "user_id": "019d8e43-e079-793d-a939-4300547666ec",
  "rental_id": "019d8e43-e1e9-7426-81f0-a7427d236c7b",
  "policy_id": "019d8f66-7eed-7414-8913-538768c91749",
  "estimated_distance_km": 25.4,
  "co2_saved": 1619,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "policy_id": "019d8f66-7eed-7414-8913-538768c91749",
    "policy_name": "Default Environment Policy v1",
    "average_speed_kmh": 12,
    "co2_saved_per_km": 75,
    "co2_saved_per_km_unit": "gCO2e/km",
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "raw_rental_minutes": 130,
    "effective_ride_minutes": 127,
    "estimated_distance_km": 25.4,
    "co2_saved": 1619,
    "co2_saved_unit": "gCO2e",
    "distance_source": "TIME_SPEED",
    "formula_version": "PHASE_1_TIME_SPEED",
    "formula": "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)"
  },
  "calculated_at": "2026-04-15T04:31:34.809Z",
  "already_calculated": false
}
```

Ky vong:

- status `200`
- `already_calculated = false`
- tao moi 1 row trong `environmental_impact_stats`
- `co2_saved_unit = "gCO2e"`
- `policy_snapshot` co thong tin policy va cong thuc tai thoi diem tinh

## 7. Giai thich cong thuc Phase 1

Input tu policy:

```text
average_speed_kmh = policy.average_speed_kmh
co2_saved_per_km = policy.co2_saved_per_km
return_scan_buffer_minutes = policy.formula_config.return_scan_buffer_minutes hoac default 3
confidence_factor = policy.formula_config.confidence_factor hoac default 0.85
```

Input tu rental:

```text
raw_rental_minutes = Rental.duration neu co
raw_rental_minutes = floor((end_time - start_time) / 60000) neu duration null
raw_rental_minutes = max(0, raw_rental_minutes)
```

Cong thuc:

```text
effective_ride_minutes = max(0, raw_rental_minutes - return_scan_buffer_minutes)
estimated_distance_km = round((effective_ride_minutes / 60) * average_speed_kmh, 2)
co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)
```

Vi du voi response mau:

```text
raw_rental_minutes = 130
return_scan_buffer_minutes = 3
effective_ride_minutes = 127

estimated_distance_km = round((127 / 60) * 12, 2)
                      = 25.4

co2_saved = round(25.4 * 75 * 0.85)
          = round(1619.25)
          = 1619
```

Don vi:

```text
co2_saved_per_km = gCO2e/km
co2_saved = gCO2e
```

## 8. Test idempotency

Goi lai dung endpoint voi cung `rentalId`:

```text
POST /internal/environment/calculate-from-rental/019d8e43-e1e9-7426-81f0-a7427d236c7b
```

Ky vong:

- status `200`
- `id` giong lan dau
- `rental_id` giong lan dau
- khong tao record moi
- `already_calculated = true`

Response mau:

```json
{
  "id": "019d8f68-ab90-7e99-8f66-ad4af3c01809",
  "user_id": "019d8e43-e079-793d-a939-4300547666ec",
  "rental_id": "019d8e43-e1e9-7426-81f0-a7427d236c7b",
  "policy_id": "019d8f66-7eed-7414-8913-538768c91749",
  "estimated_distance_km": 25.4,
  "co2_saved": 1619,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "policy_id": "019d8f66-7eed-7414-8913-538768c91749",
    "policy_name": "Default Environment Policy v1",
    "average_speed_kmh": 12,
    "co2_saved_per_km": 75,
    "co2_saved_per_km_unit": "gCO2e/km",
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "raw_rental_minutes": 130,
    "effective_ride_minutes": 127,
    "estimated_distance_km": 25.4,
    "co2_saved": 1619,
    "co2_saved_unit": "gCO2e",
    "distance_source": "TIME_SPEED",
    "formula_version": "PHASE_1_TIME_SPEED",
    "formula": "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)"
  },
  "calculated_at": "2026-04-15T04:31:34.809Z",
  "already_calculated": true
}
```

Luu y frontend:

- Neu `already_calculated = true`, UI nen hieu day la record da co.
- Khong hien loi khi goi lai endpoint.
- Khong can retry de tao moi record.

## 9. Error cases can handle tren frontend

### 9.1. Chua login

Khong gui token, goi:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
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

- redirect login hoac yeu cau dang nhap lai
- xoa token het han neu can

### 9.2. Khong phai admin

Login user/staff/agency roi goi API nay.

Ky vong:

```text
403
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

- an action calculate Environment Impact voi role khong phai `ADMIN`
- neu user truy cap truc tiep, hien no-permission state

### 9.3. rentalId khong phai UUID

Goi:

```text
POST /internal/environment/calculate-from-rental/not-a-uuid
```

Ky vong:

```text
400
```

Response mau:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR",
    "issues": [
      {
        "path": "rentalId",
        "message": "...",
        "code": "..."
      }
    ]
  }
}
```

Frontend action:

- khong goi API neu rental id rong/invalid
- hien validation/no-data state trong admin UI

### 9.4. Rental khong ton tai

Goi voi UUID hop le nhung khong co trong DB.

Ky vong:

```text
404
```

Response mau:

```json
{
  "error": "Rental not found",
  "details": {
    "code": "ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND"
  }
}
```

Frontend action:

- refetch rental list/detail
- hien "Rental not found"

### 9.5. Rental chua COMPLETED

Goi voi rental `RENTED` hoac `CANCELLED`.

Ky vong:

```text
409
```

Response mau:

```json
{
  "error": "Rental must be completed before calculating environment impact",
  "details": {
    "code": "ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED"
  }
}
```

Frontend action:

- chi hien action calculate cho rental co `status = COMPLETED`
- neu bi 409, hien message ro rang va refetch rental detail

### 9.6. Khong co active environment policy

Tat ca policy dang `INACTIVE` hoac khong co row active hop le.

Ky vong:

```text
404
```

Response mau:

```json
{
  "error": "No active environment policy found",
  "details": {
    "code": "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND"
  }
}
```

Frontend action:

- hien empty/config-required state
- dieu huong admin sang Environment Policy screen de tao/activate policy
- khong retry calculate lien tuc

### 9.7. DB error hoac loi server

Ky vong:

```text
500
```

Frontend action:

- hien toast/thong bao loi chung
- cho retry thu cong
- khong tao local fake impact record

## 10. Kiem tra trong pgAdmin

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

### 10.1. Kiem tra active policy

```sql
SELECT id, name, status, average_speed_kmh, co2_saved_per_km, formula_config
FROM environmental_impact_policies
WHERE status = 'ACTIVE';
```

Ky vong co 1 row active:

```text
name = Default Environment Policy v1
status = ACTIVE
average_speed_kmh = 12.00
co2_saved_per_km = 75.0000
formula_config.return_scan_buffer_minutes = 3
formula_config.confidence_factor = 0.85
```

### 10.2. Kiem tra rental

```sql
SELECT id, user_id, duration, start_time, end_time, status
FROM "Rental"
WHERE id = '<rental-id>';
```

Ky vong:

```text
status = COMPLETED
duration co gia tri hoac end_time != null
```

### 10.3. Kiem tra impact sau khi calculate

```sql
SELECT id, user_id, rental_id, policy_id, estimated_distance_km, co2_saved, policy_snapshot, calculated_at
FROM environmental_impact_stats
WHERE rental_id = '<rental-id>';
```

Ky vong:

- co 1 row
- `user_id` trung voi rental user
- `rental_id` trung voi rental da test
- `policy_id` trung voi active policy tai thoi diem tinh
- `estimated_distance_km` dung cong thuc
- `co2_saved` la gram CO2e
- `policy_snapshot` co formula input/output

### 10.4. Kiem tra khong tao trung

```sql
SELECT rental_id, COUNT(*)
FROM environmental_impact_stats
GROUP BY rental_id
HAVING COUNT(*) > 1;
```

Expected:

```text
Khong co row nao
```

Kiem tra rieng rental vua test:

```sql
SELECT rental_id, COUNT(*)
FROM environmental_impact_stats
WHERE rental_id = '<rental-id>'
GROUP BY rental_id;
```

Expected:

```text
count = 1
```

### 10.5. Tao active policy co id co dinh bang SQL neu can

Chi dung trong local/dev khi can setup nhanh.

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
  'Default Environment Policy v1',
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

## 11. Frontend contract co the dung

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

export type EnvironmentImpact = {
  id: string;
  user_id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  policy_snapshot: EnvironmentImpactPolicySnapshot;
  calculated_at: string;
  already_calculated: boolean;
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
```

## 12. Goi API tu frontend

Vi du voi `fetch`:

```ts
export async function calculateEnvironmentImpactFromRental(
  baseUrl: string,
  token: string,
  rentalId: string,
): Promise<EnvironmentImpact> {
  const response = await fetch(
    `${baseUrl}/internal/environment/calculate-from-rental/${rentalId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw body as ServerErrorResponse;
  }

  return body as EnvironmentImpact;
}
```

Vi du handle error:

```ts
try {
  const impact = await calculateEnvironmentImpactFromRental(
    apiBaseUrl,
    accessToken,
    rentalId,
  );

  setImpact(impact);

  if (impact.already_calculated) {
    showToast("Environment impact already calculated for this rental.");
  } else {
    showToast("Environment impact calculated.");
  }
} catch (error) {
  const body = error as ServerErrorResponse;

  if (body.details?.code === "ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND") {
    showToast("Rental not found.");
    refetchRental();
    return;
  }

  if (body.details?.code === "ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED") {
    showToast("Rental must be completed before calculating environment impact.");
    refetchRental();
    return;
  }

  if (body.details?.code === "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND") {
    showToast("No active environment policy found.");
    return;
  }

  if (body.details?.code === "VALIDATION_ERROR") {
    showToast("Invalid rental id.");
    return;
  }

  if (body.details?.code === "UNAUTHORIZED") {
    showToast("You do not have permission to calculate environment impact.");
    return;
  }

  showToast("Could not calculate environment impact.");
}
```

## 13. Suggested UI cho admin/frontend

Man rental detail hoac admin action co the co:

- Button: `Calculate environment impact`
- Chi hien button khi rental `status = COMPLETED`
- Disable button khi request dang loading
- Sau success, hien impact summary:
  - Estimated distance
  - CO2 saved
  - Unit
  - Formula version
  - Policy name
  - Calculated at
  - Already calculated flag neu can

Copy text ngan co the dung:

```text
Calculate environment impact
```

```text
Environment impact calculated.
```

```text
Environment impact already calculated for this rental.
```

```text
No active environment policy found.
```

```text
Rental must be completed before calculating environment impact.
```

Field hien thi:

| UI label | API field | Unit / note |
| --- | --- | --- |
| Estimated distance | `estimated_distance_km` | km |
| CO2 saved | `co2_saved` | use `co2_saved_unit` |
| CO2 unit | `co2_saved_unit` | `gCO2e` |
| Policy | `policy_snapshot.policy_name` | snapshot at calculation time |
| Average speed | `policy_snapshot.average_speed_kmh` | km/h |
| CO2 factor | `policy_snapshot.co2_saved_per_km` | use `co2_saved_per_km_unit` |
| Raw rental minutes | `policy_snapshot.raw_rental_minutes` | minutes |
| Effective ride minutes | `policy_snapshot.effective_ride_minutes` | minutes |
| Formula version | `policy_snapshot.formula_version` | `PHASE_1_TIME_SPEED` |
| Distance source | `policy_snapshot.distance_source` | `TIME_SPEED` |
| Calculated at | `calculated_at` | datetime |

## 14. Important frontend notes

- Endpoint path khong co `/v1`.
- Endpoint la internal/admin, khong goi tu mobile user public flow.
- Khong can request body.
- Khong hardcode policy id.
- Khong hardcode formula input tu frontend; backend lay active policy.
- Khong tu dong retry lien tuc khi loi active policy missing.
- Neu `already_calculated = true`, coi nhu success.
- `policy_snapshot` la source of truth de render impact da tinh.
- Neu policy sau nay thay doi, impact cu van giu snapshot cu.
- `co2_saved` dang la gram CO2e, khong phai kg.
- Neu muon hien kg tren UI, frontend tu format display, nhung giu raw value la gram.

Vi du format:

```ts
export function formatCo2Saved(value: number, unit: "gCO2e") {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kgCO2e`;
  }

  return `${Math.round(value)} ${unit}`;
}
```

## 15. Checklist test nhanh

1. Chay backend va mo Scalar.
2. Login admin lay token.
3. Set bearer token trong Scalar.
4. Tao policy bang `POST /environment/policies`.
5. Activate policy bang `PATCH /environment/policies/{policyId}/activate`.
6. Check `GET /environment/policies/active` tra `200`.
7. Vao pgAdmin query rental `COMPLETED` chua co impact.
8. Copy `rental.id`.
9. Goi `POST /internal/environment/calculate-from-rental/{rentalId}`.
10. Confirm status `200`.
11. Confirm `already_calculated = false`.
12. Confirm `co2_saved_unit = "gCO2e"`.
13. Confirm `policy_snapshot.formula_version = "PHASE_1_TIME_SPEED"`.
14. Vao pgAdmin query `environmental_impact_stats` theo `rental_id`.
15. Confirm co 1 row.
16. Goi lai cung API voi cung `rentalId`.
17. Confirm status `200`.
18. Confirm `already_calculated = true`.
19. Confirm `id` giong lan dau.
20. Confirm query duplicate khong tra row nao.
21. Test invalid UUID -> `400`.
22. Test missing rental -> `404`.
23. Test rental `RENTED` -> `409`.
24. Test khong co active policy -> `404`.
25. Test clear token -> `401`.
26. Test non-admin token -> `403`.

## 16. Business boundaries

API nay chi lam:

- doc rental
- doc existing impact
- doc active policy
- tinh impact Phase 1
- insert `environmental_impact_stats`
- tra impact record

API nay khong lam:

- khong update `Rental`
- khong update payment
- khong update reservation
- khong update summary table
- khong trigger recalculation du lieu cu
- khong sua policy
- khong tao policy
- khong activate policy

## 17. Troubleshooting

### 17.1. Scalar khong thay endpoint

Kiem tra:

```text
http://localhost:4000/docs/openapi.json
```

Tim:

```text
/internal/environment/calculate-from-rental/{rentalId}
```

Neu khong co:

- build lai `packages/shared`
- restart backend

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm dev:build
```

### 17.2. Tra 404 "No active environment policy found"

Kiem tra active policy:

```sql
SELECT id, name, status, active_from, active_to
FROM environmental_impact_policies
WHERE status = 'ACTIVE';
```

Policy hop le khi:

```text
status = ACTIVE
active_from IS NULL OR active_from <= now()
active_to IS NULL OR active_to > now()
```

### 17.3. Tra 409 rental chua completed

Kiem tra rental:

```sql
SELECT id, status
FROM "Rental"
WHERE id = '<rental-id>';
```

Chi rental `COMPLETED` moi duoc tinh.

### 17.4. Goi lai ma tao trung row

Khong nen xay ra vi DB co unique index tren `rental_id`.

Kiem tra:

```sql
SELECT rental_id, COUNT(*)
FROM environmental_impact_stats
GROUP BY rental_id
HAVING COUNT(*) > 1;
```

Expected:

```text
Khong co row nao
```
