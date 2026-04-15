# Environment Impact History Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
GET /environment/me/history
```

Muc tieu API:

- User xem lich su Environment Impact theo tung rental da duoc tinh.
- API chi doc tu bang `environmental_impact_stats`.
- API khong tinh moi impact.
- API khong tao row impact.
- API khong sua DB.
- Rental `COMPLETED` nhung chua chay calculate Environment Impact thi chua xuat hien trong history.
- Moi item trong history tuong ung voi 1 row trong `environmental_impact_stats`.
- User chi thay record co `user_id` bang user trong access token.
- Client khong truyen `userId`.

Quan trong:

```text
Endpoint nay khong co prefix /v1.
Dung dung path: /environment/me/history
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

## 2. Tai khoan test

Tat ca account demo dung password:

```text
Demo@123456
```

Admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

User 1:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

User 2:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Dang nhap trong Scalar bang:

```text
POST /v1/auth/login
```

Ky vong:

- status `200`
- response co `data.accessToken`
- copy `accessToken` de authorize API

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

## 3. Data that hien tai tren DB local nay

Luu y:

- Cac UUID ben duoi la data that da doc tu DB local hien tai.
- Neu reset DB hoac chay lai `pnpm seed:demo`, UUID se thay doi vi seed dung `uuidv7()`.
- Sau moi lan reset DB, hay chay SQL section 10 de lay UUID moi.

User IDs hien tai:

```text
admin@mebike.local  = 019d8fbb-563d-7dd8-bdb9-2e5b28d2d24f
user01@mebike.local = 019d8fbb-5644-7858-90b8-2cea9592be15
user02@mebike.local = 019d8fbb-5644-7858-90b8-2ceb7c23b17c
```

Trang thai Environment hien tai luc doc DB:

```text
environmental_impact_policies: 0 row
environmental_impact_stats: 0 row
```

Vi vay:

- `GET /environment/me/history` bang `user01` se tra list rong truoc khi calculate.
- Can tao + activate Environment Policy truoc khi goi calculate.

Rental completed chua calculate cua `user01`:

```text
rentalId_1 = 019d8fbb-585d-7ade-86ab-b86d9d04140a
duration = 110
start_time = 2026-04-26 15:45:00+00
end_time = 2026-04-26 17:35:00+00
expected estimated_distance_km = 21.40
expected co2_saved = 1364
raw_rental_minutes = 110
effective_ride_minutes = 107
```

Rental completed thu hai cua `user01`:

```text
rentalId_2 = 019d8fbb-585b-7547-a4eb-180d9b195352
duration = 20
start_time = 2026-04-15 07:40:00+00
end_time = 2026-04-15 08:00:00+00
expected estimated_distance_km = 3.40
expected co2_saved = 217
raw_rental_minutes = 20
effective_ride_minutes = 17
```

Rental completed cua `user02` de test user khac:

```text
rentalId_user02 = 019d8fbb-585d-7ade-86ab-b86e8314ab7b
duration = 120
start_time = 2026-04-27 16:46:00+00
end_time = 2026-04-27 18:46:00+00
expected estimated_distance_km = 23.40
expected co2_saved = 1492
raw_rental_minutes = 120
effective_ride_minutes = 117
```

## 4. API can tich hop

```text
GET /environment/me/history
```

Role:

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

| Param | Type | Default | Rule |
| --- | --- | --- | --- |
| `page` | integer | `1` | min `1` |
| `pageSize` | integer | `20` | min `1`, max `100` |
| `sortOrder` | enum | `desc` | `asc` hoac `desc` |
| `dateFrom` | ISO date/datetime | none | UTC lower bound cho `calculated_at` |
| `dateTo` | ISO date/datetime | none | UTC upper bound cho `calculated_at` |

Date note:

- Co the gui date-only: `2026-04-15`.
- Co the gui datetime: `2026-04-15T00:00:00.000Z`.
- Neu gui ca `dateFrom` va `dateTo`, `dateFrom <= dateTo`.

### 4.1. Date Filter Timezone Rule

