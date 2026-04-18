# Environment Policy Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
POST /environment/policies
```

Muc tieu API:

- Admin tao mot Environment Policy moi.
- Policy nay la config cho cong thuc tinh CO2 saved sau nay.
- API nay khong tinh environment impact cho rental.
- API nay khong ghi vao `environmental_impact_stats`.
- Policy tao moi luon la draft/inactive: `status = "INACTIVE"`.
- Activate policy se la API rieng, khong lam trong API create nay.

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
- copy `accessToken` de authorize cac API admin

Dang response:

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
POST /environment/policies
```

Role:

```text
ADMIN only
```

Header:

```http
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Request body toi thieu:

```json
{
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75
}
```

Request body day du:

```json
{
  "name": "Default Environment Policy v1",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85
}
```

Khong gui `status: "ACTIVE"` trong API nay.
Neu frontend co field status, chi nen mac dinh an field nay hoac gui `INACTIVE`.

## 4. Field request cho frontend

| Field | Type | Required | Rule | UI note |
| --- | --- | --- | --- | --- |
| `name` | string | yes | trim xong khong duoc rong | Text input |
| `average_speed_kmh` | number | yes | `> 0` va `<= 40` | Don vi km/h |
| `co2_saved_per_km` | number | yes | `>= 0` va `<= 500` | Don vi gCO2e/km |
| `return_scan_buffer_minutes` | integer | no | `>= 0` va `<= 30` | Default 3 neu bo trong |
| `confidence_factor` | number | no | `> 0` va `<= 1` | Default 0.85 neu bo trong |

Normalize o backend truoc khi luu:

- `average_speed_kmh`: toi da 2 chu so thap phan
- `co2_saved_per_km`: toi da 4 chu so thap phan
- `confidence_factor`: toi da 2 chu so thap phan
- `return_scan_buffer_minutes`: integer

Frontend nen validate truoc de user thay loi nhanh, nhung van phai xu ly error tu backend.

## 5. Response thanh cong

Status:

```text
201 Created
```

Response mau:

```json
{
  "id": "018fa0f9-8f3b-752c-8f3d-2c9000000000",
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
  "created_at": "2026-04-15T01:00:00.000Z",
  "updated_at": "2026-04-15T01:00:00.000Z"
}
```

Luu y cho UI:

- Hien `status` la `INACTIVE`, co the label la `Draft` hoac `Inactive`.
- Hien `co2_saved_per_km` kem unit `gCO2e/km`.
- `active_from` va `active_to` co the la `null`, frontend khong nen render thanh `Invalid Date`.
- `formula_config.display_unit` la `gCO2e`, dung cho CO2 saved total sau nay.

## 6. Unit va y nghia nghiep vu

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

Don vi response lien quan CO2 phai ghi ro:

- per km: `gCO2e/km`
- total saved: `gCO2e`

Cong thuc Phase 1 sau nay, khong tinh trong API create policy:

```text
raw_rental_minutes = Rental.duration hoac end_time - start_time
effective_ride_minutes = max(0, raw_rental_minutes - return_scan_buffer_minutes)
estimated_distance_km = round((effective_ride_minutes / 60) * average_speed_kmh, 2)
co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)
```

## 7. Default formula_config

Neu frontend khong gui `return_scan_buffer_minutes` va `confidence_factor`, backend tu dung default:

```json
{
  "return_scan_buffer_minutes": 3,
  "confidence_factor": 0.85,
  "display_unit": "gCO2e",
  "formula_version": "PHASE_1_TIME_SPEED",
  "distance_source": "TIME_SPEED"
}
```

Frontend co the set default tren form de user nhin thay:

```text
return_scan_buffer_minutes = 3
confidence_factor = 0.85
```

## 8. Error cases can handle tren frontend

### 8.1. Chua login

Khong gui token, goi:

```text
POST /environment/policies
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

### 8.2. Khong phai admin

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

