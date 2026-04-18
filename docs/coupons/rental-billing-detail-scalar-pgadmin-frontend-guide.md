# Rental Billing Detail Scalar + pgAdmin + Frontend Guide

File nay dung cho API moi:

- `GET /v1/rentals/me/{rentalId}/billing-detail`
- chi danh cho role `USER`
- chi cho user dang dang nhap xem rental cua chinh minh
- chi doc finalized billing record da duoc ghi that
- khong tinh preview lai
- khong thay doi semantics cua `GET /v1/rentals/me/{rentalId}/billing-preview`
- giup user hieu vi sao rental do duoc giam: prepaid, subscription, coupon rule nao da ap dung

Guide nay duoc viet de frontend team co the:

- login bang account demo that tu `seed:demo`
- lay `rentalId` that trong pgAdmin
- test API bang Scalar
- doi chieu tung field voi DB
- code tiep UI lich su billing / discount breakdown
- hieu ro case nao co san ngay trong `seed-demo`, case nao la edge case khong co san

Guide lien quan:

- `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-usage-logs-scalar-pgadmin-frontend-guide.md`

## 1. Business baseline frontend can hieu dung

API nay la finalized billing detail cua mot rental da ket thuc.

Khac voi `billing-preview`:

- `billing-preview` chi dung cho rental dang `RENTED`
- `billing-preview` la du bao tai thoi diem goi API
- `billing-detail` chi dung cho rental da `COMPLETED`
- `billing-detail` doc du lieu that tu `rental_billing_records`
- `billing-detail` phan anh rule/snapshot da ap dung luc finalize, khong tinh lai theo rule hien tai

Frontend nen xem day la API dung de hien:

- billing breakdown cua rental da hoan tat
- ly do user duoc giam
- coupon nao da ap
- so tien da giam do subscription
- so tien prepaid da duoc tru truoc

## 2. Chuan bi moi truong

Chay theo dung thu tu:

```bash
cd D:\do_an_3\MeBike\packages\shared
pnpm build

cd D:\do_an_3\MeBike\apps\server
pnpm exec prisma generate
pnpm prisma migrate reset --force
pnpm seed:demo
pnpm dev
```

Mo:

- Scalar: `http://localhost:4000/docs`
- pgAdmin: `http://localhost:5050/browser/`

Neu Scalar chua thay endpoint moi:

1. restart server
2. reload `http://localhost:4000/docs`
3. tim endpoint `GET /v1/rentals/me/{rentalId}/billing-detail`

## 3. Account demo that co san sau `pnpm seed:demo`

Tat ca account demo dung password:

```text
Demo@123456
```

Frontend nen dung:

- `user01@mebike.local`: user chinh de test happy path
- `user02@mebike.local`: user de test case rental cua nguoi khac
- `admin@mebike.local`: de test `403` neu goi API user-only

Login trong Scalar bang `POST /v1/auth/login`.

Body vi du:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Ky vong:

- HTTP `200`
- response co `data.accessToken`
- response co `data.refreshToken`

Sau do:

1. copy `data.accessToken`
2. bam `Authorize` trong Scalar
3. nhap:

```text
Bearer <accessToken>
```

## 4. API contract frontend can bam theo

### 4.1. Endpoint

```text
GET /v1/rentals/me/{rentalId}/billing-detail
```

Auth:

- Bearer token bat buoc
- role bat buoc: `USER`

Path param:

- `rentalId`: UUID v7 cua rental

### 4.2. Response shape

Response `200`:

```json
{
  "rentalId": "019bxxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx",
  "baseAmount": 8000,
  "prepaidAmount": 2000,
  "subscriptionApplied": false,
  "subscriptionDiscountAmount": 0,
  "couponRuleId": "019bxxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx",
  "couponRuleName": "Ride 2h discount",
  "couponRuleMinRidingMinutes": 120,
  "couponRuleDiscountType": "FIXED_AMOUNT",
  "couponRuleDiscountValue": 2000,
  "couponDiscountAmount": 2000,
  "totalAmount": 4000,
  "appliedAt": "2026-04-17T09:35:00.000Z",
  "explanation": "Prepaid amount 2000 was applied before final billing. \"Ride 2h discount\" reduced this rental by 2000 after meeting the 120-minute tier."
}
```