Environment history filter theo UTC instant cua field `calculated_at`.

Business rule:

- Backend luu va filter thoi gian theo UTC.
- `calculated_at` la `TIMESTAMPTZ`, response tra ISO string, vi du `2026-04-15T10:30:00.000Z`.
- `dateFrom` va `dateTo` nhan ISO date hoac ISO datetime.
- ISO datetime co `Z` hoac timezone offset duoc backend dung dung instant da truyen.
- Date-only `YYYY-MM-DD` la UTC day, khong phai ngay Viet Nam.
- Backend khong tu cong/tru `+7` cho Viet Nam trong Environment Phase 1.

Backend interpretation cho date-only:

```text
dateFrom=2026-04-15 -> 2026-04-15T00:00:00.000Z
dateTo=2026-04-15   -> 2026-04-15T23:59:59.999Z
```

Neu frontend Viet Nam muon loc ngay `15/04/2026` theo gio Viet Nam, frontend phai convert local range `Asia/Saigon` sang UTC truoc khi goi API:

```text
Local range Asia/Saigon:
2026-04-15 00:00:00.000 +07:00
2026-04-15 23:59:59.999 +07:00

API query nen gui:
dateFrom=2026-04-14T17:00:00.000Z
dateTo=2026-04-15T16:59:59.999Z
```

Neu frontend gui:

```text
dateFrom=2026-04-15&dateTo=2026-04-15
```

Backend hieu la ngay `2026-04-15` theo UTC:

```text
2026-04-15T00:00:00.000Z den 2026-04-15T23:59:59.999Z
```

Khoang nay tuong duong:

```text
07:00 ngay 15/04/2026 den 06:59:59.999 ngay 16/04/2026 o Viet Nam
```

Frontend rule:

- Neu user chon ngay theo Viet Nam, convert local start/end sang UTC ISO string roi gui API.
- Khong gui date-only neu muon loc dung ngay Viet Nam.
- Chi gui date-only khi muon loc ngay UTC.

## 5. Response contract

Success:

```ts
export type EnvironmentImpactHistoryItem = {
  id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  distance_source: "TIME_SPEED" | null;
  raw_rental_minutes: number | null;
  effective_ride_minutes: number | null;
  calculated_at: string;
};

export type EnvironmentImpactHistoryResponse = {
  items: EnvironmentImpactHistoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
```

Response khi chua co data:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Response co data mau:

