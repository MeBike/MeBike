# Environment Policy Activate Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API:

```text
PATCH /environment/policies/{policyId}/activate
```

Muc tieu API:

- Admin kich hoat mot Environment Policy de policy do tro thanh cong thuc `ACTIVE` dung cho tinh CO2 saved Phase 1.
- Khi activate policy moi, backend se chuyen tat ca policy `ACTIVE` khac sang `INACTIVE`.
- API nay la diem kiem soat chinh de doi cong thuc Environment.
- API nay khong tao policy moi.
- API nay khong sua thong so cong thuc nhu `average_speed_kmh`, `co2_saved_per_km`, `formula_config`.
- API nay khong tinh lai du lieu cu trong `environmental_impact_stats`.
- API nay khong update DB khi normalize `formula_config`; backend chi normalize trong response.

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
PATCH /environment/policies/{policyId}/activate
```

Role:

```text
ADMIN only
```

Header:

```http
Authorization: Bearer <admin_access_token>
```

Path params:

```text
policyId: UUID
```

Request body:

```text
Khong co body trong Phase 1
```

Response success:

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
  "updated_at": "2026-04-15T01:05:00.000Z"
}
```

Luu y response:

- `status` cua target se la `ACTIVE`.
- `active_from` la thoi diem activate neu policy truoc do `INACTIVE`.
- `active_to` cua target luon la `null`.
- `co2_saved_per_km_unit` luon la `"gCO2e/km"`.
- `formula_config` luon du cac default field trong response:
  - `return_scan_buffer_minutes`: default `3`
  - `confidence_factor`: default `0.85`
  - `display_unit`: default `"gCO2e"`
  - `formula_version`: default `"PHASE_1_TIME_SPEED"`
  - `distance_source`: default `"TIME_SPEED"`

## 4. Business rule frontend can biet

- Chi co mot Environment Policy `ACTIVE` tai mot thoi diem.
- Backend da dam bao transaction khi activate.
- Frontend khong can goi API deactivate policy cu rieng.
- Frontend khong duoc gui body de sua cong thuc vao API activate.
- Frontend khong duoc dung `POST /environment/policies` de tao policy `ACTIVE`; POST chi tao draft `INACTIVE`.
- Target dang `ACTIVE` van co the bam Activate lai. API idempotent va tra `200`.
- Policy `SUSPENDED` hoac `BANNED` khong duoc activate.
- Du lieu lich su CO2 da tinh khong bi tinh lai khi activate policy moi.

## 5. Flow test nhanh trong Scalar

### 5.1 Tao policy A

Dung API:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Environment Policy A",
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75
}
```

Ky vong:

- status `201`
- response `status = "INACTIVE"`
- response co `co2_saved_per_km_unit = "gCO2e/km"`
- luu `id` cua response thanh `policyAId`

### 5.2 Tao policy B

Dung API:

```text
POST /environment/policies
```

Body:

```json
{
  "name": "Environment Policy B",
  "average_speed_kmh": 14,
  "co2_saved_per_km": 80,
  "return_scan_buffer_minutes": 5,
  "confidence_factor": 0.9
}
```

Ky vong:

- status `201`
- response `status = "INACTIVE"`
- luu `id` cua response thanh `policyBId`

### 5.3 Activate policy A

Dung API:

```text
PATCH /environment/policies/{policyAId}/activate
```

Request body:

```text
De trong
```

Ky vong:

- status `200`
- response `id = policyAId`
- response `status = "ACTIVE"`
- response `active_from != null`
- response `active_to = null`

Sau do goi:

```text
GET /environment/policies/active
```

Ky vong:

- status `200`
- response `id = policyAId`
- response `status = "ACTIVE"`

### 5.4 Activate policy B

Dung API:

```text
PATCH /environment/policies/{policyBId}/activate
```

Ky vong:

- status `200`
- response `id = policyBId`
- response `status = "ACTIVE"`
- policy A tu dong thanh `INACTIVE`
- policy B la active policy hien tai

Kiem tra bang API list:

```text
GET /environment/policies?status=ACTIVE
```

Ky vong:

- status `200`
- `items.length = 1`
- `items[0].id = policyBId`
- `items[0].status = "ACTIVE"`

Kiem tra policy A bang list all:

```text
GET /environment/policies
```

Ky vong:

- tim policy A trong `items`
- policy A co `status = "INACTIVE"`
- policy B co `status = "ACTIVE"`

### 5.5 Test idempotency

Goi lai:

```text
PATCH /environment/policies/{policyBId}/activate
```

Ky vong:

- status `200`
- response `id = policyBId`
- response `status = "ACTIVE"`
- khong bao loi chi vi policy B da active
- van chi co mot policy `ACTIVE`

## 6. Error cases can test trong Scalar

### 6.1 Chua login

Khong set bearer token, goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Ky vong:

```text
status 401
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

