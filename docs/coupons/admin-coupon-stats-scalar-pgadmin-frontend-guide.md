# Admin Coupon Stats Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
GET /v1/admin/coupon-stats
```

Muc tieu API:

- cho admin xem thong ke tong quan hieu qua Global Auto Discount Policy V1
- API nay la API quan tri
- API nay chi doc du lieu
- API nay khong tinh lai discount cho rental cu
- API nay khong apply discount moi
- API nay khong finalize billing
- API nay lay so lieu tu billing va rental da duoc ghi that trong DB
- API nay khong lay du lieu tu `user_coupons`

Guide nay giup frontend team:

- login va test API tren Scalar
- dung duoc data that ngay sau `pnpm seed:demo`
- doi chieu data trong pgAdmin
- hieu dung response shape de code giao dien summary + breakdown
- biet ro gioi han hien tai cua `topAppliedRule`

Guide lien quan:

- `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-list-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-create-scalar-pgadmin-frontend-guide.md`

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
- discount chi ap vao `eligibleRentalAmount`, khong ap vao penalty, deposit forfeited, phi ngoai rental hoac phi phat sinh khac
- preview va finalize rental end dung chung logic global rules

Luu y quan trong cho frontend:

- API stats nay khong phai API tinh discount
- API nay chi tong hop tren du lieu finalize that da co trong `rental_billing_records`
- vi DB hien tai chua luu `applied_coupon_rule_id`, field `topAppliedRule` hien tra `null`

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

Neu Scalar chua thay endpoint moi:

1. restart `pnpm dev:build`
2. reload `http://localhost:4000/docs`
3. tim endpoint `GET /v1/admin/coupon-stats`

## 3. Tai khoan demo de test

Sau `pnpm seed:demo`, dung admin demo:

```text
email: admin@mebike.local
password: Demo@123456
```

Token user thuong de test `403`:

```text
email: user01@mebike.local
password: Demo@123456
```

## 4. Cach login trong Scalar

Trong Scalar:

1. goi `POST /v1/auth/login`
2. body:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

3. ky vong:
   - HTTP `200`
   - response co `data.accessToken`
4. copy `accessToken`
5. bam `Authorize`
6. paste bearer token vao o token

Neu test `403`:

1. login bang:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

2. dung token user do goi `GET /v1/admin/coupon-stats`
3. ky vong `403`

Neu test `401`:

- clear token trong Scalar
- goi lai endpoint

## 5. API contract ma frontend can bam theo

### 5.1. Endpoint

