# Coupon V1 Global Auto Discount Frontend Test Guide

File nay dung cho frontend team test va tich hop day du Coupon V1 sau thay doi audit moi:

- Coupon V1 la Global Auto Discount Policy, khong phai user-owned coupon.
- Backend tu dong chon rule hop le tot nhat khi billing preview va finalize rental.
- Finalize ghi `coupon_rule_id` va `coupon_rule_snapshot` vao `rental_billing_records`.
- Usage logs va stats doc rule identity tu billing record/snapshot, khong suy luan chinh bang `coupon_discount_amount`.

Guide nay gom:

- data that co san sau `pnpm seed:demo`
- cach test tren Scalar `http://localhost:4000/docs`
- query pgAdmin de verify DB
- cac case frontend can code va handle loi

## 1. Chuan bi moi truong

Chay theo thu tu:

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

Neu Scalar chua thay field/API moi:

1. dung server dang chay
2. chay lai `pnpm dev:build`
3. reload `http://localhost:4000/docs`

## 2. Account demo sau seed

Tat ca account demo dung password:

```text
Demo@123456
```

Account can dung:

| Email | Role | Dung de test |
| --- | --- | --- |
| `admin@mebike.local` | ADMIN | Admin coupon rules, stats, usage logs |
| `user01@mebike.local` | USER | Preview active rental co subscription, coupon khong ap dung |
| `user02@mebike.local` | USER | Preview active rental wallet, du dieu kien coupon 2h |
| `staff1@mebike.local` | STAFF | Finalize rental bang `PUT /v1/rentals/{rentalId}/end` |
| `agency1@mebike.local` | AGENCY | Co the test finalize theo agency station |

## 3. Business rule frontend phai nam

Coupon V1:

- user khong nhap coupon code
- user khong can claim coupon
- khong doc `user_coupons`
- admin cau hinh global `coupon_rules`
- chi nhan rule bang `id`, khong can unique name toan cuc
- chi cho `triggerType = RIDING_DURATION`
- chi cho `discountType = FIXED_AMOUNT`
- chi cho 4 tier co dinh:

| minRidingMinutes | discountValue |
| ---: | ---: |
| 60 | 1000 |
| 120 | 2000 |
| 240 | 4000 |
| 360 | 6000 |

Dieu kien apply:

- rental phai khong co `subscription_id`
- neu rental co `subscription_id` thi khong ap coupon, ke ca phan con lai phai tra bang wallet
- eligibility dung riding duration that: `rentalMinutes` / `totalDurationMinutes`
- khong dung `billableMinutes` hoac `billableHours` de xet tier nua
- `minBillableHours` trong API chi la field hien thi suy ra tu `minRidingMinutes / 60`
- coupon chi ap vao tien thue xe eligible sau prepaid/subscription
- coupon khong ap vao deposit forfeited 500k
- coupon khong ap vao penalty
- moi rental toi da 1 coupon
- preview va finalize dung cung logic chon rule

Rule admin:

- khong cho tao/update rule ngoai 4 mapping tren
- khong cho 2 rule `ACTIVE` cung `minRidingMinutes`
- rule da tung duoc ap vao `rental_billing_records` thi `PUT update` bi chan
- deactivate rule da used van duoc phep
- activate rule phai check duplicate active same tier

## 4. Seed data coupon co san

Sau `pnpm seed:demo`, backend seed 4 active rule deterministic:

| Rule ID | Name | minRidingMinutes | discountValue | Status |
| --- | --- | ---: | ---: | --- |
| `019b17bd-d130-7e7d-be69-91ceef7b7201` | `Ride 1h discount` | 60 | 1000 | ACTIVE |
| `019b17bd-d130-7e7d-be69-91ceef7b7202` | `Ride 2h discount` | 120 | 2000 | ACTIVE |
| `019b17bd-d130-7e7d-be69-91ceef7b7203` | `Ride 4h discount` | 240 | 4000 | ACTIVE |
| `019b17bd-d130-7e7d-be69-91ceef7b7204` | `Ride 6h discount` | 360 | 6000 | ACTIVE |

