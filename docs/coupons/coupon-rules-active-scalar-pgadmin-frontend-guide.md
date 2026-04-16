# Coupon Rules Active Scalar + pgAdmin + Frontend Guide

File nay dung cho API moi:

- `GET /v1/coupon-rules/active`
- public endpoint, khong can auth
- tra danh sach global auto discount rules dang active cho frontend/user xem
- khong tinh bill
- khong apply discount
- khong ghi data
- data lay truc tiep tu `coupon_rules`

Guide nay duoc viet de frontend team co the:

- chay `seed:demo` va co ngay data that de test
- test API bang Scalar
- doi chieu data bang pgAdmin
- biet chinh xac response shape, ordering, nullability
- code tiep UI hien thi chinh sach giam gia hien tai

Luu y quan trong:

- endpoint nay khong dung `coupons`
- endpoint nay khong dung `user_coupons`
- endpoint nay chi doc global rules trong `coupon_rules`
- sau khi `pnpm seed:demo`, he thong da co san 4 rule mac dinh de test

Guide lien quan:

- `docs/coupons/rental-billing-preview-global-auto-discount-scalar-pgadmin-frontend-guide.md`
- billing preview va rental finalize cung dung cung bo `coupon_rules` nay

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

Neu Scalar chua thay endpoint moi:

1. restart `pnpm dev`
2. reload lai `http://localhost:4000/docs`
3. tim endpoint `GET /v1/coupon-rules/active`

## 2. Data that co san ngay sau `pnpm seed:demo`

Sau khi `pnpm seed:demo`, he thong se upsert 4 global coupon rules mac dinh:

| id | name | minRidingMinutes | discountValue | priority |
| --- | --- | ---: | ---: | ---: |
| `019b17bd-d130-7e7d-be69-91ceef7b7201` | `Ride 1h discount` | `60` | `1000` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7202` | `Ride 2h discount` | `120` | `2000` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7203` | `Ride 4h discount` | `240` | `4000` | `100` |
| `019b17bd-d130-7e7d-be69-91ceef7b7204` | `Ride 6h discount` | `360` | `6000` | `100` |

Tat ca 4 rule deu co:

- `trigger_type = RIDING_DURATION`
- `discount_type = FIXED_AMOUNT`
- `status = ACTIVE`
- `active_from = null`
- `active_to = null`
- `min_completed_rentals = null`

Neu trong DB da co rule `ACTIVE` khac cung loai `RIDING_DURATION + FIXED_AMOUNT`, `seed:demo`
se chuyen chung sang `INACTIVE` de demo state on dinh.

## 3. Business meaning ma frontend can hieu dung

Policy hien tai:

- di tu `1h` den duoi `2h`: giam `1.000 VND`
- di tu `2h` den duoi `4h`: giam `2.000 VND`
- di tu `4h` den duoi `6h`: giam `4.000 VND`
- di tu `6h` tro len: giam `6.000 VND`

Frontend chi dung endpoint nay de hien thi policy.

Frontend khong nen suy ra tu endpoint nay rang:

- user chac chan se duoc giam trong moi rental
- discount se apply khi co `subscription_id`
- discount ap dung cho penalty hay phi khac

Nhung rule nghiep vu can hien thi hoac note trong UI:

- chi ap dung cho rental thanh toan bang wallet
- chi ap dung khi rental khong co `subscription_id`
- moi rental toi da 1 discount
- neu co nhieu rule hop le khi tinh bill, he thong chon rule giam tot nhat
- discount chi ap vao `eligibleRentalAmount`, khong ap vao penalty, deposit forfeited hay phi khac

## 4. Contract API ma frontend can bam theo

### 4.1. Endpoint

```text
GET /v1/coupon-rules/active
```

Auth:

- khong can Bearer token
- co the goi truc tiep tu frontend public flow neu can

### 4.2. Response shape

Response hien tai:

```json
{
  "data": [
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
      "activeTo": null,
      "displayLabel": "Di tu 1h den duoi 2h giam 1.000 VND"
    }
  ]
}
```

### 4.3. Field notes cho frontend

