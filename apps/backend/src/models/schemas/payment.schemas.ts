import type { Decimal128 } from "mongodb";

import { ObjectId } from "mongodb";

import { PaymentMethod, PaymentStatus } from "~/constants/enums";

type PaymentType = {
  _id?: ObjectId;
  rental_id: ObjectId;
  user_id: ObjectId;
  amount: Decimal128;
  method?: PaymentMethod;
  status?: PaymentStatus;
  created_at?: Date;
};

export default class Payment {
  _id?: ObjectId;
  rental_id: ObjectId;
  user_id?: ObjectId;
  amount: Decimal128;
  method?: PaymentMethod;
  status?: PaymentStatus;
  created_at?: Date;

  constructor(payment: PaymentType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = payment._id || new ObjectId();
    this.rental_id = payment.rental_id;
    this.user_id = payment.user_id;
    this.amount = payment.amount;
    this.method = payment.method || PaymentMethod.Wallet;
    this.status = payment.status || PaymentStatus.Pending;
    this.created_at = payment.created_at || localTime;
  }
}
