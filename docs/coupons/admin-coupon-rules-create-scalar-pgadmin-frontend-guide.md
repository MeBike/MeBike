# Admin Coupon Rules Create Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
POST /v1/admin/coupon-rules
```

Muc tieu API:

- cho admin tao moi global `coupon_rule`
- API nay la API quan tri cau hinh rule giam gia tu dong toan he thong
- API nay chi tao rule
- API nay khong apply discount
- API nay khong tinh billing preview
- API nay khong finalize rental end
- API nay chi ghi vao bang `coupon_rules`
- API nay khong ghi vao `coupons`
- API nay khong ghi vao `user_coupons`

Guide nay giup frontend team:

- dung duoc data that ngay sau `pnpm seed:demo`
- login bang admin demo co san
- test API trong Scalar day du happy path + error cases
- doi chieu data moi tao trong pgAdmin
- code tiep giao dien create form, submit flow, validation state va list refresh

Guide lien quan:

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
- discount chi ap vao `eligibleRentalAmount`, khong ap vao penalty, deposit forfeited, phi ngoai rental hoac phi phat sinh khac
- preview va finalize rental end dung chung logic global rules

Luu y:

- task nay chi tao rule
- frontend khong nen hieu rang create xong la he thong da auto apply ngay trong UI billing
- activation/deactivation la flow rieng

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
3. tim endpoint `POST /v1/admin/coupon-rules`

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

De test create rule:

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

Dieu nay co nghia:

- truoc khi create rule moi, list admin mac dinh co `4` dong
- sau khi create thanh cong 1 rule moi, list admin se thanh `5` dong
- neu body khong truyen `status`, rule moi se mac dinh la `INACTIVE`

## 6. API contract ma frontend can bam theo

### 6.1. Endpoint

```text
POST /v1/admin/coupon-rules
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

### 6.2. Request body hop le

Body toi thieu duoc frontend submit:

```json
{
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "activeFrom": null,
  "activeTo": null
}
```

Backend se default:

- `status = INACTIVE` neu khong truyen
- `priority = 100` neu khong truyen
- `activeFrom = null` neu khong truyen
- `activeTo = null` neu khong truyen

### 6.3. Request body day du

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

### 6.4. Rule validation hien tai

Backend validate chat nhu sau:

- `name` la string, sau trim phai con noi dung
- `triggerType` chi nhan `RIDING_DURATION`
- `minRidingMinutes` phai la so nguyen `> 0`
- `discountType` chi nhan `FIXED_AMOUNT`
- `discountValue` phai la so nguyen `> 0`
- `priority` neu co thi la so nguyen
- `status` neu co thi chi nhan `ACTIVE` hoac `INACTIVE`
- neu `activeFrom` va `activeTo` cung co gia tri thi `activeFrom <= activeTo`

Luu y quan trong:

- hien tai backend **khong check unique theo `name`**
- co the tao 2 rule cung ten neu payload hop le
- rule moi chi ghi vao `coupon_rules`

### 6.5. Response shape thanh cong

Backend tra ve 1 object rule vua tao:

```json
{
  "id": "019b17bd-d130-7e7d-be69-91ceef7b7311",
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
  "createdAt": "2026-04-17T09:30:12.123Z",
  "updatedAt": "2026-04-17T09:30:12.123Z"
}
```

Luu y:

- `id` la UUID do backend tao
- `minBillableHours` la field derive tu `minRidingMinutes / 60`
- `createdAt` va `updatedAt` la thoi diem tao that
- neu body khong truyen `status`, response van tra `INACTIVE`

### 6.6. TypeScript shape goi y cho frontend

