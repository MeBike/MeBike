export interface Agency {
  id: string;
  name: string;
  address: string | null;
  contactPhone: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: string;
  updatedAt: string;
}