Query pgAdmin:

```sql
select
  id,
  name,
  trigger_type,
  min_riding_minutes,
  discount_type,
  discount_value,
  status,
  priority,
  active_from,
  active_to
from coupon_rules
where trigger_type = 'RIDING_DURATION'
order by min_riding_minutes;
```

Expected:

- co 4 row tren
- ca 4 row `ACTIVE`
- `active_from` va `active_to` la `null`

## 5. Seed stats baseline that

Seed demo tao 60 completed rentals bang lifecycle.

Voi code hien tai, all-time expected:

```text
totalCompletedRentals: 60
discountedRentalsCount: 44
nonDiscountedRentalsCount: 16
discountRate: 0.7333
totalDiscountAmount: 132000
avgDiscountAmount: 3000
```

Breakdown theo discount amount:

| discountAmount | rentalsCount | totalDiscountAmount |
| ---: | ---: | ---: |
| 1000 | 12 | 12000 |
| 2000 | 12 | 24000 |
| 4000 | 12 | 48000 |
| 6000 | 8 | 48000 |

Breakdown theo rule:

| rule | appliedCount | totalDiscountAmount |
| --- | ---: | ---: |
| Ride 1h discount | 12 | 12000 |
| Ride 2h discount | 12 | 24000 |
| Ride 4h discount | 12 | 48000 |
| Ride 6h discount | 8 | 48000 |

`topAppliedRule` all-time expected la `Ride 4h discount`, vi sort theo:

1. `appliedCount desc`
2. `totalDiscountAmount desc`
3. `minRidingMinutes asc`

Query pgAdmin de verify all-time:

```sql
select
  count(*) as total_completed_rentals,
  count(*) filter (where br.coupon_discount_amount > 0) as discounted_rentals_count,
  count(*) filter (where coalesce(br.coupon_discount_amount, 0) = 0) as non_discounted_rentals_count,
  coalesce(sum(br.coupon_discount_amount) filter (where br.coupon_discount_amount > 0), 0) as total_discount_amount
from "Rental" r
left join rental_billing_records br on br.rental_id = r.id
where r.status = 'COMPLETED';
```

Query breakdown by amount:

```sql
select
  br.coupon_discount_amount as discount_amount,
  count(*) as rentals_count,
  sum(br.coupon_discount_amount) as total_discount_amount
from rental_billing_records br
join "Rental" r on r.id = br.rental_id
where r.status = 'COMPLETED'
  and br.coupon_discount_amount > 0
group by br.coupon_discount_amount
order by br.coupon_discount_amount;
```

Query breakdown by rule/snapshot:

```sql
select
  coalesce(br.coupon_rule_id::text, br.coupon_rule_snapshot ->> 'ruleId') as rule_id,
  coalesce(br.coupon_rule_snapshot ->> 'name', cr.name) as rule_name,
  coalesce((br.coupon_rule_snapshot ->> 'minRidingMinutes')::int, cr.min_riding_minutes) as min_riding_minutes,
  coalesce((br.coupon_rule_snapshot ->> 'discountValue')::numeric, cr.discount_value) as discount_value,
  count(*) as applied_count,
  sum(br.coupon_discount_amount) as total_discount_amount
from rental_billing_records br
join "Rental" r on r.id = br.rental_id
left join coupon_rules cr on cr.id = br.coupon_rule_id
where r.status = 'COMPLETED'
  and br.coupon_discount_amount > 0
group by
  coalesce(br.coupon_rule_id::text, br.coupon_rule_snapshot ->> 'ruleId'),
  coalesce(br.coupon_rule_snapshot ->> 'name', cr.name),
  coalesce((br.coupon_rule_snapshot ->> 'minRidingMinutes')::int, cr.min_riding_minutes),
  coalesce((br.coupon_rule_snapshot ->> 'discountValue')::numeric, cr.discount_value)
order by applied_count desc, total_discount_amount desc, min_riding_minutes asc;
```

