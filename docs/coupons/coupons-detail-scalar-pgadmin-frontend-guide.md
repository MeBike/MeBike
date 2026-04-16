# Coupons Detail Scalar + pgAdmin + Frontend Guide

> OBSOLETE as of Global Auto Discount Policy V1.
>
> `GET /v1/coupons/{userCouponId}` has been removed from the server contract.
> V1 no longer supports "my coupons"; users do not own individual coupons in
> `user_coupons`. Wallet rentals without `subscription_id` get the best eligible
> global discount from `coupon_rules` automatically. Use
> `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`
> for current coupon discount verification.

File nay dung cho API moi:

- `GET /v1/coupons/{userCouponId}`
- chi danh cho role `USER`
- chi tra coupon cua user dang dang nhap
- khong tinh billing preview
- khong apply coupon
- khong finalize coupon
- co tra thong tin `conditions` de frontend hien thi rule ap dung

Guide nay duoc viet de frontend team co the:

- login bang account demo that
- test API bang Scalar
- doi chieu data bang pgAdmin
- co data deterministic de code man hinh coupon detail
- biet ro cac case `200`, `400`, `401`, `403`, `404`
- tiep tuc code UI detail screen va flow tu list -> detail

Luu y quan trong:

- `seed:demo` hien tai KHONG tu seed coupon
- `seed:demo` chi seed account login that, rental, reservation, subscription, wallet va data nghiep vu khac
- de test coupon detail, can chen them coupon bang SQL trong guide nay
- guide nay dung "data that" theo nghia:
  - account login that co san tu `seed:demo`
  - coupon test data duoc chen that vao DB dev bang SQL deterministic

Guide lien quan:

- file list guide da co san: `docs/coupons/coupons-list-scalar-pgadmin-frontend-guide.md`
- frontend nen dung `GET /v1/coupons` de lay `userCouponId`, sau do dung `GET /v1/coupons/{userCouponId}` de mo man detail

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

## 2. Account demo that co san sau khi `pnpm seed:demo`

Tat ca account demo dung password:

```text
Demo@123456
```

Account nen dung cho coupons:

- `user01@mebike.local`
- `user02@mebike.local`
- `admin@mebike.local`

Mot so account demo khac:

- `staff1@mebike.local`
- `agency1@mebike.local`
- `agency2@mebike.local`
- `tech1@mebike.local`

Luu y ve "data that":

- email va password o tren la data that duoc seed boi `seed:demo`
- `user.id` KHONG nen hardcode theo lan seed truoc, vi user demo duoc tao moi
- trong SQL cua guide nay, moi insert vao `user_coupons` deu resolve `user_id` bang:

```sql
SELECT id FROM users WHERE email = 'user01@mebike.local'
```

=> frontend team khong can tu tim UUID user bang tay de insert coupon test data

## 3. Login trong Scalar

Dung `POST /v1/auth/login`.

Body de login user dung cho coupon detail:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Ky vong:

- `200`
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

## 4. Scope nghiep vu cua API detail nay

Endpoint:

```text
GET /v1/coupons/{userCouponId}
```

Muc dich:

- user dang dang nhap xem chi tiet 1 coupon cua chinh minh

Khong nam trong scope cua API nay:

- billing preview
- coupon apply
- coupon finalize
- staff/admin/agency truy cap endpoint nay

Rule an toan:

- neu `userCouponId` khong ton tai -> `404`
- neu `userCouponId` thuoc user khac -> `404`
- khong duoc lo data coupon cua user khac

## 5. Response shape ma frontend can bam theo

Response detail hien tai:

