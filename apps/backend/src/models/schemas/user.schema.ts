import { ObjectId } from "mongodb";

import { Role, UserVerifyStatus } from "~/constants/enums";

export type SupplierBikeStats = {
  supplier_id: string;
  supplier_name?: string;
  total_bikes: number;
  active_bikes: number;
  booked_bikes: number;
  broken_bikes: number;
  reserve_bikes: number;
  maintain_bikes: number;
  unavailable_bikes: number;
};

type UserType = {
  _id?: ObjectId;
  fullname: string;
  email: string;
  password: string;
  email_verify_token?: string;
  forgot_password_token?: string;
  verify?: UserVerifyStatus;
  location?: string;
  username?: string;
  phone_number?: string;
  avatar?: string;
  role: Role;
  nfc_card_uid?: string;
  created_at?: Date;
  updated_at?: Date;
};

export default class User {
  _id?: ObjectId;
  fullname: string;
  email: string;
  password: string;
  email_verify_token: string;
  forgot_password_token: string;
  verify: UserVerifyStatus;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: Role;
  nfc_card_uid?: string;
  created_at: Date;
  updated_at: Date;

  constructor(user: UserType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = user._id || new ObjectId();
    this.fullname = user.fullname;
    this.email = user.email;
    this.password = user.password;
    this.email_verify_token = user.email_verify_token || "";
    this.forgot_password_token = user.forgot_password_token || "";
    this.verify = user.verify || UserVerifyStatus.Unverified;
    this.location = user.location || "";
    this.username = user.username || "";
    this.phone_number = user.phone_number || "";
    this.avatar = user.avatar || "";
    this.role = user.role || Role.User;
    this.nfc_card_uid = user.nfc_card_uid || "";
    this.created_at = user.created_at || localTime;
    this.updated_at = user.updated_at || localTime;
  }
}