### 6.2 Login nhung khong phai admin

Neu da chay `pnpm seed:demo`, co the dung user demo:

```text
email: user01@mebike.local
password: Demo@123456
```

Login lay token user, authorize Scalar bang token user, goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Ky vong:

```text
status 403
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

### 6.3 policyId khong phai UUID

Goi:

```text
PATCH /environment/policies/not-a-uuid/activate
```

Ky vong:

```text
status 400
details.code = "VALIDATION_ERROR"
```

Response mau:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR"
  }
}
```

### 6.4 Policy khong ton tai

Goi voi UUID hop le nhung khong ton tai:

```text
PATCH /environment/policies/018fa200-0000-7000-8000-000000009999/activate
```

Ky vong:

```text
status 404
```

Response mau:

```json
{
  "error": "Environment policy not found",
  "details": {
    "code": "ENVIRONMENT_POLICY_NOT_FOUND"
  }
}
```

### 6.5 Policy bi SUSPENDED hoac BANNED

Neu can test nhanh, vao pgAdmin update mot policy:

```sql
UPDATE environmental_impact_policies
SET status = 'SUSPENDED'
WHERE id = '<policy_id>'::uuid;
```

Sau do goi:

```text
PATCH /environment/policies/{policyId}/activate
```

Ky vong:

```text
status 409
```

Response mau:

```json
{
  "error": "Cannot activate suspended or banned environment policy",
  "details": {
    "code": "ENVIRONMENT_POLICY_ACTIVATION_BLOCKED"
  }
}
```

Co the test `BANNED` tuong tu:

```sql
UPDATE environmental_impact_policies
SET status = 'BANNED'
WHERE id = '<policy_id>'::uuid;
```

## 7. Kiem tra bang pgAdmin

Mo:

```text
http://localhost:5050/browser/
```

Vao database local, mo Query Tool va chay SQL sau.

### 7.1 Xem trang thai policy truoc/sau activate

```sql
SELECT id, name, status, active_from, active_to, updated_at
FROM environmental_impact_policies
ORDER BY updated_at DESC;
```

Sau khi activate policy B, ky vong:

- policy B co `status = 'ACTIVE'`
- policy B co `active_from IS NOT NULL`
- policy B co `active_to IS NULL`
- policy A cu co `status = 'INACTIVE'`

### 7.2 Kiem tra chi co mot ACTIVE

```sql
SELECT COUNT(*) AS active_count
FROM environmental_impact_policies
WHERE status = 'ACTIVE';
```

Ky vong:

```text
active_count = 1
```

### 7.3 Xem chi tiet policy ACTIVE hien tai

```sql
SELECT id, name, average_speed_kmh, co2_saved_per_km, status, active_from, active_to, formula_config
FROM environmental_impact_policies
WHERE status = 'ACTIVE'
ORDER BY updated_at DESC;
```

Ky vong:

- chi co mot row
- `co2_saved_per_km` la gia tri gCO2e/km
- `formula_config` trong DB co the thieu field voi du lieu cu, nhung response API van du default field

## 8. Goi y UI/UX cho frontend

