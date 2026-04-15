# Environment Active Policy Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
GET /environment/policies/active
```

Muc tieu API:

- Admin lay Environment Policy dang `ACTIVE`.
- Policy nay la config hien tai cua he thong cho cong thuc tinh CO2 saved Phase 1.
- API nay chi doc du lieu, khong tao policy, khong sua policy, khong activate policy.
- API nay dung cho man hinh admin/config va de check policy truoc khi chay flow calculate-from-rental sau nay.
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
GET /environment/policies/active
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

Query params:

```text
Khong co query param trong Phase 1
```

## 4. Business rule

Backend tim policy thoa dieu kien:

```text
status = ACTIVE
active_from IS NULL OR active_from <= now()
active_to IS NULL OR active_to > now()
```

Neu khong co policy `ACTIVE` hop le:

- Tra `404`
- Khong tu tao default policy
- Khong thay doi DB

Neu DB cu bi loi va co nhieu policy `ACTIVE` hop le:

- API khong crash
- Backend chon policy moi nhat theo:

```text
active_from DESC NULLS LAST
updated_at DESC
created_at DESC
```

Day la fallback an toan cho du lieu cu. Ve nghiep vu, he thong van chi nen co mot active policy tai mot thoi diem.

## 5. Response thanh cong

Status:

```text
200 OK
```

Response mau:

```json
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
```

Luu y cho frontend:

- `co2_saved_per_km_unit` luon la `gCO2e/km`.
- `formula_config.display_unit` la unit cho tong CO2 saved, mac dinh `gCO2e`.
- `active_from` va `active_to` co the la `null`; khong render thanh `Invalid Date`.
- `status` mong doi la `ACTIVE` khi response `200`.
- Khong can fallback hardcode nhieu o frontend neu backend da tra day du, nhung UI co the fallback text `gCO2e` khi field bi thieu do cache/old client.

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
- Backend khong update `formula_config` trong DB khi goi API nay.
- Frontend nen xem response cua `GET /environment/policies/active` la source of truth cho config dang duoc dung.

## 7. Error cases can handle tren frontend

### 7.1. Chua login

Khong gui token, goi:

```text
GET /environment/policies/active
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

### 7.3. Chua co active policy

Login admin roi goi:

```text
GET /environment/policies/active
```

Ky vong:

```text
404
```

Response theo convention hien tai:

```json
{
  "error": "No active environment policy found",
  "details": {
    "code": "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND"
  }
}
```

Frontend action:

- Hien empty state trong admin/config.
- Goi y admin tao policy draft neu da co man create.
- Goi y admin activate policy neu sau nay co API activate.
- Khong tu dong goi calculate-from-rental khi chua co active policy.

### 7.4. DB error hoac loi server

Ky vong:

```text
500
```

Frontend action:

- hien toast/thong bao loi chung
- cho retry
- khong mac dinh tao policy phia client

## 8. Cach test nhanh trong Scalar

### 8.1. Test 401

1. Vao Scalar `http://localhost:4000/docs`.
2. Clear bearer token.
3. Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `401`
- body co `error = "Unauthorized"`

### 8.2. Test 403

1. Login bang account khong phai admin, vi du user demo.
2. Set bearer token cua account do.
3. Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `403`
- body co `error = "Unauthorized"`

### 8.3. Test 404 khi chua co active policy

1. Login admin.
2. Set bearer token admin.
3. Dam bao DB khong co policy `ACTIVE` hop le.
4. Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `404`
- body:

```json
{
  "error": "No active environment policy found",
  "details": {
    "code": "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND"
  }
}
```

### 8.4. Test success khi co active policy

1. Login admin.
2. Set bearer token admin.
3. Tao policy draft neu chua co:

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

4. API create se tra `status = "INACTIVE"`. Lay `id` cua policy vua tao.
5. Neu API activate chua co, dung pgAdmin SQL tam de set `ACTIVE` theo section 9.3.
6. Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- response co `status = "ACTIVE"`
- response co `co2_saved_per_km_unit = "gCO2e/km"`
- response co `formula_config.display_unit = "gCO2e"`
- response co day du default formula config neu DB thieu field

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
database: mebike_dev
user: mebike
password: mebike
```

Neu pgAdmin chay ngoai compose network, host co the la:

```text
localhost
```

### 9.1. Kiem tra cot cua environmental_impact_policies

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'environmental_impact_policies'
ORDER BY ordinal_position;
```

