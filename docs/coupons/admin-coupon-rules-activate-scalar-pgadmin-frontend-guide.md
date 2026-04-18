# Admin Coupon Rules Activate Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
PATCH /v1/admin/coupon-rules/{ruleId}/activate
```

Muc tieu API:

- cho admin kich hoat 1 global `coupon_rule`
- API nay la API quan tri de bat 1 rule giam gia tu dong toan he thong
- API nay chi xu ly action `activate`
- API nay khong cap nhat toan bo noi dung rule
- API nay chi ghi vao bang `coupon_rules`
- API nay khong ghi vao `coupons`
- API nay khong ghi vao `user_coupons`
- API nay khong tu tinh billing preview trong task nay
- API nay khong finalize rental end trong task nay

Guide nay giup frontend team:

- co data that, chinh xac ngay sau `pnpm seed:demo`
- login va lay token that trong Scalar
- biet ro cach tao precondition de test happy path `INACTIVE -> ACTIVE`
- test day du success, idempotent va error cases
- doi chieu data trong pgAdmin truoc va sau activate
- code tiep nut `Activate`, optimistic/refetch flow, disabled states va error handling trong admin UI

Guide lien quan:

- `docs/coupons/admin-coupon-rules-list-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-update-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/coupon-rules-active-scalar-pgadmin-frontend-guide.md`

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
- discount chi ap vao `eligibleRentalAmount`, khong ap vao deposit forfeited, phi ngoai rental hoac phi phat sinh khac; V1 hien tai khong co penalty rieng
- preview va finalize rental end dung chung logic global rules

Luu y cho frontend:

- task nay chi activate rule da ton tai
- API nay khong sua `name`, `discountValue`, `priority`, `activeFrom`, `activeTo`
- API nay khong tao object `coupon` cho tung user
- cac endpoint se doc rule nay sau khi no dang `ACTIVE` va hop le theo time window:
  - `GET /v1/coupon-rules/active`
  - `GET /v1/rentals/me/{rentalId}/billing-preview`
  - `PUT /v1/rentals/{rentalId}/end`

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
3. tim endpoint `PATCH /v1/admin/coupon-rules/{ruleId}/activate`

## 3. Tai khoan demo de test

Sau `pnpm seed:demo`, co cac login demo that:

```text
admin: admin@mebike.local
staff: staff1@mebike.local
manager: manager@mebike.local
agency: agency1@mebike.local
agency2: agency2@mebike.local
technician: tech1@mebike.local
user: user01@mebike.local
password chung: Demo@123456
```

De test activate:

- happy path: dung `admin@mebike.local`
- `403`: dung `user01@mebike.local`
- `401`: khong dung token

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

## 5. Data that co san ngay sau `pnpm seed:demo`

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

Day la diem quan trong cho QA/frontend:

- happy path `INACTIVE -> ACTIVE` khong xay ra ngay lap tuc sau `seed:demo`
- vi vay muon test activate thanh cong theo dung nghia, can tao precondition truoc:
  - cach 1: tam thoi doi `status` cua 1 rule sang `INACTIVE` trong pgAdmin
  - cach 2: dung API update hien co de doi rule sang `INACTIVE`, roi moi goi activate

Day la 4 ID that frontend nen dung de test:

- rule 1h: `019b17bd-d130-7e7d-be69-91ceef7b7201`
- rule 2h: `019b17bd-d130-7e7d-be69-91ceef7b7202`
- rule 4h: `019b17bd-d130-7e7d-be69-91ceef7b7203`
- rule 6h: `019b17bd-d130-7e7d-be69-91ceef7b7204`

## 6. API contract ma frontend can bam theo

### 6.1. Endpoint

```text
PATCH /v1/admin/coupon-rules/{ruleId}/activate
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

### 6.2. Semantics cua action activate hien tai

Backend dang implement action nay theo semantics:

- chi set `status` cua rule thanh `ACTIVE`
- neu rule da `ACTIVE` roi thi backend tra `200` idempotent voi du lieu hien tai
- neu rule chua ton tai thi `404`
- action nay khong dong vao `name`, `minRidingMinutes`, `discountValue`, `priority`, `activeFrom`, `activeTo`
- action nay khong sinh them record trong bang khac

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
  "status": "ACTIVE",
  "priority": 100,
  "activeFrom": null,
  "activeTo": null,
  "createdAt": "2026-04-17T00:00:00.000Z",
  "updatedAt": "2026-04-17T01:30:00.000Z"
}
```

Luu y:

- `id` giu nguyen
- `createdAt` giu nguyen
- `updatedAt` doi neu lan goi nay thuc su chuyen `INACTIVE -> ACTIVE`
- neu rule da `ACTIVE` tu truoc, response van `200` nhung `updatedAt` se giu nguyen
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

### 6.6. Xu ly `activeFrom` va `activeTo`

Implementation hien tai chon huong it pha structure nhat:

- activate van cho phep thanh cong du `activeFrom` nam o tuong lai
- activate van cho phep thanh cong du `activeTo` da qua
- viec rule co xuat hien trong `GET /v1/coupon-rules/active` hay co duoc billing preview dung hay khong se do query-side filter theo time window

Frontend can hieu ro:

- `status = ACTIVE` khong dong nghia 100% la user se thay rule o public active list ngay luc do
- can nhin them `activeFrom` va `activeTo`

### 6.7. TypeScript shape goi y cho frontend

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

export async function activateAdminCouponRule(ruleId: string, accessToken: string) {
  const response = await fetch(`/v1/admin/coupon-rules/${ruleId}/activate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}