```json
{
  "userCouponId": "018fa200-0000-7000-8000-000000000103",
  "couponId": "018fa200-0000-7000-8000-000000000102",
  "couponRuleId": "018fa200-0000-7000-8000-000000000101",
  "couponRuleName": "Tier 2h Riding Coupon",
  "code": "SCALAR-DETAIL-2000",
  "status": "ASSIGNED",
  "discountType": "FIXED_AMOUNT",
  "discountValue": "2000",
  "expiresAt": "2026-06-30T00:00:00.000Z",
  "assignedAt": "2026-04-15T08:00:00.000Z",
  "usedAt": null,
  "lockedAt": null,
  "lockExpiresAt": null,
  "description": null,
  "coupon": {
    "id": "018fa200-0000-7000-8000-000000000102",
    "code": "SCALAR-DETAIL-2000",
    "discountType": "FIXED_AMOUNT",
    "discountValue": "2000",
    "expiresAt": "2026-06-30T00:00:00.000Z",
    "rule": {
      "id": "018fa200-0000-7000-8000-000000000101",
      "name": "Tier 2h Riding Coupon",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 120,
      "minBillableHours": "2"
    }
  },
  "conditions": {
    "requiresNoSubscription": true,
    "usesBillableHours": true,
    "billableMinutesPerBlock": 30,
    "billableHoursPerBlock": "0.5",
    "minimumBillableHours": "2",
    "appliesToPenalty": false,
    "appliesToDepositForfeited": false,
    "appliesToOtherFees": false,
    "maxCouponsPerRental": 1
  }
}
```

### 5.1. Field notes cho frontend

- `discountValue` la `string`, khong phai `number`
- `description` hien tai se la `null` vi baseline + Prisma chua co cot description cho coupon/rule
- co 2 nhom field:
  - field phang o top-level de render nhanh
  - field nested trong `coupon` va `coupon.rule` de phuc vu UI detail ro hon
- `usedAt`, `lockedAt`, `lockExpiresAt`, `expiresAt`, `couponRuleId`, `couponRuleName` deu co the `null`
- `conditions` la data quan trong de frontend hien thi "coupon dung trong truong hop nao"

### 5.2. Y nghia `conditions`

`conditions` hien tai the hien Coupon V1 baseline:

- `requiresNoSubscription = true`
- `usesBillableHours = true`
- `billableMinutesPerBlock = 30`
- `billableHoursPerBlock = "0.5"`
- `minimumBillableHours` phu thuoc `couponRule.minRidingMinutes`
- `appliesToPenalty = false`
- `appliesToDepositForfeited = false`
- `appliesToOtherFees = false`
- `maxCouponsPerRental = 1`

Goi y copy text cho UI:

- "Chi ap dung khi rental khong co subscription"
- "Tinh dieu kien theo billable hours"
- "Khong ap dung cho penalty"
- "Khong ap dung cho deposit forfeited"
- "Khong ap dung cho phi khac"
- "Moi rental toi da 1 coupon"

### 5.3. TypeScript shape goi y cho frontend

```ts
export type CouponStatus =
  | "ACTIVE"
  | "ASSIGNED"
  | "LOCKED"
  | "USED"
  | "EXPIRED"
  | "CANCELLED";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type CouponTriggerType =
  | "RIDING_DURATION"
  | "USAGE_FREQUENCY"
  | "CAMPAIGN"
  | "MEMBERSHIP_MILESTONE"
  | "MANUAL_GRANT";

export type UserCouponDetail = {
  userCouponId: string;
  couponId: string;
  couponRuleId: string | null;
  couponRuleName: string | null;
  code: string;
  status: CouponStatus;
  discountType: CouponDiscountType;
  discountValue: string;
  expiresAt: string | null;
  assignedAt: string;
  usedAt: string | null;
  lockedAt: string | null;
  lockExpiresAt: string | null;
  description: string | null;
  coupon: {
    id: string;
    code: string;
    discountType: CouponDiscountType;
    discountValue: string;
    expiresAt: string | null;
    rule: {
      id: string | null;
      name: string | null;
      triggerType: CouponTriggerType | null;
      minRidingMinutes: number | null;
      minBillableHours: string | null;
    };
  };
  conditions: {
    requiresNoSubscription: boolean;
    usesBillableHours: boolean;
    billableMinutesPerBlock: number;
    billableHoursPerBlock: string;
    minimumBillableHours: string | null;
    appliesToPenalty: boolean;
    appliesToDepositForfeited: boolean;
    appliesToOtherFees: boolean;
    maxCouponsPerRental: number;
  };
};
```