```text
GET /v1/admin/coupon-stats
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

Tat ca query params deu optional, nhung hien tai backend chi chap nhan:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `from` | date hoac datetime | neu truyen kieu `YYYY-MM-DD` thi backend convert thanh `T00:00:00.000Z` |
| `to` | date hoac datetime | neu truyen kieu `YYYY-MM-DD` thi backend convert thanh `T23:59:59.999Z` |

Luu y:

- hien tai frontend nen gui `from` va `to` cung nhau
- neu chi gui 1 ben, backend se tra `400`
- hien tai chua co `stationId`

Vi du:

```text
GET /v1/admin/coupon-stats
GET /v1/admin/coupon-stats?from=2026-04-01&to=2026-04-30
GET /v1/admin/coupon-stats?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z
```

### 5.3. Response shape

Response thanh cong:

```json
{
  "range": {
    "from": "2026-04-01T00:00:00.000Z",
    "to": "2026-04-30T23:59:59.999Z"
  },
  "summary": {
    "totalCompletedRentals": 30,
    "discountedRentalsCount": 27,
    "nonDiscountedRentalsCount": 3,
    "discountRate": 0.9,
    "totalDiscountAmount": 36000,
    "avgDiscountAmount": 1333.33
  },
  "statsByDiscountAmount": [
    {
      "discountAmount": 1000,
      "rentalsCount": 18,
      "totalDiscountAmount": 18000
    },
    {
      "discountAmount": 2000,
      "rentalsCount": 9,
      "totalDiscountAmount": 18000
    }
  ],
  "topAppliedRule": null
}
```

Y nghia field:

- `range.from`, `range.to`: pham vi filter ma backend da ap dung
- `summary.totalCompletedRentals`: so rental `COMPLETED` trong pham vi
- `summary.discountedRentalsCount`: so rental co `coupon_discount_amount > 0`
- `summary.nonDiscountedRentalsCount`: `totalCompletedRentals - discountedRentalsCount`
- `summary.discountRate`: ty le `discountedRentalsCount / totalCompletedRentals`
- `summary.totalDiscountAmount`: tong `coupon_discount_amount`
- `summary.avgDiscountAmount`: trung binh tren rental co discount, khong tinh rental khong discount
- `statsByDiscountAmount`: breakdown theo muc discount thuc te da ghi vao billing
- `topAppliedRule`: hien tai `null` do DB chua luu rule id da ap

## 6. Data that co san ngay sau `pnpm seed:demo`

Sau khi seed demo moi:

- completed rentals khong con duoc insert tay vao `Rental`
- completed rentals duoc tao qua flow that:
  - reserve
  - confirm reservation
  - create return slot
  - confirm return
  - finalize billing
- vi vay `rental_billing_records` se co data that cho coupon stats

Pricing policy mac dinh:

- `billingUnitMinutes = 30`
- `depositRequired = 500000`

Rule mac dinh:

| Rule | minRidingMinutes | discountValue |
| --- | ---: | ---: |
| 1h | `60` | `1000` |
| 2h | `120` | `2000` |
| 4h | `240` | `4000` |
| 6h | `360` | `6000` |

Luu y quan trong:

- he thong tinh coupon theo `billableMinutes` da round theo block `30` phut
- vi vay rental `40`, `45`, `50` phut deu co the thanh `60` billable minutes va an rule `1000`

### 6.1. Exact baseline khong filter

Ngay sau `pnpm seed:demo`, frontend co the ky vong:

```json
{
  "range": {
    "from": null,
    "to": null
  },
  "summary": {
    "totalCompletedRentals": 60,
    "discountedRentalsCount": 53,
    "nonDiscountedRentalsCount": 7,
    "discountRate": 0.8833,
    "totalDiscountAmount": 144000,
    "avgDiscountAmount": 2716.98
  },
  "statsByDiscountAmount": [
    {
      "discountAmount": 1000,
      "rentalsCount": 18,
      "totalDiscountAmount": 18000
    },
    {
      "discountAmount": 2000,
      "rentalsCount": 15,
      "totalDiscountAmount": 30000
    },
    {
      "discountAmount": 4000,
      "rentalsCount": 12,
      "totalDiscountAmount": 48000
    },
    {
      "discountAmount": 6000,
      "rentalsCount": 8,
      "totalDiscountAmount": 48000
    }
  ],
  "topAppliedRule": null
}
```

Giai thich nhanh vi sao:

- `60` completed rentals duoc tao qua lifecycle that
- `53` rental co `coupon_discount_amount > 0`
- `7` rental khong discount:
  - `3` rental wallet co billable minutes < `60`
  - `4` rental co `subscription_id`, nen khong ap coupon

### 6.2. Exact baseline theo current month va previous month

Neu ban chay seed trong moi truong hien tai ngay `2026-04-17`, completed rentals duoc chia deu:

- `30` rental trong thang hien tai `2026-04`
- `30` rental trong thang truoc `2026-03`

#### Current month `2026-04`

Request:

```text
GET /v1/admin/coupon-stats?from=2026-04-01&to=2026-04-30
```

Ky vong:

```json
{
  "range": {
    "from": "2026-04-01T00:00:00.000Z",
    "to": "2026-04-30T23:59:59.999Z"
  },
  "summary": {
    "totalCompletedRentals": 30,
    "discountedRentalsCount": 27,
    "nonDiscountedRentalsCount": 3,
    "discountRate": 0.9,
    "totalDiscountAmount": 36000,
    "avgDiscountAmount": 1333.33
  },
  "statsByDiscountAmount": [
    {
      "discountAmount": 1000,
      "rentalsCount": 18,
      "totalDiscountAmount": 18000
    },
    {
      "discountAmount": 2000,
      "rentalsCount": 9,
      "totalDiscountAmount": 18000
    }
  ],
  "topAppliedRule": null
}
```

#### Previous month `2026-03`

Request:

```text
GET /v1/admin/coupon-stats?from=2026-03-01&to=2026-03-31
```

Ky vong:

```json
{
  "range": {
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-31T23:59:59.999Z"
  },
  "summary": {
    "totalCompletedRentals": 30,
    "discountedRentalsCount": 26,
    "nonDiscountedRentalsCount": 4,
    "discountRate": 0.8667,
    "totalDiscountAmount": 108000,
    "avgDiscountAmount": 4153.85
  },
  "statsByDiscountAmount": [
    {
      "discountAmount": 2000,
      "rentalsCount": 6,
      "totalDiscountAmount": 12000
    },
    {
      "discountAmount": 4000,
      "rentalsCount": 12,
      "totalDiscountAmount": 48000
    },
    {
      "discountAmount": 6000,
      "rentalsCount": 8,
      "totalDiscountAmount": 48000
    }
  ],
  "topAppliedRule": null
}
```

## 7. Scalar test cases ma frontend nen tu test

### 7.1. Admin token hop le -> `200`

Request:

```text
GET /v1/admin/coupon-stats
```

Ky vong:

- HTTP `200`
- response dung shape
- `summary.totalCompletedRentals = 60`
- `summary.totalDiscountAmount = 144000`
- `statsByDiscountAmount.length = 4`
- `topAppliedRule = null`

### 7.2. Khong co token -> `401`

Request:

```text
GET /v1/admin/coupon-stats
```

Khong authorize.

Ky vong:

- HTTP `401`

### 7.3. User token khong phai admin -> `403`

Request:

```text
GET /v1/admin/coupon-stats
```

Dung token cua `user01@mebike.local`.

Ky vong:

- HTTP `403`

### 7.4. Filter `from/to` current month

Request:

```text
GET /v1/admin/coupon-stats?from=2026-04-01&to=2026-04-30
```

Ky vong:

- `totalCompletedRentals = 30`
- `discountedRentalsCount = 27`
- `nonDiscountedRentalsCount = 3`
- `totalDiscountAmount = 36000`

### 7.5. Filter `from/to` previous month

Request:

```text
GET /v1/admin/coupon-stats?from=2026-03-01&to=2026-03-31
```

Ky vong:

- `totalCompletedRentals = 30`
- `discountedRentalsCount = 26`
- `nonDiscountedRentalsCount = 4`
- `totalDiscountAmount = 108000`

### 7.6. Chi gui `from` hoac chi gui `to` -> `400`

Request vi du:

```text
GET /v1/admin/coupon-stats?from=2026-04-01
```

Ky vong:

- HTTP `400`
- frontend nen validate client side de tranh gui request loi

### 7.7. Breakdown theo muc discount

Request:

```text
GET /v1/admin/coupon-stats
```

Ky vong:

- bucket `1000` co `18` rental
- bucket `2000` co `15` rental
- bucket `4000` co `12` rental
- bucket `6000` co `8` rental
- khong co bucket `0`

Luu y:

- `statsByDiscountAmount` chi tra ve bucket co discount `> 0`
- rental khong discount duoc tinh trong `summary.nonDiscountedRentalsCount`

## 8. pgAdmin: bang can kiem tra

Toi thieu:

- `rental_billing_records`
- `"Rental"`
- `coupon_rules`

Nen kiem tra them neu can:

- `return_confirmations`
- `wallet_transactions`
- `wallet_holds`

## 9. SQL de doi chieu du lieu nen

### 9.1. Xem completed rentals + billing thuc te

```sql
SELECT
  r.id AS rental_id,
  r.status,
  r.start_time,
  r.end_time,
  r.subscription_id,
  r.pricing_policy_id,
  rb.base_amount,
  rb.coupon_discount_amount,
  rb.subscription_discount_amount,
  rb.total_amount,
  rb.created_at
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
ORDER BY rb.created_at DESC;
```

### 9.2. Breakdown all-time theo discount amount

```sql
SELECT
  COALESCE(rb.coupon_discount_amount, 0) AS discount_amount,
  COUNT(*) AS rentals_count,
  SUM(COALESCE(rb.coupon_discount_amount, 0)) AS total_discount_amount