## 6. API map cho frontend

| API | Role | Muc dich |
| --- | --- | --- |
| `GET /v1/coupon-rules/active` | Public | Lay 4 rule ACTIVE hop le de hien thi policy |
| `GET /v1/admin/coupon-rules` | ADMIN | Admin list rules |
| `POST /v1/admin/coupon-rules` | ADMIN | Tao rule moi |
| `PUT /v1/admin/coupon-rules/{ruleId}` | ADMIN | Update rule chua used |
| `PATCH /v1/admin/coupon-rules/{ruleId}/activate` | ADMIN | Activate rule, check duplicate tier |
| `PATCH /v1/admin/coupon-rules/{ruleId}/deactivate` | ADMIN | Deactivate rule, allowed even used |
| `GET /v1/admin/coupon-stats` | ADMIN | Stats coupon theo finalized billing |
| `GET /v1/admin/coupon-usage-logs` | ADMIN | Audit log coupon da apply |
| `GET /v1/rentals/me/{rentalId}/billing-preview` | USER | Preview bill/coupon, khong ghi DB |
| `PUT /v1/rentals/{rentalId}/end` | STAFF/AGENCY | Finalize rental va ghi billing record |

## 7. Login tren Scalar

Goi:

```text
POST /v1/auth/login
```

Admin body:

```json
{
  "email": "admin@mebike.local",
  "password": "Demo@123456"
}
```

User body:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Staff body:

```json
{
  "email": "staff1@mebike.local",
  "password": "Demo@123456"
}
```

Sau khi login:

1. copy `data.accessToken`
2. bam `Authorize`
3. paste token vao bearer auth

Neu Scalar yeu cau full header thi dung:

```text
Bearer <accessToken>
```

## 8. Test public active rules

Scalar:

```text
GET /v1/coupon-rules/active
```