## 6. Data coupon deterministic de test detail API

Section nay chen coupon test data that vao DB dev sau khi da chay `seed:demo`.

Muc tieu:

- `user01@mebike.local` co nhieu coupon voi nhieu status de frontend test man detail
- `user02@mebike.local` co 1 coupon rieng de verify ownership va safe `404`
- tat ca ID trong section nay la deterministic de frontend de copy-paste test lai

### 6.1. SQL cleanup truoc khi insert

Copy-paste vao pgAdmin:

```sql
DELETE FROM user_coupons
WHERE id IN (
  '018fa200-0000-7000-8000-000000000103',
  '018fa200-0000-7000-8000-000000000113',
  '018fa200-0000-7000-8000-000000000123',
  '018fa200-0000-7000-8000-000000000133',
  '018fa200-0000-7000-8000-000000000143',
  '018fa200-0000-7000-8000-000000000203'
);

DELETE FROM coupons
WHERE id IN (
  '018fa200-0000-7000-8000-000000000102',
  '018fa200-0000-7000-8000-000000000112',
  '018fa200-0000-7000-8000-000000000122',
  '018fa200-0000-7000-8000-000000000132',
  '018fa200-0000-7000-8000-000000000142',
  '018fa200-0000-7000-8000-000000000202'
)
OR code IN (
  'SCALAR-DETAIL-2000',
  'SCALAR-LOCKED-1000',
  'SCALAR-USED-4000',
  'SCALAR-EXPIRED-6000',
  'SCALAR-CANCELLED-1000',
  'SCALAR-OTHER-2000'
);

DELETE FROM coupon_rules
WHERE id IN (
  '018fa200-0000-7000-8000-000000000101',
  '018fa200-0000-7000-8000-000000000111',
  '018fa200-0000-7000-8000-000000000121',
  '018fa200-0000-7000-8000-000000000131',
  '018fa200-0000-7000-8000-000000000141'
);
```

### 6.2. SQL insert coupon rules + coupons + user coupons

Copy-paste vao pgAdmin:

```sql
INSERT INTO coupon_rules (
  id,
  name,
  trigger_type,
  min_riding_minutes,
  min_completed_rentals,
  discount_type,
  discount_value,
  status,
  priority,
  active_from,
  active_to,
  created_at,
  updated_at
) VALUES
(
  '018fa200-0000-7000-8000-000000000101',
  'Tier 2h Riding Coupon',
  'RIDING_DURATION',
  120,
  NULL,
  'FIXED_AMOUNT',
  2000.00,
  'ACTIVE',
  90,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  NULL,
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000111',
  'Tier 1h Riding Coupon',
  'RIDING_DURATION',
  60,
  NULL,
  'FIXED_AMOUNT',
  1000.00,
  'ACTIVE',
  100,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  NULL,
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000121',
  'Tier 4h Riding Coupon',
  'RIDING_DURATION',
  240,
  NULL,
  'FIXED_AMOUNT',
  4000.00,
  'ACTIVE',
  110,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  NULL,
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000131',
  'Tier 6h Riding Coupon',
  'RIDING_DURATION',
  360,
  NULL,
  'FIXED_AMOUNT',
  6000.00,
  'ACTIVE',
  120,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  NULL,
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000141',
  'Tier 2h Backup Coupon',
  'RIDING_DURATION',
  120,
  NULL,
  'FIXED_AMOUNT',
  1000.00,
  'ACTIVE',
  130,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO coupons (
  id,
  coupon_rule_id,
  code,
  discount_type,
  discount_value,
  expires_at,
  status,
  created_at,
  updated_at
) VALUES
(
  '018fa200-0000-7000-8000-000000000102',
  '018fa200-0000-7000-8000-000000000101',
  'SCALAR-DETAIL-2000',
  'FIXED_AMOUNT',
  2000.00,
  TIMESTAMPTZ '2026-06-30T00:00:00.000Z',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000112',
  '018fa200-0000-7000-8000-000000000111',
  'SCALAR-LOCKED-1000',
  'FIXED_AMOUNT',
  1000.00,
  TIMESTAMPTZ '2026-06-15T00:00:00.000Z',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000122',
  '018fa200-0000-7000-8000-000000000121',
  'SCALAR-USED-4000',
  'FIXED_AMOUNT',
  4000.00,
  TIMESTAMPTZ '2026-06-10T00:00:00.000Z',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000132',
  '018fa200-0000-7000-8000-000000000131',
  'SCALAR-EXPIRED-6000',
  'FIXED_AMOUNT',
  6000.00,
  TIMESTAMPTZ '2026-04-15T00:00:00.000Z',
  'EXPIRED',
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000142',
  '018fa200-0000-7000-8000-000000000141',
  'SCALAR-CANCELLED-1000',
  'FIXED_AMOUNT',
  1000.00,
  TIMESTAMPTZ '2026-06-20T00:00:00.000Z',
  'CANCELLED',
  NOW(),
  NOW()
),
(
  '018fa200-0000-7000-8000-000000000202',
  '018fa200-0000-7000-8000-000000000101',
  'SCALAR-OTHER-2000',
  'FIXED_AMOUNT',
  2000.00,
  TIMESTAMPTZ '2026-06-30T00:00:00.000Z',
  'ACTIVE',
  NOW(),
  NOW()
);

INSERT INTO user_coupons (
  id,
  user_id,
  coupon_id,
  assigned_at,
  used_at,
  locked_at,
  lock_expires_at,
  locked_for_payment_id,
  status
) VALUES
(
  '018fa200-0000-7000-8000-000000000103',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '018fa200-0000-7000-8000-000000000102',
  TIMESTAMPTZ '2026-04-15T08:00:00.000Z',
  NULL,
  NULL,
  NULL,
  NULL,
  'ASSIGNED'
),
(
  '018fa200-0000-7000-8000-000000000113',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '018fa200-0000-7000-8000-000000000112',
  TIMESTAMPTZ '2026-04-14T08:00:00.000Z',
  NULL,
  TIMESTAMPTZ '2026-04-16T09:00:00.000Z',
  TIMESTAMPTZ '2026-04-16T09:15:00.000Z',
  NULL,
  'LOCKED'
),
(
  '018fa200-0000-7000-8000-000000000123',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '018fa200-0000-7000-8000-000000000122',
  TIMESTAMPTZ '2026-04-13T08:00:00.000Z',
  TIMESTAMPTZ '2026-04-14T10:30:00.000Z',
  NULL,
  NULL,
  NULL,
  'USED'
),
(
  '018fa200-0000-7000-8000-000000000133',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '018fa200-0000-7000-8000-000000000132',
  TIMESTAMPTZ '2026-04-12T08:00:00.000Z',
  NULL,
  NULL,
  NULL,
  NULL,
  'EXPIRED'
),
(
  '018fa200-0000-7000-8000-000000000143',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '018fa200-0000-7000-8000-000000000142',
  TIMESTAMPTZ '2026-04-11T08:00:00.000Z',
  NULL,
  NULL,
  NULL,
  NULL,
  'CANCELLED'
),
(
  '018fa200-0000-7000-8000-000000000203',
  (SELECT id FROM users WHERE email = 'user02@mebike.local'),
  '018fa200-0000-7000-8000-000000000202',
  TIMESTAMPTZ '2026-04-16T08:00:00.000Z',
  NULL,
  NULL,
  NULL,
  NULL,
  'ASSIGNED'
);
```

### 6.3. SQL verify sau khi insert