Field meaning cho UI:

- `rentalId`: rental da finalized
- `baseAmount`: gia goc truoc khi tru prepaid/subscription/coupon
- `prepaidAmount`: tien prepaid tu reservation, co the bang `0`
- `subscriptionApplied`: `true` neu rental co `subscription_id`
- `subscriptionDiscountAmount`: so tien giam do subscription
- `couponRuleId`: id rule da ap, `null` neu khong co coupon
- `couponRuleName`: ten rule da ap, `null` neu khong co coupon
- `couponRuleMinRidingMinutes`: moc minute tier cua rule, `null` neu khong co coupon
- `couponRuleDiscountType`: hien tai mong doi `FIXED_AMOUNT`, `null` neu khong co coupon
- `couponRuleDiscountValue`: gia tri discount cua rule, `null` neu khong co coupon
- `couponDiscountAmount`: so tien giam thuc te do coupon
- `totalAmount`: tong tien cuoi cung sau khi tru cac khoan giam
- `appliedAt`: thoi diem billing record duoc tao
- `explanation`: text backend build san de UI hien thi nhanh

Luu y:

- `explanation` la field derived o presenter, khong phai text luu trong DB
- cac field coupon co the `null` neu rental khong dung coupon
- `couponDiscountAmount` co the bang `0`

### 4.3. Error cases frontend can xu ly

Khong co token:

```text
401 Unauthorized
```

Token role khong phai `USER`, vi du admin:

```text
403 Forbidden
```

Rental khong ton tai hoac khong thuoc user dang dang nhap:

```json
{
  "error": "Rental not found",
  "details": {
    "code": "RENTAL_NOT_FOUND",
    "rentalId": "<rentalId>"
  }
}
```

Rental chua `COMPLETED`, vi du dang `RENTED`:

```json
{
  "error": "Billing detail requires a completed rental",
  "details": {
    "code": "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL",
    "rentalId": "<rentalId>",
    "status": "RENTED"
  }
}
```

Rental da `COMPLETED` nhung chua co finalized billing record:

```json
{
  "error": "Billing detail is not ready",
  "details": {
    "code": "BILLING_DETAIL_NOT_READY",
    "rentalId": "<rentalId>",
    "status": "COMPLETED"
  }
}
```

## 5. Data that co san ngay sau `pnpm seed:demo`

`seed-demo` da tao:

- user demo that
- active rental cho mot so user
- completed rentals da finalize that qua lifecycle
- `rental_billing_records` that
- global `coupon_rules` mac dinh

Mac dinh system co 4 tier auto discount:

| Rule | minRidingMinutes | discountValue |
| --- | ---: | ---: |
| `Ride 1h discount` | `60` | `1000` |
| `Ride 2h discount` | `120` | `2000` |
| `Ride 4h discount` | `240` | `4000` |
| `Ride 6h discount` | `360` | `6000` |

Quan trong:

- `seed-demo` khong in san danh sach `rentalId` cho `billing-detail`
- vi vay frontend can lay `rentalId` that bang query pgAdmin duoi day
- day van la data that cua `seed-demo`, khong phai data insert tay bo sung

## 6. Query pgAdmin de lay rental that cho tung case

Mo pgAdmin -> chon database local -> `Tools` -> `Query Tool`.

### 6.1. Query tong hop de tim cac rental that cua `user01`

