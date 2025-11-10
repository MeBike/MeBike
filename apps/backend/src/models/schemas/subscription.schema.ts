import { Decimal128, ObjectId } from "mongodb";
import { SubscriptionPackage, SubscriptionStatus } from "~/constants/enums";
import { getLocalTime } from "~/utils/date-time";

type SubscriptionType = {
  _id?: ObjectId;
  user_id: ObjectId;
  package_name: SubscriptionPackage; // e.g., "Tháng cơ bản", "Tháng không giới hạn"
  activated_at?: Date;
  expires_at?: Date;
  max_usages?: number | null; // null = unlimited
  usage_count?: number;
  price: Decimal128;
  status?: SubscriptionStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Subscription {
  _id?: ObjectId;
  user_id: ObjectId;
  package_name: SubscriptionPackage;
  activated_at?: Date;
  expires_at?: Date;
  max_usages?: number;
  usage_count: number;
  price: Decimal128;
  status: SubscriptionStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(sub: SubscriptionType) {
    const now = getLocalTime();
    this._id = sub._id || new ObjectId();
    this.user_id = sub.user_id;
    this.package_name = sub.package_name ?? SubscriptionPackage.BASIC;
    this.activated_at = sub.activated_at ?? undefined;
    this.expires_at = sub.expires_at ?? undefined;
    this.max_usages =
      sub.max_usages === null ? undefined : sub.max_usages ?? undefined
    this.usage_count = sub.usage_count ?? 0;
    this.price = sub.price instanceof Decimal128 ? sub.price : Decimal128.fromString(String(sub.price));
    this.status = sub.status ?? SubscriptionStatus.PENDING;
    this.created_at = sub.created_at || now;
    this.updated_at = sub.updated_at || now;
  }
}