### 8.3. Validation error

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
        "path": "average_speed_kmh",
        "message": "average_speed_kmh must be greater than 0",
        "code": "too_small"
      }
    ]
  }
}
```

Frontend action:

- doc `details.issues`
- map `path` ve field form
- hien `message` gan input tuong ung
- neu khong map duoc thi hien toast chung

## 9. Test validation trong Scalar

Dung token admin, goi `POST /environment/policies`.

### 9.1. Name rong

```json
{
  "name": "   ",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75
}
```

Ky vong:

- `400`
- `details.code = "VALIDATION_ERROR"`

### 9.2. average_speed_kmh <= 0

```json
{
  "name": "Invalid speed",
  "average_speed_kmh": 0,
  "co2_saved_per_km": 75
}
```

Ky vong:

- `400`

### 9.3. average_speed_kmh > 40

```json
{
  "name": "Invalid speed high",
  "average_speed_kmh": 41,
  "co2_saved_per_km": 75
}
```

Ky vong:

- `400`

### 9.4. co2_saved_per_km < 0

```json
{
  "name": "Invalid CO2",
  "average_speed_kmh": 12,
  "co2_saved_per_km": -1
}
```

Ky vong:

- `400`

### 9.5. co2_saved_per_km > 500

```json
{
  "name": "Invalid CO2 high",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 501
}
```

Ky vong:

- `400`

### 9.6. return_scan_buffer_minutes khong phai integer

```json
{
  "name": "Invalid buffer",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 1.5
}
```

Ky vong:

- `400`

### 9.7. return_scan_buffer_minutes < 0 hoac > 30

```json
{
  "name": "Invalid buffer range",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "return_scan_buffer_minutes": 31
}
```

Ky vong:

- `400`

### 9.8. confidence_factor <= 0

```json
{
  "name": "Invalid confidence low",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "confidence_factor": 0
}
```

Ky vong:

- `400`

### 9.9. confidence_factor > 1

```json
{
  "name": "Invalid confidence high",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "confidence_factor": 1.2
}
```

Ky vong:

- `400`

### 9.10. Khong duoc create ACTIVE policy

```json
{
  "name": "Should not activate",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "status": "ACTIVE"
}
```

Ky vong:

- `400`
- create policy API khong cho activate

## 10. Test normalize trong Scalar

Request:

```json
{
  "name": "  Normalize Environment Policy  ",
  "average_speed_kmh": 12.345,
  "co2_saved_per_km": 75.12345,
  "return_scan_buffer_minutes": 4,
  "confidence_factor": 0.856
}
```

Ky vong response:

```json
{
  "name": "Normalize Environment Policy",
  "average_speed_kmh": 12.35,
  "co2_saved_per_km": 75.1235,
  "status": "INACTIVE",
  "formula_config": {
    "return_scan_buffer_minutes": 4,
    "confidence_factor": 0.86,
    "display_unit": "gCO2e",
    "formula_version": "PHASE_1_TIME_SPEED",
    "distance_source": "TIME_SPEED"
  }
}
```

## 11. Kiem tra trong pgAdmin

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

### 11.1. Kiem tra cot formula_config da ton tai

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'environmental_impact_policies'
ORDER BY ordinal_position;
```

Ky vong co cot:

```text
formula_config | jsonb | YES
```

### 11.2. Kiem tra policy moi tao

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
ORDER BY created_at DESC
LIMIT 10;
```

Ky vong:

- `name` dung voi request
- `average_speed_kmh` da normalize toi da 2 decimals
- `co2_saved_per_km` da normalize toi da 4 decimals
- `status = INACTIVE`
- `active_from IS NULL`
- `active_to IS NULL`
- `formula_config` co `display_unit = "gCO2e"`
- `formula_config` co `formula_version = "PHASE_1_TIME_SPEED"`
- `formula_config` co `distance_source = "TIME_SPEED"`

### 11.3. Kiem tra API khong tao impact stats

Chay truoc va sau khi tao policy:

```sql
SELECT COUNT(*) AS stats_count
FROM environmental_impact_stats;
```

Ky vong:

- tao policy khong lam tang count trong bang `environmental_impact_stats`

### 11.4. Query rieng cho formula_config

```sql
SELECT
  id,
  name,
  formula_config->>'display_unit' AS display_unit,
  formula_config->>'formula_version' AS formula_version,
  formula_config->>'distance_source' AS distance_source,
  (formula_config->>'return_scan_buffer_minutes')::int AS return_scan_buffer_minutes,
  (formula_config->>'confidence_factor')::numeric AS confidence_factor