```ts
export type CreateAdminCouponRuleBody = {
  name: string;
  triggerType: "RIDING_DURATION";
  minRidingMinutes: number;
  discountType: "FIXED_AMOUNT";
  discountValue: number;
  priority?: number;
  status?: "ACTIVE" | "INACTIVE";
  activeFrom?: string | null;
  activeTo?: string | null;
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

### 7.1. Case 1: happy path, body khong truyen `status`

Trong Scalar:

1. authorize bang admin token
2. mo `POST /v1/admin/coupon-rules`
3. body:

```json
{
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "activeFrom": null,
  "activeTo": null
}
```

4. bam `Send`

Ky vong:

- HTTP `201`
- response co `status = INACTIVE`
- response co `minBillableHours = 2`
- response co `discountValue = 2000`
- response co `name = Ride 2h discount`

Day la case frontend nen uu tien test vi phu hop flow draft/create hien tai.

### 7.2. Case 2: happy path, body truyen explicit `status = INACTIVE`

Body:

```json
{
  "name": "Ride 4h inactive discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 240,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 4000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `201`
- response `status = INACTIVE`

### 7.3. Case 3: happy path, body truyen explicit `status = ACTIVE`

Body:

```json
{
  "name": "Ride 8h active discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 480,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 8000,
  "priority": 100,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- HTTP `201`
- response `status = ACTIVE`

Luu y:

- flow business uu tien create draft `INACTIVE`
- nhung implementation hien tai cho phep frontend gui explicit `ACTIVE`

### 7.4. Case 4: khong co token

Trong Scalar:

- clear `Authorize`
- goi lai `POST /v1/admin/coupon-rules`

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

Sau do authorize token user va goi lai create API.

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

### 7.6. Case 6: `discountValue <= 0`

Body:

```json
{
  "name": "Invalid discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 0
}
```

Ky vong:

- HTTP `400`
- `error = Invalid request payload`
- `details.code = VALIDATION_ERROR`

### 7.7. Case 7: `minRidingMinutes <= 0`

Body:

```json
{
  "name": "Invalid duration",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 0,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.8. Case 8: `activeFrom > activeTo`

Body:

```json
{
  "name": "Invalid time window",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "activeFrom": "2026-04-18T00:00:00.000Z",
  "activeTo": "2026-04-17T00:00:00.000Z"
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.9. Case 9: body thieu field bat buoc

Body:

```json
{
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT"
}
```

Ky vong:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.10. Case 10: body sai business V1

Body:

```json
{
  "name": "Invalid trigger",
  "triggerType": "CAMPAIGN",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000
}
```

Hoac:

```json
{
  "name": "Invalid discount type",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "PERCENTAGE",
  "discountValue": 10
}
```

Ky vong cho ca 2:

- HTTP `400`
- `details.code = VALIDATION_ERROR`

### 7.11. Case 11: create xong thi test tiep list API

Sau khi create thanh cong:

1. goi `GET /v1/admin/coupon-rules`
2. hoac `GET /v1/admin/coupon-rules?status=INACTIVE`

Ky vong:

- rule vua tao xuat hien trong admin list
- neu body khong truyen `status`, rule vua tao xuat hien trong filter `INACTIVE`
- public API `GET /v1/coupon-rules/active` chi thay rule moi neu rule do duoc tao voi `status = ACTIVE`

## 8. pgAdmin guide

### 8.1. Bang can kiem tra

Bang backend dung cho API nay:

```text
coupon_rules
```

### 8.2. Query xem toan bo du lieu sau khi create

Mo Query Tool va chay:

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
ORDER BY created_at DESC;
```

Ky vong:

- truoc create sau `seed:demo`: co 4 dong mac dinh
- sau create thanh cong 1 lan: co it nhat 5 dong
- dong moi tao se nam tren cung vi `created_at` moi nhat

### 8.3. Query xac dinh dong moi tao bang `name`

Vi du body create:

```json
{
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "activeFrom": null,
  "activeTo": null
}
```

Chay SQL:

```sql
SELECT
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
FROM coupon_rules
WHERE name = 'Ride 2h discount'
ORDER BY created_at DESC;
```

Ky vong:

- co the thay nhieu hon 1 dong neu DB da co rule cung ten
- dong moi nhat la dong vua create
- dong moi nhat co:
  - `trigger_type = RIDING_DURATION`
  - `min_riding_minutes = 120`
  - `min_completed_rentals IS NULL`
  - `discount_type = FIXED_AMOUNT`
  - `discount_value = 2000.00`
  - `status = INACTIVE` neu body khong truyen `status`
  - `priority = 100`
  - `active_from IS NULL`
  - `active_to IS NULL`

### 8.4. Query xac dinh rule moi xuat hien o filter `INACTIVE`

Neu create body khong co `status`, chay:

```sql
SELECT
  id,
  name,
  min_riding_minutes,
  discount_value,
  status,
  created_at
FROM coupon_rules
WHERE status = 'INACTIVE'::"AccountStatus"
ORDER BY created_at DESC;
```

Ky vong:

- rule vua tao xuat hien trong top result

### 8.5. Query xac dinh khong ghi vao `coupons` va `user_coupons`

API nay chi duoc phep ghi vao `coupon_rules`.

Chay:

```sql
SELECT COUNT(*) AS coupon_count FROM coupons;
SELECT COUNT(*) AS user_coupon_count FROM user_coupons;
```

Ky vong:

- create `coupon_rule` khong lam tang count trong 2 bang nay
- count truoc va sau khi create phai giong nhau

### 8.6. Query test frontend voi body co `status = ACTIVE`

Neu frontend create body:

```json
{
  "name": "Ride 8h active discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 480,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 8000,
  "priority": 100,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Thi query verify:

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
WHERE name = 'Ride 8h active discount'
ORDER BY created_at DESC;
```

Ky vong:

- dong moi nhat co `status = ACTIVE`

## 9. Du lieu mau de frontend test ngay

### 9.1. Mau create draft khuyen nghi

Dung body nay de test form tao draft:

```json
{
  "name": "Ride 8h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 480,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 8000,
  "priority": 100,
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- response `status = INACTIVE`
- admin list tang them 1 dong
- public active list khong nhat thiet thay rule nay

### 9.2. Mau create voi khung thoi gian

```json
{
  "name": "Ride 10h promo window",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 600,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 10000,
  "priority": 50,
  "status": "INACTIVE",
  "activeFrom": "2026-04-20T00:00:00.000Z",
  "activeTo": "2026-04-30T23:59:59.000Z"
}
```

Ky vong:

- HTTP `201`
- response co `activeFrom`, `activeTo` dung nhu input

### 9.3. Mau create trung `name`

Vi backend khong unique `name`, frontend co the test:

```json
{
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2500,
  "priority": 90,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Ky vong:

- neu body hop le thi van `201`
- pgAdmin se co them 1 dong moi cung `name`
- frontend list khong nen coi `name` la unique key; phai dung `id`

## 10. Frontend implementation notes

### 10.1. UI goi y cho man create

Form create nen co:

- `name`
- `minRidingMinutes`
- `discountValue`
- `priority`
- `status`
- `activeFrom`
- `activeTo`

Cac field nen hardcode hidden hoac preset:

- `triggerType = RIDING_DURATION`
- `discountType = FIXED_AMOUNT`

Vi day la business V1 hien tai.

### 10.2. Validation client-side nen co

Frontend nen validate som:

- `name.trim().length > 0`
- `minRidingMinutes > 0`
- `discountValue > 0`
- `priority` la integer neu co nhap
- neu `activeFrom` va `activeTo` cung co thi `activeFrom <= activeTo`

Validation client-side khong thay the backend validation.

### 10.3. Sau khi create thanh cong

Frontend nen:

1. hien toast thanh cong
2. redirect ve trang admin list hoac append item moi vao list
3. refetch `GET /v1/admin/coupon-rules`
4. neu create draft mac dinh, co the auto mo filter `INACTIVE` de user thay rule moi

### 10.4. UI states can co

- idle
- submitting
- submit success
- validation error `400`
- unauthorized `401`
- forbidden `403`
- unknown server error `5xx`

### 10.5. Mapping error cho frontend

Neu `400 VALIDATION_ERROR`:

- bind error vao tung field neu parse duoc `details.issues`
- neu khong parse field-level duoc thi hien banner `Invalid request payload`

Neu `401`:

- yeu cau login lai

Neu `403`:

- hien thong bao khong co quyen admin

## 11. Checklist test nhanh cho team frontend

Sau `pnpm seed:demo`:

- [ ] login admin demo thanh cong
- [ ] authorize trong Scalar
- [ ] `POST /v1/admin/coupon-rules` voi body hop le tra `201`
- [ ] body khong truyen `status` thi response `status = INACTIVE`
- [ ] body truyen `status = ACTIVE` thi response `status = ACTIVE`
- [ ] khong co token thi `401`
- [ ] user token thi `403`
- [ ] `discountValue <= 0` thi `400`
- [ ] `minRidingMinutes <= 0` thi `400`
- [ ] `activeFrom > activeTo` thi `400`
- [ ] body thieu field bat buoc thi `400`
- [ ] pgAdmin query `SELECT ... FROM coupon_rules ORDER BY created_at DESC` thay dong moi tao
- [ ] `coupons` va `user_coupons` khong doi sau create
- [ ] `GET /v1/admin/coupon-rules` thay rule moi tao

## 12. SQL cleanup neu can xoa data test

Neu QA muon xoa cac rule vua tao thu cong:

```sql
DELETE FROM coupon_rules
WHERE name IN (
  'Ride 8h discount',
  'Ride 10h promo window',
  'Ride 8h active discount'
);
```

Neu muon xoa theo id cu the:

```sql
DELETE FROM coupon_rules
WHERE id = 'PUT_CREATED_UUID_HERE';
```

## 13. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login `admin@mebike.local / Demo@123456`
3. goi `POST /v1/admin/coupon-rules`
4. dung body draft khong co `status`
5. ky vong `201` va `status = INACTIVE`
6. mo pgAdmin query `coupon_rules`
7. verify dong moi tao nam tren cung
8. goi tiep `GET /v1/admin/coupon-rules` de thay rule moi trong list