```sql
SELECT
  u.email,
  uc.id AS user_coupon_id,
  uc.status AS user_coupon_status,
  uc.assigned_at,
  uc.used_at,
  uc.locked_at,
  uc.lock_expires_at,
  c.id AS coupon_id,
  c.code,
  c.discount_type,
  c.discount_value,
  c.expires_at,
  c.status AS coupon_status,
  cr.id AS coupon_rule_id,
  cr.name AS coupon_rule_name,
  cr.trigger_type,
  cr.min_riding_minutes
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = c.coupon_rule_id
WHERE u.email IN ('user01@mebike.local', 'user02@mebike.local')
ORDER BY u.email, uc.assigned_at DESC;
```

Ky vong:

- `user01@mebike.local` co 5 coupon
- `user02@mebike.local` co 1 coupon
- `user01` co du cac status:
  - `ASSIGNED`
  - `LOCKED`
  - `USED`
  - `EXPIRED`
  - `CANCELLED`

## 7. Mapping nhanh giua userCouponId va case test

Frontend co the dung bang nay de test nhanh:

| Case | userCouponId | email owner | status | code | note |
| --- | --- | --- | --- | --- | --- |
| own assigned detail | `018fa200-0000-7000-8000-000000000103` | `user01@mebike.local` | `ASSIGNED` | `SCALAR-DETAIL-2000` | case `200` chinh |
| own locked detail | `018fa200-0000-7000-8000-000000000113` | `user01@mebike.local` | `LOCKED` | `SCALAR-LOCKED-1000` | test `lockedAt`, `lockExpiresAt` |
| own used detail | `018fa200-0000-7000-8000-000000000123` | `user01@mebike.local` | `USED` | `SCALAR-USED-4000` | test `usedAt` |
| own expired detail | `018fa200-0000-7000-8000-000000000133` | `user01@mebike.local` | `EXPIRED` | `SCALAR-EXPIRED-6000` | test expired state |
| own cancelled detail | `018fa200-0000-7000-8000-000000000143` | `user01@mebike.local` | `CANCELLED` | `SCALAR-CANCELLED-1000` | test cancelled state |
| other user coupon | `018fa200-0000-7000-8000-000000000203` | `user02@mebike.local` | `ASSIGNED` | `SCALAR-OTHER-2000` | `user01` truy cap se bi `404` |
| not found | `018fa100-0000-7000-8000-000000009999` | none | none | none | `404` |

## 8. Scalar test checklist

Frontend team nen test theo dung thu tu nay.

### 8.1. Case 1: login thanh cong voi user01

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

Ky vong:

- `200`
- co `accessToken`

### 8.2. Case 2: lay list coupon de frontend co userCouponId that

Guide nay tap trung vao detail, nhung frontend nen test them buoc nay:

```text
GET /v1/coupons
```

Ky vong:

- `200`
- chi thay coupon cua `user01@mebike.local`
- co cac `userCouponId` dung nhu section 7

### 8.3. Case 3: lay detail coupon ASSIGNED cua chinh minh

Goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000103
```

Ky vong:

- `200`
- body co:
  - `status = ASSIGNED`
  - `code = SCALAR-DETAIL-2000`
  - `coupon.rule.name = Tier 2h Riding Coupon`
  - `coupon.rule.minBillableHours = "2"`
  - `conditions.requiresNoSubscription = true`
  - `conditions.maxCouponsPerRental = 1`
  - `usedAt = null`
  - `lockedAt = null`
  - `lockExpiresAt = null`
  - `description = null`

### 8.4. Case 4: lay detail coupon LOCKED cua chinh minh

Goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000113
```

Ky vong:

- `200`
- body co:
  - `status = LOCKED`
  - `code = SCALAR-LOCKED-1000`
  - `lockedAt = "2026-04-16T09:00:00.000Z"`
  - `lockExpiresAt = "2026-04-16T09:15:00.000Z"`
  - `usedAt = null`
  - `coupon.rule.minBillableHours = "1"`

### 8.5. Case 5: lay detail coupon USED cua chinh minh

Goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000123
```

Ky vong:

- `200`
- body co:
  - `status = USED`
  - `code = SCALAR-USED-4000`
  - `usedAt = "2026-04-14T10:30:00.000Z"`
  - `lockedAt = null`
  - `coupon.rule.minBillableHours = "4"`

### 8.6. Case 6: lay detail coupon EXPIRED cua chinh minh

Goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000133
```