- `data` co the la mang rong `[]`
- `discountValue` la `number`
- `minBillableHours` la `number`
- `activeFrom` co the `null`
- `activeTo` co the `null`
- `displayLabel` la text server render san de frontend co the hien thi ngay
- `status` hien tai se la `ACTIVE`, nhung frontend van nen coi no la field nghiep vu that

### 4.4. Sort order ma frontend duoc nhan

API da sort san:

1. `minRidingMinutes ASC`
2. neu bang nhau thi `priority ASC`
3. neu van bang nhau thi `createdAt ASC`

Voi data sau `seed:demo`, thu tu se luon la:

1. `60`
2. `120`
3. `240`
4. `360`

Frontend khong can sort lai neu chi muon hien thi theo chinh sach mac dinh.

### 4.5. TypeScript shape goi y cho frontend

```ts
export type ActiveCouponRule = {
  id: string;
  name: string;
  triggerType:
    | "RIDING_DURATION"
    | "USAGE_FREQUENCY"
    | "CAMPAIGN"
    | "MEMBERSHIP_MILESTONE"
    | "MANUAL_GRANT";
  minRidingMinutes: number;
  minBillableHours: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  priority: number;
  activeFrom: string | null;
  activeTo: string | null;
  displayLabel: string;
};

export type GetActiveCouponRulesResponse = {
  data: ActiveCouponRule[];
};
```

## 5. Scalar test guide

Endpoint nay la public, nen khong can login truoc.

### 5.1. Case 1: happy path ngay sau `seed:demo`

Trong Scalar, goi:

```text
GET /v1/coupon-rules/active
```

Ky vong:

- HTTP `200`
- `data.length = 4`
- thu tu item:
  - `Ride 1h discount`
  - `Ride 2h discount`
  - `Ride 4h discount`
  - `Ride 6h discount`

Kiem tra tung item:

| name | minRidingMinutes | minBillableHours | discountValue | displayLabel |
| --- | ---: | ---: | ---: | --- |
| `Ride 1h discount` | `60` | `1` | `1000` | `Di tu 1h den duoi 2h giam 1.000 VND` |
| `Ride 2h discount` | `120` | `2` | `2000` | `Di tu 2h den duoi 4h giam 2.000 VND` |
| `Ride 4h discount` | `240` | `4` | `4000` | `Di tu 4h den duoi 6h giam 4.000 VND` |
| `Ride 6h discount` | `360` | `6` | `6000` | `Di tu 6h giam 6.000 VND` |

Tat ca item phai co:

- `triggerType = RIDING_DURATION`
- `discountType = FIXED_AMOUNT`
- `status = ACTIVE`
- `priority = 100`
- `activeFrom = null`
- `activeTo = null`

### 5.2. Case 2: khong can auth

Trong Scalar:

- khong bam `Authorize`
- hoac clear token neu dang co token
- goi lai `GET /v1/coupon-rules/active`

Ky vong:

- van la `200`
- van tra 4 item

Luu y:

- day la diem khac voi cac endpoint user-only nhu `GET /v1/rentals/me/...`
- frontend team co the goi endpoint nay truoc login neu can hien policy o man hinh public

### 5.3. Case 3: neu API tra `data: []`

Neu goi endpoint ma nhan:

```json
{
  "data": []
}
```

thi can check:

1. co chay dung `pnpm seed:demo` hay khong
2. app dang dung dung DB vua seed hay khong
3. `coupon_rules` trong pgAdmin co 4 rule active hay khong

Voi DB dung va `seed:demo` moi chay xong, case nay khong nen xay ra.

## 6. pgAdmin queries de doi chieu

### 6.1. Query tong hop dung nhat voi logic API

Mo Query Tool trong pgAdmin va chay:

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
  created_at
FROM coupon_rules
WHERE status = 'ACTIVE'
  AND trigger_type = 'RIDING_DURATION'
  AND discount_type = 'FIXED_AMOUNT'
  AND min_riding_minutes IS NOT NULL
  AND (active_from IS NULL OR active_from <= now())
  AND (active_to IS NULL OR active_to >= now())
