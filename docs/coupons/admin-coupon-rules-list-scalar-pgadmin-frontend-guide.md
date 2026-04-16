# Admin Coupon Rules List Scalar + pgAdmin + Frontend Guide

File nay dung cho doi frontend de test va tich hop API admin moi:

```text
GET /v1/admin/coupon-rules
```

Muc tieu API:

- admin xem danh sach toan bo global `coupon_rules`
- API nay la API quan tri, dung de list rule giam gia toan he thong
- API nay chi doc du lieu
- API nay khong tinh bill
- API nay khong apply discount
- API nay khong ghi vao DB
- API nay lay truc tiep tu bang `coupon_rules`
- API nay khong phu thuoc `coupons`
- API nay khong phu thuoc `user_coupons`

Guide nay giup frontend team:

- co du lieu that ngay sau `pnpm seed:demo`
- test API tren Scalar
- doi chieu bang pgAdmin
- hieu dung response shape, filter, pagination, auth
- code tiep giao dien admin list global auto discount rules

Guide lien quan:

- `docs/coupons/coupon-rules-active-scalar-pgadmin-frontend-guide.md`
- file nay danh cho public endpoint `GET /v1/coupon-rules/active`
- file nay danh cho admin endpoint `GET /v1/admin/coupon-rules`

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

- endpoint admin list nay chi dung de xem cau hinh rule
- endpoint nay khong cho frontend suy ra rang rule chac chan se duoc apply trong moi rental

## 2. Chuan bi moi truong

Chay backend chinh trong `apps/server`:

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
3. tim endpoint `GET /v1/admin/coupon-rules`

## 3. Tai khoan admin demo de test

Neu da chay `pnpm seed:demo`, dung admin demo:

```text
email: admin@mebike.local
password: Demo@123456
```

Trong Scalar:

1. Goi `POST /v1/auth/login`
2. Body:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

3. Ky vong:
   - status `200`
   - response co `data.accessToken`
4. Copy `accessToken`
5. Bam `Authorize` trong Scalar
6. Paste bearer token vao o token

Neu test `401`:

- clear token trong Scalar

Neu test `403`:

- login bang user thuong roi dung token do goi endpoint admin

## 4. Data that co san ngay sau `pnpm seed:demo`

Sau `pnpm seed:demo`, backend se goi `seedDefaultGlobalCouponRules(prisma, { demoMode: true })`
va upsert 4 global rule mac dinh sau:

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

Business meaning cua 4 rule nay:

- `>= 1h den < 2h`: giam `1.000 VND`
- `>= 2h den < 4h`: giam `2.000 VND`
- `>= 4h den < 6h`: giam `4.000 VND`
- `>= 6h`: giam `6.000 VND`

Luu y quan trong:

- sau `seed:demo`, mac dinh khong co rule `INACTIVE` trong bo 4 rule demo
- vi vay case filter `status=INACTIVE` se thuong tra `data: []` neu frontend/QA khong tu tao them data test trong pgAdmin

## 5. API contract ma frontend can bam theo

### 5.1. Endpoint

```text
GET /v1/admin/coupon-rules
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

Tat ca query params deu optional.

| Param | Type | Default | Ghi chu |
| --- | --- | --- | --- |
| `status` | enum | none | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED` |
| `triggerType` | enum | none | `RIDING_DURATION`, `USAGE_FREQUENCY`, `CAMPAIGN`, `MEMBERSHIP_MILESTONE`, `MANUAL_GRANT` |
| `discountType` | enum | none | `FIXED_AMOUNT`, `PERCENTAGE` |
| `page` | integer | `1` | page bat dau tu `1` |
| `pageSize` | integer | `20` | so item moi trang |

Vi du:

```text
GET /v1/admin/coupon-rules
GET /v1/admin/coupon-rules?status=ACTIVE
GET /v1/admin/coupon-rules?status=INACTIVE
GET /v1/admin/coupon-rules?page=1&pageSize=2
GET /v1/admin/coupon-rules?status=ACTIVE&triggerType=RIDING_DURATION&discountType=FIXED_AMOUNT
```

### 5.3. Response shape

Response thanh cong:

```json
{
  "data": [
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
      "updatedAt": "2026-04-17T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

### 5.4. Field notes cho frontend

- `data` co the la mang rong `[]`
- `pagination` luon co trong list API
- `discountValue` la `number`
- `minRidingMinutes` co the `null`
- `minBillableHours` co the `null`
- `activeFrom` co the `null`
- `activeTo` co the `null`
- `createdAt` va `updatedAt` la ISO datetime string
- `minBillableHours` duoc backend derive tu `minRidingMinutes / 60`

### 5.5. Sort order hien tai

Admin list nay dang sort mac dinh:

1. `createdAt DESC`
2. neu bang nhau thi `id DESC`

Frontend co the render theo thu tu backend tra ve.

### 5.6. TypeScript shape goi y cho frontend

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

export type AdminCouponRuleListResponse = {
  data: AdminCouponRule[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
```