Ky vong:

- `200`
- body co:
  - `status = EXPIRED`
  - `code = SCALAR-EXPIRED-6000`
  - `expiresAt = "2026-04-15T00:00:00.000Z"`
  - `coupon.rule.minBillableHours = "6"`

### 8.7. Case 7: lay detail coupon CANCELLED cua chinh minh

Goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000143
```

Ky vong:

- `200`
- body co:
  - `status = CANCELLED`
  - `code = SCALAR-CANCELLED-1000`
  - `coupon.rule.minBillableHours = "2"`

### 8.8. Case 8: coupon khong ton tai

Goi:

```text
GET /v1/coupons/018fa100-0000-7000-8000-000000009999
```

Ky vong:

- `404`
- body:

```json
{
  "error": "Coupon not found",
  "details": {
    "code": "COUPON_NOT_FOUND"
  }
}
```

### 8.9. Case 9: user lay coupon cua user khac

Login `user01@mebike.local`, sau do goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000203
```

Ky vong:

- `404`
- body:

```json
{
  "error": "Coupon not found",
  "details": {
    "code": "COUPON_NOT_FOUND"
  }
}
```

### 8.10. Case 10: khong co token

Clear bearer token, goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000103
```

Ky vong:

- `401`
- body:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

### 8.11. Case 11: sai role voi admin

Login:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Sau do goi:

```text
GET /v1/coupons/018fa200-0000-7000-8000-000000000103
```

Ky vong:

- `403`
- vi route chi cho role `USER`

### 8.12. Case 12: invalid path param

Goi:

```text
GET /v1/coupons/not-a-uuid
```

Ky vong:

- `400`
- body validation error theo convention server

Payload mau:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR",
    "issues": [
      {
        "path": "param.userCouponId",
        "message": "Invalid UUID",
        "code": "invalid_format"
      }
    ]
  }
}
```

Luu y:

- text issue thuc te co the khac nhe tuy validator
- frontend chi nen bam vao `status` va `details.code`

## 9. pgAdmin queries de doi chieu voi Scalar

### 9.1. Xac dinh user login that

```sql
SELECT id, email, role, verify_status, account_status
FROM users
WHERE email IN (
  'user01@mebike.local',
  'user02@mebike.local',
  'admin@mebike.local'
)
ORDER BY email;
```

### 9.2. Danh sach coupon detail-ready cua user01 va user02

```sql
SELECT
  u.email,
  uc.id AS user_coupon_id,
  uc.status AS user_coupon_status,
  uc.assigned_at,
  uc.used_at,
  uc.locked_at,
  uc.lock_expires_at,
  c.id AS coupon_id,
  c.code,
  c.discount_type,
  c.discount_value,
  c.expires_at,
  c.status AS coupon_status,
  cr.id AS coupon_rule_id,
  cr.name AS coupon_rule_name,
  cr.trigger_type,
  cr.min_riding_minutes
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = c.coupon_rule_id
WHERE u.email IN ('user01@mebike.local', 'user02@mebike.local')
ORDER BY u.email, uc.assigned_at DESC;
```

### 9.3. Query 1 coupon detail theo `userCouponId`

```sql
SELECT
  uc.id AS user_coupon_id,
  u.email,
  uc.status AS user_coupon_status,
  uc.assigned_at,
  uc.used_at,
  uc.locked_at,
  uc.lock_expires_at,
  c.id AS coupon_id,
  c.code,
  c.discount_type,
  c.discount_value,
  c.expires_at,
  c.status AS coupon_status,
  cr.id AS coupon_rule_id,
  cr.name AS coupon_rule_name,
  cr.trigger_type,
  cr.min_riding_minutes
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = c.coupon_rule_id
WHERE uc.id = '018fa200-0000-7000-8000-000000000103';
```

### 9.4. Verify ownership isolation