```

## 7. Cach tao precondition de test happy path

Vi `seed:demo` tao san 4 rule `ACTIVE`, frontend/QA can tao precondition cho case `INACTIVE -> ACTIVE`.

### 7.1. Cach 1: doi status bang pgAdmin

Dung rule 2h:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Chay SQL:

```sql
UPDATE coupon_rules
SET
  status = 'INACTIVE'::"AccountStatus",
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Sau do moi goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate
```

### 7.2. Cach 2: doi status bang API update hien co

Goi:

```text
PUT /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202
```

Body:

```json
{
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Sau do moi goi API activate.

### 7.3. Rule test khuyen nghi

Rule de frontend test happy path khuyen nghi:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Ly do:

- de nhan dien trong UI
- `minBillableHours = 2`
- data seed ro rang va quen thuoc

## 8. Scalar test guide

### 8.1. Case 1: happy path `INACTIVE -> ACTIVE`

Precondition:

- rule `019b17bd-d130-7e7d-be69-91ceef7b7202` dang `INACTIVE`

Trong Scalar:

1. authorize bang admin token
2. mo `PATCH /v1/admin/coupon-rules/{ruleId}/activate`
3. set `ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202`
4. khong nhap body
5. bam `Send`

Ky vong:

- HTTP `200`
- response `id = 019b17bd-d130-7e7d-be69-91ceef7b7202`
- response `status = ACTIVE`
- response `name = Ride 2h discount`
- response `discountValue = 2000`
- response `minBillableHours = 2`
- `updatedAt` thay doi so voi gia tri truoc khi activate

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
  "status": "ACTIVE",
  "priority": 100,
  "activeFrom": null,
  "activeTo": null,
  "createdAt": "2026-04-17T00:00:00.000Z",
  "updatedAt": "2026-04-17T09:30:00.000Z"
}
```

### 8.2. Case 2: rule da `ACTIVE` roi, backend tra `200` idempotent

Dung ngay rule 4h sau `seed:demo`:

```text
019b17bd-d130-7e7d-be69-91ceef7b7203
```

Trong Scalar:

1. authorize bang admin token
2. mo `PATCH /v1/admin/coupon-rules/{ruleId}/activate`
3. set `ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7203`
4. khong body
5. bam `Send`

Ky vong:

- HTTP `200`
- `status = ACTIVE`
- response tra ve du lieu hien tai cua rule
- `updatedAt` giu nguyen neu rule da `ACTIVE` tu truoc

Y nghia cho frontend:

- user bam lai nut `Activate` tren rule da active khong lam API fail
- UI co the disable nut `Activate` khi `status = ACTIVE`, nhung neu van bam thi cung khong phai handle nhu loi nghiep vu

### 8.3. Case 3: activate rule co `activeFrom/activeTo` o tuong lai

Case nay de frontend hieu semantics.

Precondition pgAdmin:

```sql
UPDATE coupon_rules
SET
  status = 'INACTIVE'::"AccountStatus",
  active_from = '2026-04-20T00:00:00.000Z',
  active_to = '2026-04-30T23:59:59.000Z',
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7201';
```

Sau do goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7201/activate
```

Ky vong:

- HTTP `200`
- response `status = ACTIVE`
- response giu dung `activeFrom = 2026-04-20T00:00:00.000Z`
- response giu dung `activeTo = 2026-04-30T23:59:59.000Z`

Nhung frontend can biet:

- rule nay co the chua xuat hien trong `GET /v1/coupon-rules/active` neu current time chua toi `activeFrom`

### 8.4. Case 4: khong co token

- clear `Authorize`
- goi lai `PATCH /v1/admin/coupon-rules/{ruleId}/activate`

Ky vong:

- HTTP `401`

Response mau:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

### 8.5. Case 5: token khong phai admin

