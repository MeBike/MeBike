# Rental Billing Preview Global Auto Discount Scalar + pgAdmin + Frontend Guide

File nay dung cho API moi:

- `GET /v1/rentals/me/{rentalId}/billing-preview`
- chi danh cho role `USER`
- chi cho user dang dang nhap xem rental cua chinh minh
- tinh preview bill, khong ghi bill that
- khong tru vi
- khong finalize rental
- khong dung `user_coupons`
- discount tu dong lay tu global `coupon_rules`
- ap dung MeBike Global Auto Discount Policy V1

Luu y: endpoint preview khong ghi bill that, nhung cung policy global
`coupon_rules` nay cung duoc dung khi finalize rental qua `PUT /v1/rentals/{rentalId}/end`.

Guide nay duoc viet de frontend team co the:

- login bang account demo that tu `seed:demo`
- test API bang Scalar
- doi chieu data bang pgAdmin
- setup data cho day du case discount/prepaid/subscription/deposit forfeited
- code tiep UI billing preview va flow hien thi bill truoc khi tra xe

## 1. Chuan bi moi truong

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

Neu Scalar van hien response cu co `bestCoupon`, restart server va reload `http://localhost:4000/docs`.

## 2. Account demo that co san sau `pnpm seed:demo`

Tat ca account demo dung password:

```text
Demo@123456
```

Account nen dung cho billing preview:

- `user01@mebike.local`: co active rental trong seed demo, thuong co subscription
- `user02@mebike.local`: co active rental trong seed demo, thuong khong co subscription
- `admin@mebike.local`: dung de test `403` neu goi endpoint user-only

Mot so account demo khac:

- `staff1@mebike.local`
- `manager@mebike.local`
- `agency1@mebike.local`
- `agency2@mebike.local`
- `tech1@mebike.local`

Luu y:

- `user.id` va `rental.id` duoc seed moi moi lan reset DB, khong hardcode UUID tu lan chay cu.
- SQL trong guide nay resolve user/rental theo email nen frontend team chi can copy chay.
- Cac UUID `019b17bd-...` trong SQL la data test bo sung deterministic cho `coupon_rules`, `reservation`, `subscription`.

## 3. Login trong Scalar

Dung `POST /v1/auth/login`.

Body:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Ky vong:

- HTTP `200`
- response dang:

