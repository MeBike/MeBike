
export interface Bike {
  id: string;
  qrCode: string;
  batteryLevel: number;
  isAvailable: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type: 'electric' | 'manual';
  pricePerMinute: number;
  stationId?: string;
  positionInStation?: {
    x: number; // Position on 2D map (0-100)
    y: number; // Position on 2D map (0-100)
    slotNumber: number;
  };
}

export interface Station {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availableBikes: number;
  totalSlots: number;
  isActive: boolean;
  bikes: Bike[]; // All bikes at this station
  layout: {
    width: number; // Station layout width
    height: number; // Station layout height
    entrances: Array<{
      x: number;
      y: number;
      type: 'main' | 'secondary';
    }>;
  };
}

export interface RentalSession {
  id: string;
  bikeId: string;
  startTime: Date;
  endTime?: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  duration?: number; // in minutes
  cost?: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentMethods: PaymentMethod[];
  rentalHistory: RentalSession[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  lastFourDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
}
