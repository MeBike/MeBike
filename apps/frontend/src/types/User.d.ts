export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  email_verify_token: string;
  forgot_verify_token: string;
  verify: number;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  roleid: number;
}
