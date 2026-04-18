# Environment Policy List Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
GET /environment/policies
```

Muc tieu API:

- Admin xem danh sach Environment Policies da tao.
- API nay dung cho man hinh admin/config de xem lich su policy, trang thai `ACTIVE`/`INACTIVE`, thoi gian hieu luc va thong so tinh CO2.
- API nay chi doc danh sach policy.
- API nay khong tao policy, khong sua policy, khong activate/deactivate policy.
- API nay khong tao default policy tu dong.
- API nay khong ghi vao `environmental_impact_stats`.
- API nay khong update `formula_config` trong DB; neu DB thieu field thi backend chi normalize trong response.

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
- copy `accessToken` de authorize API admin

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
GET /environment/policies
```

Role:

```text
ADMIN only
```

Header:

```http
Authorization: Bearer <admin_access_token>
```

Request body:

```text
Khong co body
```

## 4. Query params

Tat ca query params deu optional.

| Param | Type | Default | Rule | Ghi chu |
| --- | --- | --- | --- | --- |
| `page` | integer | `1` | min `1` | So trang, bat dau tu 1 |
| `pageSize` | integer | `20` | min `1`, max `100` | So item moi trang |
| `status` | enum | none | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED` | Filter theo status |
| `search` | string | none | trim | Tim theo `name`, case-insensitive |
| `sortBy` | enum | `created_at` | `created_at`, `updated_at`, `active_from`, `name` | Field sort |
| `sortOrder` | enum | `desc` | `asc`, `desc` | Huong sort |

Vi du:

```text
GET /environment/policies?page=1&pageSize=20
GET /environment/policies?status=ACTIVE
GET /environment/policies?search=default
GET /environment/policies?page=2&pageSize=10&sortBy=name&sortOrder=asc
GET /environment/policies?status=INACTIVE&search=draft&sortBy=updated_at&sortOrder=desc
```

## 5. Response thanh cong

Status:

```text
200 OK
```

Response mau co data:

```json
{
  "items": [
    {
      "id": "018fa0f9-8f3b-752c-8f3d-2c9000000000",
      "name": "Default Environment Policy v1",
      "average_speed_kmh": 12,
      "co2_saved_per_km": 75,
      "co2_saved_per_km_unit": "gCO2e/km",
      "status": "ACTIVE",
      "active_from": "2026-04-15T00:00:00.000Z",
      "active_to": null,
      "formula_config": {
        "return_scan_buffer_minutes": 3,
        "confidence_factor": 0.85,
        "display_unit": "gCO2e",
        "formula_version": "PHASE_1_TIME_SPEED",
        "distance_source": "TIME_SPEED"
      },
      "created_at": "2026-04-15T01:00:00.000Z",
      "updated_at": "2026-04-15T01:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Response mau khi chua co policy:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Luu y cho frontend:

- `items` co the rong, khong coi la loi.
- `co2_saved_per_km_unit` luon la `gCO2e/km`.
- `formula_config.display_unit` la unit cho tong CO2 saved, mac dinh `gCO2e`.
- `active_from` va `active_to` co the la `null`; khong render thanh `Invalid Date`.
- `status` dung enum chung: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED`.
- `co2_saved_per_km` trong Phase 1 duoc hieu la `net_saved_ef_g_per_km`.

## 6. Normalize formula_config trong response

Neu `formula_config` trong DB bi `NULL` hoac thieu field, backend van tra response day du bang default:

```json
{
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85,
  "display_unit": "gCO2e",
  "formula_version": "PHASE_1_TIME_SPEED",
  "distance_source": "TIME_SPEED"
}
```

Quan trong:

- Backend chi normalize trong response.
- Backend khong update `formula_config` trong DB khi goi API list.
- Frontend nen xem response cua `GET /environment/policies` la source of truth de render list.

## 7. Error cases can handle tren frontend

### 7.1. Chua login

Khong gui token, goi:

```text
GET /environment/policies
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

### 7.2. Khong phai admin

Login user/staff/agency roi goi API nay.

Co the dung user demo:

```text
email: user01@mebike.local
password: Demo@123456
```

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

- an menu Environment Policy voi role khong phai `ADMIN`
- neu user truy cap truc tiep, hien man hinh khong co quyen

### 7.3. Query param invalid

Status:

```text
400
```

Response dang chung:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR",
    "issues": [
      {
        "path": "pageSize",
        "message": "pageSize must be less than or equal to 100",
        "code": "too_big"
      }
    ]
  }
}
```

Frontend action:

- validate truoc khi submit filter
- neu backend tra `VALIDATION_ERROR`, map `issues[].path` vao field filter tuong ung
- neu khong map duoc thi hien toast chung

### 7.4. DB error

Neu DB loi, backend tra theo default error handler hien tai:

```text
500
```

Frontend action:

- hien toast loi he thong
- cho retry
- khong xoa local filter state

## 8. Test trong Scalar

Dung token admin, mo group `Environment` trong Scalar.

### 8.1. Test list khong filter

Goi:

```text
GET /environment/policies
```

Ky vong:

- status `200`
- response co `items`
- response co `page = 1`
- response co `pageSize = 20`
- neu co data, moi item co `co2_saved_per_km_unit = "gCO2e/km"`
- moi item co `formula_config` du 5 field default

### 8.2. Test empty state

Neu DB chua co row trong `environmental_impact_policies`, goi:

```text
GET /environment/policies
```

Ky vong:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Frontend nen render empty state, khong redirect, khong coi la loi.

### 8.3. Test filter status ACTIVE

Goi:

```text
GET /environment/policies?status=ACTIVE
```

Ky vong:

- status `200`
- moi item trong `items` co `status = "ACTIVE"`
- neu khong co active policy thi `items = []`

### 8.4. Test filter status INACTIVE

Goi:

```text
GET /environment/policies?status=INACTIVE
```

Ky vong:

- status `200`
- moi item trong `items` co `status = "INACTIVE"`

### 8.5. Test search theo name

Goi:

```text
GET /environment/policies?search=default
```

Hoac test trim:

```text
GET /environment/policies?search=%20default%20
```

Ky vong:

- status `200`
- backend tim theo `name`
- search case-insensitive
- search duoc trim

### 8.6. Test pagination

Goi:

```text
GET /environment/policies?page=1&pageSize=1
```

Ky vong:

- `page = 1`
- `pageSize = 1`
- `items.length <= 1`
- `totalItems` la tong so row match filter
- `totalPages = ceil(totalItems / pageSize)`, neu `totalItems = 0` thi `totalPages = 0`

Goi tiep:

```text
GET /environment/policies?page=2&pageSize=1
```

Ky vong:

- `page = 2`
- item khac page 1 neu co du data

### 8.7. Test sort by created_at desc

Goi:

```text
GET /environment/policies?sortBy=created_at&sortOrder=desc
```

Ky vong:

- item moi tao gan nhat dung dau

### 8.8. Test sort by name asc

Goi:

```text
GET /environment/policies?sortBy=name&sortOrder=asc
```

Ky vong:

- danh sach sap xep theo `name` tang dan

### 8.9. Test sort by updated_at desc

Goi:

```text
GET /environment/policies?sortBy=updated_at&sortOrder=desc
```

Ky vong:

- item moi update gan nhat dung dau

### 8.10. Test sort by active_from asc

Goi:

```text
GET /environment/policies?sortBy=active_from&sortOrder=asc
```

Ky vong:

- danh sach sap xep theo `active_from`
- `active_from` co the `null`, frontend can handle null date

### 8.11. Test invalid query

Moi case ben duoi phai tra `400` va `details.code = "VALIDATION_ERROR"`:

```text
GET /environment/policies?page=0
GET /environment/policies?pageSize=0
GET /environment/policies?pageSize=101
GET /environment/policies?status=DELETED
GET /environment/policies?sortBy=bad
GET /environment/policies?sortOrder=up
```

### 8.12. Test khong login

Clear token trong Scalar, goi:

```text
GET /environment/policies
```

Ky vong:

- status `401`
- `details.code = "UNAUTHORIZED"`

### 8.13. Test non-admin

Login bang user demo:

```text
email: user01@mebike.local
password: Demo@123456
```

Authorize token user trong Scalar, goi:

```text
GET /environment/policies
```

Ky vong:

- status `403`
- `details.code = "UNAUTHORIZED"`

## 9. Kiem tra trong pgAdmin

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
port: 5432
database: mebike
user: postgres
password: postgres
```

Neu pgAdmin chay ngoai compose network, host co the la:

```text
localhost
```

### 9.1. Xem danh sach policy

Chay query:

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
ORDER BY created_at DESC;
```

Expected row:

```text
id: UUID
name: Default Environment Policy v1
average_speed_kmh: 12.00
co2_saved_per_km: 75.0000
status: ACTIVE hoac INACTIVE
active_from: timestamp hoac null
active_to: timestamp hoac null
formula_config: JSONB hoac null
created_at: timestamp
updated_at: timestamp
```

### 9.2. Tao data bang API POST truoc

Neu chua co policy, tao draft bang API da co:

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
- response `status = "INACTIVE"`
- create API khong activate policy

Sau do goi:

```text
GET /environment/policies
```

Ky vong:

- list co policy vua tao
- policy do co `status = "INACTIVE"`

### 9.3. Tao data bang SQL local/dev neu can

Chi dung trong local/dev khi can data nhanh de test list/filter/sort.

```sql
INSERT INTO environmental_impact_policies
  (
    id,
    name,
    average_speed_kmh,
    co2_saved_per_km,
    status,
    active_from,
    active_to,
    formula_config,
    updated_at
  )
VALUES
  (
    '018fa300-0000-7000-8000-000000000001',
    'Default Environment Policy v1',
    12,
    75,
    'ACTIVE'::"AccountStatus",
    NOW() - INTERVAL '1 day',
    NULL,
    '{
      "return_scan_buffer_minutes": 3,
      "confidence_factor": 0.85,
      "display_unit": "gCO2e",
      "formula_version": "PHASE_1_TIME_SPEED",
      "distance_source": "TIME_SPEED"
    }'::jsonb,
    NOW()
  ),
  (
    '018fa300-0000-7000-8000-000000000002',
    'Draft Environment Policy v2',
    12,
    80,
    'INACTIVE'::"AccountStatus",
    NULL,
    NULL,
    '{}'::jsonb,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  average_speed_kmh = EXCLUDED.average_speed_kmh,
  co2_saved_per_km = EXCLUDED.co2_saved_per_km,
  status = EXCLUDED.status,
  active_from = EXCLUDED.active_from,
  active_to = EXCLUDED.active_to,
  formula_config = EXCLUDED.formula_config,
  updated_at = NOW();
```

Sau khi insert, test:

```text
GET /environment/policies?sortBy=created_at&sortOrder=desc
GET /environment/policies?status=ACTIVE
GET /environment/policies?status=INACTIVE
GET /environment/policies?search=draft
```

### 9.4. Kiem tra normalize khong update DB

Data SQL o tren co row `Draft Environment Policy v2` voi `formula_config = '{}'`.

Goi:

```text
GET /environment/policies?search=Draft
```

Ky vong response van co:

```json
{
  "formula_config": {
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "display_unit": "gCO2e",
    "formula_version": "PHASE_1_TIME_SPEED",
    "distance_source": "TIME_SPEED"
  }
}
```

Sau do kiem tra DB:

```sql
SELECT name, formula_config
FROM environmental_impact_policies
WHERE name = 'Draft Environment Policy v2';
```

Ky vong:

- DB van co `formula_config = {}`
- response da normalize, nhung DB khong bi update

### 9.5. Kiem tra API list khong tao impact stats

Chay truoc va sau khi goi `GET /environment/policies`:

```sql
SELECT COUNT(*) AS total_environmental_impact_stats
FROM environmental_impact_stats;
```

Ky vong:

- count khong thay doi
- API list khong ghi vao `environmental_impact_stats`

## 10. Contract frontend co the dung

```ts
export type EnvironmentPolicyFormulaConfig = {
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  display_unit: "gCO2e";
  formula_version: "PHASE_1_TIME_SPEED";
  distance_source: "TIME_SPEED";
};

export type EnvironmentPolicyStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "BANNED";

export type EnvironmentPolicy = {
  id: string;
  name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: "gCO2e/km";
  status: EnvironmentPolicyStatus;
  active_from: string | null;
  active_to: string | null;
  formula_config: EnvironmentPolicyFormulaConfig;
  created_at: string;
  updated_at: string;
};

export type ListEnvironmentPoliciesParams = {
  page?: number;
  pageSize?: number;
  status?: EnvironmentPolicyStatus;
  search?: string;
  sortBy?: "created_at" | "updated_at" | "active_from" | "name";
  sortOrder?: "asc" | "desc";
};

export type EnvironmentPolicyListResponse = {
  items: EnvironmentPolicy[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
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

## 11. Frontend fetch helper mau

```ts
function buildQuery(params: ListEnvironmentPoliciesParams): string {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));
  if (params.status) query.set("status", params.status);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function listEnvironmentPolicies(
  baseUrl: string,
  token: string,
  params: ListEnvironmentPoliciesParams = {},
): Promise<EnvironmentPolicyListResponse> {
  const response = await fetch(
    `${baseUrl}/environment/policies${buildQuery(params)}`,
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

  return body as EnvironmentPolicyListResponse;
}
```

Usage:

```ts
const page = await listEnvironmentPolicies(apiBaseUrl, accessToken, {
  page: 1,
  pageSize: 20,
  status: "ACTIVE",
  search: "default",
  sortBy: "created_at",
  sortOrder: "desc",
});

setPolicies(page.items);
setPagination({
  page: page.page,
  pageSize: page.pageSize,
  totalItems: page.totalItems,
  totalPages: page.totalPages,
});
```

## 12. Suggested UI cho man admin/config

Man hinh danh sach nen co:

- table/list Environment Policies
- search input theo `name`
- status filter: All, Active, Inactive, Suspended, Banned
- page/pageSize pagination
- sort by `created_at`, `updated_at`, `active_from`, `name`
- status badge
- display `co2_saved_per_km` kem `co2_saved_per_km_unit`
- display `formula_config.confidence_factor`
- display `formula_config.return_scan_buffer_minutes`
- display `active_from` va `active_to`, handle null

Khong nen co trong API list screen:

- khong auto create policy khi list rong
- khong activate/deactivate policy bang endpoint nay
- khong update policy bang endpoint nay
- khong chay calculate-from-rental bang endpoint nay

## 13. Mapping UI field

| UI label | Response field | Ghi chu |
| --- | --- | --- |
| Policy name | `name` | Text |
| Status | `status` | Badge |
| Average speed | `average_speed_kmh` | km/h |
| CO2 saved factor | `co2_saved_per_km` + `co2_saved_per_km_unit` | `gCO2e/km` |
| Active from | `active_from` | nullable datetime |
| Active to | `active_to` | nullable datetime |
| Return scan buffer | `formula_config.return_scan_buffer_minutes` | minutes |
| Confidence factor | `formula_config.confidence_factor` | ratio 0-1 |
| Formula version | `formula_config.formula_version` | Phase 1: `PHASE_1_TIME_SPEED` |
| Distance source | `formula_config.distance_source` | Phase 1: `TIME_SPEED` |
| Display unit | `formula_config.display_unit` | `gCO2e` |
| Created at | `created_at` | datetime |
| Updated at | `updated_at` | datetime |

## 14. Checklist test nhanh cho frontend

1. Chay backend va mo Scalar.
2. Login admin lay token.
3. Goi `GET /environment/policies` khong query.
4. Confirm `200`.
5. Confirm response co `items`, `page`, `pageSize`, `totalItems`, `totalPages`.
6. Confirm empty list tra `items = []`, khong `404`.
7. Tao policy draft bang `POST /environment/policies` neu chua co data.
8. Goi lai `GET /environment/policies`.
9. Confirm policy moi tao xuat hien voi `status = "INACTIVE"`.
10. Confirm `co2_saved_per_km_unit = "gCO2e/km"`.
11. Confirm `formula_config` co du 5 field.
12. Test `status=ACTIVE`.
13. Test `search=default`.
14. Test `page=1&pageSize=1`.
15. Test `sortBy=name&sortOrder=asc`.
16. Test invalid query `pageSize=101` -> `400`.
17. Clear token va test `401`.
18. Login non-admin va test `403`.
19. Kiem tra pgAdmin bang `environmental_impact_policies`.
20. Kiem tra `environmental_impact_stats` khong co row moi do API nay tao.

## 15. Ghi chu quan trong

- Endpoint nay la collection read endpoint, nen list rong la `200` voi `items = []`.
- `pageSize` toi da `100` de tranh request qua lon cho man admin/config.
- `search` nen trim o frontend truoc khi gui.
- Frontend nen debounce search input de tranh goi API qua nhieu.
- Frontend nen giu filter state khi API tra loi `500`, de user retry.
- Khong hardcode unit neu API da tra unit; uu tien doc `co2_saved_per_km_unit` va `formula_config.display_unit` tu response.
- `formula_config` la JSONB de sau nay them config/version cong thuc ma khong phai them nhieu cot DB.
- API list normalize response nhung khong sua DB, nen pgAdmin co the thay `formula_config` thieu field trong data cu.