Ky vong co cac cot chinh:

- `id`
- `name`
- `average_speed_kmh`
- `co2_saved_per_km`
- `status`
- `active_from`
- `active_to`
- `formula_config`
- `created_at`
- `updated_at`

### 9.2. Xem active policy hien tai

```sql
SELECT id, name, average_speed_kmh, co2_saved_per_km, status, active_from, active_to, formula_config, created_at, updated_at
FROM environmental_impact_policies
WHERE status = 'ACTIVE';
```

Ky vong:

- Neu khong co row nao: API `GET /environment/policies/active` tra `404`.
- Neu co row nhung `active_from` nam trong tuong lai: API van co the tra `404`.
- Neu co row nhung `active_to <= NOW()`: API van co the tra `404`.
- Neu co row hop le: API tra row active do.

### 9.3. Set tam ACTIVE de test success

Chi dung SQL tam khi API activate chua duoc lam.

```sql
UPDATE environmental_impact_policies
SET status = 'ACTIVE', active_from = NOW(), active_to = NULL, updated_at = NOW()
WHERE id = '<policy-id>';
```

Sau do goi lai:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- response tra policy vua set active

### 9.4. Test active_from trong tuong lai

Dung khi muon verify API ton trong effective window:

```sql
UPDATE environmental_impact_policies
SET status = 'ACTIVE',
    active_from = NOW() + INTERVAL '1 day',
    active_to = NULL,
    updated_at = NOW()
WHERE id = '<policy-id>';
```

Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `404`
- vi policy ACTIVE nhung chua toi thoi diem hieu luc

### 9.5. Test active_to da het han

```sql
UPDATE environmental_impact_policies
SET status = 'ACTIVE',
    active_from = NOW() - INTERVAL '2 days',
    active_to = NOW() - INTERVAL '1 day',
    updated_at = NOW()
WHERE id = '<policy-id>';
```

Goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `404`
- vi policy ACTIVE nhung da het han

### 9.6. Test nhieu ACTIVE hop le

Chi dung trong local/dev de verify fallback cho du lieu cu.

```sql
SELECT id, name, status, active_from, active_to, updated_at, created_at
FROM environmental_impact_policies
WHERE status = 'ACTIVE'
ORDER BY active_from DESC NULLS LAST, updated_at DESC, created_at DESC;
```

Goi:

```text
GET /environment/policies/active
```

Ky vong:

- API tra row dau tien theo order tren.
- API khong crash.

Sau khi test xong nen dua data ve chi con mot policy ACTIVE.

## 10. Unit va y nghia nghiep vu

`co2_saved_per_km` trong policy duoc hieu la:

```text
net_saved_ef_g_per_km
```

Don vi:

```text
gCO2e/km
```

`environmental_impact_stats.co2_saved` sau nay se luu:

```text
gram CO2e
```

Don vi response lien quan CO2:

- per km: `co2_saved_per_km_unit = "gCO2e/km"`
- total saved: `formula_config.display_unit = "gCO2e"`

Cong thuc Phase 1 sau nay, API active policy chi cung cap config chua khong tinh:

```text
raw_rental_minutes = Rental.duration hoac end_time - start_time
effective_ride_minutes = max(0, raw_rental_minutes - return_scan_buffer_minutes)
estimated_distance_km = round((effective_ride_minutes / 60) * average_speed_kmh, 2)
co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)
```

## 11. Contract frontend co the dung

```ts
export type EnvironmentPolicyFormulaConfig = {
  return_scan_buffer_minutes: number;
  confidence_factor: number;
  display_unit: "gCO2e";
  formula_version: "PHASE_1_TIME_SPEED";
  distance_source: "TIME_SPEED";
};

export type EnvironmentPolicy = {
  id: string;
  name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  co2_saved_per_km_unit: "gCO2e/km";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  active_from: string | null;
  active_to: string | null;
  formula_config: EnvironmentPolicyFormulaConfig;
  created_at: string;
  updated_at: string;
};

export type ServerErrorResponse = {
  error: string;
  details?: {
    code?: string;
    [key: string]: unknown;
  };
};
```

## 12. Goi API tu frontend

Vi du voi `fetch`:

```ts
export async function getActiveEnvironmentPolicy(
  baseUrl: string,
  token: string,
): Promise<EnvironmentPolicy> {
  const response = await fetch(`${baseUrl}/environment/policies/active`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw body as ServerErrorResponse;
  }

  return body as EnvironmentPolicy;
}
```

Vi du handle error:

```ts
try {
  const policy = await getActiveEnvironmentPolicy(apiBaseUrl, accessToken);
  setPolicy(policy);
} catch (error) {
  const body = error as ServerErrorResponse;

  if (body.details?.code === "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND") {
    setPolicy(null);
    setEmptyReason("No active environment policy found");
    return;
  }

  if (body.details?.code === "UNAUTHORIZED") {
    // redirect login hoac hien no-permission state tuy status HTTP
    return;
  }

  throw error;
}
```

Neu frontend co wrapper HTTP chung, nen map theo HTTP status:

- `200`: render active policy
- `401`: logout/refresh token/redirect login
- `403`: no permission
- `404` + `ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND`: empty state cua config
- `500`: retry/toast loi server

## 13. Suggested UI cho man admin/config

Man hinh nen co cac khu vuc:

- Current Environment Policy
- Policy name
- Status
- Effective window
- Average speed
- CO2 saved factor
- Formula config
- Last updated

Copy text ngan co the dung:

```text
No active environment policy found.
```

```text
Create or activate a policy before running CO2 saved calculations.
```

Field hien thi:

| UI label | API field | Unit / note |
| --- | --- | --- |
| Policy name | `name` | none |
| Status | `status` | expected `ACTIVE` |
| Active from | `active_from` | nullable datetime |
| Active to | `active_to` | nullable datetime |
| Average speed | `average_speed_kmh` | km/h |
| CO2 saved factor | `co2_saved_per_km` | use `co2_saved_per_km_unit` |
| Return scan buffer | `formula_config.return_scan_buffer_minutes` | minutes |
| Confidence factor | `formula_config.confidence_factor` | ratio 0-1 |
| Formula version | `formula_config.formula_version` | Phase 1: `PHASE_1_TIME_SPEED` |
| Distance source | `formula_config.distance_source` | Phase 1: `TIME_SPEED` |
| Display unit | `formula_config.display_unit` | `gCO2e` |
| Updated at | `updated_at` | datetime |

Luu y UI:

- Khong cho user activate policy bang API nay.
- Khong goi API create khi active API tra 404, tru khi user bam action tao policy rieng.
- Khong chay calculate-from-rental neu active API tra 404.
- Khong hardcode policy id.
- Khong hardcode unit neu API da tra unit; uu tien doc tu response.

## 14. Lien quan API create policy

Neu can tao policy draft de test active API, dung API da co:

```text
POST /environment/policies
```

Body toi thieu:

```json
{
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75
}
```

Body day du:

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

De test `GET /environment/policies/active`, sau khi create draft can activate bang API activate sau nay hoac SQL tam trong dev.

## 15. Checklist test nhanh cho frontend

1. Chay backend va mo Scalar.
2. Login admin lay token.
3. Goi `GET /environment/policies/active` khi chua co active policy.
4. Confirm `404` va `details.code = "ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND"`.
5. Tao policy draft bang `POST /environment/policies` neu chua co policy.
6. Vao pgAdmin set tam policy do thanh `ACTIVE`.
7. Goi lai `GET /environment/policies/active`.
8. Confirm `200`.
9. Confirm `status = "ACTIVE"`.
10. Confirm `co2_saved_per_km_unit = "gCO2e/km"`.
11. Confirm `formula_config.display_unit = "gCO2e"`.
12. Confirm `formula_config` co du 5 field default.
13. Clear token va test `401`.
14. Login non-admin va test `403`.
15. Test active_from tuong lai -> `404`.
16. Test active_to het han -> `404`.
17. Neu test nhieu ACTIVE, confirm API chon row moi nhat theo SQL order.

## 16. Ghi chu quan trong

- API nay la read-only config endpoint.
- API nay khong phai calculate endpoint.
- API nay khong tao default policy.
- API nay khong activate policy.
- API nay khong update DB khi normalize `formula_config`.
- Frontend nen goi API nay truoc khi cho phep user chay/tiep tuc flow tinh CO2 saved.
- Neu API tra `404`, frontend nen hien empty state va chan calculate flow.
- Neu API tra `200`, frontend co the dung policy response lam snapshot/config hien tai cho UI.