Man hinh Environment Policy nen co cac API:

```text
GET /environment/policies
GET /environment/policies/active
POST /environment/policies
PATCH /environment/policies/{policyId}/activate
```

Goi y hien thi list:

- Cot `name`
- Cot `status`
- Cot `average_speed_kmh`
- Cot `co2_saved_per_km` + unit `gCO2e/km`
- Cot `active_from`
- Cot `updated_at`
- Action `Activate`

Goi y behavior nut `Activate`:

- Chi hien nut cho role `ADMIN`.
- Disable nut khi policy dang `SUSPENDED` hoac `BANNED`.
- Neu policy dang `ACTIVE`, co the hien label `Active` hoac cho bam lai de refresh idempotent.
- Khi bam activate policy `INACTIVE`, nen mo confirm modal:

```text
Activate this environment policy?
This will make it the active CO2 saved formula and deactivate the current active policy.
```

- Sau khi API thanh cong:
  - show toast success
  - update row target thanh `ACTIVE`
  - update cac row ACTIVE khac thanh `INACTIVE`
  - refetch `GET /environment/policies`
  - refetch `GET /environment/policies/active`

Goi y error handling:

- `401`: redirect login hoac clear session.
- `403`: an action admin hoac hien "Admin permission required".
- `400` validation: hien "Invalid policy id" neu loi tu URL/router.
- `404`: hien "Environment policy not found" va refetch list.
- `409`: hien "Cannot activate suspended or banned environment policy" va refetch list.
- `500`: hien generic server error, khong tu update UI optimistic.

Khong nen optimistic update truoc khi response success. Activate policy la thao tac config quan trong, nen doi server confirm roi moi update UI.

## 9. TypeScript type goi y cho frontend

```ts
export type EnvironmentPolicyStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "BANNED";

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
  status: EnvironmentPolicyStatus;
  active_from: string | null;
  active_to: string | null;
  formula_config: EnvironmentPolicyFormulaConfig;
  created_at: string;
  updated_at: string;
};
```

Activate function mau:

```ts
export async function activateEnvironmentPolicy(
  policyId: string,
  accessToken: string,
): Promise<EnvironmentPolicy> {
  const response = await fetch(
    `/environment/policies/${policyId}/activate`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw body;
  }

  return body as EnvironmentPolicy;
}
```

Neu frontend co base API URL rieng:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

await fetch(`${API_BASE_URL}/environment/policies/${policyId}/activate`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 10. Acceptance checklist cho frontend

- Login admin thanh cong va authorize duoc Scalar.
- Tao duoc 2 policy `INACTIVE` bang `POST /environment/policies`.
- Activate policy A thanh cong, A thanh `ACTIVE`.
- Activate policy B thanh cong, A thanh `INACTIVE`, B thanh `ACTIVE`.
- Goi lai activate B van thanh cong, khong bao loi.
- `GET /environment/policies/active` tra ve B.
- `GET /environment/policies?status=ACTIVE` chi tra ve 1 item.
- pgAdmin query `active_count` tra ve `1`.
- Invalid UUID tra `400`.
- UUID khong ton tai tra `404`.
- User khong phai admin tra `403`.
- Policy `SUSPENDED` hoac `BANNED` tra `409`.
- UI khong gui body khi activate.
- UI khong sua `formula_config` khi activate.
- UI refresh list va active policy sau khi activate thanh cong.

## 11. Luu y cho Phase 1

- `co2_saved_per_km` co y nghia la `net_saved_ef_g_per_km`.
- Don vi cua `co2_saved_per_km` la `gCO2e/km`.
- Cac response lien quan CO2 dung `gCO2e`.
- Activate policy moi khong tinh lai du lieu cu trong `environmental_impact_stats`.
- Du lieu lich su da tinh giu nguyen vi moi impact da co `policy_id` va `policy_snapshot`.
- Neu DB co du lieu cu voi nhieu row `ACTIVE`, API activate se don lai de chi con target policy la `ACTIVE`.