FROM "Rental" r
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
WHERE r.status = 'COMPLETED'
GROUP BY COALESCE(rb.coupon_discount_amount, 0)
ORDER BY discount_amount;
```

Ky vong all-time ngay sau seed:

| discount_amount | rentals_count | total_discount_amount |
| ---: | ---: | ---: |
| `0` | `7` | `0` |
| `1000` | `18` | `18000` |
| `2000` | `15` | `30000` |
| `4000` | `12` | `48000` |
| `6000` | `8` | `48000` |

### 9.3. Breakdown current month `2026-04`

```sql
SELECT
  COALESCE(rb.coupon_discount_amount, 0) AS discount_amount,
  COUNT(*) AS rentals_count,
  SUM(COALESCE(rb.coupon_discount_amount, 0)) AS total_discount_amount
FROM "Rental" r
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
WHERE r.status = 'COMPLETED'
  AND r.end_time >= '2026-04-01T00:00:00.000Z'
  AND r.end_time <= '2026-04-30T23:59:59.999Z'
GROUP BY COALESCE(rb.coupon_discount_amount, 0)
ORDER BY discount_amount;
```

Ky vong:

| discount_amount | rentals_count | total_discount_amount |
| ---: | ---: | ---: |
| `0` | `3` | `0` |
| `1000` | `18` | `18000` |
| `2000` | `9` | `18000` |

### 9.4. Breakdown previous month `2026-03`

```sql
SELECT
  COALESCE(rb.coupon_discount_amount, 0) AS discount_amount,
  COUNT(*) AS rentals_count,
  SUM(COALESCE(rb.coupon_discount_amount, 0)) AS total_discount_amount