Chay query nay truoc:

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.status,
  r.start_time,
  r.end_time,
  r.duration,
  COALESCE(res.prepaid, 0) AS prepaid_amount,
  (r.subscription_id IS NOT NULL) AS subscription_applied,
  COALESCE(rb.base_amount, 0) AS base_amount,
  COALESCE(rb.subscription_discount_amount, 0) AS subscription_discount_amount,
  COALESCE(rb.coupon_discount_amount, 0) AS coupon_discount_amount,
  COALESCE(rb.total_amount, 0) AS total_amount,
  rb.created_at AS applied_at,
  COALESCE((rb.coupon_rule_snapshot ->> 'name'), cr.name) AS coupon_rule_name,
  COALESCE((rb.coupon_rule_snapshot ->> 'minRidingMinutes')::int, cr.min_riding_minutes) AS coupon_rule_min_riding_minutes,
  CASE
    WHEN r.status = 'RENTED' THEN 'CASE_ACTIVE_RENTED'
    WHEN r.status = 'COMPLETED'
      AND COALESCE(rb.coupon_discount_amount, 0) > 0 THEN 'CASE_COMPLETED_WITH_COUPON'
    WHEN r.status = 'COMPLETED'
      AND (r.subscription_id IS NOT NULL OR COALESCE(rb.subscription_discount_amount, 0) > 0) THEN 'CASE_COMPLETED_WITH_SUBSCRIPTION'
    WHEN r.status = 'COMPLETED'
      AND COALESCE(rb.coupon_discount_amount, 0) = 0
      AND COALESCE(rb.subscription_discount_amount, 0) = 0 THEN 'CASE_COMPLETED_WITHOUT_COUPON'
    ELSE 'OTHER'
  END AS suggested_case
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
LEFT JOIN "Reservation" res ON res.id = r.reservation_id
LEFT JOIN coupon_rules cr ON cr.id = rb.coupon_rule_id
WHERE u.email = 'user01@mebike.local'
ORDER BY
  CASE WHEN r.status = 'RENTED' THEN 0 ELSE 1 END,
  rb.created_at DESC NULLS LAST,
  r.created_at DESC;
```

Muc tieu cua query:

- lay ra toan bo rental that cua `user01`
- cho frontend thay ngay rental nao dung de test case nao
- copy `rental_id` that tu ket qua sang Scalar

### 6.2. Query lay 1 rental `COMPLETED` co coupon

```sql
SELECT
  r.id AS rental_id,
  u.email,
  COALESCE(res.prepaid, 0) AS prepaid_amount,
  rb.base_amount,
  rb.coupon_discount_amount,
  rb.subscription_discount_amount,
  rb.total_amount,
  rb.created_at AS applied_at,
  COALESCE((rb.coupon_rule_snapshot ->> 'name'), cr.name) AS coupon_rule_name,
  COALESCE((rb.coupon_rule_snapshot ->> 'minRidingMinutes')::int, cr.min_riding_minutes) AS coupon_rule_min_riding_minutes
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
LEFT JOIN "Reservation" res ON res.id = r.reservation_id
LEFT JOIN coupon_rules cr ON cr.id = rb.coupon_rule_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
  AND rb.coupon_discount_amount > 0
ORDER BY rb.created_at DESC
LIMIT 5;
```

Dung row dau tien cho case happy path.

### 6.3. Query lay 1 rental `COMPLETED` khong dung coupon

```sql
SELECT
  r.id AS rental_id,
  u.email,
  COALESCE(res.prepaid, 0) AS prepaid_amount,
  rb.base_amount,
  rb.coupon_discount_amount,
  rb.subscription_discount_amount,
  rb.total_amount,
  rb.created_at AS applied_at
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
LEFT JOIN "Reservation" res ON res.id = r.reservation_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
  AND COALESCE(rb.coupon_discount_amount, 0) = 0
  AND COALESCE(rb.subscription_discount_amount, 0) = 0
ORDER BY rb.created_at DESC
LIMIT 5;
```

Dung row dau tien cho case completed khong coupon.

### 6.4. Query lay 1 rental `COMPLETED` co subscription discount

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.subscription_id,
  rb.base_amount,
  rb.subscription_discount_amount,
  rb.coupon_discount_amount,
  rb.total_amount,
  rb.created_at AS applied_at
FROM rental_billing_records rb
JOIN "Rental" r ON r.id = rb.rental_id
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'COMPLETED'
  AND (r.subscription_id IS NOT NULL OR COALESCE(rb.subscription_discount_amount, 0) > 0)
ORDER BY rb.created_at DESC
LIMIT 5;
```