```sql
SELECT
  u.email,
  COUNT(*) AS coupon_count
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
WHERE u.email IN ('user01@mebike.local', 'user02@mebike.local')
GROUP BY u.email
ORDER BY u.email;
```

Ky vong:

- `user01@mebike.local` = `5`
- `user02@mebike.local` = `1`

### 9.5. Verify locked coupon

```sql
SELECT
  uc.id,
  uc.status,
  uc.locked_at,
  uc.lock_expires_at,
  c.code
FROM user_coupons uc
JOIN coupons c ON c.id = uc.coupon_id
WHERE uc.id = '018fa200-0000-7000-8000-000000000113';
```

### 9.6. Verify used coupon

```sql
SELECT
  uc.id,
  uc.status,
  uc.used_at,
  c.code
FROM user_coupons uc
JOIN coupons c ON c.id = uc.coupon_id
WHERE uc.id = '018fa200-0000-7000-8000-000000000123';
```

## 10. Frontend flow khuyen nghi

Flow hop ly cho UI:

1. user login
2. goi `GET /v1/coupons`
3. user chon 1 coupon item
4. lay `userCouponId` tu item
5. goi `GET /v1/coupons/{userCouponId}`
6. render man detail

Khong nen hardcode `userCouponId` trong code production.

`userCouponId` la key chinh cho detail screen, khong phai `couponId`.

## 11. Frontend checklist de code man detail

### 11.1. Cac state man hinh can xu ly

- loading lan dau
- success state
- `404` not found
- `401` unauthorized
- `403` forbidden
- `400` validation error neu route param sai

### 11.2. Cac field nen hien thi tren man detail

- `code`
- `status`
- `discountType`
- `discountValue`
- `expiresAt`
- `assignedAt`
- `usedAt`
- `lockedAt`
- `lockExpiresAt`
- `couponRuleName`
- `coupon.rule.triggerType`
- `coupon.rule.minRidingMinutes`
- `coupon.rule.minBillableHours`
- `conditions.requiresNoSubscription`
- `conditions.usesBillableHours`
- `conditions.billableMinutesPerBlock`
- `conditions.billableHoursPerBlock`
- `conditions.minimumBillableHours`
- `conditions.appliesToPenalty`
- `conditions.appliesToDepositForfeited`
- `conditions.appliesToOtherFees`
- `conditions.maxCouponsPerRental`

### 11.3. Goi y mapping UI theo `status`

- `ASSIGNED`: coupon san sang dung
- `LOCKED`: coupon dang bi khoa tam thoi
- `USED`: da su dung
- `EXPIRED`: het han
- `CANCELLED`: da bi huy

### 11.4. Null handling can co tren UI

- `description == null` -> an section description hoac hien `Khong co mo ta`
- `usedAt == null` -> an section `Da su dung luc`
- `lockedAt == null` -> an section `Khoa luc`
- `lockExpiresAt == null` -> an section `Khoa den`
- `expiresAt == null` -> hien `Khong co han su dung`
- `coupon.rule.id == null` -> fallback `Khong co coupon rule`
- `coupon.rule.minBillableHours == null` -> fallback `Khong gioi han billable hours`

### 11.5. Goi y render text nghiep vu

Neu `conditions` la:

```json
{
  "requiresNoSubscription": true,
  "usesBillableHours": true,
  "billableMinutesPerBlock": 30,
  "billableHoursPerBlock": "0.5",
  "minimumBillableHours": "2",
  "appliesToPenalty": false,
  "appliesToDepositForfeited": false,
  "appliesToOtherFees": false,
  "maxCouponsPerRental": 1
}
```

Frontend co the hien:

- "Chi ap dung khi rental khong co subscription"
- "Xet theo billable hours"
- "Moi block billing: 30 phut (0.5 gio)"
- "Can toi thieu 2 billable hours"
- "Khong ap dung cho penalty"
- "Khong ap dung cho deposit forfeited"
- "Khong ap dung cho phi khac"
- "Moi rental toi da 1 coupon"

### 11.6. Parse `discountValue`

Vi API tra `discountValue` la `string`:

