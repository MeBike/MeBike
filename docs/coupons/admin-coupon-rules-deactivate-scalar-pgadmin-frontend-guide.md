# Admin Coupon Rules Deactivate Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
PATCH /v1/admin/coupon-rules/{ruleId}/deactivate
```

Muc tieu API:

- cho admin vo hieu hoa 1 global `coupon_rule`
- API nay la API quan tri de tat 1 rule giam gia tu dong toan he thong
- API nay chi xu ly action `deactivate`
- API nay khong cap nhat toan bo noi dung rule
- API nay chi ghi vao bang `coupon_rules`
- API nay khong ghi vao `coupons`
- API nay khong ghi vao `user_coupons`
- API nay khong tao coupon cho user
- API nay khong can body

Guide nay giup frontend team:

- co data that, on dinh ngay sau `pnpm seed:demo`
- login va lay token that trong Scalar
- test day du success, idempotent va error cases
- doi chieu data trong pgAdmin truoc va sau deactivate
- verify anh huong xuong `GET /v1/coupon-rules/active`
- verify anh huong xuong `GET /v1/rentals/me/{rentalId}/billing-preview`
- code tiep giao dien admin list/detail, nut `Deactivate`, disabled state, confirm flow va refetch flow

Guide lien quan:

- `docs/coupons/admin-coupon-rules-list-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-create-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-update-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-activate-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/coupon-rules-active-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`

## 1. Business baseline ma frontend can hieu dung

MeBike Global Auto Discount Policy V1:

- MeBike Coupon V1 la chinh sach giam gia tu dong toan he thong theo `billableHours`
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

Luu y cho frontend:

- task nay chi tat rule da ton tai
- deactivate khong sua `name`, `minRidingMinutes`, `discountValue`, `priority`, `activeFrom`, `activeTo`
- deactivate khong tao object `coupon`
- deactivate khong tao object `user_coupon`
- sau khi deactivate, rule khong con duoc query-side xem la active

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
3. tim endpoint `PATCH /v1/admin/coupon-rules/{ruleId}/deactivate`

Quan trong:

- guide nay su dung data tu `seed-demo.ts`
- neu DB chi duoc seed bang `seed.ts` thi se khong co login demo de test tu buoc auth
- de co rental test co san dung cho billing preview, can re-run `pnpm seed:demo` sau khi lay code moi nhat

## 3. Tai khoan demo de test

Sau `pnpm seed:demo`, co cac login demo that:

```text
admin: admin@mebike.local
staff: staff1@mebike.local
manager: manager@mebike.local
agency: agency1@mebike.local
agency2: agency2@mebike.local
technician: tech1@mebike.local
user coupon preview: user02@mebike.local
password chung: Demo@123456
```

De test deactivate:

- happy path va idempotent: dung `admin@mebike.local`
- `403`: dung `user02@mebike.local`
- `401`: khong dung token

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

Login user de test billing preview:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

## 5. Data that co san ngay sau `pnpm seed:demo`

### 5.1. 4 global coupon rules mac dinh

Ngay sau `seed:demo`, bang `coupon_rules` da co 4 rule mac dinh:

| id | name | minRidingMinutes | discountValue | status | priority |
| --- | --- | ---: | ---: | --- | ---: |
| `019b17bd-d130-7e7d-be69-91ceef7b7201` | `Ride 1h discount` | `60` | `1000` | `ACTIVE` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7202` | `Ride 2h discount` | `120` | `2000` | `ACTIVE` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7203` | `Ride 4h discount` | `240` | `4000` | `ACTIVE` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7204` | `Ride 6h discount` | `360` | `6000` | `ACTIVE` | `100` |

Tat ca 4 rule mac dinh deu co:

- `trigger_type = RIDING_DURATION`
- `discount_type = FIXED_AMOUNT`
- `status = ACTIVE`
- `active_from = null`
- `active_to = null`
- `min_completed_rentals = null`

### 5.2. Rental test co dinh de verify anh huong billing preview

Demo seed da co san 1 rental active, khong subscription, du lau de an coupon:

```text
user email: user02@mebike.local
rentalId: 019b17bd-d130-7e7d-be69-91ceef7b9021
```

Rental nay duoc tao voi:

- `status = RENTED`
- `subscription_id = null`
- start time khoang `125` phut truoc luc seed

