import { Decimal128, ObjectId } from "mongodb";
import { SubscriptionStatus } from "~/constants/enums";
import { getLocalTime } from "~/utils/date-time";

type SubscriptionType = {
  _id?: ObjectId;
  user_id: ObjectId;
  package_name: string; // e.g., "Tháng cơ bản", "Tháng không giới hạn"
  start_date: Date;
  end_date: Date;
  max_reservations_per_month?: number | null; // null = unlimited
  used_reservations?: number;
  price: Decimal128;
  status?: SubscriptionStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Subscription {
  _id?: ObjectId;
  user_id: ObjectId;
  package_name: string;
  start_date: Date;
  end_date: Date;
  max_reservations_per_month?: number;
  used_reservations: number;
  price: Decimal128;
  status: SubscriptionStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(sub: SubscriptionType) {
    const now = getLocalTime();
    this._id = sub._id || new ObjectId();
    this.user_id = sub.user_id;
    this.package_name = sub.package_name;
    this.start_date = sub.start_date;
    this.end_date = sub.end_date;
    this.max_reservations_per_month =
      sub.max_reservations_per_month === null ? undefined : sub.max_reservations_per_month ?? undefined
    this.used_reservations = sub.used_reservations ?? 0;
    this.price = sub.price instanceof Decimal128 ? sub.price : Decimal128.fromString(String(sub.price));
    this.status = sub.status ?? SubscriptionStatus.ACTIVE;
    this.created_at = sub.created_at || now;
    this.updated_at = sub.updated_at || now;
  }
}