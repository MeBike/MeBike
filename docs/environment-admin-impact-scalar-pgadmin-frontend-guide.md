# Environment Admin Impact Scalar + pgAdmin Guide

Guide nay dung de verify cac API admin read-only cho Environment Impact Phase 1.

API moi:

- `GET /environment/impacts`
- `GET /environment/impacts/{impactId}`
- `GET /environment/users/{userId}/summary`

Nguyen tac:

- Tat ca API moi can role `ADMIN`.
- API chi doc bang `environmental_impact_stats`.
- Khong calculate impact moi.
- Khong update DB.
- Khong trigger repair job.
- `co2_saved` la gram CO2e va response luon co `co2_saved_unit = "gCO2e"`.
- Date filter dung UTC. Date-only `YYYY-MM-DD` duoc hieu la UTC day boundary.

## 1. Chay server va mo Scalar

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm dev
```

Mo:

- Scalar: `http://localhost:4000/docs`
- pgAdmin: `http://localhost:5050/browser/`

## 2. Login admin trong Scalar

Dung `POST /v1/auth/login` hoac route login hien co trong Scalar.

Body demo thuong dung:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Copy `accessToken` vao Authorize/Bearer token cua Scalar.

## 3. Tao Environment Impact data

Cac API admin moi chi doc impact da co san. Neu rental completed nhung chua co row trong
`environmental_impact_stats`, rental do se khong hien trong list.

Co 2 cach tao data:

1. Dung worker/flow hien co de calculate impact sau khi rental completed.
2. Goi internal/admin calculate API:

```text
POST /internal/environment/calculate-from-rental/{rentalId}
```

Ky vong:

- `200`
- response co `id`, `user_id`, `rental_id`, `policy_id`
- `co2_saved_unit = "gCO2e"`
- row moi nam trong `environmental_impact_stats`

API calculate nay la cach tao data de test. Cac API admin list/detail/summary ben duoi khong goi calculate lai.

## 4. Kiem tra data trong pgAdmin

Danh sach impact:

```sql
SELECT id, user_id, rental_id, policy_id, estimated_distance_km, co2_saved, policy_snapshot, calculated_at
FROM environmental_impact_stats
ORDER BY calculated_at DESC;
```

Summary cho mot user:

```sql
SELECT
  COUNT(*) AS total_trips_counted,
  COALESCE(SUM(estimated_distance_km), 0) AS total_estimated_distance_km,
  COALESCE(SUM(co2_saved), 0) AS total_co2_saved
FROM environmental_impact_stats
WHERE user_id = '<user-id>';
```

Lay nhanh cac id can test:

```sql
SELECT
  eis.id AS impact_id,
  eis.user_id,
  u.email,
  eis.rental_id,
  eis.policy_id,
  eis.estimated_distance_km,
  eis.co2_saved,
  eis.calculated_at
FROM environmental_impact_stats eis
LEFT JOIN users u ON u.id = eis.user_id
ORDER BY eis.calculated_at DESC;
```

## 5. Test admin list impacts

Trong Scalar goi:

```text
GET /environment/impacts
```

Query co the dung:

```text
page=1
pageSize=20
sortOrder=desc
```

Expected:

```json
{
  "data": [
    {
      "id": "...",
      "user_id": "...",
      "rental_id": "...",
      "policy_id": "...",
      "estimated_distance_km": 4,
      "co2_saved": 255,
      "co2_saved_unit": "gCO2e",
      "distance_source": "TIME_SPEED",
      "raw_rental_minutes": 23,
      "effective_ride_minutes": 20,
      "calculated_at": "2026-04-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Luu y response list theo convention hien tai cua server la `data + pagination`.

## 6. Test filters

Filter theo user:

```text
GET /environment/impacts?userId=<user-id>
```

Filter theo rental:

```text
GET /environment/impacts?rentalId=<rental-id>
```

Filter theo policy:

```text
GET /environment/impacts?policyId=<policy-id>
```

Filter theo UTC date-only:

```text
GET /environment/impacts?dateFrom=2026-04-15&dateTo=2026-04-15
```

Rule:

- `dateFrom=2026-04-15` => `2026-04-15T00:00:00.000Z`
- `dateTo=2026-04-15` => `2026-04-15T23:59:59.999Z`
- Neu frontend muon loc theo ngay Viet Nam, frontend phai convert local day sang UTC datetime truoc.

Vi du ngay Viet Nam `2026-04-15`:

```text
GET /environment/impacts?dateFrom=2026-04-14T17:00:00.000Z&dateTo=2026-04-15T16:59:59.999Z
```

## 7. Test admin detail impact

Lay `impact_id` tu SQL section 4, sau do goi:

```text
GET /environment/impacts/{impactId}
```

Expected:

```json
{
  "id": "...",
  "user_id": "...",
  "rental_id": "...",
  "policy_id": "...",
  "estimated_distance_km": 4,
  "co2_saved": 255,
  "co2_saved_unit": "gCO2e",
  "raw_rental_minutes": 23,
  "effective_ride_minutes": 20,
  "return_scan_buffer_minutes": 3,
  "average_speed_kmh": 12,
  "co2_saved_per_km": 75,
  "co2_saved_per_km_unit": "gCO2e/km",
  "confidence_factor": 0.85,
  "distance_source": "TIME_SPEED",
  "formula_version": "PHASE_1_TIME_SPEED",
  "policy_snapshot": {
    "policy_id": "...",
    "policy_name": "Default Environment Policy v1",
    "average_speed_kmh": 12,
    "co2_saved_per_km": 75,
    "co2_saved_per_km_unit": "gCO2e/km",
    "return_scan_buffer_minutes": 3,
    "confidence_factor": 0.85,
    "raw_rental_minutes": 23,
    "effective_ride_minutes": 20,
    "estimated_distance_km": 4,
    "co2_saved": 255,
    "co2_saved_unit": "gCO2e",
    "distance_source": "TIME_SPEED",
    "formula_version": "PHASE_1_TIME_SPEED"
  },
  "calculated_at": "2026-04-15T10:30:00.000Z"
}
```

Expected error:

- `impactId` invalid: `400`
- impact khong ton tai: `404`, error `"Environment impact not found"`
- user thuong goi API: `403`
- chua login: `401`

## 8. Test admin user summary

Goi:

```text
GET /environment/users/{userId}/summary
```

Expected khi co data:

```json
{
  "user_id": "...",
  "total_trips_counted": 3,
  "total_estimated_distance_km": 7.4,
  "total_co2_saved": 472,
  "co2_saved_unit": "gCO2e"
}
```

Expected khi user khong co impact record:

```json
{
  "user_id": "...",
  "total_trips_counted": 0,
  "total_estimated_distance_km": 0,
  "total_co2_saved": 0,
  "co2_saved_unit": "gCO2e"
}
```

Hien tai API nay khong check user ton tai. Ly do: endpoint duoc thiet ke de
aggregate source of truth `environmental_impact_stats` va tra 0 cho UUID khong co
impact, tranh them dependency vao bang `users` cho API read-only/debug.

## 9. Checklist nhanh cho frontend

- List screen dung `GET /environment/impacts`.
- Pagination doc tu `pagination.page`, `pagination.pageSize`, `pagination.total`, `pagination.totalPages`.
- Cot CO2 hien thi gia tri `co2_saved` kem unit `gCO2e`.
- Detail screen dung `GET /environment/impacts/{impactId}`.
- User support/debug screen dung `GET /environment/users/{userId}/summary`.
- Khong hien thi rental completed chua co impact trong admin list, vi source of truth la `environmental_impact_stats`.

