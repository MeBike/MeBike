import { AccountStatus , VerifyStatus} from "./Customer";
export type AssetStatus = "UNASSIGNED" | "ACTIVE" | "BLOCKED" | "LOST";
export interface AssignedUser {
  id: string;
  fullname: string;
  email: string;
  account_status: AccountStatus;
  verify_status: VerifyStatus;
}
export interface AssetNFCCard {
  id: string;
  uid: string;
  status: AssetStatus;
  assigned_user_id: string;
  assigned_user: AssignedUser;
  issued_at: string;    
  returned_at: string | null;
  blocked_at: string | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
}