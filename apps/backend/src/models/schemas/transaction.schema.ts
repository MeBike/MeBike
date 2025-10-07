import type { Decimal128 } from "mongodb";

import { ObjectId } from "mongodb";

import { TransactionStaus, TransactionTypeEnum } from "~/constants/enums";

type TransactionType = {
  _id?: ObjectId;
  wallet_id: ObjectId;
  amount: Decimal128;
  fee: Decimal128;
  description: string;
  transaction_hash: string;
  type: TransactionTypeEnum;
  status: TransactionStaus;
  created_at?: Date;
};

export default class Transaction {
  _id?: ObjectId;
  wallet_id: ObjectId;
  amount: Decimal128;
  fee: Decimal128;
  description: string;
  transaction_hash: string;
  type: TransactionTypeEnum;
  status: TransactionStaus;
  created_at?: Date;

  constructor(transaction: TransactionType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = transaction._id || new ObjectId();
    this.wallet_id = transaction.wallet_id;
    this.amount = transaction.amount;
    this.fee = transaction.fee || 0;
    this.description = transaction.description;
    this.transaction_hash = transaction.transaction_hash;
    this.type = transaction.type || TransactionTypeEnum.PAYMENT;
    this.status = transaction.status || TransactionStaus.Pending;
    this.created_at = transaction.created_at || localTime;
  }
}