Login bang:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Sau do authorize token user va goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate
```

Ky vong:

- HTTP `403`

Response mau:

```json
{
  "error": "Unauthorized",
  "details": {
    "code": "UNAUTHORIZED"
  }
}
```

### 8.6. Case 6: `ruleId` khong ton tai

Dung `ruleId` khong ton tai:

```text
019b17bd-d130-7e7d-be69-91ceef7b7299
```

Goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7299/activate
```

Ky vong:

- HTTP `404`
- `details.code = COUPON_RULE_NOT_FOUND`

### 8.7. Case 7: `ruleId` sai format

Dung:

```text
not-a-uuid
```

Ky vong:

- HTTP `400`
- `error = Invalid request payload`
- `details.code = VALIDATION_ERROR`

### 8.8. Case 8: verify qua list API sau activate

Sau khi happy path thanh cong:

1. goi `GET /v1/admin/coupon-rules`
2. verify rule 2h dang `ACTIVE`
3. goi them `GET /v1/coupon-rules/active`
4. neu `activeFrom/activeTo` la hop le tai thoi diem hien tai, verify rule xuat hien trong public active list

### 8.9. Case 9: verify repeated activate

Sau case 1:

1. goi lai `PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate`
2. compare response lan 1 va lan 2

Ky vong:

- ca 2 lan deu `200`
- lan 2 khong doi them state business
- `updatedAt` lan 2 giu nguyen neu rule da active roi truoc khi vao lan 2

## 9. pgAdmin guide

### 9.1. Bang can kiem tra

Bang backend dung cho API nay:

```text
coupon_rules
```

### 9.2. SQL xem du lieu truoc khi activate

Dung rule that tu seed demo:

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

Neu chua tao precondition thi ky vong:

- `status = ACTIVE`

Neu da tao precondition happy path thi ky vong:

- `status = INACTIVE`

### 9.3. SQL tao precondition happy path trong pgAdmin

```sql
UPDATE coupon_rules
SET
  status = 'INACTIVE'::"AccountStatus",
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Chay lai query section `9.2` de verify:

- `status = INACTIVE`

### 9.4. SQL xem du lieu sau khi activate

Sau khi goi happy path case 1 trong Scalar, chay lai:

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

Ky vong sau activate thanh cong:

- `id` giu nguyen
- `name` giu nguyen
- `trigger_type` van la `RIDING_DURATION`
- `min_riding_minutes` van la `120`
- `discount_type` van la `FIXED_AMOUNT`
- `discount_value` van la `2000.00`
- `status` doi thanh `ACTIVE`
- `priority` giu nguyen `100`
- `active_from` giu nguyen
- `active_to` giu nguyen
- `created_at` giu nguyen
- `updated_at` thay doi so voi truoc activate

### 9.5. Cac field phai doi va khong duoc doi

Sau 1 lan activate thanh cong tu `INACTIVE -> ACTIVE`:

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

### 9.6. SQL verify khong ghi vao `coupons` va `user_coupons`

API nay chi duoc phep ghi vao `coupon_rules`.

Chay:

```sql
SELECT COUNT(*) AS coupon_count FROM coupons;
SELECT COUNT(*) AS user_coupon_count FROM user_coupons;
```

Ky vong:

- activate `coupon_rule` khong lam tang giam count trong 2 bang nay
- count truoc va sau activate phai giong nhau

### 9.7. SQL verify rule da active co the di vao public active list

Neu rule co:

- `status = ACTIVE`
- `trigger_type = RIDING_DURATION`
- `discount_type = FIXED_AMOUNT`
- `active_from IS NULL OR active_from <= now()`
- `active_to IS NULL OR active_to >= now()`

thi chay query:

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

Dung query nay de doi chieu voi `GET /v1/coupon-rules/active`.

## 10. Data mau de frontend test ngay

### 10.1. Flow test nhanh nhat cho happy path

Rule:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

B1. pgAdmin:

```sql
UPDATE coupon_rules
SET
  status = 'INACTIVE'::"AccountStatus",
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

B2. Scalar:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate
```

B3. pgAdmin verify:

```sql
SELECT
  id,
  name,
  status,
  updated_at
FROM coupon_rules
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Ky vong:

- `status = ACTIVE`
- `updated_at` moi hon gia tri truoc do

### 10.2. Flow test idempotent nhanh nhat

Rule:

```text
019b17bd-d130-7e7d-be69-91ceef7b7204
```

Sau `seed:demo`, rule nay da `ACTIVE` san.

Goi:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7204/activate
```

Ky vong:

- `200`
- response van `ACTIVE`
- khong can body

### 10.3. Flow test time window

B1. pgAdmin:

```sql
UPDATE coupon_rules
SET
  status = 'INACTIVE'::"AccountStatus",
  active_from = '2026-04-20T00:00:00.000Z',
  active_to = '2026-04-30T23:59:59.000Z',
  updated_at = now()
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7201';
```

B2. Scalar:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7201/activate
```

Ky vong:

- response `status = ACTIVE`
- response giu nguyen `activeFrom` va `activeTo`

Frontend note:

- neu current time chua toi `activeFrom`, public screen co the chua thay rule nay

## 11. Frontend implementation notes

### 11.1. Nut Activate nen hien o dau

Trong admin list/detail screen:

- neu `status = INACTIVE` -> hien nut `Activate`
- neu `status = ACTIVE` -> co the disable nut hoac an nut
- neu team van cho bam khi `ACTIVE`, UI nen xu ly `200` nhu no-op thay vi show error

### 11.2. Frontend request flow de nghi

Flow an toan:

1. user mo admin list hoac detail
2. frontend load rule hien tai
3. neu rule `INACTIVE`, user bam `Activate`
4. frontend goi `PATCH /v1/admin/coupon-rules/{ruleId}/activate`
5. neu `200`, update local state bang response moi
6. refetch `GET /v1/admin/coupon-rules`
7. neu man hinh phu thuoc public active policy, co the refetch `GET /v1/coupon-rules/active`

### 11.3. UI states can co

- idle
- activating
- activate success
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

Frontend activate screen khong nen:

- gui body cho endpoint nay
- coi `PATCH /activate` la full update API
- assume activate xong thi luon xuat hien ngay tren `GET /v1/coupon-rules/active`
- assume activate xong thi `coupons` hoac `user_coupons` thay doi
- assume repeated activate la loi nghiep vu

## 12. Checklist test nhanh cho team frontend

Sau `pnpm seed:demo`:

- [ ] login admin demo thanh cong
- [ ] authorize trong Scalar
- [ ] xac nhan 4 rule seed demo deu dang `ACTIVE`
- [ ] tao precondition cho rule `019b17bd-d130-7e7d-be69-91ceef7b7202` thanh `INACTIVE`
- [ ] `PATCH /v1/admin/coupon-rules/{ruleId}/activate` voi rule tren tra `200`
- [ ] response `status = ACTIVE`
- [ ] `updatedAt` thay doi sau happy path
- [ ] repeated activate tren rule da `ACTIVE` tra `200`
- [ ] repeated activate khong doi them state
- [ ] khong co token thi `401`
- [ ] user token thi `403`
- [ ] `ruleId` khong ton tai thi `404`
- [ ] `ruleId` sai format thi `400`
- [ ] pgAdmin query `coupon_rules` thay `status` va `updated_at` doi dung
- [ ] count bang `coupons` va `user_coupons` khong doi
- [ ] `GET /v1/admin/coupon-rules` thay rule vua activate dang `ACTIVE`
- [ ] `GET /v1/coupon-rules/active` thay rule do neu time window dang hop le

## 13. SQL restore data seed demo sau khi QA xong

Neu QA da doi status/time window cua 4 rule mac dinh va muon tra lai trang thai seed demo:

```sql
UPDATE coupon_rules
SET
  name = CASE id
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7201' THEN 'Ride 1h discount'
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7202' THEN 'Ride 2h discount'
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7203' THEN 'Ride 4h discount'
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7204' THEN 'Ride 6h discount'
  END,
  trigger_type = 'RIDING_DURATION'::coupon_trigger_type,
  min_riding_minutes = CASE id
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7201' THEN 60
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7202' THEN 120
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7203' THEN 240
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7204' THEN 360
  END,
  discount_type = 'FIXED_AMOUNT'::discount_type,
  discount_value = CASE id
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7201' THEN 1000
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7202' THEN 2000
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7203' THEN 4000
    WHEN '019b17bd-d130-7e7d-be69-91ceef7b7204' THEN 6000
  END,
  status = 'ACTIVE'::"AccountStatus",
  priority = 100,
  active_from = NULL,
  active_to = NULL,
  updated_at = now()
WHERE id IN (
  '019b17bd-d130-7e7d-be69-91ceef7b7201',
  '019b17bd-d130-7e7d-be69-91ceef7b7202',
  '019b17bd-d130-7e7d-be69-91ceef7b7203',
  '019b17bd-d130-7e7d-be69-91ceef7b7204'
);
```

Neu muon sach hon, co the chay lai:

```bash
cd D:\do_an_3\MeBike\apps\server
pnpm seed:demo
```

## 14. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login `admin@mebike.local / Demo@123456`
3. dung pgAdmin doi rule `019b17bd-d130-7e7d-be69-91ceef7b7202` thanh `INACTIVE`
4. goi `PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate`
5. mong doi `200`
6. verify response `status = ACTIVE`
7. mo pgAdmin query `coupon_rules`
8. verify `status` va `updated_at` da doi
9. goi tiep `GET /v1/admin/coupon-rules`
10. neu can, goi tiep `GET /v1/coupon-rules/active` de verify rule dang active va dang trong time window