ORDER BY min_riding_minutes ASC, priority ASC, created_at ASC;
```

Ky vong sau `seed:demo`:

- tra `4` dong
- thu tu `60, 120, 240, 360`
- discount values `1000, 2000, 4000, 6000`

### 6.2. Query xac dinh 4 rule mac dinh theo ID that

```sql
SELECT
  id,
  name,
  min_riding_minutes,
  discount_value,
  status,
  priority,
  active_from,
  active_to
FROM coupon_rules
WHERE id IN (
  '019b17bd-d130-7e7d-be69-91ceef7b7201',
  '019b17bd-d130-7e7d-be69-91ceef7b7202',
  '019b17bd-d130-7e7d-be69-91ceef7b7203',
  '019b17bd-d130-7e7d-be69-91ceef7b7204'
)
ORDER BY min_riding_minutes ASC;
```

Ky vong:

- dung 4 dong nhu section 2
- tat ca `status = ACTIVE`
- tat ca `active_from IS NULL`
- tat ca `active_to IS NULL`

### 6.3. Query xem co rule active khac dang chen vao hay khong

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
WHERE status = 'ACTIVE'
ORDER BY trigger_type, discount_type, min_riding_minutes NULLS LAST, created_at ASC;
```

Dung query nay neu:

- Scalar tra nhieu hon 4 rule
- team nghi co data cu tu lan test truoc
- can xac dinh trong DB co rule active nao ngoai bo mac dinh khong

## 7. Cach doi chieu Scalar va pgAdmin cho chinh xac

Frontend team nen doi chieu theo thu tu nay:

1. goi `GET /v1/coupon-rules/active` trong Scalar
2. ghi lai 4 gia tri:
   - `name`
   - `minRidingMinutes`
   - `discountValue`
   - `displayLabel`
3. sang pgAdmin chay query section `6.1`
4. verify 3 field data goc:
   - `name`
   - `min_riding_minutes`
   - `discount_value`
5. doi chieu them `displayLabel` theo quy tac server render:
   - co next tier thi `Di tu X den duoi Y giam Z VND`
   - tier cuoi cung thi `Di tu X giam Z VND`

Map chinh xac:

- `60 + 1000 + next 120` -> `Di tu 1h den duoi 2h giam 1.000 VND`
- `120 + 2000 + next 240` -> `Di tu 2h den duoi 4h giam 2.000 VND`
- `240 + 4000 + next 360` -> `Di tu 4h den duoi 6h giam 4.000 VND`
- `360 + 6000 + no next tier` -> `Di tu 6h giam 6.000 VND`

## 8. Frontend checklist de code UI

### 8.1. UI states can co

- loading lan dau
- success state co `4` rule
- empty state neu `data.length = 0`
- fallback state neu server loi `5xx`

Vi endpoint la public:

- khong can block UI do thieu token
- khong can redirect login neu `401`
- neu co `401/403` thi nen coi la bat thuong moi truong, khong phai behavior binh thuong

### 8.2. Field nen render tren giao dien

- `displayLabel`
- `discountValue`
- `minBillableHours` hoac `minRidingMinutes`
- `name` neu can debug hoac hien subtitle
- `activeFrom`
- `activeTo`

### 8.3. Goi y render

List item toi thieu:

- dong chinh: `displayLabel`
- subtitle: `Rule name: Ride 1h discount`
- badge: `ACTIVE`

Neu muon frontend tu render lai text thay vi dung `displayLabel`, co the dua theo:

- `minBillableHours`
- rule tiep theo trong danh sach
- `discountValue`

Nhung khuyen nghi:

- uu tien dung `displayLabel` lam chuoi hien thi chinh
- frontend chi tu render lai khi can localization khac

### 8.4. Goi y TypeScript helper cho UI

```ts
export function formatCouponRuleMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function getCouponRuleSubtitle(rule: ActiveCouponRule) {
  return `${rule.minBillableHours} billable hour(s) - ${formatCouponRuleMoney(rule.discountValue)} VND`;
}
```

### 8.5. Cac assumption frontend khong nen hardcode

- khong hardcode luc nao cung chi co 4 rule
- khong hardcode luc nao cung `priority = 100`
- khong hardcode `activeFrom/activeTo` luon la `null`
- khong hardcode ten rule luon bat dau bang `Ride`