FROM "Rental" r
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
WHERE r.status = 'COMPLETED'
  AND r.end_time >= '2026-03-01T00:00:00.000Z'
  AND r.end_time <= '2026-03-31T23:59:59.999Z'
GROUP BY COALESCE(rb.coupon_discount_amount, 0)
ORDER BY discount_amount;
```

Ky vong:

| discount_amount | rentals_count | total_discount_amount |
| ---: | ---: | ---: |
| `0` | `4` | `0` |
| `2000` | `6` | `12000` |
| `4000` | `12` | `48000` |
| `6000` | `8` | `48000` |

### 9.5. Doi chieu rule active

```sql
SELECT
  id,
  name,
  trigger_type,
  min_riding_minutes,
  discount_type,
  discount_value,
  status
FROM coupon_rules
ORDER BY min_riding_minutes ASC;
```

## 10. Frontend mapping goi y

Frontend admin dashboard cho coupon stats co the chia nhu sau:

- Summary cards:
  - total completed rentals
  - discounted rentals count
  - non-discounted rentals count
  - discount rate
  - total discount amount
  - average discount amount
- Breakdown chart:
  - bar chart hoac donut chart theo `statsByDiscountAmount`
- Filter bar:
  - `from`
  - `to`
- Empty state:
  - khi tat ca summary bang `0`

UI note:

- `discountRate` la ratio, khong phai percent string
  - frontend co the render `0.8833` thanh `88.33%`
- `avgDiscountAmount` va `totalDiscountAmount` nen format theo VND
- `topAppliedRule` hien tai co the an di hoac render `Chua kha dung`
- `statsByDiscountAmount` co the sap xep tang dan theo `discountAmount`

## 11. Gioi han hien tai ma frontend can biet

- hien tai khong thong ke chinh xac theo `ruleId`
- ly do:
  - finalize billing chi luu `coupon_discount_amount`
  - khong luu `applied_coupon_rule_id`
- vi vay:
  - `topAppliedRule` tra `null`
  - frontend khong nen build UI phu thuoc rule usage chi tiet

Neu sau nay backend bo sung schema luu `applied_coupon_rule_id`, API co the mo rong them `statsByRule`.

## 12. Ket luan cho doi frontend

Ngay sau `pnpm seed:demo`, frontend co the test va code tiep dua tren:

- login admin demo
- goi `GET /v1/admin/coupon-stats`
- ky vong all-time exact:
  - completed `60`
  - discounted `53`
  - non-discounted `7`
  - total discount `144000`
- dung `from/to` de test thay doi pham vi
- doi chieu bang SQL trong pgAdmin neu can

Neu UI stats hien thi dung bo so tren thi frontend da bam dung contract hien tai cua backend.
