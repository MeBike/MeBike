export interface PricingPolicy {
  id: string;
  name: string;
  base_rate: number;
  billing_unit_minutes: number;
  reservation_fee: number;
  deposit_required: number;
  late_return_cutoff: string; 
  status: PricingPolicyStatus;
  created_at: string;
  updated_at: string;
}
export type PricingPolicyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED"  
export interface UsageSummary {
  reservation_count: number;
  rental_count: number;
  billing_record_count: number;
  is_used: boolean;
}

export interface PricingPolicyDetail {
  id: string;
  name: string;
  base_rate: number;
  billing_unit_minutes: number;
  reservation_fee: number;
  deposit_required: number;
  late_return_cutoff: string;
  status: PricingPolicyStatus;
  created_at: string;
  updated_at: string;
  usage_summary: UsageSummary;
}
