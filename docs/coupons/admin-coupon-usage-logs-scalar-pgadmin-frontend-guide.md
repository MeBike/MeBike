# Admin Coupon Usage Logs Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
GET /v1/admin/coupon-usage-logs
```

Muc tieu API:

- cho admin xem danh sach rental da duoc ap Global Auto Discount Policy V1 that su vao bill
- API nay la API quan tri de audit va tra cuu lich su usage
- API nay chi doc du lieu
- API nay khong preview discount
- API nay khong apply discount moi
- API nay khong finalize billing
- API nay lay du lieu tu `rental_billing_records` + `"Rental"` da finalize that
- API nay khong dung `user_coupons`
- API nay khong dung `coupons`

Guide nay giup frontend team:

- login va test tu dau trong Scalar
- dung duoc data that ngay sau `pnpm seed:demo`
- hieu ro response shape de code giao dien audit list
- hieu ro filter, sort, pagination va cac gioi han hien tai
- doi chieu du lieu trong pgAdmin de debug va verify

Guide lien quan:

- `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-stats-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-list-scalar-pgadmin-frontend-guide.md`

## 1. Business baseline ma frontend can hieu dung

MeBike Global Auto Discount Policy V1:

- MeBike Coupon V1 la chinh sach giam gia tu dong toan he thong theo `billableMinutes`
- user khong can nhan coupon rieng
- admin cau hinh cac global `coupon_rules`
- rule dang `ACTIVE` thi toan bo user du dieu kien deu co the duoc ap dung
- chi ap dung discount cho rental thanh toan bang wallet
- chi ap dung khi rental khong co `subscription_id`
- neu rental co `subscription_id` thi khong ap discount, ke ca con phan tien du phai tra bang wallet
- moi rental toi da 1 discount
- neu nhieu rule active cung hop le khi tinh bill, he thong chon rule co discount tot nhat
- discount chi ap vao `eligibleRentalAmount`, khong ap vao deposit forfeited, phi ngoai rental hoac phi phat sinh khac; V1 hien tai khong co penalty rieng
- preview va finalize rental end dung chung logic global rules

Luu y quan trong cho frontend:

- API nay khong doc preview
- API nay chi doc usage da finalize that
- API nay chi tra rental co `coupon_discount_amount > 0`
- API nay mac dinh sort moi nhat truoc theo `rental_billing_records.created_at desc`
- DB hien tai chua luu `applied ruleId` tai thoi diem finalize
- vi vay API hien tai khong tra `ruleId`
- `derivedTier` chi la field suy ra tu `coupon_discount_amount`, khong phai rule snapshot that

## 2. Chuan bi moi truong

Chay backend chinh:

```bash
cd D:\do_an_3\MeBike

docker compose -f apps/server/compose.dev.yml up -d db redis pgadmin

cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm prisma migrate deploy
pnpm seed:demo
pnpm dev:build
```

Mo:

- Scalar: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- pgAdmin: `http://localhost:5050/browser/`

Neu `pnpm seed:demo` fail voi `ECONNREFUSED`:

- thuong la Postgres local chua chay
- check lai `docker compose -f apps/server/compose.dev.yml up -d db redis pgadmin`
- `.env` mac dinh dang tro toi:

```text
postgresql://mebike:mebike@localhost:5432/mebike_dev
```

Neu Scalar chua thay endpoint moi:

1. restart `pnpm dev:build`
2. reload `http://localhost:4000/docs`
3. tim endpoint `GET /v1/admin/coupon-usage-logs`

## 3. Tai khoan demo de test

Sau `pnpm seed:demo`, dung cac login demo that:

Admin de test happy path:

```text
email: admin@mebike.local
password: Demo@123456
```

User thuong de test `403`:

```text
email: user01@mebike.local
password: Demo@123456
```

Them mot user de doi chieu data:

```text
email: user02@mebike.local
password: Demo@123456
```

## 4. Cach login trong Scalar

Trong Scalar:

1. goi `POST /v1/auth/login`
2. body admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

3. ky vong:
   - HTTP `200`
   - response co `data.accessToken`
   - response co `data.refreshToken`
4. copy `data.accessToken`
5. bam `Authorize`
6. paste token vao bearer auth

Response login mau:

```json
{
  "data": {
    "accessToken": "PUT_ACCESS_TOKEN_HERE",
    "refreshToken": "PUT_REFRESH_TOKEN_HERE"
  }
}
```

Neu test `403`:

1. login bang user thuong:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

2. dung token user do goi `GET /v1/admin/coupon-usage-logs`
3. ky vong `403`

Neu test `401`:

- clear token trong Scalar
- goi lai endpoint

## 5. API contract ma frontend can bam theo

### 5.1. Endpoint

```text
GET /v1/admin/coupon-usage-logs
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

### 5.2. Query params

Tat ca query params deu optional:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `page` | integer | mac dinh `1` |
| `pageSize` | integer | mac dinh `20` |
| `from` | date hoac datetime | lower bound theo `"Rental".end_time` |
| `to` | date hoac datetime | upper bound theo `"Rental".end_time` |
| `userId` | uuid v7 | filter theo `"Rental".user_id` |
| `rentalId` | uuid v7 | filter theo `rental_billing_records.rental_id` |
| `discountAmount` | integer > 0 | filter exact theo `coupon_discount_amount` |
| `subscriptionApplied` | boolean | filter anomaly audit theo `"Rental".subscription_id` |

Vi du:

```text
GET /v1/admin/coupon-usage-logs
GET /v1/admin/coupon-usage-logs?page=1&pageSize=20
GET /v1/admin/coupon-usage-logs?discountAmount=2000
GET /v1/admin/coupon-usage-logs?subscriptionApplied=false
GET /v1/admin/coupon-usage-logs?userId=<uuid>
GET /v1/admin/coupon-usage-logs?rentalId=<uuid>
GET /v1/admin/coupon-usage-logs?from=2026-03-01&to=2026-03-31
```

Luu y rat quan trong:

- `from/to` filter theo ngay rental ket thuc: `"Rental".end_time`
- `appliedAt` van la thoi diem billing record duoc tao, dung de audit/sort, nhung khong phai moc filter date range
- cach nay giup `GET /v1/admin/coupon-stats` va `GET /v1/admin/coupon-usage-logs` cung dung mot y nghia ngay: ngay chuyen xe ket thuc

### 5.3. Response shape

Response thanh cong:

```json
{
  "data": [
    {
      "rentalId": "019b17bd-d130-7e7d-be69-91ceef7b9991",
      "userId": "019b17bd-d130-7e7d-be69-91ceef7b9992",
      "pricingPolicyId": "019b17bd-d130-7e7d-be69-91ceef7b7001",
      "rentalStatus": "COMPLETED",
      "startTime": "2026-03-15T09:00:00.000Z",
      "endTime": "2026-03-15T15:00:00.000Z",
      "totalDurationMinutes": 360,
      "baseAmount": 12000,
      "prepaidAmount": 0,
      "subscriptionApplied": false,
      "subscriptionDiscountAmount": 0,
      "couponDiscountAmount": 6000,
      "totalAmount": 6000,
      "appliedAt": "2026-04-17T15:03:12.345Z",
      "derivedTier": "TIER_6H_PLUS"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 53,
    "totalPages": 3
  }
}
```

Y nghia field:

- `rentalId`: rental da duoc ap discount that
- `userId`: owner cua rental
- `pricingPolicyId`: pricing policy da dung luc finalize
- `rentalStatus`: hien tai se la `COMPLETED`
- `startTime`, `endTime`: thong tin rental de frontend hien thi history
- `totalDurationMinutes`: duration da ghi vao billing record
- `baseAmount`: base rental amount truoc coupon
- `prepaidAmount`: prepaid tu reservation neu co, hien duoc suy tu `Reservation.prepaid`
- `subscriptionApplied`: `true` neu rental co `subscription_id`
- `subscriptionDiscountAmount`: phan giam do subscription
- `couponDiscountAmount`: so tien global auto discount that su da ghi vao bill
- `totalAmount`: tong tien rental sau discount trong billing record
- `appliedAt`: thoi diem billing record duoc tao
- `derivedTier`: tier suy ra tu amount

### 5.4. Mapping `derivedTier`

Backend hien suy ra:

| couponDiscountAmount | derivedTier |
| ---: | --- |
| `1000` | `TIER_1H_2H` |
| `2000` | `TIER_2H_4H` |
| `4000` | `TIER_4H_6H` |
| `6000` | `TIER_6H_PLUS` |

Luu y:

- day la suy ra theo amount
- khong phai rule snapshot that
- neu sau nay co amount khac do rule thay doi hoac amount bi cap, `derivedTier` co the la `null`

## 6. Nguon du lieu va gioi han hien tai

Frontend can hieu ro de tranh code sai:

- API nay lay tu `rental_billing_records`
- backend join them sang `"Rental"` va `Reservation`
- API nay chi lay record co `coupon_discount_amount > 0`
- API nay khong query `user_coupons`
- API nay khong query `coupons`
- schema hien tai chua luu `applied_coupon_rule_id`
- vi vay frontend khong the hien thi rule id thuc te da ap cho tung log
- `prepaidAmount` hien la du lieu doc theo reservation hien co, khong phai snapshot rieng trong billing record

## 7. Data that co san ngay sau `pnpm seed:demo`

### 7.1. Rule mac dinh dang active

Ngay sau `seed:demo`, he thong co 4 global rule mac dinh:

| Rule | minRidingMinutes | discountValue |
| --- | ---: | ---: |
| `Ride 1h discount` | `60` | `1000` |
| `Ride 2h discount` | `120` | `2000` |
| `Ride 4h discount` | `240` | `4000` |
| `Ride 6h discount` | `360` | `6000` |

### 7.2. Exact baseline all-time cho usage logs

Ngay sau `pnpm seed:demo` tren DB sach, frontend co the ky vong:

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 53,
    "totalPages": 3
  }
}
```

Breakdown exact:

| couponDiscountAmount | rentalsCount | derivedTier |
| ---: | ---: | --- |
| `1000` | `18` | `TIER_1H_2H` |
| `2000` | `15` | `TIER_2H_4H` |
| `4000` | `12` | `TIER_4H_6H` |
| `6000` | `8` | `TIER_6H_PLUS` |

Tong exact:

- total usage logs: `53`
- total discount amount: `144000`
- `subscriptionApplied=false`: `53`
- `subscriptionApplied=true`: `0`

Vi sao la `53`:

- seed demo tao `60` completed rentals qua lifecycle that
- `7` rental completed khong co coupon:
  - `3` rental wallet co billable minutes < `60`
  - `4` rental co `subscription_id`
- con lai `53` rental co `coupon_discount_amount > 0`

### 7.3. Pagination exact voi `pageSize=20`

Neu goi:

```text
GET /v1/admin/coupon-usage-logs?page=1&pageSize=20
```

Ky vong:

- `pagination.total = 53`
- `pagination.totalPages = 3`
- `data.length = 20`

Neu goi:

```text
GET /v1/admin/coupon-usage-logs?page=2&pageSize=20
```

Ky vong:

- `data.length = 20`

Neu goi:

```text
GET /v1/admin/coupon-usage-logs?page=3&pageSize=20
```

Ky vong:

- `data.length = 13`

## 8. Scalar test cases ma frontend nen tu test

### 8.1. Admin token hop le -> `200`

Request:

```text
GET /v1/admin/coupon-usage-logs
```

Ky vong:

- HTTP `200`
- response dung shape `{ data, pagination }`
- `pagination.total = 53`
- `pagination.totalPages = 3`
- `data[0].couponDiscountAmount > 0`
- tat ca item deu co `rentalStatus = COMPLETED`

### 8.2. Khong co token -> `401`

Request:

```text
GET /v1/admin/coupon-usage-logs
```

Khong authorize.

Ky vong:

- HTTP `401`

### 8.3. User token khong phai admin -> `403`

Request:

```text
GET /v1/admin/coupon-usage-logs
```

Dung token cua `user01@mebike.local`.

Ky vong:

- HTTP `403`

### 8.4. Filter theo `discountAmount = 1000`

Request:

```text
GET /v1/admin/coupon-usage-logs?discountAmount=1000
```

Ky vong:

- `pagination.total = 18`
- moi item deu co `couponDiscountAmount = 1000`
- moi item deu co `derivedTier = TIER_1H_2H`

### 8.5. Filter theo `discountAmount = 2000`

Request:

```text
GET /v1/admin/coupon-usage-logs?discountAmount=2000
```

Ky vong:

- `pagination.total = 15`
- moi item deu co `derivedTier = TIER_2H_4H`

### 8.6. Filter theo `discountAmount = 4000`

Request:

```text
GET /v1/admin/coupon-usage-logs?discountAmount=4000
```

Ky vong:

- `pagination.total = 12`
- moi item deu co `derivedTier = TIER_4H_6H`

### 8.7. Filter theo `discountAmount = 6000`

Request:

```text
GET /v1/admin/coupon-usage-logs?discountAmount=6000
```

Ky vong:

- `pagination.total = 8`
- moi item deu co `derivedTier = TIER_6H_PLUS`

### 8.8. Filter theo `subscriptionApplied = false`

Request:

```text
GET /v1/admin/coupon-usage-logs?subscriptionApplied=false
```

Ky vong:

- `pagination.total = 53`

### 8.9. Filter theo `subscriptionApplied = true`

Request:

```text
GET /v1/admin/coupon-usage-logs?subscriptionApplied=true
```

Ky vong:

- HTTP `200`
- `data = []`
- `pagination.total = 0`

Luu y:

- day la expected dung theo business baseline
- rental co `subscription_id` thi khong duoc ap global auto discount

### 8.10. Empty state do filter khong match

Request:

```text
GET /v1/admin/coupon-usage-logs?discountAmount=999999
```

Ky vong:

- HTTP `200`
- `data = []`
- `pagination.total = 0`

### 8.11. Validation error do khoang thoi gian sai

Request:

```text
GET /v1/admin/coupon-usage-logs?from=2026-04-18&to=2026-04-17
```

Ky vong:

- HTTP `400`
- `error = Invalid request payload`
- `details.code = VALIDATION_ERROR`

### 8.12. Filter `from/to` theo ngay rental ket thuc

`from/to` cua API nay filter theo `"Rental".end_time`, khong filter theo `rental_billing_records.created_at`.
Sau `seed:demo`, frontend nen lay khoang `end_time` that trong pgAdmin truoc.

Chay SQL:

```sql
SELECT
  MIN(r.end_time) AS min_end_time,
  MAX(r.end_time) AS max_end_time,
  COUNT(*) AS total_logs
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
WHERE rb.coupon_discount_amount > 0;
```

Sau do goi:

```text
GET /v1/admin/coupon-usage-logs?from=<min_end_time>&to=<max_end_time>
```

Ky vong:

- `pagination.total = 53`

Neu muon test empty range:

```text
GET /v1/admin/coupon-usage-logs?from=2025-01-01T00:00:00.000Z&to=2025-01-01T23:59:59.999Z
```

Ky vong:

- `data = []`

### 8.13. Filter theo `userId`

`userId` duoc generate luc seed, nen frontend can lay UUID that trong DB.

Goi SQL:

```sql
SELECT id, email
FROM users
WHERE email IN ('user01@mebike.local', 'user02@mebike.local');
```

Data deterministic co the dua vao:

- `user01@mebike.local` co `2` usage logs discounted
- `user02@mebike.local` co `3` usage logs discounted

Sau khi lay `userId` that, goi:

```text
GET /v1/admin/coupon-usage-logs?userId=<user01_uuid>
```

Ky vong:

- `pagination.total = 2`

Hoac:

```text
GET /v1/admin/coupon-usage-logs?userId=<user02_uuid>
```

Ky vong:

- `pagination.total = 3`

### 8.14. Filter theo `rentalId`

Do `rentalId` completed rentals duoc generate luc seed, frontend nen lay tu SQL.

Vi du lay 1 rental cua `user02@mebike.local`:

```sql
SELECT
  rb.rental_id,
  u.email,
  rb.coupon_discount_amount,
  rb.created_at AS applied_at
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user02@mebike.local'
  AND rb.coupon_discount_amount > 0
ORDER BY rb.created_at DESC;
```

Lay 1 `rental_id` trong ket qua va goi:

```text
GET /v1/admin/coupon-usage-logs?rentalId=<rental_id_that>
```

Ky vong:

- `pagination.total = 1`
- `data.length = 1`

## 9. pgAdmin: bang can kiem tra

Toi thieu:

- `rental_billing_records`
- `"Rental"`
- `coupon_rules`

Nen kiem tra them neu can:

- `"Reservation"`
- `wallet_transactions`
- `return_confirmations`

## 10. SQL de doi chieu du lieu voi API

### 10.1. Query gan nhat voi usage logs API

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.user_id,
  rb.pricing_policy_id,
  r.status AS rental_status,
  r.start_time,
  r.end_time,
  rb.total_duration_minutes,
  rb.base_amount,
  COALESCE(res.prepaid, 0) AS prepaid_amount,
  (r.subscription_id IS NOT NULL) AS subscription_applied,
  rb.subscription_discount_amount,
  rb.coupon_discount_amount,
  rb.total_amount,
  rb.created_at AS applied_at,
  CASE rb.coupon_discount_amount
    WHEN 1000 THEN 'TIER_1H_2H'
    WHEN 2000 THEN 'TIER_2H_4H'
    WHEN 4000 THEN 'TIER_4H_6H'
    WHEN 6000 THEN 'TIER_6H_PLUS'
    ELSE NULL
  END AS derived_tier
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
LEFT JOIN "Reservation" res ON res.id = r.reservation_id
WHERE rb.coupon_discount_amount > 0
ORDER BY rb.created_at DESC, rb.id DESC;
```

### 10.2. Breakdown exact all-time

```sql
SELECT
  rb.coupon_discount_amount,
  COUNT(*) AS rentals_count,
  SUM(rb.coupon_discount_amount) AS total_discount_amount
FROM rental_billing_records rb
WHERE rb.coupon_discount_amount > 0
GROUP BY rb.coupon_discount_amount
ORDER BY rb.coupon_discount_amount ASC;
```

Ky vong sau `seed:demo`:

| coupon_discount_amount | rentals_count | total_discount_amount |
| ---: | ---: | ---: |
| `1000` | `18` | `18000` |
| `2000` | `15` | `30000` |
| `4000` | `12` | `48000` |
| `6000` | `8` | `48000` |

### 10.3. Tong so usage logs

```sql
SELECT COUNT(*) AS total_usage_logs
FROM rental_billing_records rb
WHERE rb.coupon_discount_amount > 0;
```

Ky vong:

```text
53
```

### 10.4. Kiem tra anomaly `subscriptionApplied=true`

```sql
SELECT COUNT(*) AS unexpected_logs
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
WHERE rb.coupon_discount_amount > 0
  AND r.subscription_id IS NOT NULL;
```

Ky vong:

```text
0
```

### 10.5. Lay `userId` that de test filter

```sql
SELECT id, email
FROM users
WHERE email IN ('user01@mebike.local', 'user02@mebike.local')
ORDER BY email;
```

### 10.6. Verify so log cua `user01` va `user02`

```sql
SELECT
  u.email,
  COUNT(*) AS discounted_usage_logs
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
WHERE rb.coupon_discount_amount > 0
  AND u.email IN ('user01@mebike.local', 'user02@mebike.local')
GROUP BY u.email
ORDER BY u.email;
```

Ky vong:

| email | discounted_usage_logs |
| --- | ---: |
| `user01@mebike.local` | `2` |
| `user02@mebike.local` | `3` |

### 10.7. Lay `rentalId` that de test `rentalId` filter

```sql
SELECT
  rb.rental_id,
  u.email,
  rb.coupon_discount_amount,
  rb.created_at
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
WHERE rb.coupon_discount_amount > 0
ORDER BY rb.created_at DESC
LIMIT 10;
```

Lay 1 `rental_id` bat ky trong ket qua de test:

```text
GET /v1/admin/coupon-usage-logs?rentalId=<rental_id_that>
```

## 11. Frontend mapping goi y

Frontend admin audit screen cho usage logs co the chia nhu sau:

- filter bar:
  - `from`
  - `to`
  - `userId`
  - `rentalId`
  - `discountAmount`
  - `subscriptionApplied`
- data table:
  - rentalId
  - userId
  - appliedAt
  - startTime
  - endTime
  - totalDurationMinutes
  - baseAmount
  - prepaidAmount
  - subscriptionDiscountAmount
  - couponDiscountAmount
  - totalAmount
  - derivedTier
- pagination footer:
  - page
  - pageSize
  - total
  - totalPages
- empty state:
  - khi `data = []`

UI note:

- `endTime` la field quan trong nhat cho filter ngay bao cao
- `appliedAt` la field audit/sort cho thoi diem billing record duoc tao
- `couponDiscountAmount` nen format VND
- `derivedTier` co the render bang badge
- `subscriptionApplied=true` la anomaly filter, frontend co the dat label ro de tranh hieu nham
- `prepaidAmount` khong phai snapshot rieng trong billing record, nen co the xem la field bo tro

## 12. TypeScript shape goi y cho frontend

```ts
export type CouponUsageDerivedTier =
  | "TIER_1H_2H"
  | "TIER_2H_4H"
  | "TIER_4H_6H"
  | "TIER_6H_PLUS";

export type AdminCouponUsageLog = {
  rentalId: string;
  userId: string;
  pricingPolicyId: string;
  rentalStatus: "RENTED" | "COMPLETED" | "CANCELLED";
  startTime: string;
  endTime: string | null;
  totalDurationMinutes: number;
  baseAmount: number;
  prepaidAmount: number;
  subscriptionApplied: boolean;
  subscriptionDiscountAmount: number;
  couponDiscountAmount: number;
  totalAmount: number;
  appliedAt: string;
  derivedTier: CouponUsageDerivedTier | null;
};

export type AdminCouponUsageLogsResponse = {
  data: AdminCouponUsageLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
```

## 13. Fetch sample cho frontend

```ts
type ListAdminCouponUsageLogsParams = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  userId?: string;
  rentalId?: string;
  discountAmount?: number;
  subscriptionApplied?: boolean;
};

export async function listAdminCouponUsageLogs(
  accessToken: string,
  params: ListAdminCouponUsageLogsParams = {},
) {
  const search = new URLSearchParams();

  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.userId) search.set("userId", params.userId);
  if (params.rentalId) search.set("rentalId", params.rentalId);
  if (params.discountAmount !== undefined) {
    search.set("discountAmount", String(params.discountAmount));
  }
  if (params.subscriptionApplied !== undefined) {
    search.set("subscriptionApplied", String(params.subscriptionApplied));
  }

  const response = await fetch(
    `/v1/admin/coupon-usage-logs?${search.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response;
}
```

## 14. Checklist test nhanh cho team frontend

Sau `pnpm seed:demo`:

- [ ] login admin `admin@mebike.local / Demo@123456`
- [ ] login user `user01@mebike.local / Demo@123456`
- [ ] `GET /v1/admin/coupon-usage-logs` voi admin tra `200`
- [ ] `pagination.total = 53`
- [ ] `page=1&pageSize=20` tra `20` item
- [ ] `page=3&pageSize=20` tra `13` item
- [ ] khong token thi `401`
- [ ] user token thi `403`
- [ ] `discountAmount=1000` tra `18`
- [ ] `discountAmount=2000` tra `15`
- [ ] `discountAmount=4000` tra `12`
- [ ] `discountAmount=6000` tra `8`
- [ ] `subscriptionApplied=false` tra `53`
- [ ] `subscriptionApplied=true` tra `0`
- [ ] `discountAmount=999999` tra empty state
- [ ] `from > to` tra `400`
- [ ] query SQL all-time breakdown trong pgAdmin ra dung `18 / 15 / 12 / 8`
- [ ] query anomaly `subscriptionApplied=true` trong pgAdmin ra `0`
- [ ] lay `userId` that cua `user01` va verify API tra `2` logs
- [ ] lay `userId` that cua `user02` va verify API tra `3` logs
- [ ] lay `rentalId` that bat ky va verify API tra `1` row

## 15. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login admin `admin@mebike.local / Demo@123456`
3. goi `GET /v1/admin/coupon-usage-logs`
4. mong doi:
   - `total = 53`
   - `1000 => 18`
   - `2000 => 15`
   - `4000 => 12`
   - `6000 => 8`
5. mo pgAdmin va chay SQL breakdown de doi chieu
6. dung `user01` va `user02` de test `userId` filter
7. dung `rental_id` lay tu SQL de test `rentalId` filter
8. dung khoang `end_time` that lay tu SQL de test `from/to`

Neu UI list, filter, pagination, empty state va formatting VND hien thi dung bo so tren thi frontend da bam dung contract hien tai cua backend cho usage logs.