FROM environmental_impact_policies
ORDER BY created_at DESC
LIMIT 10;
```

Ky vong:

```text
display_unit = gCO2e
formula_version = PHASE_1_TIME_SPEED
distance_source = TIME_SPEED
return_scan_buffer_minutes = 3 hoac gia tri user nhap
confidence_factor = 0.85 hoac gia tri user nhap da normalize
```

## 12. Goi API tu frontend

Vi du voi `fetch`:

```ts
type CreateEnvironmentPolicyPayload = {
  name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  return_scan_buffer_minutes?: number;
  confidence_factor?: number;
};

async function createEnvironmentPolicy(
  baseUrl: string,
  token: string,
  payload: CreateEnvironmentPolicyPayload,
) {
  const response = await fetch(`${baseUrl}/environment/policies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw body;
  }

  return body;
}
```

Vi du payload tu form:

```ts
const payload = {
  name: form.name.trim(),
  average_speed_kmh: Number(form.averageSpeedKmh),
  co2_saved_per_km: Number(form.co2SavedPerKm),
  return_scan_buffer_minutes: Number(form.returnScanBufferMinutes || 3),
  confidence_factor: Number(form.confidenceFactor || 0.85),
};
```

Luu y:

- Khong gui number dang string neu form input tra string; can `Number(...)`.
- Khong gui field empty string cho numeric.
- Neu optional field rong, frontend co the bo field hoac set default.
- Khong gui `status: "ACTIVE"` trong create.

## 13. Suggested UI cho frontend

Man hinh create policy nen co:

- `Policy name`
- `Average speed (km/h)`
- `Net CO2 saved factor (gCO2e/km)`
- `Return scan buffer (minutes)`
- `Confidence factor`
- submit button `Create inactive policy`

Text goi y ngan:

```text
New policies are created inactive. Activation is handled separately.
```

Sau khi create thanh cong:

- hien toast success
- hien `status = INACTIVE`
- hien id policy vua tao
- reload list neu frontend da co list page sau nay
- khong can trigger calculate rental impact

## 14. Mapping field frontend/back-end

| UI label | API field | Unit |
| --- | --- | --- |
| Policy name | `name` | none |
| Average speed | `average_speed_kmh` | km/h |
| Net CO2 saved factor | `co2_saved_per_km` | gCO2e/km |
| Return scan buffer | `return_scan_buffer_minutes` | minutes |
| Confidence factor | `confidence_factor` | ratio 0-1 |
| Status | response `status` | enum |
| CO2 factor unit | response `co2_saved_per_km_unit` | gCO2e/km |

## 15. Contract frontend co the dung

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

export type CreateEnvironmentPolicyPayload = {
  name: string;
  average_speed_kmh: number;
  co2_saved_per_km: number;
  return_scan_buffer_minutes?: number;
  confidence_factor?: number;
  status?: "INACTIVE";
};
```

Hien tai API create se luon tra `status = "INACTIVE"`.
Union status o tren di theo enum `AccountStatus` cua backend, nhung UI create khong nen cho chon status khac.

## 16. Checklist test nhanh cho frontend

1. Login admin lay token.
2. Goi `POST /environment/policies` voi body hop le.
3. Confirm response `201`.
4. Confirm response co `co2_saved_per_km_unit = "gCO2e/km"`.
5. Confirm response co `status = "INACTIVE"`.
6. Confirm `formula_config.display_unit = "gCO2e"`.
7. Confirm `active_from = null`, `active_to = null`.
8. Test khong token -> `401`.
9. Test token khong phai admin -> `403`.
10. Test cac invalid body -> `400`.
11. Kiem tra pgAdmin bang `environmental_impact_policies`.
12. Kiem tra `environmental_impact_stats` khong co row moi do API nay tao.

## 17. Ghi chu quan trong

- API nay la create config, khong phai calculate.
- Khong goi API calculate-from-rental sau khi create policy, tru khi co flow rieng trong phase sau.
- Khong hardcode policy id trong frontend.
- Khong hardcode unit ngoai nhung cho UI can fallback; uu tien doc `co2_saved_per_km_unit` va `formula_config.display_unit` tu response.
- `formula_config` la JSONB de sau nay them config/version cong thuc ma khong phai them nhieu cot DB.
- Vi table DB default `status` la `ACTIVE`, backend create service da set ro `INACTIVE`; frontend van nen xem response la source of truth.