Nen hardcode toi da:

- `triggerType = RIDING_DURATION` va `discountType = FIXED_AMOUNT` la behavior hien tai cua endpoint

## 9. Test cases frontend nen tick

### 9.1. Basic cases

- `GET /v1/coupon-rules/active` tra `200`
- endpoint goi duoc khi chua login
- danh sach hien thi dung thu tu `60, 120, 240, 360`
- hien thi dung `displayLabel`

### 9.2. Data consistency cases

- item 1 co `Ride 1h discount / 60 / 1000`
- item 2 co `Ride 2h discount / 120 / 2000`
- item 3 co `Ride 4h discount / 240 / 4000`
- item 4 co `Ride 6h discount / 360 / 6000`

### 9.3. Empty state case

Case nay khong phai state mac dinh sau `seed:demo`, nhung frontend van nen support:

```json
{
  "data": []
}
```

UI nen:

- hien empty state nhe
- khong bao loi
- khong render danh sach rong khong co message

## 10. Query bo sung de team tu tao case thu cong neu can

Neu team can tu tao case de test future/inactive/expired tren DB local, co the chen bo sung:

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
  '019b17bd-d130-7e7d-be69-91ceef7b7291',
  'Inactive discount',
  'RIDING_DURATION',
  30,
  NULL,
  'FIXED_AMOUNT',
  500,
  'INACTIVE',
  100,
  NULL,
  NULL,
  now(),
  now()
),
(
  '019b17bd-d130-7e7d-be69-91ceef7b7292',
  'Future discount',
  'RIDING_DURATION',
  45,
  NULL,
  'FIXED_AMOUNT',
  700,
  'ACTIVE',
  100,
  now() + interval '1 day',
  NULL,
  now(),
  now()
),
(
  '019b17bd-d130-7e7d-be69-91ceef7b7293',
  'Expired discount',
  'RIDING_DURATION',
  50,
  NULL,
  'FIXED_AMOUNT',
  800,
  'ACTIVE',
  100,
  NULL,
  now() - interval '1 day',
  now(),
  now()
);
```

Sau do goi lai API.

Ky vong:

- 3 rule vua chen khong duoc xuat hien trong response
- response van chi con 4 rule mac dinh

Neu muon cleanup:

```sql
DELETE FROM coupon_rules
WHERE id IN (
  '019b17bd-d130-7e7d-be69-91ceef7b7291',
  '019b17bd-d130-7e7d-be69-91ceef7b7292',
  '019b17bd-d130-7e7d-be69-91ceef7b7293'
);
```

## 11. Troubleshooting

Neu Scalar khong thay endpoint `GET /v1/coupon-rules/active`:

1. kiem tra server da restart sau khi pull code moi hay chua
2. reload `http://localhost:4000/docs`
3. kiem tra app dang chay dung branch/code moi

Neu Scalar tra `data: []`:

1. kiem tra da chay `pnpm seed:demo` hay chua
2. kiem tra app dang dung dung DB vua seed
3. chay query section `6.1`

Neu pgAdmin co 4 dong nhung Scalar tra rong:

1. kha nang cao app dang noi sang DB khac
2. check `DATABASE_URL` trong env cua server
3. restart `pnpm dev`

Neu Scalar tra hon 4 rule:

1. chay query section `6.3`
2. xem co rule active khac cung filter hay khong
3. chay lai `pnpm seed:demo` de demo mode deactivate rule active khac cung loai

## 12. Summary cho team frontend

Ngay sau `pnpm seed:demo`, frontend co the test ngay:

1. mo `http://localhost:4000/docs`
2. goi `GET /v1/coupon-rules/active`
3. verify response co 4 rule mac dinh
4. mo pgAdmin chay query section `6.1`
5. doi chieu du lieu goc va response API
6. code UI dua tren `displayLabel`, `discountValue`, `minBillableHours`

Neu team muon cach test nhanh nhat:

1. `pnpm seed:demo`
2. `pnpm dev`
3. Scalar: `GET /v1/coupon-rules/active`
4. pgAdmin: chay query section `6.1`
5. frontend render list 4 policy theo thu tu `1h`, `2h`, `4h`, `6h`
