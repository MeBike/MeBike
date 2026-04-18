# Admin Coupon Rules Update Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
PUT /v1/admin/coupon-rules/{ruleId}
```

Muc tieu API:

- cho admin cap nhat 1 global `coupon_rule` da ton tai
- API nay la API quan tri cau hinh rule giam gia tu dong toan he thong
- API nay chi cap nhat ban ghi trong `coupon_rules`
- API nay khong tao `coupons`
- API nay khong tao `user_coupons`
- API nay khong apply discount ngay trong task nay
- API nay khong tinh billing preview trong task nay
- API nay khong finalize rental end trong task nay

Guide nay giup frontend team:

- dung duoc data that ngay sau `pnpm seed:demo`
- test day du happy path va error cases trong Scalar
- doi chieu du lieu truoc/sau update trong pgAdmin
- hieu ro semantics `PUT` hien tai cua API
- code tiep man hinh edit/update rule trong admin UI

Guide lien quan:

- `docs/coupons/admin-coupon-rules-create-scalar-pgadmin-frontend-guide.md`
- `docs/coupons/admin-coupon-rules-list-scalar-pgadmin-frontend-guide.md`
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

- task nay chi cap nhat rule config
- frontend khong nen hieu rang update rule xong thi API nay tu apply lai billing
- cac endpoint se dung rule nay sau nay la:
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
3. tim endpoint `PUT /v1/admin/coupon-rules/{ruleId}`

## 3. Tai khoan demo de test

Sau `pnpm seed:demo`, co cac login demo:

```text
admin: admin@mebike.local
staff: staff1@mebike.local
manager: manager@mebike.local
agency: agency1@mebike.local
technician: tech1@mebike.local
user: user01@mebike.local
password chung: Demo@123456
```

De test update rule:

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
4. copy `accessToken`
5. bam `Authorize`
6. paste token vao bearer auth

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

Day la 4 ID that frontend nen dung de test update:

- test rule 1h: `019b17bd-d130-7e7d-be69-91ceef7b7201`
- test rule 2h: `019b17bd-d130-7e7d-be69-91ceef7b7202`
- test rule 4h: `019b17bd-d130-7e7d-be69-91ceef7b7203`
- test rule 6h: `019b17bd-d130-7e7d-be69-91ceef7b7204`

## 6. API contract ma frontend can bam theo

### 6.1. Endpoint

```text
PUT /v1/admin/coupon-rules/{ruleId}
```

Role:

```text
ADMIN only
```

Header:

```http
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

### 6.2. Semantics `PUT` hien tai

Backend dang treat API nay theo full update:

- body la full payload
- cac field mutable deu bat buoc trong request body
- frontend khong nen gui partial body
- frontend nen load detail/list hien tai truoc, sau do submit full form state

Neu body thieu field bat buoc:

- backend tra `400 VALIDATION_ERROR`

### 6.3. Path param

`ruleId` phai la UUID v7 hop le.

Vi du that tu seed demo:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

### 6.4. Request body hop le

Body toi thieu theo semantics `PUT`:

```json
{
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

### 6.5. Validation business hien tai

Backend validate chat nhu sau:

- chi admin moi duoc update
- `ruleId` phai hop le ve format
- `ruleId` khong ton tai thi `404`
- `name` la string, sau trim phai con noi dung
- `triggerType` chi nhan `RIDING_DURATION`
- `minRidingMinutes` phai la so nguyen `> 0`
- `discountType` chi nhan `FIXED_AMOUNT`
- `discountValue` phai la so nguyen `> 0`
- `minRidingMinutes` va `discountValue` phai dung 1 trong 4 cap V1: `60->1000`, `120->2000`, `240->4000`, `360->6000`
- `priority` phai la so nguyen
- `status` chi nhan `ACTIVE` hoac `INACTIVE`
- neu `activeFrom` va `activeTo` cung co gia tri thi `activeFrom <= activeTo`
- neu rule da tung duoc ap vao `rental_billing_records` thi khong duoc update nua, muon doi campaign thi tao rule moi
- update chi ghi vao `coupon_rules`

### 6.6. Note quan trong khi sua rule

Implementation hien tai chi cho update rule **chua tung duoc ap dung**.

Frontend can hieu ro impact:

- neu rule da co billing record su dung, backend tra `409 COUPON_RULE_ALREADY_USED`
- neu rule chua duoc dung va van `ACTIVE`, thay doi co hieu luc cho cac lan preview/finalize tiep theo
- billing cu khong bi tinh lai vi da co `coupon_rule_snapshot`
- neu muon doi business rule da tung dung, admin nen deactivate rule cu va tao rule moi

### 6.7. Response shape thanh cong

Response mau:

```json
{
  "id": "019b17bd-d130-7e7d-be69-91ceef7b7202",
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "minBillableHours": 2,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "status": "INACTIVE",
  "priority": 90,
  "activeFrom": null,
  "activeTo": null,
  "createdAt": "2026-04-17T00:00:00.000Z",
  "updatedAt": "2026-04-17T01:00:00.000Z"
}
```

Luu y:

- `id` giu nguyen
- `createdAt` giu nguyen
- `updatedAt` phai thay doi sau update thanh cong
- `minBillableHours` la field derive tu `minRidingMinutes / 60`

### 6.8. Error response khi rule khong ton tai

```json
{
  "error": "Coupon rule not found",
  "details": {
    "code": "COUPON_RULE_NOT_FOUND",
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7299"
  }
}
```

### 6.9. TypeScript shape goi y cho frontend

```ts
export type UpdateAdminCouponRuleBody = {
  name: string;
  triggerType: "RIDING_DURATION";
  minRidingMinutes: number;
  discountType: "FIXED_AMOUNT";
  discountValue: number;
  priority: number;
  status: "ACTIVE" | "INACTIVE";
  activeFrom: string | null;
  activeTo: string | null;
};

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
```

## 7. Scalar test guide

### 7.1. Case 1: happy path update that tren rule seed demo

Dung rule seed demo that:

```text
ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202
```

Body:

```json
{
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Trong Scalar:

1. authorize bang admin token
2. mo `PUT /v1/admin/coupon-rules/{ruleId}`
3. set `ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7202`
4. paste body tren
5. bam `Send`

Ky vong:

- HTTP `200`
- `id` van la `019b17bd-d130-7e7d-be69-91ceef7b7202`
- `name = Ride 2h discount updated`
- `discountValue = 2000`
- `priority = 90`
- `status = INACTIVE`
- `minBillableHours = 2`
- `updatedAt` khac gia tri cu

Luu y:

- case nay chi thanh cong neu rule 2h chua tung duoc ap vao billing record
- neu truoc do da test finalize rental va rule nay da duoc dung, backend se tra `409 COUPON_RULE_ALREADY_USED`; luc do hay tao rule draft moi de test update hoac reset seed demo

### 7.2. Case 2: happy path update rule dang `ACTIVE` nhung van giu `ACTIVE`

Dung rule 4h:

```text
ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7203
```

Body:

```json
{
  "name": "Ride 4h discount priority update",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 240,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 4000,
  "priority": 80,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `200`
- response van `status = ACTIVE`
- `GET /v1/coupon-rules/active` sau do co the thay `Ride 4h discount priority update`
- neu rule da tung duoc dung thi ky vong dung la `409 COUPON_RULE_ALREADY_USED`

### 7.3. Case 3: update voi active window

Dung rule 1h:

```text
ruleId = 019b17bd-d130-7e7d-be69-91ceef7b7201
```

Body:

```json
{
  "name": "Ride 1h scheduled discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 60,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 1000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": "2026-04-20T00:00:00.000Z",
  "activeTo": "2026-04-30T23:59:59.000Z"
}
```

Ky vong:

- HTTP `200`
- response giu dung `activeFrom`, `activeTo`

### 7.4. Case 4: khong co token

- clear `Authorize`
- goi lai `PUT /v1/admin/coupon-rules/{ruleId}`

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

### 7.5. Case 5: token khong phai admin

Login bang:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Sau do authorize token user va goi lai update API.

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

### 7.6. Case 6: `ruleId` khong ton tai

Dung `ruleId` khong ton tai:

```text
019b17bd-d130-7e7d-be69-91ceef7b7299
```

Body:

```json
{
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `404`
- `details.code = COUPON_RULE_NOT_FOUND`

### 7.7. Case 7: `discountValue <= 0`

Body:

```json
{
  "name": "Invalid discount update",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 0,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `400`
- `error = Invalid request payload`
- `details.code = VALIDATION_ERROR`

### 7.8. Case 8: `minRidingMinutes <= 0`

Body:

```json
{
  "name": "Invalid duration update",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 0,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 1000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.9. Case 9: `activeFrom > activeTo`

Body:

```json
{
  "name": "Invalid time window update",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": "2026-04-18T00:00:00.000Z",
  "activeTo": "2026-04-17T00:00:00.000Z"
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.10. Case 10: body thieu field bat buoc

Do semantics `PUT` la full update, body sau la khong hop le:

```json
{
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.11. Case 11: body sai business V1

Body sai `triggerType`:

```json
{
  "name": "Invalid trigger update",
  "triggerType": "CAMPAIGN",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Hoac body sai `discountType`:

```json
{
  "name": "Invalid discount type update",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong cho ca 2:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.12. Case 12: verify qua list API sau update

Sau khi update thanh cong:

1. goi `GET /v1/admin/coupon-rules`
2. hoac `GET /v1/admin/coupon-rules?status=INACTIVE`
3. neu update thanh `ACTIVE`, goi them `GET /v1/coupon-rules/active`

Ky vong:

- admin list hien data moi vua cap nhat
- neu status doi tu `ACTIVE` sang `INACTIVE` thi public active list co the khong con thay rule do
- neu status van `ACTIVE` thi public active list se thay gia tri moi

## 8. pgAdmin guide

### 8.1. Bang can kiem tra

Bang backend dung cho API nay:

```text
coupon_rules
```

### 8.2. SQL xem du lieu truoc khi update

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

Ky vong truoc update:

- `name = Ride 2h discount`
- `trigger_type = RIDING_DURATION`
- `min_riding_minutes = 120`
- `discount_type = FIXED_AMOUNT`
- `discount_value = 2000.00`
- `status = ACTIVE`
- `priority = 100`
- `active_from IS NULL`
- `active_to IS NULL`

### 8.3. SQL xem du lieu sau khi update

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

Ky vong sau update:

- `id` giu nguyen
- `name` doi thanh `Ride 2h discount updated`
- `trigger_type` van la `RIDING_DURATION`
- `min_riding_minutes` van la `120`
- `discount_type` van la `FIXED_AMOUNT`
- `discount_value` van la `2000.00`
- `status` doi thanh `INACTIVE`
- `priority` doi thanh `90`
- `active_from IS NULL`
- `active_to IS NULL`
- `created_at` giu nguyen
- `updated_at` thay doi

### 8.4. Cac field phai doi va khong duoc doi

Sau 1 lan update thanh cong:

Field phai doi neu body doi:

- `name`
- `min_riding_minutes` va `discount_value` chi duoc doi neu van dung cap fixed tier V1
- `status`
- `priority`
- `active_from`
- `active_to`
- `updated_at`

Field khong duoc doi:

- `id`
- `created_at`

Field business V1 nen van dung:

- `trigger_type = RIDING_DURATION`
- `discount_type = FIXED_AMOUNT`
- `min_completed_rentals IS NULL`

### 8.5. SQL verify khong ghi vao `coupons` va `user_coupons`

API nay chi duoc phep ghi vao `coupon_rules`.

Chay:

```sql
SELECT COUNT(*) AS coupon_count FROM coupons;
SELECT COUNT(*) AS user_coupon_count FROM user_coupons;
```

Ky vong:

- update `coupon_rule` khong lam tang giam count trong 2 bang nay
- count truoc va sau update phai giong nhau

### 8.6. SQL xem toan bo rule sau khi update

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
ORDER BY created_at DESC, id DESC;
```

Dung query nay de:

- doi chieu voi admin list API
- xem rule vua update trong toan bo danh sach
- check `updated_at` co nhay len hay khong

## 9. Data mau de frontend test ngay

### 9.1. Mau update khuyen nghi de test doi ACTIVE -> INACTIVE

Rule:

```text
019b17bd-d130-7e7d-be69-91ceef7b7202
```

Body:

```json
{
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Dung case nay de test:

- form edit co prefill dung
- submit full body thanh cong
- list refetch xong thay data moi
- filter `INACTIVE` sau do co thay rule nay
- neu rule da tung duoc dung trong billing record thi case dung la `409 COUPON_RULE_ALREADY_USED`

### 9.2. Mau update giu ACTIVE va co hieu luc ngay

Rule:

```text
019b17bd-d130-7e7d-be69-91ceef7b7204
```

Body:

```json
{
  "name": "Ride 6h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 360,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 6000,
  "priority": 70,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Dung case nay de test:

- update metadata/priority cua rule active chua tung duoc dung
- active list public thay doi ngay neu update thanh cong
- neu rule da tung duoc dung thi backend tra `409 COUPON_RULE_ALREADY_USED`

### 9.3. Mau update co active window

Rule:

```text
019b17bd-d130-7e7d-be69-91ceef7b7201
```

Body:

```json
{
  "name": "Ride 1h campaign window",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 60,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 1000,
  "priority": 95,
  "status": "INACTIVE",
  "activeFrom": "2026-04-20T00:00:00.000Z",
  "activeTo": "2026-04-30T23:59:59.000Z"
}
```

Dung case nay de test:

- form datetime inputs
- serialize ISO string dung
- render `activeFrom` va `activeTo` trong UI list/detail

## 10. Frontend implementation notes

### 10.1. UI goi y cho man edit

Form edit nen co:

- `name`
- `minRidingMinutes`
- `discountValue`
- `priority`
- `status`
- `activeFrom`
- `activeTo`

Cac field nen hardcode preset hoac hidden:

- `triggerType = RIDING_DURATION`
- `discountType = FIXED_AMOUNT`

Vi day la business V1 hien tai.

### 10.2. Frontend phai submit full payload

Do API nay la `PUT` full update:

- khong submit partial body
- khi user chi sua 1 field, frontend van phai gui lai toan bo field can thiet
- cach an toan la:
  1. load data rule hien tai tu list API
  2. bind vao form state
  3. user sua field
  4. submit full form state

### 10.3. Validation client-side nen co

Frontend nen validate som:

- `name.trim().length > 0`
- `minRidingMinutes > 0`
- `discountValue > 0`
- `minRidingMinutes` va `discountValue` phai dung 1 trong 4 cap V1: `60->1000`, `120->2000`, `240->4000`, `360->6000`
- `priority` la integer
- neu `activeFrom` va `activeTo` cung co thi `activeFrom <= activeTo`

Validation client-side khong thay the backend validation.

### 10.4. Sau khi update thanh cong

Frontend nen:

1. hien toast thanh cong
2. refetch `GET /v1/admin/coupon-rules`
3. neu dang o detail page, update local state bang response moi
4. neu status doi, cap nhat badge/filter trong UI
5. neu can, refresh them `GET /v1/coupon-rules/active` o cac man phu thuoc

### 10.5. UI states can co

- idle
- loading form
- submitting
- submit success
- validation error `400`
- unauthorized `401`
- forbidden `403`
- not found `404`
- unknown server error `5xx`

### 10.6. Mapping error cho frontend

Neu `400 VALIDATION_ERROR`:

- bind error vao tung field neu parse duoc `details.issues`
- neu khong parse duoc field-level thi hien banner `Invalid request payload`

Neu `401`:

- yeu cau login lai

Neu `403`:

- hien thong bao khong co quyen admin

Neu `404 COUPON_RULE_NOT_FOUND`:

- hien thong bao rule khong ton tai
- co the redirect ve man list

Neu `409 COUPON_RULE_ALREADY_USED`:

- hien thong bao rule da tung duoc ap dung nen khong the sua
- goi y admin deactivate rule cu va tao rule moi neu muon doi campaign

### 10.7. Frontend khong nen suy luan sai

Frontend update screen khong nen:

- dung `name` lam key unique
- coi update API nay la patch API
- assume update rule `ACTIVE` la vo hai
- assume update xong thi `coupons` hoac `user_coupons` thay doi

## 11. Checklist test nhanh cho team frontend

Sau `pnpm seed:demo`:

- [ ] login admin demo thanh cong
- [ ] authorize trong Scalar
- [ ] `PUT /v1/admin/coupon-rules/{ruleId}` voi rule seed demo va body hop le tra `200`
- [ ] update rule `019b17bd-d130-7e7d-be69-91ceef7b7202` xong thi `discountValue = 2000`
- [ ] `updatedAt` thay doi sau update
- [ ] `id` khong doi
- [ ] `createdAt` khong doi
- [ ] rule da tung duoc ap vao billing record thi update tra `409 COUPON_RULE_ALREADY_USED`
- [ ] khong co token thi `401`
- [ ] user token thi `403`
- [ ] `ruleId` khong ton tai thi `404`
- [ ] `discountValue <= 0` thi `400`
- [ ] `minRidingMinutes <= 0` thi `400`
- [ ] `activeFrom > activeTo` thi `400`
- [ ] body thieu field bat buoc thi `400`
- [ ] pgAdmin query `coupon_rules` thay du lieu moi dung nhu response
- [ ] count bang `coupons` va `user_coupons` khong doi
- [ ] admin list API thay rule moi cap nhat

## 12. SQL restore data seed demo sau khi QA xong

Neu QA da sua bo 4 rule mac dinh va muon tra lai trang thai seed demo:

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

## 13. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login `admin@mebike.local / Demo@123456`
3. goi `PUT /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202`
4. dung body full update:

```json
{
  "name": "Ride 2h discount updated",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

5. mong doi `200`
6. mo pgAdmin query bang `coupon_rules`
7. verify `discount_value`, `status`, `priority`, `updated_at` da doi
8. goi tiep `GET /v1/admin/coupon-rules` de thay rule moi trong list