## 6. Scalar test guide

### 6.1. Cach nhap query params trong Scalar

Trong Scalar:

1. mo endpoint `GET /v1/admin/coupon-rules`
2. bam `Try it out`
3. o phan `Parameters` / `Query params`, Scalar se hien cac dong:
   - `status`
   - `triggerType`
   - `discountType`
   - `page`
   - `pageSize`
4. voi param optional, Scalar thuong chi gui param neu:
   - ban bat dong/toggle cua param do
   - hoac ban nhap gia tri vao field cua param do
5. xong thi bam `Send`

Mau test:

- khong bat param nao -> request plain list
- bat `status` va chon `ACTIVE` -> request co `?status=ACTIVE`
- bat `page`, nhap `1`; bat `pageSize`, nhap `2` -> request co `?page=1&pageSize=2`

Mẹo:

- nhin phan URL request ma Scalar render
- hoac nhin curl preview
- neu khong thay `status=ACTIVE` trong URL thi nghia la param chua duoc gui

### 6.2. Case 1: admin token hop le, khong filter

Trong Scalar:

- authorize bang admin token
- mo `GET /v1/admin/coupon-rules`
- khong nhap query param nao
- bam `Send`

Ky vong:

- HTTP `200`
- `pagination.page = 1`
- `pagination.pageSize = 20`
- `pagination.total = 4`
- `pagination.totalPages = 1`
- `data.length = 4`

Voi data sau `seed:demo`, frontend se thay 4 item:

| name | minRidingMinutes | minBillableHours | discountValue | status |
| --- | ---: | ---: | ---: | --- |
| `Ride 6h discount` | `360` | `6` | `6000` | `ACTIVE` |
| `Ride 4h discount` | `240` | `4` | `4000` | `ACTIVE` |
| `Ride 2h discount` | `120` | `2` | `2000` | `ACTIVE` |
| `Ride 1h discount` | `60` | `1` | `1000` | `ACTIVE` |

Luu y:

- thu tu tren la theo `createdAt DESC`
- khac voi public active endpoint, admin list nay khong sort theo `minRidingMinutes ASC`

Response mau:

```json
{
  "data": [
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7204",
      "name": "Ride 6h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 360,
      "minBillableHours": 6,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 6000,
      "status": "ACTIVE",
      "priority": 100,
      "activeFrom": null,
      "activeTo": null
    },
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7203",
      "name": "Ride 4h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 240,
      "minBillableHours": 4,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 4000,
      "status": "ACTIVE",
      "priority": 100,
      "activeFrom": null,
      "activeTo": null
    },
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
      "activeTo": null
    },
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7201",
      "name": "Ride 1h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 60,
      "minBillableHours": 1,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 1000,
      "status": "ACTIVE",
      "priority": 100,
      "activeFrom": null,
      "activeTo": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

### 6.3. Case 2: filter `status=ACTIVE`

Trong Scalar:

- bat param `status`
- chon `ACTIVE`
- bam `Send`

Request:

```text
GET /v1/admin/coupon-rules?status=ACTIVE
```

Ky vong sau `seed:demo`:

- HTTP `200`
- `data.length = 4`
- tat ca item co `status = ACTIVE`
- `pagination.total = 4`

### 6.4. Case 3: filter `status=INACTIVE`

Trong Scalar:

- bat param `status`
- chon `INACTIVE`
- bam `Send`

Request:

```text
GET /v1/admin/coupon-rules?status=INACTIVE
```

Ky vong voi data mac dinh sau `seed:demo`:

- HTTP `200`
- `data = []`
- `pagination.total = 0`
- `pagination.totalPages = 0`

Response mong doi:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Neu frontend muon test giao dien co item `INACTIVE`, xem section pgAdmin ben duoi de tao them 1 rule inactive.

### 6.5. Case 4: pagination `page=1&pageSize=2`

Trong Scalar:

- bat param `page`, nhap `1`
- bat param `pageSize`, nhap `2`
- bam `Send`

Request:

```text
GET /v1/admin/coupon-rules?page=1&pageSize=2
```

Ky vong sau `seed:demo`:

- HTTP `200`
- `data.length = 2`
- `pagination.page = 1`
- `pagination.pageSize = 2`
- `pagination.total = 4`
- `pagination.totalPages = 2`

Thu tu item o page 1:

1. `Ride 6h discount`
2. `Ride 4h discount`

Response mau:

```json
{
  "data": [
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7204",
      "name": "Ride 6h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 360,
      "minBillableHours": 6,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 6000,
      "status": "ACTIVE",
      "priority": 100,
      "activeFrom": null,
      "activeTo": null
    },
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7203",
      "name": "Ride 4h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 240,
      "minBillableHours": 4,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 4000,
      "status": "ACTIVE",
      "priority": 100,
      "activeFrom": null,
      "activeTo": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 2,
    "total": 4,
    "totalPages": 2
  }
}
```

### 6.6. Case 5: page 2 cua pagination

Frontend nen test them:

```text
GET /v1/admin/coupon-rules?page=2&pageSize=2
```

Ky vong:

- `Ride 2h discount`
- `Ride 1h discount`

Response mong doi:

```json
{
  "data": [
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7202",
      "name": "Ride 2h discount",
      "minRidingMinutes": 120,
      "minBillableHours": 2,
      "discountValue": 2000,
      "status": "ACTIVE"
    },
    {
      "id": "019b17bd-d130-7e7d-be69-91ceef7b7201",
      "name": "Ride 1h discount",
      "minRidingMinutes": 60,
      "minBillableHours": 1,
      "discountValue": 1000,
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 2,
    "pageSize": 2,
    "total": 4,
    "totalPages": 2
  }
}
```

### 6.7. Case 6: khong co token

Trong Scalar:

- clear `Authorize`
- goi `GET /v1/admin/coupon-rules`

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

### 6.8. Case 7: token khong phai admin

Trong Scalar:

- login bang user thuong
- authorize bang token user do
- goi `GET /v1/admin/coupon-rules`

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

### 6.9. Case 8: empty list

Case nay khong xay ra voi DB vua `seed:demo`, vi seed co 4 rule.

Neu frontend muon test UI empty state, co 2 cach:

1. dung DB rieng khong seed coupon rules
2. tam thoi update tat ca coupon rules sang `INACTIVE` trong pgAdmin roi goi lai khong filter

SQL tam thoi:

```sql
UPDATE coupon_rules
SET status = 'INACTIVE'::"AccountStatus",
    updated_at = now()
