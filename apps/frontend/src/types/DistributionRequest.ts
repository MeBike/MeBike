export type RedistributionRequestStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "IN_TRANSIT"
| "PARTIALLY_COMPLETED";
export type RedistributionRequest = {
  id: string;
  reason: string;
  requestedQuantity: number;
  status: RedistributionRequestStatus;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedat: string;
  requestedByUser: {
    id: string;
    fullName: string;
  };
  approvedByUser: {
    id: string;
    fullName: string;
  };
  sourceStation: {
    id: string;
    name: string;
  };
  targetStation: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    bikeId: string;
    deliveredAt: string;
  }[];
};
export type RedistributionRequestDetail = {
  id: string;
  reason: string;
  requestedQuantity: number;
  status: RedistributionRequestStatus;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedat: string;
  requestedByUser: User;
  approvedByUser?: User;
  sourceStation: Station;
  targetStation: Station;
  items: Item[];
};
type User = {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  role: string;
};
type Station = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalCapacity: number;
};
type Item = {
  id: string;
  bike: {
    id: string;
    chipId: string;
    status: string;
  };
  deliveredAt: string;
};
// --- Sub-Interfaces ---

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  verify: 'VERIFIED' | 'UNVERIFIED';
  location: string | null;
  username: string;
  phoneNumber: string | null;
  avatar: string | null;
  role: 'USER' | 'ADMIN' | 'STAFF'; // Thêm các role có thể có của bạn
  nfcCardUid: string | null;
  updatedAt: string;
}

interface LocationGeo {
  type: 'Point';
  coordinates: number[];
}

interface StationDetail {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalCapacity: number;
  updatedAt: string;
  locationGeo: LocationGeo;
}

interface BikeDetail {
  id: string;
  chipId: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'LOST'; // Enum tùy hệ thống của bạn
  supplierId: string;
  updatedAt: string;
}

interface RedistributionItem {
  id: string;
  redistributionRequestId: string;
  bike: BikeDetail; // Ở đây JSON trả về object bike thay vì chỉ bikeId
  deliveredAt: string | null;
  createdAt: string;
}

// --- Main Interface ---

export interface RedistributionRequestDetailForApprove {
  id: string;
  reason: string | null;
  requestedQuantity: number;
  status: 
    | 'PENDING_APPROVAL' 
    | 'APPROVED' 
    | 'REJECTED' 
    | 'IN_TRANSIT' 
    | 'PARTIALLY_COMPLETED' 
    | 'COMPLETED' 
    | 'CANCELLED';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedat: string; // Giữ nguyên chữ 'a' thường theo JSON của bạn
  requestedByUser: UserProfile;
  approvedByUser: UserProfile | null; // Có thể null nếu chưa được duyệt
  sourceStation: StationDetail;
  targetStation: StationDetail;
  items: RedistributionItem[];
}