```json
{
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

Sau do:

1. copy `accessToken`
2. bam `Authorize` trong Scalar
3. nhap:

```text
Bearer <accessToken>
```

Neu Scalar chi yeu cau token thuan, dan moi `<accessToken>`.

## 4. Contract API frontend can bam theo

### 4.1. Endpoint

```text
GET /v1/rentals/me/{rentalId}/billing-preview
```

Auth:

- Bearer token bat buoc
- Role bat buoc: `USER`

Path param:

- `rentalId`: UUID v7 cua rental

### 4.2. Response 200

Vi du rental 95 phut:

```json
{
  "rentalId": "019b17bd-d130-7e7d-be69-91ceef7b7501",
  "previewedAt": "2026-04-17T03:00:00.000Z",
  "pricingPolicyId": "11111111-1111-4111-8111-111111111111",
  "rentalMinutes": 95,
  "billableBlocks": 4,
  "billableHours": 2,
  "baseRentalAmount": 8000,
  "prepaidAmount": 0,
  "eligibleRentalAmount": 8000,
  "subscriptionApplied": false,
  "subscriptionDiscountAmount": 0,
  "bestDiscountRule": {
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7102",
    "name": "Ride 2h discount",
    "triggerType": "RIDING_DURATION",
    "minRidingMinutes": 120,
    "discountType": "FIXED_AMOUNT",
    "discountValue": 2000
  },
  "couponDiscountAmount": 2000,
  "penaltyAmount": 0,
  "depositForfeited": false,
  "payableRentalAmount": 6000,
  "totalPayableAmount": 6000
}
```

Neu rental co subscription:

```json
{
  "subscriptionApplied": true,
  "bestDiscountRule": null,
  "couponDiscountAmount": 0
}
```

### 4.3. Field meaning cho UI

- `rentalMinutes`: raw duration preview, tinh bang `ceil((previewedAt - startTime) / 60000)`.
- `billableBlocks`: so block tinh tien.
- `billableHours`: so gio billable dung de xet discount.
- `baseRentalAmount`: tien thue truoc prepaid/subscription/discount.
- `prepaidAmount`: tien da prepaid tu reservation.
- `eligibleRentalAmount`: phan tien rental con lai co the duoc discount.
- `subscriptionApplied`: true thi khong hien/apply global discount.
- `subscriptionDiscountAmount`: phan subscription da cover.
- `bestDiscountRule`: rule global duoc chon, null neu khong co discount.
- `couponDiscountAmount`: so tien giam thuc te sau cap theo eligible amount.
- `penaltyAmount`: hien tai luon la `0` trong V1 vi khong con penalty rieng.
- `depositForfeited`: flag canh bao mat deposit, khong cong vao `totalPayableAmount` trong preview hien tai.
- `payableRentalAmount`: tien rental phai tra sau prepaid/subscription/discount.
- `totalPayableAmount`: bang `payableRentalAmount` trong V1.

### 4.4. Error frontend can xu ly

Khong co token:

```text
401 Unauthorized
```

Token role khong phai `USER`, vi du admin/staff:

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

Rental khong active, vi du `COMPLETED`:

```json
{
  "error": "Billing preview requires an active rental",
  "details": {
    "code": "BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL",
    "rentalId": "<rentalId>",
    "status": "COMPLETED"
  }
}
```

## 5. Business rule frontend can hien thi

Global Auto Discount Policy V1:

- User khong can so huu coupon rieng.
- Khong doc `user_coupons`.
- Discount tu global `coupon_rules`.
- Chi ap dung cho rental thanh toan bang wallet.
- Neu rental co `subscription_id` thi khong ap discount, ke ca phan tien du phai tra bang wallet.
- Moi rental chi toi da 1 discount.
- Neu nhieu rule hop le, chon rule co discount tot nhat.
- Discount khong lam tien thue am.
- Discount chi ap vao `eligibleRentalAmount`, khong ap vao deposit forfeited/phi khac.
- V1 hien tai khong con penalty rieng; `penaltyAmount` luon la `0`.

Cong thuc:

```text
rentalMinutes = ceil((previewedAt - startTime) / 60000)
billableBlocks = ceil(rentalMinutes / billingUnitMinutes)
billableHours = billableBlocks * billingUnitMinutes / 60
baseRentalAmount = billableBlocks * baseRate
eligibleRentalAmount = max(baseRentalAmount - prepaidAmount, 0)
couponDiscountAmount = min(bestDiscountRule.discountValue, eligibleRentalAmount)
payableRentalAmount = eligibleRentalAmount - couponDiscountAmount
totalPayableAmount = payableRentalAmount
```

Voi pricing default MeBike V1:

- `billingUnitMinutes = 30`
- `baseRate = 2000`

Default discount rules:

| Billable time | Rule | Discount |
| --- | --- | ---: |
| `< 1h` | khong co rule | `0` |
| `>= 1h` va `< 2h` | `minRidingMinutes = 60` | `1000` |
| `>= 2h` va `< 4h` | `minRidingMinutes = 120` | `2000` |
| `>= 4h` va `< 6h` | `minRidingMinutes = 240` | `4000` |
| `>= 6h` | `minRidingMinutes = 360` | `6000` |

## 6. Setup data test trong pgAdmin

Mo pgAdmin -> chon database local -> `Tools` -> `Query Tool`.

Chay SQL nay mot lan sau `pnpm seed:demo`.

SQL nay se:

- dam bao co 4 global `coupon_rules`
- lay active rental cua `user01@mebike.local`
- tao reservation prepaid test
- tao subscription test
- khong tao route/API moi

```sql
DO $$
DECLARE
  owner_id uuid;
  active_rental_id uuid;
  active_bike_id uuid;
  active_station_id uuid;
  active_pricing_policy_id uuid;