WHERE id IN (
  '019b17bd-d130-7e7d-be69-91ceef7b7201',
  '019b17bd-d130-7e7d-be69-91ceef7b7202',
  '019b17bd-d130-7e7d-be69-91ceef7b7203',
  '019b17bd-d130-7e7d-be69-91ceef7b7204'
);
```

Sau khi test xong, restore:

```sql
UPDATE coupon_rules
SET status = 'ACTIVE'::"AccountStatus",
    updated_at = now()
WHERE id IN (
  '019b17bd-d130-7e7d-be69-91ceef7b7201',
  '019b17bd-d130-7e7d-be69-91ceef7b7202',
  '019b17bd-d130-7e7d-be69-91ceef7b7203',
  '019b17bd-d130-7e7d-be69-91ceef7b7204'
);
```

## 7. pgAdmin guide

### 7.1. Bang can kiem tra

Bang backend dung cho API nay:

```text
coupon_rules
```

### 7.2. Query tong hop

Mo Query Tool trong pgAdmin va chay:

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
ORDER BY created_at DESC, id DESC;
```

Ky vong sau `seed:demo`:

- 4 dong
- thu tu: `Ride 6h discount`, `Ride 4h discount`, `Ride 2h discount`, `Ride 1h discount`

### 7.3. Query doi chieu voi case `status=ACTIVE`

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
WHERE status = 'ACTIVE'::"AccountStatus"
ORDER BY created_at DESC, id DESC;
```

Ky vong sau `seed:demo`:

- 4 dong

### 7.4. Query doi chieu voi case `status=INACTIVE`

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
WHERE status = 'INACTIVE'::"AccountStatus"
ORDER BY created_at DESC, id DESC;
```

Ky vong sau `seed:demo`:

- `0` dong

### 7.5. Tao them 1 rule `INACTIVE` de test frontend

