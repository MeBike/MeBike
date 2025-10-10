export interface User {
  _id: string;
  fullname:string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  email_verify_token: string;
  forgot_verify_token: string;
  verify: string;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role:"USER" | "STAFF" | "ADMIN";
  created_at: string;
  updated_at: string;
}
