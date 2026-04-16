# Coupons List Scalar + pgAdmin + Frontend Guide

File nay dung cho API moi:

- `GET /v1/coupons`
- chi danh cho role `USER`
- chi tra coupon cua user dang dang nhap
- ho tro filter theo `status`
- ho tro pagination `page`, `pageSize`
- sort mac dinh: `assignedAt DESC` (coupon moi cap truoc)

Muc tieu cua guide nay:

- cho frontend team test API bang Scalar
- doi chieu data bang pgAdmin
- co data that de hien thi UI coupon list
- biet chinh xac response shape, nullability va cac case can xu ly tren giao dien

Luu y quan trong:

- `seed:demo` hien tai KHONG tu seed coupon
- demo seed co san account login that, rental, reservation, subscription, wallet
- de test `GET /v1/coupons` vuot qua empty state, can chen them coupon bang SQL trong guide nay

## 1. Chay lai du lieu demo

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
- `user19@mebike.local`
- `user20@mebike.local`

Nguon seed:

- file `apps/server/prisma/seed-demo.ts`
- seed logins cuoi file cung in ra:
  - `admin@mebike.local`
  - `staff1@mebike.local`
  - `manager@mebike.local`
  - `agency1@mebike.local`
  - `agency2@mebike.local`
  - `tech1@mebike.local`
  - `user01@mebike.local`
  - password `Demo@123456`

## 3. Login trong Scalar

Dung `POST /v1/auth/login`.

Body de login user dung cho coupons:

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

## 4. Contract API ma frontend can bam theo

### 4.1. Endpoint

```text
GET /v1/coupons
```

### 4.2. Query params

- `status`: optional
- `page`: optional, mac dinh `1`
- `pageSize`: optional, mac dinh `50`

Gia tri hop le cho `status`:

- `ACTIVE`
- `ASSIGNED`
- `LOCKED`
- `USED`
- `EXPIRED`
- `CANCELLED`

Luu y:

- filter `status` dang ap vao `user_coupons.status`
- endpoint van co the tra item co `coupon.status` khac, nhung response hien tai chi expose `user_coupons.status`

### 4.3. Response shape

```json
{
  "data": [
    {
      "userCouponId": "33333333-3333-4333-8333-333333333332",
      "couponId": "22222222-2222-4222-8222-222222222222",
      "code": "USER01-CPN-1000-B",
      "status": "LOCKED",
      "discountType": "FIXED_AMOUNT",
      "discountValue": "1000",
      "expiresAt": "2026-05-01T00:00:00.000Z",
      "assignedAt": "2026-04-15T08:00:00.000Z",
      "usedAt": null,
      "lockedAt": "2026-04-16T08:00:00.000Z",
      "lockExpiresAt": "2026-04-16T08:14:00.000Z",
      "couponRuleId": "11111111-1111-4111-8111-111111111111",
      "couponRuleName": "Tier 2 Riding Coupon"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

### 4.4. Field notes cho frontend

- `discountValue` la `string`, khong phai `number`
- `expiresAt` co the `null`
- `usedAt` co the `null`
- `lockedAt` co the `null`
- `lockExpiresAt` co the `null`
- `couponRuleId` co the `null`
- `couponRuleName` co the `null`
- `status` la trang thai chinh de UI ve badge va filter
- sort response mac dinh da la `assignedAt DESC`

### 4.5. TypeScript shape goi y cho frontend

```ts
export type CouponStatus =
  | "ACTIVE"
  | "ASSIGNED"
  | "LOCKED"
  | "USED"
  | "EXPIRED"
  | "CANCELLED";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type UserCouponItem = {
  userCouponId: string;
  couponId: string;
  code: string;
  status: CouponStatus;
  discountType: CouponDiscountType;
  discountValue: string;
  expiresAt: string | null;
  assignedAt: string;
  usedAt: string | null;
  lockedAt: string | null;
  lockExpiresAt: string | null;
  couponRuleId: string | null;
  couponRuleName: string | null;
};