Neu frontend muon test tab/filter/badge `INACTIVE`, chay SQL sau:

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
  updated_at
)
VALUES (
  '019b17bd-d130-7e7d-be69-91ceef7b7299',
  'Ride 8h inactive discount',
  'RIDING_DURATION'::coupon_trigger_type,
  480,
  NULL,
  'FIXED_AMOUNT'::discount_type,
  8000,
  'INACTIVE'::"AccountStatus",
  100,
  NULL,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  trigger_type = EXCLUDED.trigger_type,
  min_riding_minutes = EXCLUDED.min_riding_minutes,
  min_completed_rentals = EXCLUDED.min_completed_rentals,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  active_from = EXCLUDED.active_from,
  active_to = EXCLUDED.active_to,
  updated_at = now();
```

Sau do test lai:

```text
GET /v1/admin/coupon-rules?status=INACTIVE
```

Ky vong:

- `data.length >= 1`
- co item `Ride 8h inactive discount`

### 7.6. Xoa rule test sau khi QA xong

```sql
DELETE FROM coupon_rules
WHERE id = '019b17bd-d130-7e7d-be69-91ceef7b7299';
```

## 8. Frontend implementation notes

### 8.1. UI goi y

Admin list screen co the hien:

- table list coupon rules
- filter theo `status`
- filter theo `triggerType`
- filter theo `discountType`
- pagination control
- empty state khi `data = []`

Cot goi y:

- Name
- Trigger Type
- Min Riding Minutes
- Min Billable Hours
- Discount Type
- Discount Value
- Status
- Priority
- Active From
- Active To
- Created At
- Updated At

### 8.2. Render goi y

- `discountValue` voi `FIXED_AMOUNT` thi format theo `vi-VN`
- `minBillableHours` neu `null` thi render `-`
- `activeFrom`, `activeTo` neu `null` thi render `-`
- `status` nen hien badge mau
- `RIDING_DURATION` co the map sang label UI nhu `Riding duration`

### 8.3. Khong nen suy luan sai

Frontend admin list khong nen:

- tu tinh bucket `1h-2h`, `2h-4h` neu khong can
- tu apply discount tren client
- tu join voi `coupons` hoac `user_coupons`

Nguon su that cua admin list la response cua `GET /v1/admin/coupon-rules`.

## 9. Checklist test nhanh cho frontend team

Sau `pnpm seed:demo`:

- [ ] login admin thanh cong
- [ ] authorize trong Scalar
- [ ] `GET /v1/admin/coupon-rules` tra 4 item
- [ ] `GET /v1/admin/coupon-rules?status=ACTIVE` tra 4 item
- [ ] `GET /v1/admin/coupon-rules?status=INACTIVE` tra `data: []`
- [ ] `GET /v1/admin/coupon-rules?page=1&pageSize=2` tra 2 item, `totalPages = 2`
- [ ] pgAdmin query `SELECT ... FROM coupon_rules ORDER BY created_at DESC, id DESC` ra 4 dong dung nhu Scalar
- [ ] sau khi insert 1 rule inactive trong pgAdmin, filter `status=INACTIVE` tra dung item vua tao

## 10. SQL seed lai 4 rule mac dinh neu can

Neu can repair nhanh data demo cua coupon rules:

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
  updated_at
)
VALUES
  ('019b17bd-d130-7e7d-be69-91ceef7b7201', 'Ride 1h discount', 'RIDING_DURATION'::coupon_trigger_type, 60,  NULL, 'FIXED_AMOUNT'::discount_type, 1000, 'ACTIVE'::"AccountStatus", 100, NULL, NULL, now()),
  ('019b17bd-d130-7e7d-be69-91ceef7b7202', 'Ride 2h discount', 'RIDING_DURATION'::coupon_trigger_type, 120, NULL, 'FIXED_AMOUNT'::discount_type, 2000, 'ACTIVE'::"AccountStatus", 100, NULL, NULL, now()),
  ('019b17bd-d130-7e7d-be69-91ceef7b7203', 'Ride 4h discount', 'RIDING_DURATION'::coupon_trigger_type, 240, NULL, 'FIXED_AMOUNT'::discount_type, 4000, 'ACTIVE'::"AccountStatus", 100, NULL, NULL, now()),
  ('019b17bd-d130-7e7d-be69-91ceef7b7204', 'Ride 6h discount', 'RIDING_DURATION'::coupon_trigger_type, 360, NULL, 'FIXED_AMOUNT'::discount_type, 6000, 'ACTIVE'::"AccountStatus", 100, NULL, NULL, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  trigger_type = EXCLUDED.trigger_type,
  min_riding_minutes = EXCLUDED.min_riding_minutes,
  min_completed_rentals = EXCLUDED.min_completed_rentals,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  active_from = EXCLUDED.active_from,
  active_to = EXCLUDED.active_to,
  updated_at = now();
```

## 11. Tom tat ngan cho doi frontend

Neu chi can test nhanh:

1. `pnpm seed:demo`
2. login admin demo
3. goi `GET /v1/admin/coupon-rules`
4. mong doi 4 item global rule mac dinh
5. filter `status=ACTIVE` van ra 4 item
6. filter `status=INACTIVE` mac dinh ra rong
7. `page=1&pageSize=2` se chia list thanh 2 trang
8. doi chieu bang `coupon_rules` trong pgAdmin

