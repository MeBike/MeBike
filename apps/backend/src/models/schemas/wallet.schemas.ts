import { Decimal128, ObjectId } from "mongodb";

import { WalletStatus } from "~/constants/enums";

export type WalletType = {
  _id?: ObjectId;
  user_id: ObjectId;
  balance: Decimal128;
  status: WalletStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Wallet {
  _id?: ObjectId;
  user_id: ObjectId;
  balance: Decimal128;
  status: WalletStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(wallet: WalletType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = wallet._id || new ObjectId();
    this.user_id = wallet.user_id;
    this.balance = Decimal128.fromString(wallet.balance.toString());
    this.status = wallet.status || WalletStatus.Active;
    this.created_at = wallet.created_at || localTime;
    this.updated_at = wallet.updated_at || localTime;
  }
}