BEGIN
  SELECT id INTO owner_id
  FROM users
  WHERE email = 'user01@mebike.local';

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Missing seed demo user01@mebike.local. Run pnpm seed:demo first.';
  END IF;

  SELECT id, bike_id, start_station, pricing_policy_id
  INTO active_rental_id, active_bike_id, active_station_id, active_pricing_policy_id
  FROM "Rental"
  WHERE user_id = owner_id
    AND status = 'RENTED'
  ORDER BY created_at DESC
  LIMIT 1;

  IF active_rental_id IS NULL THEN
    RAISE EXCEPTION 'Missing active rental for user01@mebike.local. Check seed-demo data.';
  END IF;

  IF active_pricing_policy_id IS NULL THEN
    SELECT id INTO active_pricing_policy_id
    FROM pricing_policies
    WHERE status = 'ACTIVE'
    ORDER BY created_at ASC, id ASC
    LIMIT 1;
  END IF;

  INSERT INTO coupon_rules (
    id, name, trigger_type, min_riding_minutes,
    discount_type, discount_value, status, priority,
    created_at, updated_at
  )
  VALUES
    ('019b17bd-d130-7e7d-be69-91ceef7b7101', 'Ride 1h discount', 'RIDING_DURATION', 60,  'FIXED_AMOUNT', 1000, 'ACTIVE', 100, now(), now()),
    ('019b17bd-d130-7e7d-be69-91ceef7b7102', 'Ride 2h discount', 'RIDING_DURATION', 120, 'FIXED_AMOUNT', 2000, 'ACTIVE', 100, now(), now()),
    ('019b17bd-d130-7e7d-be69-91ceef7b7103', 'Ride 4h discount', 'RIDING_DURATION', 240, 'FIXED_AMOUNT', 4000, 'ACTIVE', 100, now(), now()),
    ('019b17bd-d130-7e7d-be69-91ceef7b7104', 'Ride 6h discount', 'RIDING_DURATION', 360, 'FIXED_AMOUNT', 6000, 'ACTIVE', 100, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    trigger_type = EXCLUDED.trigger_type,
    min_riding_minutes = EXCLUDED.min_riding_minutes,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    status = 'ACTIVE',
    priority = 100,
    updated_at = now();

  INSERT INTO "Subscription" (
    id, user_id, package_name, "maxUsages", usage_count,
    status, activated_at, expires_at, price, updated_at
  )
  VALUES (
    '019b17bd-d130-7e7d-be69-91ceef7b7701',
    owner_id,
    'unlimited',
    NULL,
    0,
    'ACTIVE',
    now() - interval '1 day',
    now() + interval '30 days',
    499000,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = owner_id,
    package_name = 'unlimited',
    "maxUsages" = NULL,
    usage_count = 0,
    status = 'ACTIVE',
    activated_at = now() - interval '1 day',
    expires_at = now() + interval '30 days',
    updated_at = now();

  INSERT INTO "Reservation" (
    id, user_id, bike_id, station_id, pricing_policy_id,
    reservation_option, start_time, end_time, prepaid,
    status, created_at, updated_at
  )
  VALUES (
    '019b17bd-d130-7e7d-be69-91ceef7b7601',
    owner_id,
    active_bike_id,
    active_station_id,
    active_pricing_policy_id,
    'ONE_TIME',
    now() - interval '2 hours',
    now() - interval '90 minutes',
    2000,
    'FULFILLED',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = owner_id,
    bike_id = active_bike_id,
    station_id = active_station_id,
    pricing_policy_id = active_pricing_policy_id,
    prepaid = 2000,
    status = 'FULFILLED',
    updated_at = now();

  UPDATE "Rental"
  SET pricing_policy_id = active_pricing_policy_id,
      reservation_id = NULL,
      subscription_id = NULL,
      deposit_hold_id = NULL,
      start_time = now() - interval '95 minutes',
      status = 'RENTED',
      end_time = NULL,
      duration = NULL,
      total_price = NULL,
      updated_at = now()
  WHERE id = active_rental_id;

  RAISE NOTICE 'Billing preview rental id for Scalar: %', active_rental_id;
END $$;
```

Sau khi run, pgAdmin se in notice:

```text
Billing preview rental id for Scalar: <rental_id>
```

Copy `<rental_id>` de dung trong Scalar.

## 7. Query xem data trong pgAdmin

Dung query nay de xem rental dang test:

```sql
SELECT
  r.id AS rental_id,
  u.email,
  r.status,
  r.start_time,
  ceil(extract(epoch FROM (now() - r.start_time)) / 60.0) AS approx_rental_minutes,
  r.pricing_policy_id,
  pp.base_rate,
  pp.billing_unit_minutes,
  r.reservation_id,
  rv.prepaid,
  r.subscription_id,
  s.package_name,
  s."maxUsages",
  s.usage_count,
  r.deposit_hold_id
FROM "Rental" r
JOIN users u ON u.id = r.user_id
LEFT JOIN pricing_policies pp ON pp.id = r.pricing_policy_id
LEFT JOIN "Reservation" rv ON rv.id = r.reservation_id
LEFT JOIN "Subscription" s ON s.id = r.subscription_id
WHERE u.email = 'user01@mebike.local'
  AND r.status = 'RENTED'
ORDER BY r.created_at DESC;
```

Dung query nay de xem global discount rules:

```sql
SELECT
  id,
  name,
  trigger_type,
  min_riding_minutes,
  discount_type,
  discount_value,
  status,
  priority
FROM coupon_rules
WHERE trigger_type = 'RIDING_DURATION'
ORDER BY min_riding_minutes;
```

Dung query nay de xem deposit hold neu can kiem tra case sau 23:00:

```sql
SELECT
  wh.id,
  wh.rental_id,
  wh.amount,
  wh.status,
  wh.released_at,
  wh.forfeited_at,
  wh.settled_at
FROM wallet_holds wh
JOIN "Rental" r ON r.deposit_hold_id = wh.id
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user01@mebike.local'
ORDER BY wh.created_at DESC;
```

## 8. Test API trong Scalar

Endpoint:

```text
GET /v1/rentals/me/{rentalId}/billing-preview
```

Thay `{rentalId}` bang UUID lay tu notice cua SQL setup hoac query pgAdmin.

Vi du:

```text
GET /v1/rentals/me/019bxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx/billing-preview
```

## 9. Cac case test chuan

Tat ca SQL trong muc nay deu resolve rental theo `user01@mebike.local`.

Sau moi SQL:

1. quay lai Scalar
2. goi lai `GET /v1/rentals/me/{rentalId}/billing-preview`
3. doi chieu expected output

### Case 1: Khong subscription, duoi 1h, khong discount

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '20 minutes',
    reservation_id = NULL,
    subscription_id = NULL,
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `billableHours = 0.5`
- `baseRentalAmount = 2000`
- `bestDiscountRule = null`
- `couponDiscountAmount = 0`
- `payableRentalAmount = 2000`
- `totalPayableAmount = 2000`

### Case 2: Khong subscription, tu 1h den duoi 2h, giam 1.000

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '35 minutes',
    reservation_id = NULL,
    subscription_id = NULL,
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `billableHours = 1`
- `baseRentalAmount = 4000`
- `bestDiscountRule.name = "Ride 1h discount"`
- `bestDiscountRule.minRidingMinutes = 60`
- `couponDiscountAmount = 1000`
- `payableRentalAmount = 3000`
- `totalPayableAmount = 3000`

### Case 3: Khong subscription, tu 2h den duoi 4h, giam 2.000

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '95 minutes',
    reservation_id = NULL,
    subscription_id = NULL,
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `billableHours = 2`
- `baseRentalAmount = 8000`
- `bestDiscountRule.name = "Ride 2h discount"`
- `bestDiscountRule.minRidingMinutes = 120`
- `couponDiscountAmount = 2000`
- `payableRentalAmount = 6000`
- `totalPayableAmount = 6000`

### Case 4: Khong subscription, tu 4h den duoi 6h, giam 4.000

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '215 minutes',
    reservation_id = NULL,
    subscription_id = NULL,
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `billableHours = 4`
- `baseRentalAmount = 16000`
- `bestDiscountRule.name = "Ride 4h discount"`
- `bestDiscountRule.minRidingMinutes = 240`
- `couponDiscountAmount = 4000`
- `payableRentalAmount = 12000`
- `totalPayableAmount = 12000`

### Case 5: Khong subscription, tu 6h tro len, giam 6.000

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '335 minutes',
    reservation_id = NULL,
    subscription_id = NULL,
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `billableHours = 6`
- `baseRentalAmount = 24000`
- `bestDiscountRule.name = "Ride 6h discount"`
- `bestDiscountRule.minRidingMinutes = 360`
- `couponDiscountAmount = 6000`
- `payableRentalAmount = 18000`
- `totalPayableAmount = 18000`

### Case 6: Co subscription, khong ap global discount

SQL:

```sql
UPDATE "Rental" r
SET start_time = now() - interval '95 minutes',
    reservation_id = NULL,
    subscription_id = '019b17bd-d130-7e7d-be69-91ceef7b7701',
    deposit_hold_id = NULL,
    status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';

```

Expected Scalar:

- `subscriptionApplied = true`
- `bestDiscountRule = null`
- `couponDiscountAmount = 0`
- voi subscription unlimited test: `eligibleRentalAmount = 0`
- voi subscription unlimited test: `totalPayableAmount = 0`

### Case 7: Co prepaid, discount chi ap vao eligibleRentalAmount

SQL:

```sql
DO $$
DECLARE
  owner_id uuid;
  active_rental_id uuid;
  active_bike_id uuid;
  active_station_id uuid;
  active_pricing_policy_id uuid;
BEGIN
  SELECT id INTO owner_id FROM users WHERE email = 'user01@mebike.local';

  SELECT id, bike_id, start_station, pricing_policy_id
  INTO active_rental_id, active_bike_id, active_station_id, active_pricing_policy_id
  FROM "Rental"
  WHERE user_id = owner_id AND status = 'RENTED'
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO "Reservation" (
    id, user_id, bike_id, station_id, pricing_policy_id,
    reservation_option, start_time, end_time, prepaid,
    status, created_at, updated_at
  )
  VALUES (
    '019b17bd-d130-7e7d-be69-91ceef7b7601',
    owner_id,
    active_bike_id,
    active_station_id,
    active_pricing_policy_id,
    'ONE_TIME',
    now() - interval '2 hours',
    now() - interval '90 minutes',
    2000,
    'FULFILLED',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = owner_id,
    bike_id = active_bike_id,
    station_id = active_station_id,
    pricing_policy_id = active_pricing_policy_id,
    prepaid = 2000,
    status = 'FULFILLED',
    updated_at = now();

  UPDATE "Rental"
  SET start_time = now() - interval '95 minutes',
      reservation_id = '019b17bd-d130-7e7d-be69-91ceef7b7601',
      subscription_id = NULL,
      deposit_hold_id = NULL,
      status = 'RENTED',
      end_time = NULL,
      duration = NULL,
      total_price = NULL,
      updated_at = now()
  WHERE id = active_rental_id;

END $$;
```

Expected Scalar:

- `baseRentalAmount = 8000`
- `prepaidAmount = 2000`
- `eligibleRentalAmount = 6000`
- `bestDiscountRule.name = "Ride 2h discount"`
- `couponDiscountAmount = 2000`
- `payableRentalAmount = 4000`
- `totalPayableAmount = 4000`

### Case 8: Rental khong thuoc user hien tai

Login `user01@mebike.local`, nhung lay rental cua `user02@mebike.local`.

Lay rental id cua user02 trong pgAdmin:

```sql
SELECT r.id AS rental_id, u.email, r.status, r.start_time
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE u.email = 'user02@mebike.local'
  AND r.status = 'RENTED'
ORDER BY r.created_at DESC
LIMIT 1;
```

Goi Scalar:

```text
GET /v1/rentals/me/{user02RentalId}/billing-preview
```

Expected:

- HTTP `404`
- `details.code = "RENTAL_NOT_FOUND"`

### Case 10: Khong token

Trong Scalar:

1. clear Authorization
2. goi endpoint voi rental id cua user01

Expected:

- HTTP `401`

### Case 11: Token role khong phai USER

Login admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Dung token admin goi:

```text
GET /v1/rentals/me/{user01RentalId}/billing-preview
```

Expected:

- HTTP `403`

### Case 12: Rental da completed, khong preview duoc

SQL:

```sql
UPDATE "Rental" r
SET status = 'COMPLETED',
    end_time = now(),
    duration = 95,
    total_price = 8000,
    updated_at = now()
FROM users u
WHERE u.id = r.user_id
  AND u.email = 'user01@mebike.local'
  AND r.status = 'RENTED';
```

Goi lai Scalar voi rental id do.

Expected:

- HTTP `400`
- `details.code = "BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL"`
- `details.status = "COMPLETED"`

Sau case nay, muon test tiep thi reset lai active:

```sql
WITH target AS (
  SELECT r.id
  FROM "Rental" r
  JOIN users u ON u.id = r.user_id
  WHERE u.email = 'user01@mebike.local'
  ORDER BY r.updated_at DESC
  LIMIT 1
)
UPDATE "Rental" r
SET status = 'RENTED',
    end_time = NULL,
    duration = NULL,
    total_price = NULL,
    start_time = now() - interval '95 minutes',
    subscription_id = NULL,
    reservation_id = NULL,
    updated_at = now()
FROM target
WHERE r.id = target.id;
```

## 10. Checklist UI cho frontend

Man hinh billing preview nen co cac block:

- Rental duration:
  - `rentalMinutes`
  - `billableBlocks`
  - `billableHours`
- Base fee:
  - `baseRentalAmount`
  - `prepaidAmount`
  - `eligibleRentalAmount`
- Subscription:
  - neu `subscriptionApplied = true`, hien "Subscription applied"
  - hien `subscriptionDiscountAmount`
  - an block discount rule
- Global auto discount:
  - neu `bestDiscountRule != null`, hien `bestDiscountRule.name`
  - hien `couponDiscountAmount`
  - label nen la "Auto discount", khong goi la "My coupon"
  - khong yeu cau user chon coupon
- Penalty:
  - V1 hien tai khong con penalty rieng.
  - neu frontend van hien field `penaltyAmount`, gia tri expected la `0`.
- Deposit:
  - neu `depositForfeited = true`, hien warning mat deposit
  - khong cong field nay vao `totalPayableAmount` o UI neu backend response chua cong
- Total:
  - `payableRentalAmount`
  - `totalPayableAmount`

Format tien:

- Tat ca amount dang la VND integer.
- Frontend format bang helper VND, vi du `8.000 ₫`.

Refresh:

- Preview co tinh theo thoi gian hien tai, nen UI nen refetch khi user mo man hinh va khi bam refresh.
- Khong cache qua lau. Co the refetch moi 30-60 giay neu man hinh dang mo.

## 11. Frontend integration notes

Request:

```ts
GET /v1/rentals/me/${rentalId}/billing-preview
Authorization: Bearer ${accessToken}
```

Type shape toi thieu:

```ts
type RentalBillingPreview = {
  rentalId: string;
  previewedAt: string;
  pricingPolicyId: string;
  rentalMinutes: number;
  billableBlocks: number;
  billableHours: number;
  baseRentalAmount: number;
  prepaidAmount: number;
  eligibleRentalAmount: number;
  subscriptionApplied: boolean;
  subscriptionDiscountAmount: number;
  bestDiscountRule: null | {
    ruleId: string;
    name: string;
    triggerType: "RIDING_DURATION";
    minRidingMinutes: number;
    discountType: "FIXED_AMOUNT";
    discountValue: number;
  };
  couponDiscountAmount: number;
  penaltyAmount: number;
  depositForfeited: boolean;
  payableRentalAmount: number;
  totalPayableAmount: number;
};
```

UI state:

- loading: skeleton hoac spinner
- 200: hien preview
- 400 `BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL`: hien "Rental is no longer active"
- 401: redirect login
- 403: account role khong phu hop
- 404: rental khong ton tai hoac khong thuoc user
- 500: hien retry

Important naming:

- UI/SDK moi nen dung `bestDiscountRule`.
- Khong dung `bestCoupon` cho API nay.
- Khong hien "coupon cua ban" vi business moi khong dung user coupon.

## 12. Luu y backend scope

API nay chi la preview.

Hien tai finalize rental return van can duoc sua rieng de bill that cung ap dung global auto discount. Khi frontend test preview thay discount dung, khong co nghia la flow end rental that da tru discount trong wallet/billing record.

Cho den khi backend finalize duoc update:

- dung API nay de hien preview bill
- khong xem day la bang chung bill final da tru discount
- neu UI co copy "estimated" hoac "preview", nen giu dung wording do