```json
{
  "items": [
    {
      "id": "019d8fc0-...",
      "rental_id": "019d8fbb-585d-7ade-86ab-b86d9d04140a",
      "policy_id": "019d8fbf-...",
      "estimated_distance_km": 21.4,
      "co2_saved": 1364,
      "co2_saved_unit": "gCO2e",
      "distance_source": "TIME_SPEED",
      "raw_rental_minutes": 110,
      "effective_ride_minutes": 107,
      "calculated_at": "2026-04-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Luu y:

- `co2_saved` la gram CO2e.
- `co2_saved_unit` luon la `"gCO2e"`.
- `estimated_distance_km` la km.
- `distance_source`, `raw_rental_minutes`, `effective_ride_minutes` lay tu `policy_snapshot`.
- Neu data cu thieu field trong snapshot, frontend phai handle `null`.

## 6. Flow test nhanh trong Scalar

### 6.1. Login user01

Goi:

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

Set bearer token bang `data.accessToken`.

### 6.2. Goi history khi chua co impact

Goi:

```text
GET /environment/me/history
```

Ky vong neu `environmental_impact_stats` dang rong:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

### 6.3. Login admin

Goi:

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

Set bearer token bang admin token.

### 6.4. Tao Environment Policy neu DB chua co policy

Goi:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "History Test Policy",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Ky vong:

- status `201`
- response `status = "INACTIVE"`
- copy `id` cua policy vua tao

Response mau:

```json
{
  "id": "<policyId>",
  "name": "History Test Policy",
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
  "created_at": "...",
  "updated_at": "..."
}
```

### 6.5. Activate policy

Goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Khong co body.

Ky vong:

- status `200`
- response `status = "ACTIVE"`
- `active_to = null`

Sau do verify:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- response la policy vua activate

### 6.6. Calculate rental completed cua user01

Van dung admin token.

Goi:

```text
POST /internal/environment/calculate-from-rental/019d8fbb-585d-7ade-86ab-b86d9d04140a
```

Ky vong:

```json
{
  "rental_id": "019d8fbb-585d-7ade-86ab-b86d9d04140a",
  "estimated_distance_km": 21.4,
  "co2_saved": 1364,
  "co2_saved_unit": "gCO2e",
  "already_calculated": false,
  "policy_snapshot": {
    "raw_rental_minutes": 110,
    "effective_ride_minutes": 107,
    "distance_source": "TIME_SPEED",
    "co2_saved_unit": "gCO2e"
  }
}
```

Luu y:

- `id`, `policy_id`, `calculated_at` la gia tri sinh ra theo thoi diem test.
- Neu calculate lai cung rental, expected `already_calculated = true`.
- DB van chi co 1 row cho rental do do unique index tren `environmental_impact_stats.rental_id`.

### 6.7. Goi lai history bang user01

Set bearer token cua `user01`.

Goi:

```text
GET /environment/me/history
```

Ky vong co 1 item:

```json
{
  "items": [
    {
      "rental_id": "019d8fbb-585d-7ade-86ab-b86d9d04140a",
      "estimated_distance_km": 21.4,
      "co2_saved": 1364,
      "co2_saved_unit": "gCO2e",
      "distance_source": "TIME_SPEED",
      "raw_rental_minutes": 110,
      "effective_ride_minutes": 107
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

## 7. Test pagination, sort, date filter

### 7.1. Tao record thu hai cho user01

Dung admin token, goi:

```text
POST /internal/environment/calculate-from-rental/019d8fbb-585b-7547-a4eb-180d9b195352
```

Ky vong:

```json
{
  "rental_id": "019d8fbb-585b-7547-a4eb-180d9b195352",
  "estimated_distance_km": 3.4,
  "co2_saved": 217,
  "co2_saved_unit": "gCO2e",
  "policy_snapshot": {
    "raw_rental_minutes": 20,
    "effective_ride_minutes": 17,
    "distance_source": "TIME_SPEED"
  }
}
```

### 7.2. Pagination

Set user01 token, goi:

```text
GET /environment/me/history?page=1&pageSize=1
```

Ky vong:

```json
{
  "items": [
    {
      "rental_id": "..."
    }
  ],
  "page": 1,
  "pageSize": 1,
  "totalItems": 2,
  "totalPages": 2
}
```

Goi page 2:

```text
GET /environment/me/history?page=2&pageSize=1
```

Ky vong:

- status `200`
- `page = 2`
- `pageSize = 1`
- `items.length = 1`
- `totalItems = 2`
- `totalPages = 2`

### 7.3. Sort desc

```text
GET /environment/me/history?sortOrder=desc
```

Ky vong:

- `calculated_at` giam dan.
- Record nao calculate sau se nam truoc.

### 7.4. Sort asc

```text
GET /environment/me/history?sortOrder=asc
```

Ky vong:

- `calculated_at` tang dan.
- Record nao calculate truoc se nam truoc.

### 7.5. Date filter bang UTC datetime

Dung khoang ngay quanh luc test. Vi du neu `calculated_at` la ngay `2026-04-15`:

```text
GET /environment/me/history?dateFrom=2026-04-15T00:00:00.000Z&dateTo=2026-04-15T23:59:59.999Z
```

Ky vong:

- chi tra records co `calculated_at` trong khoang.
- datetime co `Z` hoac timezone offset duoc dung dung instant da truyen.

### 7.6. Date filter bang date-only

```text
GET /environment/me/history?dateFrom=2026-04-15&dateTo=2026-04-15
```

Ky vong:

- backend hieu la ca ngay UTC `2026-04-15`.
- backend khong hieu day la ngay Viet Nam.
- records trong ngay do duoc tra ve.

## 8. Test role va error cases

### 8.1. Khong login

Clear bearer token, goi:

```text
GET /environment/me/history
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

### 8.2. Admin bi chan

Set admin token, goi:

```text
GET /environment/me/history
```

Ky vong:

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

### 8.3. Query invalid

Set user token, goi tung case:

```text
GET /environment/me/history?page=0
GET /environment/me/history?pageSize=0
GET /environment/me/history?pageSize=101
GET /environment/me/history?sortOrder=up
GET /environment/me/history?dateFrom=not-a-date
GET /environment/me/history?dateTo=not-a-date
GET /environment/me/history?dateFrom=2026-04-16T00:00:00.000Z&dateTo=2026-04-15T00:00:00.000Z
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

### 8.4. User khac khong thay data user01

Dung admin token calculate rental cua user02:

```text
POST /internal/environment/calculate-from-rental/019d8fbb-585d-7ade-86ab-b86e8314ab7b
```

Ky vong:

```json
{
  "rental_id": "019d8fbb-585d-7ade-86ab-b86e8314ab7b",
  "estimated_distance_km": 23.4,
  "co2_saved": 1492,
  "co2_saved_unit": "gCO2e"
}
```

Sau do:

1. Set token `user01`.
2. Goi `GET /environment/me/history`.
3. Ky vong khong co `rental_id = 019d8fbb-585d-7ade-86ab-b86e8314ab7b`.
4. Set token `user02`.
5. Goi `GET /environment/me/history`.
6. Ky vong co `rental_id = 019d8fbb-585d-7ade-86ab-b86e8314ab7b`.

## 9. Business rules frontend can nho

- History la danh sach impact da tinh, khong phai danh sach rental completed.
- Neu rental completed nhung chua co row trong `environmental_impact_stats`, rental do khong hien trong history.
- Frontend khong duoc goi calculate khi user mo history.
- Calculate la admin/internal flow rieng:
  - `POST /internal/environment/calculate-from-rental/{rentalId}`
  - Role `ADMIN`
- History khong nhan `userId`.
- User identity lay tu access token.
- `co2_saved` trong history la gram CO2e.
- `estimated_distance_km` la km.
- `pageSize` max `100` de tranh list qua lon va giu API on dinh.
- `distance_source`, `raw_rental_minutes`, `effective_ride_minutes` la metadata Phase 1 lay tu `policy_snapshot`.

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
SELECT id, name, average_speed_kmh, co2_saved_per_km, status, active_from, active_to, formula_config, created_at, updated_at
FROM environmental_impact_policies
WHERE status = 'ACTIVE'
ORDER BY active_from DESC NULLS LAST, updated_at DESC, created_at DESC;
```

Neu query rong:

- `GET /environment/policies/active` se tra `404`.
- `POST /internal/environment/calculate-from-rental/{rentalId}` se tra `404 ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND`.
- Can tao + activate policy truoc khi calculate.

### 10.3. Lay rental completed chua calculate cua user01

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
LIMIT 5;
```

Lay:

```text
rentalId = rental_id
expected_distance_km = expected_distance_km
expected_co2_saved_g = expected_co2_saved_g
```

### 10.4. Lay rental completed chua calculate cua user02

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
WHERE u.email = 'user02@mebike.local'
  AND r.status = 'COMPLETED'
  AND eis.id IS NULL
ORDER BY r.end_time DESC
LIMIT 5;
```

### 10.5. Xem impact records cua user01

```sql
SELECT
  eis.id,
  eis.user_id,
  u.email,
  eis.rental_id,
  eis.policy_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.policy_snapshot,
  eis.calculated_at
FROM environmental_impact_stats eis
JOIN users u ON u.id = eis.user_id
WHERE u.email = 'user01@mebike.local'
ORDER BY eis.calculated_at DESC;
```

So sanh voi API:

- `eis.rental_id` = `items[].rental_id`
- `eis.policy_id` = `items[].policy_id`
- `eis.estimated_distance_km` = `items[].estimated_distance_km`
- `eis.co2_saved` = `items[].co2_saved`
- `eis.calculated_at` = `items[].calculated_at`
- `policy_snapshot.distance_source` = `items[].distance_source`
- `policy_snapshot.raw_rental_minutes` = `items[].raw_rental_minutes`
- `policy_snapshot.effective_ride_minutes` = `items[].effective_ride_minutes`

### 10.6. Kiem tra pagination/date filter bang SQL

Thay `<user-id>`, `<dateFrom>`, `<dateTo>` theo data that.

```sql
SELECT id, rental_id, estimated_distance_km, co2_saved, calculated_at
FROM environmental_impact_stats
WHERE user_id = '<user-id>'::uuid
  AND calculated_at >= '<dateFrom>'::timestamptz
  AND calculated_at <= '<dateTo>'::timestamptz
ORDER BY calculated_at DESC
LIMIT 20 OFFSET 0;
```

API tuong ung:

```text
GET /environment/me/history?page=1&pageSize=20&sortOrder=desc&dateFrom=<dateFrom>&dateTo=<dateTo>
```

### 10.7. Kiem tra user isolation

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

- Token `user01` chi thay rows co email `user01@mebike.local`.
- Token `user02` chi thay rows co email `user02@mebike.local`.

## 11. Frontend integration sample

### 11.1. Fetch function

```ts
export type EnvironmentImpactHistoryItem = {
  id: string;
  rental_id: string;
  policy_id: string;
  estimated_distance_km: number;
  co2_saved: number;
  co2_saved_unit: "gCO2e";
  distance_source: "TIME_SPEED" | null;
  raw_rental_minutes: number | null;
  effective_ride_minutes: number | null;
  calculated_at: string;
};

export type EnvironmentImpactHistoryResponse = {
  items: EnvironmentImpactHistoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type EnvironmentImpactHistoryQuery = {
  page?: number;
  pageSize?: number;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
};

export function vietnamLocalDayToUtcHistoryQuery(
  vietnamDate: string,
): Pick<EnvironmentImpactHistoryQuery, "dateFrom" | "dateTo"> {
  return {
    dateFrom: new Date(`${vietnamDate}T00:00:00.000+07:00`).toISOString(),
    dateTo: new Date(`${vietnamDate}T23:59:59.999+07:00`).toISOString(),
  };
}

export type ServerErrorResponse = {
  error: string;
  details?: {
    code?: string;
    issues?: unknown[];
    [key: string]: unknown;
  };
};

export async function getMyEnvironmentImpactHistory(
  baseUrl: string,
  token: string,
  query: EnvironmentImpactHistoryQuery = {},
): Promise<EnvironmentImpactHistoryResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.sortOrder !== undefined) {
    params.set("sortOrder", query.sortOrder);
  }
  if (query.dateFrom) {
    params.set("dateFrom", query.dateFrom);
  }
  if (query.dateTo) {
    params.set("dateTo", query.dateTo);
  }

  const url = `${baseUrl}/environment/me/history${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw body as ServerErrorResponse;
  }

  return body as EnvironmentImpactHistoryResponse;
}
```

### 11.2. UI states nen co

Loading:

```text
Dang tai lich su dong gop moi truong...
```

Empty:

```text
Chua co dong gop moi truong nao duoc ghi nhan.
```

Explain empty:

```text
Nhung chuyen di da hoan thanh se xuat hien sau khi he thong tinh Environment Impact.
```

Error 401:

```text
Phien dang nhap da het han. Vui long dang nhap lai.
```

Error 403:

```text
Tai khoan hien tai khong co quyen xem man hinh nay.
```

Validation error:

```text
Bo loc khong hop le. Vui long kiem tra lai ngay va kich thuoc trang.
```

### 11.3. Render field goi y

Trong list:

- `calculated_at`: thoi diem ghi nhan
- `estimated_distance_km`: hien thi `21.4 km`
- `co2_saved`: hien thi `1364 gCO2e`
- `raw_rental_minutes`: tong phut rental goc
- `effective_ride_minutes`: phut ride sau khi tru buffer
- `distance_source`: Phase 1 la `TIME_SPEED`

Format goi y:

```ts
function formatCo2Saved(item: EnvironmentImpactHistoryItem) {
  return `${item.co2_saved.toLocaleString()} ${item.co2_saved_unit}`;
}

function formatDistanceKm(item: EnvironmentImpactHistoryItem) {
  return `${item.estimated_distance_km.toLocaleString()} km`;
}

function formatMinutes(value: number | null) {
  return value === null ? "-" : `${value} min`;
}
```

## 12. Checklist test nhanh cho frontend

1. Chay backend va mo Scalar.
2. Login `user01`.
3. Goi `GET /environment/me/history`.
4. Confirm empty response neu DB chua co impact.
5. Login `admin`.
6. Tao policy bang `POST /environment/policies` neu chua co.
7. Activate policy bang `PATCH /environment/policies/{policyId}/activate`.
8. Calculate rental user01 bang `POST /internal/environment/calculate-from-rental/019d8fbb-585d-7ade-86ab-b86d9d04140a`.
9. Login lai `user01`.
10. Goi `GET /environment/me/history`.
11. Confirm co item voi `rental_id = 019d8fbb-585d-7ade-86ab-b86d9d04140a`.
12. Confirm `co2_saved_unit = "gCO2e"`.
13. Confirm `estimated_distance_km = 21.4`.
14. Confirm `co2_saved = 1364`.
15. Calculate rental thu hai cua user01.
16. Test `page=1&pageSize=1`.
17. Test `page=2&pageSize=1`.
18. Test `sortOrder=asc`.
19. Test `sortOrder=desc`.
20. Test `dateFrom/dateTo`.
21. Test invalid query tra `400`.
22. Test khong login tra `401`.
23. Test admin goi history tra `403`.
24. Calculate rental cua `user02`.
25. Confirm `user01` khong thay rental cua `user02`.
26. Confirm `user02` thay rental cua chinh minh.
27. Doi chieu response voi SQL section 10.5.

## 13. Troubleshooting

### 13.1. History van rong du user co rental completed

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
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC;
```

Neu `impact_id` la `null`, rental do chua duoc calculate. Can dung admin flow calculate.

### 13.2. Calculate tra 404 active policy

Kiem tra policy:

```sql
SELECT id, name, status, active_from, active_to
FROM environmental_impact_policies
ORDER BY created_at DESC;
```

Neu khong co policy `ACTIVE` hop le:

1. Tao policy bang `POST /environment/policies`.
2. Activate bang `PATCH /environment/policies/{policyId}/activate`.
3. Goi lai calculate.

### 13.3. Calculate tra 409 rental not completed

Rental do khong co status `COMPLETED`. Lay rental khac bang:

```sql
SELECT r.id, u.email, r.status, r.duration, r.end_time
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY r.end_time DESC
LIMIT 5;
```

### 13.4. API tra 403 khi dung admin token

Dung dung role:

- `GET /environment/me/history`: `USER`
- `POST /environment/policies`: `ADMIN`
- `PATCH /environment/policies/{policyId}/activate`: `ADMIN`
- `POST /internal/environment/calculate-from-rental/{rentalId}`: `ADMIN`

### 13.5. UUID trong guide khong dung nua

Neu da reset DB hoac seed lai, UUID thay doi. Chay lai:

- SQL section 10.1 de lay user IDs.
- SQL section 10.3 de lay rental completed cua user01.
- SQL section 10.4 de lay rental completed cua user02.

## 14. Ghi chu quan trong cho UI

- Khong hardcode UUID trong production code.
- Khong render `co2_saved` ma khong kem unit.
- Khong coi history rong la loi.
- Khong fetch Rental list roi tu tinh CO2 o frontend.
- Khong goi calculate trong man history.
- Khong cho user nhap `userId` de xem history.
- Dung pagination metadata tu API de render next/previous.
- Gioi han UI `pageSize` toi da `100`.
- Neu field snapshot metadata la `null`, UI nen hien `-` hoac an field do.