- frontend nen parse khi can tinh toan hoac format tien
- UI don gian co the hien truc tiep string + formatter

Vi du:

- `FIXED_AMOUNT` + `"2000"` -> `Giam 2.000 VND`
- `PERCENTAGE` + `"10"` -> `Giam 10%`

## 12. Goi API tu frontend

Vi du voi `fetch`:

```ts
export async function getMyCouponDetail(
  baseUrl: string,
  accessToken: string,
  userCouponId: string,
): Promise<UserCouponDetail> {
  const response = await fetch(`${baseUrl}/v1/coupons/${userCouponId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw body;
  }

  return body as UserCouponDetail;
}
```

Frontend co the handle error:

```ts
try {
  const detail = await getMyCouponDetail(apiBaseUrl, accessToken, userCouponId);
  setCouponDetail(detail);
} catch (error) {
  const body = error as {
    error: string;
    details?: { code?: string };
  };

  if (body.details?.code === "COUPON_NOT_FOUND") {
    setNotFound(true);
    return;
  }

  if (body.details?.code === "UNAUTHORIZED") {
    // redirect login hoac clear auth state
    return;
  }

  throw error;
}
```

## 13. Sequence test khuyen nghi cho frontend team

Thu tu nhanh nhat:

1. chay `pnpm seed:demo`
2. login `user01@mebike.local`
3. vao pgAdmin, chay SQL section `6.2`
4. goi `GET /v1/coupons`
5. goi `GET /v1/coupons/018fa200-0000-7000-8000-000000000103`
6. goi `GET /v1/coupons/018fa200-0000-7000-8000-000000000113`
7. goi `GET /v1/coupons/018fa200-0000-7000-8000-000000000123`
8. goi `GET /v1/coupons/018fa100-0000-7000-8000-000000009999`
9. goi `GET /v1/coupons/018fa200-0000-7000-8000-000000000203`
10. clear token test `401`
11. login `admin@mebike.local` test `403`
12. test path sai `not-a-uuid` de xem `400`

## 14. Troubleshooting

Neu `GET /v1/coupons/{userCouponId}` tra `404` trong khi frontend nghi rang coupon ton tai:

1. kiem tra dang login dung `user01@mebike.local` hay khong
2. kiem tra `userCouponId` co thuoc `user01` hay thuoc `user02`
3. chay query:

```sql
SELECT
  uc.id,
  u.email,
  uc.status,
  c.code
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
WHERE uc.id IN (
  '018fa200-0000-7000-8000-000000000103',
  '018fa200-0000-7000-8000-000000000203'
);
```

4. dang nhap lai de lay token moi

Neu login fail:

- xac nhan da chay `pnpm seed:demo`
- xac nhan dung password `Demo@123456`

Neu query insert coupon fail:

- xac nhan dang o dung DB dev
- xac nhan `users` table co `user01@mebike.local` va `user02@mebike.local`
- chay query:

```sql
SELECT id, email
FROM users
WHERE email IN ('user01@mebike.local', 'user02@mebike.local');
```

## 15. Summary cho team frontend

Data that co san ngay sau `seed:demo`:

- account login that
- JWT auth flow that
- user demo that

Data coupon de test detail:

- can chen them bang SQL trong guide nay
- sau khi chen, `user01@mebike.local` co du data de test:
  - detail assigned
  - detail locked
  - detail used
  - detail expired
  - detail cancelled
  - safe `404` voi coupon cua user khac

Neu frontend team chi muon copy-paste nhanh, hay lam theo:

1. `POST /v1/auth/login` voi `user01@mebike.local / Demo@123456`
2. chay SQL section `6.2`
3. `GET /v1/coupons`
4. `GET /v1/coupons/018fa200-0000-7000-8000-000000000103`
5. `GET /v1/coupons/018fa200-0000-7000-8000-000000000113`
6. `GET /v1/coupons/018fa200-0000-7000-8000-000000000123`
7. `GET /v1/coupons/018fa200-0000-7000-8000-000000000203` de test `404`