Dung row dau tien cho case completed co subscription.

### 6.5. Query lay 1 rental dang `RENTED`

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.status,
  r.start_time,
  r.created_at
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'RENTED'
ORDER BY r.created_at DESC
LIMIT 1;
```

Dung `rental_id` nay de test error `BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL`.

### 6.6. Query lay 1 rental cua user khac

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.status,
  rb.coupon_discount_amount,
  rb.total_amount
FROM "Rental" r
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user02@mebike.local'
  AND r.status = 'COMPLETED'
ORDER BY rb.created_at DESC NULLS LAST, r.created_at DESC
LIMIT 5;
```

Login bang `user01@mebike.local`, nhung goi API voi `rental_id` cua `user02@mebike.local` de test `RENTAL_NOT_FOUND`.

## 7. Query pgAdmin de doi chieu 1 rental voi response Scalar

Sau khi da chon duoc `rental_id`, dung query nay de verify tung field:

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.status,
  r.start_time,
  r.end_time,
  r.duration,
  COALESCE(res.prepaid, 0) AS prepaid_amount,
  (r.subscription_id IS NOT NULL) AS subscription_applied,
  rb.base_amount,
  rb.subscription_discount_amount,
  rb.coupon_discount_amount,
  rb.total_amount,
  rb.created_at AS applied_at,
  rb.coupon_rule_id,
  COALESCE((rb.coupon_rule_snapshot ->> 'name'), cr.name) AS coupon_rule_name,
  COALESCE((rb.coupon_rule_snapshot ->> 'minRidingMinutes')::int, cr.min_riding_minutes) AS coupon_rule_min_riding_minutes,
  COALESCE((rb.coupon_rule_snapshot ->> 'discountType'), cr.discount_type::text) AS coupon_rule_discount_type,
  COALESCE((rb.coupon_rule_snapshot ->> 'discountValue')::numeric, cr.discount_value) AS coupon_rule_discount_value,
  rb.coupon_rule_snapshot
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN rental_billing_records rb ON rb.rental_id = r.id
LEFT JOIN "Reservation" res ON res.id = r.reservation_id
LEFT JOIN coupon_rules cr ON cr.id = rb.coupon_rule_id
WHERE r.id = '<rental_id>';
```

Mapping Scalar <-> pgAdmin:

- `baseAmount` <-> `base_amount`
- `prepaidAmount` <-> `prepaid_amount`
- `subscriptionApplied` <-> `subscription_applied`
- `subscriptionDiscountAmount` <-> `subscription_discount_amount`
- `couponRuleId` <-> `coupon_rule_id`
- `couponRuleName` <-> `coupon_rule_name`
- `couponRuleMinRidingMinutes` <-> `coupon_rule_min_riding_minutes`
- `couponRuleDiscountType` <-> `coupon_rule_discount_type`
- `couponRuleDiscountValue` <-> `coupon_rule_discount_value`
- `couponDiscountAmount` <-> `coupon_discount_amount`
- `totalAmount` <-> `total_amount`
- `appliedAt` <-> `applied_at`

Luu y:

- `explanation` khong co cot tuong ung trong DB
- `explanation` duoc backend build dua tren `prepaidAmount`, `subscriptionDiscountAmount`, `couponDiscountAmount`, `couponRuleName`, `couponRuleMinRidingMinutes`

## 8. Scalar test cases frontend nen test

Tat ca request duoi day deu dung:

```http
Authorization: Bearer <user01_access_token>
```

Tru khi section ghi ro login account khac.

### 8.1. Happy path: rental completed co coupon

1. Chay query `6.2`
2. Copy `rental_id`
3. Goi:

```text
GET /v1/rentals/me/{rentalId}/billing-detail
```

Ky vong:

- HTTP `200`
- `couponRuleId != null`
- `couponRuleName != null`
- `couponDiscountAmount > 0`
- `appliedAt != null`
- `explanation` co nhac den coupon rule neu `couponRuleName` co san

Neu row trong pgAdmin co `prepaid_amount > 0`:

- `explanation` can co them doan ve prepaid

### 8.2. Happy path: rental completed khong coupon

1. Chay query `6.3`
2. Copy `rental_id`
3. Goi API

Ky vong:

- HTTP `200`
- `couponRuleId = null`
- `couponRuleName = null`
- `couponRuleMinRidingMinutes = null`
- `couponRuleDiscountType = null`
- `couponRuleDiscountValue = null`
- `couponDiscountAmount = 0`
- `explanation` thuong la:

```text
No prepaid amount, subscription discount, or coupon discount was applied to this rental.
```

Neu row van co `prepaid_amount > 0` thi `explanation` se thay doi tuong ung.

### 8.3. Happy path: rental completed co subscription discount

1. Chay query `6.4`
2. Copy `rental_id`
3. Goi API

Ky vong:

- HTTP `200`
- `subscriptionApplied = true`
- `subscriptionDiscountAmount > 0`
- `couponDiscountAmount` co the bang `0`
- `couponRuleId` va cac field coupon co the `null`
- `explanation` co doan:

```text
Subscription reduced this rental by <amount>
```

### 8.4. Error: rental dang `RENTED`

1. Chay query `6.5`
2. Copy `rental_id`
3. Goi API

Ky vong:

- HTTP `400`
- `details.code = "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL"`
- `details.status = "RENTED"`

### 8.5. Error: rental cua nguoi khac

1. Login bang `user01@mebike.local`
2. Chay query `6.6`
3. Copy `rental_id` cua `user02@mebike.local`
4. Goi API bang token cua `user01`

Ky vong:

- HTTP `404`
- `details.code = "RENTAL_NOT_FOUND"`

### 8.6. Error: rental khong ton tai

Dung UUID khong co trong DB:

```text
019b17bd-d130-7e7d-be69-91ceef7b6999
```

Goi:

```text
GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b6999/billing-detail
```

Ky vong:

- HTTP `404`
- `details.code = "RENTAL_NOT_FOUND"`

### 8.7. Error: khong co token

1. Clear Authorization trong Scalar
2. Goi lai API voi 1 `rental_id` hop le

Ky vong:

- HTTP `401`

### 8.8. Error: token role khong phai `USER`

1. Login `admin@mebike.local / Demo@123456`
2. Dung token admin goi API voi 1 `rental_id` cua `user01`

Ky vong:

- HTTP `403`

## 9. Case `BILLING_DETAIL_NOT_READY`

Case nay la edge case backend va khong co san trong plain `seed-demo`.

Ly do:

- completed rental trong `seed-demo` duoc tao qua lifecycle day du
- billing record da duoc ghi ngay luc finalize
- vi vay sau `pnpm seed:demo`, frontend thuong khong tim thay rental `COMPLETED` ma lai thieu `rental_billing_records`

Neu frontend chi can code UI theo contract hien tai:

- co the chi can note case nay de handle message / state
- khong can tao data that de test tay

Neu can test tay case nay, nen phoi hop backend tao 1 fixture rieng hoac dung e2e test, khong nen sua random data seed demo dang dung chung cho nhieu nguoi.

## 10. Frontend notes cho `explanation`

`explanation` duoc backend build theo quy tac:

- neu `prepaidAmount > 0`: them cau ve prepaid
- neu `subscriptionApplied = true` va `subscriptionDiscountAmount > 0`: them cau ve subscription
- neu `couponDiscountAmount > 0`: them cau ve coupon
- neu khong co khoan nao: tra default message

Vi du:

- co prepaid + coupon:
  - `Prepaid amount 2000 was applied before final billing. "Ride 2h discount" reduced this rental by 2000 after meeting the 120-minute tier.`
- chi co subscription:
  - `Subscription reduced this rental by 3000.`
- khong co gi:
  - `No prepaid amount, subscription discount, or coupon discount was applied to this rental.`

Frontend co 2 cach:

- cach 1: render `explanation` truc tiep
- cach 2: render theo tung field rieng va coi `explanation` la text bo tro

Khuyen nghi:

- UI nen dua vao field so hoc la chinh
- `explanation` dung de hien copy nhanh cho user

## 11. UI mapping goi y cho frontend

Man hinh billing detail cua rental completed nen co:

- block tong quan:
  - `rentalId`
  - `appliedAt`
  - `totalAmount`
- block breakdown:
  - `baseAmount`
  - `prepaidAmount`
  - `subscriptionDiscountAmount`
  - `couponDiscountAmount`
- block coupon:
  - `couponRuleName`
  - `couponRuleMinRidingMinutes`
  - `couponRuleDiscountType`
  - `couponRuleDiscountValue`
- block explanation:
  - `explanation`

Rule hien thi:

- neu `couponRuleId = null` thi an block coupon detail
- neu `subscriptionApplied = true` thi hien label "Subscription applied"
- neu `couponDiscountAmount = 0` thi khong can nhan la "coupon da ap"
- amount deu la integer VND

## 12. TypeScript shape goi y cho frontend

```ts
export type RentalBillingDetail = {
  rentalId: string;
  baseAmount: number;
  prepaidAmount: number;
  subscriptionApplied: boolean;
  subscriptionDiscountAmount: number;
  couponRuleId: string | null;
  couponRuleName: string | null;
  couponRuleMinRidingMinutes: number | null;
  couponRuleDiscountType: "FIXED_AMOUNT" | null;
  couponRuleDiscountValue: number | null;
  couponDiscountAmount: number;
  totalAmount: number;
  appliedAt: string;
  explanation?: string;
};
```

## 13. Fetch sample cho frontend

```ts
export async function getRentalBillingDetail(
  rentalId: string,
  accessToken: string,
) {
  const response = await fetch(`/v1/rentals/me/${rentalId}/billing-detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}
```

UI state toi thieu:

- loading
- success `200`
- `400 BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL`
- `400 BILLING_DETAIL_NOT_READY`
- `401`
- `403`
- `404`
- `500`

## 14. Checklist test nhanh cho doi frontend

Sau `pnpm seed:demo`:

- [ ] login `user01@mebike.local / Demo@123456`
- [ ] login `user02@mebike.local / Demo@123456`
- [ ] login `admin@mebike.local / Demo@123456`
- [ ] chay query `6.2` va test case completed co coupon
- [ ] chay query `6.3` va test case completed khong coupon
- [ ] chay query `6.4` va test case completed co subscription
- [ ] chay query `6.5` va test case `RENTED -> 400`
- [ ] chay query `6.6` va test case rental cua nguoi khac `-> 404`
- [ ] test UUID fake `019b17bd-d130-7e7d-be69-91ceef7b6999 -> 404`
- [ ] clear token -> `401`
- [ ] dung token admin -> `403`
- [ ] voi moi happy path, doi chieu query muc `7` voi response Scalar
- [ ] verify frontend an/hien block coupon dung khi `couponRuleId` la `null`
- [ ] verify frontend hien dung `subscriptionApplied`
- [ ] verify frontend format VND dung cho `baseAmount`, `couponDiscountAmount`, `totalAmount`

## 15. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login `user01@mebike.local / Demo@123456`
3. vao pgAdmin, chay query `6.1`
4. copy 1 `rental_id` theo tung `suggested_case`
5. goi `GET /v1/rentals/me/{rentalId}/billing-detail` trong Scalar
6. doi chieu tung field bang query muc `7`
7. dung `user02` de test case `rental cua nguoi khac`
8. dung `admin` de test `403`

Neu frontend render dung cac field so hoc, block coupon, block subscription, empty state va error state theo guide nay thi da bam dung contract hien tai cua backend cho finalized billing detail.