export type ListCouponsResponse = {
  data: UserCouponItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
```

## 5. Empty state that ngay sau `seed:demo`

Vi `seed:demo` chua insert coupon, neu login `user01@mebike.local` va goi:

```text
GET /v1/coupons
```

thi ky vong thong thuong la:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

Case nay frontend can support:

- man hinh rong
- khong loi
- van co `pagination.total = 0`

## 6. Tao data coupon that de test UI va API

Section nay dung de chen coupon that vao DB dev sau khi da chay `seed:demo`.

Muc tieu:

- `user01@mebike.local` co nhieu coupon voi nhieu status de frontend test UI
- `user02@mebike.local` co 1 coupon rieng de verify API khong lo data cua user khac

### 6.1. SQL cleanup truoc khi insert

Copy-paste vao pgAdmin:

```sql
DELETE FROM user_coupons
WHERE id IN (
  '33333333-3333-4333-8333-333333333331',
  '33333333-3333-4333-8333-333333333332',
  '33333333-3333-4333-8333-333333333333',
  '33333333-3333-4333-8333-333333333334',
  '33333333-3333-4333-8333-333333333335',
  '33333333-3333-4333-8333-333333333336'
);

DELETE FROM coupons
WHERE id IN (
  '22222222-2222-4222-8222-222222222221',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222223',
  '22222222-2222-4222-8222-222222222224',
  '22222222-2222-4222-8222-222222222225',
  '22222222-2222-4222-8222-222222222226'
);

DELETE FROM coupon_rules
WHERE id = '11111111-1111-4111-8111-111111111111';
```

### 6.2. SQL insert coupon rule + coupons + user coupons

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
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Tier 2 Riding Coupon',
  'RIDING_DURATION',
  120,
  NULL,
  'FIXED_AMOUNT',
  2000,
  'ACTIVE',
  100,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '90 days',
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
  '22222222-2222-4222-8222-222222222221',
  '11111111-1111-4111-8111-111111111111',
  'USER01-CPN-2000-A',
  'FIXED_AMOUNT',
  2000,
  NOW() + INTERVAL '30 days',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'USER01-CPN-1000-B',
  'FIXED_AMOUNT',
  1000,
  NOW() + INTERVAL '15 days',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '22222222-2222-4222-8222-222222222223',
  '11111111-1111-4111-8111-111111111111',
  'USER01-CPN-USED-C',
  'FIXED_AMOUNT',
  4000,
  NOW() + INTERVAL '10 days',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '22222222-2222-4222-8222-222222222224',
  '11111111-1111-4111-8111-111111111111',
  'USER01-CPN-EXPIRED-D',
  'FIXED_AMOUNT',
  6000,
  NOW() - INTERVAL '1 day',
  'EXPIRED',
  NOW(),
  NOW()
),
(
  '22222222-2222-4222-8222-222222222225',
  '11111111-1111-4111-8111-111111111111',
  'USER01-CPN-CANCELLED-E',
  'FIXED_AMOUNT',
  1000,
  NOW() + INTERVAL '20 days',
  'CANCELLED',
  NOW(),
  NOW()
),
(
  '22222222-2222-4222-8222-222222222226',
  '11111111-1111-4111-8111-111111111111',
  'USER02-CPN-PRIVATE',
  'FIXED_AMOUNT',
  2000,
  NOW() + INTERVAL '40 days',
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
  '33333333-3333-4333-8333-333333333331',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '22222222-2222-4222-8222-222222222221',
  NOW() - INTERVAL '5 days',
  NULL,
  NULL,
  NULL,
  NULL,
  'ASSIGNED'
),
(
  '33333333-3333-4333-8333-333333333332',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '22222222-2222-4222-8222-222222222222',
  NOW() - INTERVAL '4 days',
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '13 minutes',
  NULL,
  'LOCKED'
),
(
  '33333333-3333-4333-8333-333333333333',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '22222222-2222-4222-8222-222222222223',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days',
  NULL,
  NULL,
  NULL,
  'USED'
),
(
  '33333333-3333-4333-8333-333333333334',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '22222222-2222-4222-8222-222222222224',
  NOW() - INTERVAL '2 days',
  NULL,
  NULL,
  NULL,
  NULL,
  'EXPIRED'
),
(
  '33333333-3333-4333-8333-333333333335',
  (SELECT id FROM users WHERE email = 'user01@mebike.local'),
  '22222222-2222-4222-8222-222222222225',
  NOW() - INTERVAL '1 day',
  NULL,
  NULL,
  NULL,
  NULL,
  'CANCELLED'
),
(
  '33333333-3333-4333-8333-333333333336',
  (SELECT id FROM users WHERE email = 'user02@mebike.local'),
  '22222222-2222-4222-8222-222222222226',
  NOW() - INTERVAL '1 hour',
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
  uc.status,
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
  c.coupon_rule_id,
  cr.name AS coupon_rule_name
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

## 7. Scalar test checklist

Frontend team nen test theo dung thu tu nay.

### 7.1. Case 1: login thanh cong

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

### 7.2. Case 2: list coupon cua user hien tai

Goi:

```text
GET /v1/coupons
```

Ky vong:

- `200`
- chi tra coupon cua `user01@mebike.local`
- KHONG tra `USER02-CPN-PRIVATE`
- thu tu item la moi assigned truoc:
  - `USER01-CPN-CANCELLED-E`
  - `USER01-CPN-EXPIRED-D`
  - `USER01-CPN-USED-C`
  - `USER01-CPN-1000-B`
  - `USER01-CPN-2000-A`

Luu y:

- thu tu tren dua tren `assigned_at` trong SQL insert
- API sort theo `assignedAt DESC`

### 7.3. Case 3: filter `status=ASSIGNED`

Goi:

```text
GET /v1/coupons?status=ASSIGNED
```

Ky vong:

- `200`
- tra 1 item
- item do co `code = USER01-CPN-2000-A`

### 7.4. Case 4: filter `status=LOCKED`

Goi:

```text
GET /v1/coupons?status=LOCKED
```

Ky vong:

- `200`
- tra 1 item
- item do co:
  - `code = USER01-CPN-1000-B`
  - `lockedAt != null`
  - `lockExpiresAt != null`

### 7.5. Case 5: filter `status=USED`

Goi:

```text
GET /v1/coupons?status=USED
```

Ky vong:

- `200`
- tra 1 item
- item do co:
  - `code = USER01-CPN-USED-C`
  - `usedAt != null`

### 7.6. Case 6: filter `status=EXPIRED`

Goi:

```text
GET /v1/coupons?status=EXPIRED
```

Ky vong:

- `200`
- tra 1 item
- item do co `code = USER01-CPN-EXPIRED-D`

### 7.7. Case 7: filter `status=CANCELLED`

Goi:

```text
GET /v1/coupons?status=CANCELLED
```

Ky vong:

- `200`
- tra 1 item
- item do co `code = USER01-CPN-CANCELLED-E`

### 7.8. Case 8: pagination `page=1&pageSize=2`

Goi:

```text
GET /v1/coupons?page=1&pageSize=2
```

Ky vong:

- `200`
- `data.length = 2`
- `pagination.page = 1`
- `pagination.pageSize = 2`
- `pagination.total = 5`
- `pagination.totalPages = 3`

### 7.9. Case 9: pagination `page=2&pageSize=2`

Goi:

```text
GET /v1/coupons?page=2&pageSize=2
```

Ky vong:

- `200`
- `data.length = 2`
- `pagination.page = 2`
- van la item cua `user01`

### 7.10. Case 10: pagination `page=3&pageSize=2`

Goi:

```text
GET /v1/coupons?page=3&pageSize=2
```

Ky vong:

- `200`
- `data.length = 1`
- `pagination.total = 5`
- `pagination.totalPages = 3`

### 7.11. Case 11: unauthorized

Khong Authorize, goi:

```text
GET /v1/coupons
```

Ky vong:

- `401`
- payload:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

### 7.12. Case 12: forbidden voi admin

Login:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Sau do goi:

```text
GET /v1/coupons
```

Ky vong:

- `403`
- vi route chi cho role `USER`

### 7.13. Case 13: invalid query `page=0`

Goi:

```text
GET /v1/coupons?page=0
```

Ky vong:

- `400`
- loi validation

Payload mau:

```json
{
  "error": "Invalid request payload",
  "details": {
    "code": "VALIDATION_ERROR",
    "issues": [
      {
        "path": "query.page",
        "message": "Number must be greater than 0",
        "code": "too_small"
      }
    ]
  }
}
```

### 7.14. Case 14: invalid query `status=INVALID`

Goi:

```text
GET /v1/coupons?status=INVALID
```

Ky vong:

- `400`
- loi validation do enum sai

## 8. pgAdmin queries de doi chieu voi Scalar

### 8.1. Xac dinh user login

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

### 8.2. Danh sach coupon cua user01

```sql
SELECT
  uc.id AS user_coupon_id,
  uc.status,
  uc.assigned_at,
  uc.used_at,
  uc.locked_at,
  uc.lock_expires_at,
  c.id AS coupon_id,
  c.code,
  c.discount_type,
  c.discount_value,
  c.expires_at,
  c.coupon_rule_id,
  cr.name AS coupon_rule_name
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = c.coupon_rule_id
WHERE u.email = 'user01@mebike.local'
ORDER BY uc.assigned_at DESC;
```

### 8.3. Verify filter theo status

```sql
SELECT
  uc.id AS user_coupon_id,
  uc.status,
  c.code
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
WHERE u.email = 'user01@mebike.local'
  AND uc.status = 'LOCKED'
ORDER BY uc.assigned_at DESC;
```

### 8.4. Verify user isolation

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

## 9. Frontend checklist de code giao dien

### 9.1. Man hinh list coupon nen xu ly cac state sau

- loading lan dau
- empty state khi `data.length = 0`
- list state co du lieu
- filter theo `status`
- phan trang bang `page` va `pageSize`
- unauthorized `401`
- forbidden `403`
- validation error `400`

### 9.2. Cac field nen hien thi tren item

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

### 9.3. Goi y mapping UI

- `ASSIGNED`: coupon san sang dung
- `LOCKED`: coupon dang bi giu tam cho flow thanh toan
- `USED`: da dung, co the hien `usedAt`
- `EXPIRED`: het han
- `CANCELLED`: da bi huy

Goi y hien thi:

- `couponRuleName ?? "Khong co rule name"`
- `expiresAt == null` -> hien `Khong co han`
- `usedAt == null` -> an row hoac hien `Chua su dung`
- `lockedAt == null` -> an row hoac hien `Khong khoa`
- `lockExpiresAt == null` -> an row hoac hien `Khong co lock expiry`

### 9.4. So sanh string discount

Vi API tra `discountValue` la string:

- frontend nen parse khi can tinh toan hoac format so
- UI don gian co the hien truc tiep string + don vi

Vi du:

- `FIXED_AMOUNT` + `2000` -> hien `Giam 2.000 VND`
- `PERCENTAGE` + `10` -> hien `Giam 10%`

### 9.5. API client goi y

Request:

```ts
await fetch("/v1/coupons?status=ASSIGNED&page=1&pageSize=10", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

Frontend nen coi `status`, `page`, `pageSize` la source of truth cua man hinh list.

## 10. Sequence test khuyen nghi cho frontend team

Thu tu nhanh nhat:

1. chay `pnpm seed:demo`
2. login `user01@mebike.local`
3. test `GET /v1/coupons` de thay empty state
4. vao pgAdmin, chay SQL insert coupon
5. goi lai `GET /v1/coupons`
6. test filter tung status
7. test pagination
8. login `admin@mebike.local`, test `403`
9. bo token, test `401`
10. test `page=0`, `status=INVALID` de xem `400`

## 11. Troubleshooting

Neu `GET /v1/coupons` van tra rong sau khi da insert SQL:

1. kiem tra insert dung DB dev hay chua
2. kiem tra `DATABASE_URL` trong `apps/server/.env`
3. chay query:

```sql
SELECT email, id
FROM users
WHERE email IN ('user01@mebike.local', 'user02@mebike.local');
```

4. chay query:

```sql
SELECT u.email, uc.status, c.code
FROM user_coupons uc
JOIN users u ON u.id = uc.user_id
JOIN coupons c ON c.id = uc.coupon_id
WHERE u.email = 'user01@mebike.local';
```

5. dang nhap lai de lay token moi

Neu login fail:

- xac nhan da chay `pnpm seed:demo`
- xac nhan dung password `Demo@123456`

## 12. Summary cho team frontend

Data that co san ngay sau `seed:demo`:

- account login that
- JWT auth flow that
- user demo that

Data coupon de test UI:

- can chen them bang SQL trong guide nay
- sau khi chen, `user01@mebike.local` co du data de test:
  - list
  - filter
  - pagination
  - state badge
  - empty/null field rendering

Neu frontend team chi muon copy-paste nhanh, hay lam theo:

1. `POST /v1/auth/login` voi `user01@mebike.local / Demo@123456`
2. chay SQL section `6.2`
3. `GET /v1/coupons`
4. `GET /v1/coupons?status=LOCKED`
5. `GET /v1/coupons?page=1&pageSize=2`