Voi data do, preview truoc khi deactivate se thuong match:

```text
ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202
name = Ride 2h discount
discountValue = 2000
```

Rule frontend nen dung de test deactivate ro nhat:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Ly do:

- rule nay dang `ACTIVE` san
- rental demo o tren du dieu kien de match rule nay
- sau khi deactivate, preview se fallback xuong rule `1h`:

```text
019b17bd-d130-7e7d-be69-91ceef7b7201
```

## 6. API contract ma frontend can bam theo

### 6.1. Endpoint

```text
PATCH /v1/admin/coupon-rules/{ruleId}/deactivate
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

Frontend khong can gui `Content-Type` neu khong gui body.

### 6.2. Semantics cua action deactivate hien tai

Backend dang implement action nay theo semantics:

- chi set `status` cua rule thanh `INACTIVE`
- neu rule da `INACTIVE` roi thi backend tra `200` idempotent voi du lieu hien tai
- neu rule chua ton tai thi `404`
- action nay khong dong vao `name`, `minRidingMinutes`, `discountValue`, `priority`, `activeFrom`, `activeTo`
- action nay khong sinh them record trong bang khac

Y nghia cho frontend:

- repeated click vao rule da inactive khong la business error
- UI co the disable nut `Deactivate` khi `status = INACTIVE`
- neu user van bam duoc thi backend van tra `200`, UI khong nen show do la fail

### 6.3. Path param

`ruleId` phai la UUID v7 hop le.

Vi du that tu seed demo:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

### 6.4. Response shape thanh cong

Response mau:

```json
{
  "id": "019b17bd-d130-7e7d-be69-91ceef7b7202",
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "minBillableHours": 2,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "status": "INACTIVE",
  "priority": 100,
  "activeFrom": null,
  "activeTo": null,
  "createdAt": "2026-04-17T00:00:00.000Z",
  "updatedAt": "2026-04-17T09:30:00.000Z"
}
```

Luu y:

- `id` giu nguyen
- `createdAt` giu nguyen
- `updatedAt` doi neu lan goi nay thuc su chuyen `ACTIVE -> INACTIVE`
- neu rule da `INACTIVE` tu truoc, response van `200` nhung `updatedAt` giu nguyen
- `minBillableHours` la field derive tu `minRidingMinutes / 60`

### 6.5. Error response khi rule khong ton tai

```json
{
  "error": "Coupon rule not found",
  "details": {
    "code": "COUPON_RULE_NOT_FOUND",
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7299"
  }
}
```

### 6.6. TypeScript shape goi y cho frontend

```ts
export type AdminCouponRule = {
  id: string;
  name: string;
  triggerType:
    | "RIDING_DURATION"
    | "USAGE_FREQUENCY"
    | "CAMPAIGN"
    | "MEMBERSHIP_MILESTONE"
    | "MANUAL_GRANT";
  minRidingMinutes: number | null;
  minBillableHours: number | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  priority: number;
  activeFrom: string | null;
  activeTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function deactivateAdminCouponRule(ruleId: string, accessToken: string) {
  const response = await fetch(`/v1/admin/coupon-rules/${ruleId}/deactivate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}
```

## 7. Flow test dung nhat cho frontend team

Day la flow test khuyen nghi nhat vi verify duoc:

- auth
- deactivate admin API
- active rules endpoint
- billing preview endpoint
- idempotent behavior

### 7.1. B1. Login user de lay preview truoc khi deactivate

Login:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Copy `user access token`.

### 7.2. B2. Goi billing preview truoc khi deactivate

Goi:

```text
GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview
```

Header:

```http
Authorization: Bearer <user_access_token>
```

Ky vong:

- HTTP `200`
- `subscriptionApplied = false`
- `bestDiscountRule != null`
- `bestDiscountRule.ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202`
- `bestDiscountRule.name = Ride 2h discount`
- `couponDiscountAmount = 2000`

### 7.3. B3. Goi active rules truoc khi deactivate

Goi:

```text
GET /v1/coupon-rules/active
```

Ky vong:

- rule `019b17bd-d130-7e7d-be69-91ceef7b7202` xuat hien trong list

### 7.4. B4. Login admin

Login:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

Copy `admin access token`.

### 7.5. B5. Goi deactivate API

Goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate
```

Header:

```http
Authorization: Bearer <admin_access_token>
```

Khong body.

Ky vong:

- HTTP `200`
- response `status = INACTIVE`
- response `id = 019b17bd-d130-7e7d-be69-91ceef7b7202`

### 7.6. B6. Goi lai active rules sau khi deactivate

Goi:

```text
GET /v1/coupon-rules/active
```

Ky vong:

- rule `019b17bd-d130-7e7d-be69-91ceef7b7202` khong con xuat hien trong list

### 7.7. B7. Goi lai billing preview sau khi deactivate

Goi lai:

```text
GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview
```

Ky vong:

- HTTP `200`
- `bestDiscountRule` khong con la `...7202`
- preview se fallback thanh rule `1h`:

```json
{
  "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7201",
  "name": "Ride 1h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 60,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 1000
}
```

- `couponDiscountAmount` giam tu `2000` xuong `1000`

## 8. Scalar test guide theo tung case

### 8.1. Case 1: happy path `ACTIVE -> INACTIVE`

Rule dung that:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Trong Scalar:

1. authorize bang admin token
2. mo `PATCH /v1/admin/coupon-rules/{ruleId}/deactivate`
3. set `ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202`
4. khong nhap body
5. bam `Send`

Ky vong:

- HTTP `200`
- response `status = INACTIVE`
- `updatedAt` thay doi so voi gia tri truoc do

### 8.2. Case 2: rule da `INACTIVE`, backend tra `200` idempotent

Sau case 1, goi lai chinh endpoint tren 1 lan nua:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate
```

Ky vong:

- HTTP `200`
- response van `status = INACTIVE`
- response tra ve du lieu hien tai cua rule
- `updatedAt` giu nguyen neu rule da inactive tu truoc

Y nghia cho frontend:

- repeated click khong phai business error
- co the disable nut `Deactivate` tren rule inactive, nhung neu van goi API thi khong can handle nhu fail

### 8.3. Case 3: khong co token

- clear `Authorize`
- goi lai `PATCH /v1/admin/coupon-rules/{ruleId}/deactivate`

Ky vong:

- HTTP `401`

### 8.4. Case 4: token khong phai admin

Login bang:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Sau do authorize token user va goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate
```

Ky vong:

- HTTP `403`

### 8.5. Case 5: `ruleId` khong ton tai

Dung `ruleId` khong ton tai:

```text
019b17bd-d130-7e7d-be69-91ceef7b7299
```

Goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7299/deactivate
```

Ky vong:

- HTTP `404`
- `details.code = COUPON_RULE_NOT_FOUND`

### 8.6. Case 6: `ruleId` sai format

Dung:

```text
not-a-uuid
```

Ky vong:

- HTTP `400`
- `error = Invalid request payload`
- `details.code = VALIDATION_ERROR`

### 8.7. Case 7: verify active list sau deactivate

Sau case 1:

1. goi `GET /v1/coupon-rules/active`
2. verify rule `...7202` khong con trong list

### 8.8. Case 8: verify billing preview sau deactivate

Sau case 1:

1. dang nhap `user02@mebike.local`
2. goi lai `GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview`

Ky vong:

- `bestDiscountRule.ruleId != 019b17bd-d130-7e7d-be69-91ceef7b7202`
- `couponDiscountAmount != 2000`
- voi data demo hien tai, ky vong fallback xuong `1000`

## 9. pgAdmin guide

### 9.1. Bang can kiem tra

Bang backend dung cho API nay:

```text
coupon_rules
```

Bang can kiem tra them de verify billing test:

```text
Rental
```

### 9.2. SQL xem du lieu rule truoc/sau deactivate

Dung rule that:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Chay SQL:

```sql
SELECT
  id,
  name,
  trigger_type,
  min_riding_minutes,
  discount_type,
  discount_value,
  status,
  priority,
  active_from,
  active_to,
  created_at,
  updated_at
FROM coupon_rules
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Ky vong:

- truoc deactivate: `status = ACTIVE`
- sau deactivate thanh cong: `status = INACTIVE`

### 9.3. Cac field phai doi va khong duoc doi

Sau 1 lan deactivate thanh cong tu `ACTIVE -> INACTIVE`:

Field phai doi:

- `status`
- `updated_at`

Field khong duoc doi:

- `id`
- `name`
- `trigger_type`
- `min_riding_minutes`
- `discount_type`
- `discount_value`
- `priority`
- `active_from`
- `active_to`
- `created_at`

### 9.4. SQL verify khong ghi vao `coupons` va `user_coupons`

API nay chi duoc phep ghi vao `coupon_rules`.

Chay:

```sql
SELECT COUNT(*) AS coupon_count FROM coupons;
SELECT COUNT(*) AS user_coupon_count FROM user_coupons;
```

Ky vong:

- deactivate `coupon_rule` khong lam tang giam count trong 2 bang nay
- count truoc va sau deactivate phai giong nhau

### 9.5. SQL verify rental demo co san de test billing preview

Chay:

```sql
SELECT
  id,
  user_id,
  subscription_id,
  status,
  start_time,
  end_time,
  updated_at
FROM "Rental"
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b9021';
```

Ky vong:

- `status = RENTED`
- `subscription_id IS NULL`

### 9.6. SQL verify user cua rental demo

Chay:

```sql
SELECT
  r.id,
  u.email,
  r.status,
  r.subscription_id,
  r.start_time
FROM "Rental" r
JOIN users u ON u.id = r.user_id
WHERE r.id = '019b17bd-d130-7e7d-be69-91ceef7b9021';
```

Ky vong:

- `email = user02@mebike.local`

### 9.7. SQL doi chieu rule active list voi DB

Sau khi deactivate rule `2h`, chay:

```sql
SELECT
  id,
  name,
  min_riding_minutes,
  discount_value,
  status,
  active_from,
  active_to
FROM coupon_rules
WHERE status = 'ACTIVE'
  AND trigger_type = 'RIDING_DURATION'
  AND discount_type = 'FIXED_AMOUNT'
  AND min_riding_minutes IS NOT NULL
  AND (active_from IS NULL OR active_from <= now())
  AND (active_to IS NULL OR active_to >= now())
ORDER BY min_riding_minutes ASC, priority ASC, created_at ASC;
```

Ky vong:

- khong con rule `019b17bd-d130-7e7d-be69-91ceef7b7202`
- van con rule `...7201`, `...7203`, `...7204` neu khong bi sua gi khac

## 10. Data mau de frontend test ngay

### 10.1. Flow test nhanh nhat cho happy path

Admin:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

User:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Rental:

```text
019b17bd-d130-7e7d-be69-91ceef7b9021
```

Rule can deactivate:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Rule fallback sau deactivate:

```text
019b17bd-d130-7e7d-be69-91ceef7b7201
```

### 10.2. Happy path sample response cho deactivate

```json
{
  "id": "019b17bd-d130-7e7d-be69-91ceef7b7202",
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "minBillableHours": 2,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "status": "INACTIVE",
  "priority": 100,
  "activeFrom": null,
  "activeTo": null,
  "createdAt": "2026-04-17T00:00:00.000Z",
  "updatedAt": "2026-04-17T09:45:00.000Z"
}
```

### 10.3. Preview truoc deactivate

Ky vong gan dung:

```json
{
  "rentalId": "019b17bd-d130-7e7d-be69-91ceef7b9021",
  "subscriptionApplied": false,
  "bestDiscountRule": {
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7202",
    "name": "Ride 2h discount",
    "triggerType": "RIDING_DURATION",
    "minRidingMinutes": 120,
    "discountType": "FIXED_AMOUNT",
    "discountValue": 2000
  },
  "couponDiscountAmount": 2000
}
```

### 10.4. Preview sau deactivate

Ky vong gan dung:

```json
{
  "rentalId": "019b17bd-d130-7e7d-be69-91ceef7b9021",
  "subscriptionApplied": false,
  "bestDiscountRule": {
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7201",
    "name": "Ride 1h discount",
    "triggerType": "RIDING_DURATION",
    "minRidingMinutes": 60,
    "discountType": "FIXED_AMOUNT",
    "discountValue": 1000
  },
  "couponDiscountAmount": 1000
}
```

## 11. Frontend implementation notes

### 11.1. Nut `Deactivate` nen hien o dau

Trong admin list/detail screen:

- neu `status = ACTIVE` -> hien nut `Deactivate`
- neu `status = INACTIVE` -> co the disable nut hoac an nut
- neu team van cho bam khi `INACTIVE`, UI nen xu ly `200` nhu no-op thay vi show error

### 11.2. Request flow de nghi

Flow an toan:

1. user mo admin list hoac detail
2. frontend load rule hien tai
3. neu rule `ACTIVE`, user bam `Deactivate`
4. frontend co the show confirm modal:
   - title: `Deactivate discount rule?`
   - message: `Rule nay se khong con duoc dung boi active rules va billing preview/finalize sau thoi diem deactivate.`
5. frontend goi `PATCH /v1/admin/coupon-rules/{ruleId}/deactivate`
6. neu `200`, update local state bang response moi
7. refetch `GET /v1/admin/coupon-rules`
8. neu man hinh co phu thuoc public active list, refetch `GET /v1/coupon-rules/active`

### 11.3. UI states can co

- idle
- confirming
- deactivating
- deactivate success
- unauthorized `401`
- forbidden `403`
- not found `404`
- validation error `400` cho param sai format
- unknown server error `5xx`

### 11.4. Mapping error cho frontend

Neu `400 VALIDATION_ERROR`:

- thong bao `ruleId` khong hop le hoac request khong hop le

Neu `401`:

- yeu cau login lai

Neu `403`:

- hien thong bao khong co quyen admin

Neu `404 COUPON_RULE_NOT_FOUND`:

- hien thong bao rule khong ton tai
- co the refetch list
- neu dang o detail page, co the redirect ve list

### 11.5. Frontend khong nen suy luan sai

Frontend deactivate screen khong nen:

- gui body cho endpoint nay
- coi `PATCH /deactivate` la full update API
- assume deactivate xong thi `coupons` hoac `user_coupons` thay doi
- assume deactivate xong thi billing preview se fail
- assume repeated deactivate la loi nghiep vu

Dieu dung la:

- deactivate xong thi rule khong con la `ACTIVE`
- active rules endpoint se bo qua rule do
- billing preview va finalize se bo qua rule do vi dung chung query logic

## 12. Checklist test nhanh cho team frontend

Sau `pnpm seed:demo`:

- [ ] login admin demo thanh cong
- [ ] login `user02@mebike.local` thanh cong
- [ ] `GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview` truoc deactivate tra rule `...7202`
- [ ] `GET /v1/coupon-rules/active` truoc deactivate co rule `...7202`
- [ ] `PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate` tra `200`
- [ ] response `status = INACTIVE`
- [ ] `updatedAt` thay doi sau happy path
- [ ] repeated deactivate tren rule da `INACTIVE` tra `200`
- [ ] repeated deactivate khong doi them state
- [ ] khong co token thi `401`
- [ ] user token thi `403`
- [ ] `ruleId` khong ton tai thi `404`
- [ ] `ruleId` sai format thi `400`
- [ ] pgAdmin query `coupon_rules` thay `status` va `updated_at` doi dung
- [ ] count bang `coupons` va `user_coupons` khong doi
- [ ] `GET /v1/coupon-rules/active` sau deactivate khong con rule `...7202`
- [ ] `GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview` sau deactivate fallback khoi rule `...7202`

## 13. SQL restore data seed demo sau khi QA xong

Neu QA da tat rule `2h` va muon tra lai dung data seed demo:

```sql
UPDATE coupon_rules
SET
  name = 'Ride 2h discount',
  trigger_type = 'RIDING_DURATION'::coupon_trigger_type,
  min_riding_minutes = 120,
  discount_type = 'FIXED_AMOUNT'::discount_type,
  discount_value = 2000,
  status = 'ACTIVE'::"AccountStatus",
  priority = 100,
  active_from = NULL,
  active_to = NULL,
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Neu muon sach hon, co the chay lai:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm seed:demo
```

## 14. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login user `user02@mebike.local / Demo@123456`
3. goi `GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview`
4. verify rule dang duoc chon la `019b17bd-d130-7e7d-be69-91ceef7b7202`
5. login admin `admin@mebike.local / Demo@123456`
6. goi `PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate`
7. mong doi `200`
8. mo pgAdmin query `coupon_rules`
9. verify `status = INACTIVE`
10. goi lai `GET /v1/coupon-rules/active`
11. verify rule `...7202` khong con
12. goi lai billing preview
13. verify rule khong con la `...7202`, thuong fallback xuong `...7201`