Expected `200`:

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
      "displayLabel": "Ride 1h discount"
    }
  ]
}
```

Frontend note:

- response co 4 items ngay sau seed
- sort theo `minRidingMinutes asc`
- `minBillableHours` chi de hien thi
- khong dung endpoint nay de tinh discount phia client; backend van la source of truth

## 9. Test admin list rules

Login admin, goi:

```text
GET /v1/admin/coupon-rules?page=1&pageSize=20
GET /v1/admin/coupon-rules?status=ACTIVE
GET /v1/admin/coupon-rules?triggerType=RIDING_DURATION&discountType=FIXED_AMOUNT
```

Expected:

- `200`
- co `data`
- co `pagination`
- seed co 4 active fixed rules

Neu dung token user:

```text
403
```

Neu khong co token:

```text
401
```

## 10. Test create rule hop le

Vi seed da co active rule cho ca 4 tier, nen tao rule test nen de `INACTIVE`.

Scalar:

```text
POST /v1/admin/coupon-rules
```

Body:

```json
{
  "name": "FE Test Ride 2h inactive",
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

Expected:

- HTTP `201`
- response co `id` moi
- `status = INACTIVE`
- duplicate name van duoc neu can, frontend khong duoc xem `name` la unique key

Query pgAdmin:

```sql
select id, name, min_riding_minutes, discount_value, status
from coupon_rules
where name = 'FE Test Ride 2h inactive'
order by created_at desc;
```

## 11. Test create sai mapping

Scalar:

```text
POST /v1/admin/coupon-rules
```

Body sai:

```json
{
  "name": "FE Test invalid tier",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 90,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 1500,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Expected:

```text
400
```

Ly do:

- `90 -> 1500` khong nam trong 4 mapping fixed

Mapping duy nhat duoc phep:

```text
60 -> 1000
120 -> 2000
240 -> 4000
360 -> 6000
```

## 12. Test create sai trigger/discount type

Body sai trigger:

```json
{
  "name": "FE Test invalid trigger",
  "triggerType": "CAMPAIGN",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Expected:

```text
400
```

Body sai discount type:

```json
{
  "name": "FE Test invalid discount type",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "PERCENTAGE",
  "discountValue": 2000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Expected:

```text
400
```

Frontend note:

- form admin nen lock `triggerType = RIDING_DURATION`
- form admin nen lock `discountType = FIXED_AMOUNT`
- UI nen cho chon tier tu dropdown 4 option thay vi input tu do

## 13. Test active window invalid

Scalar:

```text
POST /v1/admin/coupon-rules
```

Body:

```json
{
  "name": "FE Test invalid active window",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 240,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 4000,
  "priority": 100,
  "status": "INACTIVE",
  "activeFrom": "2026-05-02T00:00:00.000Z",
  "activeTo": "2026-05-01T00:00:00.000Z"
}
```

Expected:

```text
400
```

Frontend validation:

```text
activeFrom <= activeTo
```

## 14. Test duplicate ACTIVE same tier khi create

Seed da co `Ride 2h discount` ACTIVE voi `minRidingMinutes = 120`.

Scalar:

```text
POST /v1/admin/coupon-rules
```

Body:

```json
{
  "name": "FE Test duplicate active 2h",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Expected:

```text
409
```

Expected error code:

```json
{
  "details": {
    "code": "COUPON_RULE_ACTIVE_TIER_CONFLICT",
    "minRidingMinutes": 120,
    "conflictingRuleId": "019b17bd-d130-7e7d-be69-91ceef7b7202"
  }
}
```

## 15. Test activate duplicate ACTIVE same tier

Buoc 1: tao inactive duplicate 2h nhu section 10.

Buoc 2: copy `id` cua rule moi, goi:

```text
PATCH /v1/admin/coupon-rules/{newRuleId}/activate
```

Expected:

```text
409
```

Expected code:

```text
COUPON_RULE_ACTIVE_TIER_CONFLICT
```

Ly do:

- seed rule `019b17bd-d130-7e7d-be69-91ceef7b7202` van ACTIVE cung tier 120

## 16. Test deactivate used rule

Seed rule da duoc apply vao completed rentals, nhung deactivate van duoc phep.

Scalar:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate
```

Expected:

- HTTP `200`
- `status = INACTIVE`

Query pgAdmin:

```sql
select id, name, status
from coupon_rules
where id = '019b17bd-d130-7e7d-be69-91ceef7b7202';
```

Can kich hoat lai de cac case preview/finalize 2h tiep tuc dung:

```text
PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/activate
```

Expected:

- HTTP `200`
- `status = ACTIVE`

Neu ban da tao va activate mot duplicate 2h khac, activate rule seed se bi `409`.

## 17. Test update rule da used bi chan

Ngay sau seed, 4 seed rules da co usage trong `rental_billing_records`, nen PUT vao rule seed phai bi chan.

Scalar:

```text
PUT /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202
```

Body:

```json
{
  "name": "Ride 2h discount edited by FE test",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 90,
  "status": "ACTIVE",
  "activeFrom": null,
  "activeTo": null
}
```

Expected:

```text
409
```

Expected error code:

```json
{
  "details": {
    "code": "COUPON_RULE_ALREADY_USED",
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7202"
  }
}
```

Frontend note:

- UI edit rule nen handle `COUPON_RULE_ALREADY_USED`
- message nen huong admin deactivate rule cu va create rule moi

## 18. Test billing preview wallet rental

Seed co active rental deterministic cho `user02`:

```text
rentalId: 019b17bd-d130-7e7d-be69-91ceef7b9021
email: user02@mebike.local
subscription_id: null
start offset luc seed: khoang 125 phut truoc
expected tier neu test ngay sau seed: 120 -> 2000
```

Neu da de server chay lau, riding duration that co the vuot 240 hoac 360 phut va backend se chon tier cao hon. De test deterministic 2h, co the reset start time bang pgAdmin:

```sql
update "Rental"
set
  start_time = now() - interval '130 minutes',
  duration = 130,
  subscription_id = null,
  updated_at = now()
where id = '019b17bd-d130-7e7d-be69-91ceef7b9021'
  and status = 'RENTED';
```

Login user:

```json
{
  "email": "user02@mebike.local",
  "password": "Demo@123456"
}
```

Scalar:

```text
GET /v1/rentals/me/019b17bd-d130-7e7d-be69-91ceef7b9021/billing-preview
```

Expected neu duration khoang 130 phut:

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

Cac field tien can hien thi:

- `baseRentalAmount`
- `prepaidAmount`
- `eligibleRentalAmount`
- `subscriptionDiscountAmount`
- `couponDiscountAmount`
- `penaltyAmount`
- `depositForfeited`
- `payableRentalAmount`
- `totalPayableAmount`

Frontend formula hien thi:

```text
eligibleRentalAmount = max(rental amount after subscription - prepaidAmount, 0)
couponDiscountAmount = discount backend tra ve
payableRentalAmount = eligibleRentalAmount - couponDiscountAmount
totalPayableAmount = payableRentalAmount + penaltyAmount
```

Khong tu tinh lai coupon o frontend.

## 19. Test billing preview subscription rental

Seed `user01` co active rental va thuong co subscription.

Query lay rental id:

```sql
select
  r.id as rental_id,
  u.email,
  r.subscription_id,
  ceil(extract(epoch from (now() - r.start_time)) / 60)::int as riding_minutes_now
from "Rental" r
join users u on u.id = r.user_id
where u.email = 'user01@mebike.local'
  and r.status = 'RENTED'
order by r.start_time desc
limit 1;
```

Login:

```json
{
  "email": "user01@mebike.local",
  "password": "Demo@123456"
}
```

Scalar:

```text
GET /v1/rentals/me/{rentalId}/billing-preview
```

Expected:

```json
{
  "subscriptionApplied": true,
  "bestDiscountRule": null,
  "couponDiscountAmount": 0
}
```

Frontend note:

- neu `subscriptionApplied = true`, khong hien discount coupon
- co the hien `subscriptionDiscountAmount`
- khong hien nut claim/apply coupon

## 20. Test finalize rental va billing audit

Endpoint:

```text
PUT /v1/rentals/{rentalId}/end
```

Role:

```text
STAFF hoac AGENCY
```

Lay station cua `staff1`:

```sql
select
  u.email,
  uoa.station_id,
  s.name as station_name
from users u
join "UserOrgAssignment" uoa on uoa.user_id = u.id
left join "Station" s on s.id = uoa.station_id
where u.email = 'staff1@mebike.local';
```

Login staff:

```json
{
  "email": "staff1@mebike.local",
  "password": "Demo@123456"
}
```

Neu muon test deterministic 2h truoc khi finalize, chay lai:

```sql
update "Rental"
set
  start_time = now() - interval '130 minutes',
  duration = 130,
  subscription_id = null,
  updated_at = now()
where id = '019b17bd-d130-7e7d-be69-91ceef7b9021'
  and status = 'RENTED';
```

Scalar:

```text
PUT /v1/rentals/019b17bd-d130-7e7d-be69-91ceef7b9021/end
```

Body:

```json
{
  "stationId": "PASTE_STAFF1_STATION_ID_HERE",
  "confirmationMethod": "MANUAL"
}
```

Expected:

- HTTP `200`
- rental status thanh `COMPLETED`
- billing record duoc tao
- `coupon_rule_id` co rule id neu rental khong subscription va du dieu kien
- `coupon_rule_snapshot` co snapshot rule tai thoi diem apply
- `coupon_discount_amount` khop discount

Query pgAdmin:

```sql
select
  rental_id,
  coupon_rule_id,
  coupon_rule_snapshot,
  coupon_discount_amount,
  subscription_discount_amount,
  deposit_forfeited,
  total_amount,
  created_at
from rental_billing_records
where rental_id = '019b17bd-d130-7e7d-be69-91ceef7b9021';
```

Expected neu duration khoang 130 phut:

```text
coupon_rule_id = 019b17bd-d130-7e7d-be69-91ceef7b7202
coupon_discount_amount = 2000.00
subscription_discount_amount = 0.00
coupon_rule_snapshot.name = Ride 2h discount
coupon_rule_snapshot.minRidingMinutes = 120
coupon_rule_snapshot.discountValue = 2000
```

Snapshot toi thieu can co:

```json
{
  "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7202",
  "name": "Ride 2h discount",
  "triggerType": "RIDING_DURATION",
  "minRidingMinutes": 120,
  "discountType": "FIXED_AMOUNT",
  "discountValue": 2000,
  "priority": 100,
  "billableMinutes": 150,
  "billableHours": 2.5,
  "appliedAt": "2026-04-18T..."
}
```

Luu y:

- `billableMinutes` va `billableHours` trong snapshot la audit pricing block.
- Rule eligibility van dua tren `minRidingMinutes` voi riding duration that.
- Endpoint end chi finalize duoc 1 lan. Muon test lai rental fixed id nay, rerun seed/reset DB.

## 21. Test subscription finalize khong co coupon

Neu finalize rental co `subscription_id`, billing record dung business la:

```text
coupon_rule_id = null
coupon_rule_snapshot = null
coupon_discount_amount = 0.00
subscription_discount_amount > 0 neu subscription cover rental
```

Query de tim completed subscription billing:

```sql
select
  r.id as rental_id,
  u.email,
  r.subscription_id,
  br.coupon_rule_id,
  br.coupon_rule_snapshot,
  br.coupon_discount_amount,
  br.subscription_discount_amount,
  br.total_amount,
  br.created_at
from "Rental" r
join users u on u.id = r.user_id
join rental_billing_records br on br.rental_id = r.id
where r.subscription_id is not null
order by br.created_at desc
limit 20;
```

Day la expected dung. Neu thay `subscription_discount_amount = 78000.00`, nghia la subscription da cover tien rental. Coupon phai null/0 trong case nay.

## 22. Test usage logs

Login admin, goi:

```text
GET /v1/admin/coupon-usage-logs?page=1&pageSize=20
GET /v1/admin/coupon-usage-logs?discountAmount=2000
GET /v1/admin/coupon-usage-logs?subscriptionApplied=false
GET /v1/admin/coupon-usage-logs?rentalId=019b17bd-d130-7e7d-be69-91ceef7b9021
```

Response item quan trong:

```json
{
  "rentalId": "019b17bd-d130-7e7d-be69-91ceef7b9021",
  "subscriptionApplied": false,
  "subscriptionDiscountAmount": 0,
  "couponRuleId": "019b17bd-d130-7e7d-be69-91ceef7b7202",
  "couponRuleName": "Ride 2h discount",
  "couponRuleMinRidingMinutes": 120,
  "couponRuleDiscountType": "FIXED_AMOUNT",
  "couponRuleDiscountValue": 2000,
  "couponDiscountAmount": 2000,
  "derivedTier": "TIER_2H_4H"
}
```

Frontend note:

- hien rule name bang `couponRuleName`
- hien tier bang `couponRuleMinRidingMinutes`
- hien discount config bang `couponRuleDiscountValue`
- `derivedTier` chi la field phu, khong dung lam source of truth
- khong suy rule name tu `couponDiscountAmount`

Query pgAdmin doi chieu:

```sql
select
  br.rental_id,
  br.coupon_rule_id,
  br.coupon_rule_snapshot ->> 'name' as snapshot_rule_name,
  br.coupon_rule_snapshot ->> 'minRidingMinutes' as snapshot_min_riding_minutes,
  br.coupon_rule_snapshot ->> 'discountType' as snapshot_discount_type,
  br.coupon_rule_snapshot ->> 'discountValue' as snapshot_discount_value,
  br.coupon_discount_amount,
  br.created_at
from rental_billing_records br
where br.coupon_discount_amount > 0
order by br.created_at desc
limit 20;
```

## 23. Test stats

Login admin, goi all-time:

```text
GET /v1/admin/coupon-stats
```

Expected summary ngay sau seed:

```json
{
  "summary": {
    "totalCompletedRentals": 60,
    "discountedRentalsCount": 44,
    "nonDiscountedRentalsCount": 16,
    "discountRate": 0.7333,
    "totalDiscountAmount": 132000,
    "avgDiscountAmount": 3000
  }
}
```

Expected `statsByRule` co du lieu that:

```json
{
  "statsByRule": [
    {
      "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7203",
      "name": "Ride 4h discount",
      "triggerType": "RIDING_DURATION",
      "minRidingMinutes": 240,
      "minBillableHours": 4,
      "discountType": "FIXED_AMOUNT",
      "discountValue": 4000,
      "appliedCount": 12,
      "totalDiscountAmount": 48000,
      "source": "BILLING_RECORD_SNAPSHOT"
    }
  ],
  "topAppliedRule": {
    "ruleId": "019b17bd-d130-7e7d-be69-91ceef7b7203",
    "name": "Ride 4h discount",
    "minRidingMinutes": 240,
    "discountValue": 4000,
    "appliedCount": 12,
    "inferredFrom": "BILLING_RECORD_SNAPSHOT"
  }
}
```

`statsByDiscountAmount` van giu de hien breakdown phu:

```json
{
  "statsByDiscountAmount": [
    { "discountAmount": 1000, "rentalsCount": 12, "totalDiscountAmount": 12000 },
    { "discountAmount": 2000, "rentalsCount": 12, "totalDiscountAmount": 24000 },
    { "discountAmount": 4000, "rentalsCount": 12, "totalDiscountAmount": 48000 },
    { "discountAmount": 6000, "rentalsCount": 8, "totalDiscountAmount": 48000 }
  ]
}
```

Date range:

```text
GET /v1/admin/coupon-stats?from=2026-04-01&to=2026-04-30
GET /v1/admin/coupon-stats?from=2026-03-01&to=2026-03-31
```

Important:

- stats filter theo `Rental.end_time`
- usage logs filter theo `rental_billing_records.created_at`
- neu chi truyen `from` hoac chi truyen `to`, backend tra `400`
- neu `from > to`, backend tra `400`

## 24. Query active rentals seed

Dung query nay de frontend/debug lay real rental ids sau seed:

```sql
select
  r.id as rental_id,
  u.email,
  r.status,
  r.subscription_id,
  r.start_time,
  ceil(extract(epoch from (now() - r.start_time)) / 60)::int as riding_minutes_now
from "Rental" r
join users u on u.id = r.user_id
where r.status = 'RENTED'
order by u.email;
```

Expected seed pattern:

| Email | Subscription | Riding time luc moi seed | Coupon preview |
| --- | --- | ---: | --- |
| `user01@mebike.local` | yes | ~185 min | no coupon |
| `user02@mebike.local` | no | ~125 min | Ride 2h discount |
| `user03@mebike.local` | yes | ~95 min | no coupon |
| `user04@mebike.local` | no | ~75 min | Ride 1h discount |
| `user05@mebike.local` | yes | ~50 min | no coupon |
| `user06@mebike.local` | no | ~35 min | no coupon |
| `user07@mebike.local` | yes | ~20 min | no coupon |
| `user08@mebike.local` | no | ~10 min | no coupon |

Do preview/finalize dung thoi gian that, cac rental nay se tang riding minutes theo thoi gian.

## 25. Frontend UI/contract notes

Admin coupon rules UI:

- nen hien tier dropdown 4 option
- khong cho nhap free-form `triggerType`
- khong cho nhap free-form `discountType`
- khong bat unique name
- dung `id` lam key trong table/action
- handle `409 COUPON_RULE_ACTIVE_TIER_CONFLICT`
- handle `409 COUPON_RULE_ALREADY_USED`
- voi used rule, UI nen goi y deactivate + create rule moi

Billing preview UI:

- khong co input coupon code
- hien discount neu `bestDiscountRule != null` va `couponDiscountAmount > 0`
- neu `subscriptionApplied = true`, an coupon discount block hoac hien "Subscription applied, coupon not eligible"
- khong tu tinh tier bang `billableHours`
- khong tu tinh total phia client ngoai viec hien lai cac field backend tra ve

Usage logs UI:

- hien `couponRuleName`, `couponRuleMinRidingMinutes`, `couponRuleDiscountValue`
- `derivedTier` chi optional label phu
- filter `discountAmount` la exact amount, khong phai rule id
- `subscriptionApplied=true` chi dung cho anomaly audit, vi business binh thuong coupon khong ap khi subscription

Stats UI:

- primary grouping la `statsByRule`
- `topAppliedRule` phai co data khi co coupon usage sau migration moi
- `statsByDiscountAmount` chi la secondary chart/table
- khong render rule name bang cach map `1000 -> 1h`, vi policy co snapshot

## 26. Checklist test nhanh cho frontend

1. `GET /v1/coupon-rules/active` tra 4 rule active.
2. `POST /v1/admin/coupon-rules` valid inactive tra `201`.
3. `POST /v1/admin/coupon-rules` invalid mapping tra `400`.
4. `POST /v1/admin/coupon-rules` duplicate active tier tra `409 COUPON_RULE_ACTIVE_TIER_CONFLICT`.
5. `PATCH /v1/admin/coupon-rules/{inactiveDuplicateId}/activate` tra `409` neu tier da co active.
6. `PUT /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202` tra `409 COUPON_RULE_ALREADY_USED`.
7. `PATCH /v1/admin/coupon-rules/019b17bd-d130-7e7d-be69-91ceef7b7202/deactivate` tra `200`.
8. Activate lai rule 2h de preview/finalize tiep tuc dung `200`.
9. User02 preview rental `019b17bd-d130-7e7d-be69-91ceef7b9021` co coupon neu duration du tier.
10. User01 preview subscription rental co `bestDiscountRule = null`.
11. Staff1 end user02 rental, pgAdmin thay `coupon_rule_id` va `coupon_rule_snapshot`.
12. `GET /v1/admin/coupon-usage-logs` thay `couponRuleName` tu snapshot.
13. `GET /v1/admin/coupon-stats` thay `statsByRule` va `topAppliedRule`.

## 27. Lenh test backend nen chay

Neu frontend muon nho backend verify lai automated tests:

```bash
cd D:\do_an_3\MeBike\apps\server

pnpm vitest run --config vitest.int.config.ts --mode test src/domain/rentals/services/test/rental-pricing-lifecycle.int.test.ts

pnpm vitest run --config vitest.e2e.config.ts --mode test src/http/test/e2e/admin-coupon-rules-routing.e2e.int.test.ts
pnpm vitest run --config vitest.e2e.config.ts --mode test src/http/test/e2e/admin-coupon-stats-routing.e2e.int.test.ts
pnpm vitest run --config vitest.e2e.config.ts --mode test src/http/test/e2e/admin-coupon-usage-logs-routing.e2e.int.test.ts
pnpm vitest run --config vitest.e2e.config.ts --mode test src/http/test/e2e/coupon-rules-routing.e2e.int.test.ts
pnpm vitest run --config vitest.e2e.config.ts --mode test src/http/test/e2e/rentals-billing-preview-routing.e2e.int.test.ts
```

Neu repo dung script khac, xem `apps/server/package.json` va chay dung script test hien co.
