export const EVENTS = {
  DEVICE_STATUS_CHANGED: "device:status:changed",
  BOOKING_STATUS_UPDATED: "booking:status:updated",
  MAINTENANCE_STATUS_UPDATED: "maintenance:status:updated",
  LOG_RECEIVED: "log:received",
  CONNECTION_ESTABLISHED: "connection:established",
  CONNECTION_ERROR: "connection:error",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

export type EventData = {
  [EVENTS.DEVICE_STATUS_CHANGED]: {
    deviceId?: string;
    status: string;
    timestamp: Date;
  };
  [EVENTS.BOOKING_STATUS_UPDATED]: {
    deviceId?: string;
    status: string;
    timestamp: Date;
  };
  [EVENTS.MAINTENANCE_STATUS_UPDATED]: {
    deviceId?: string;
    status: string;
    timestamp: Date;
  };
  [EVENTS.LOG_RECEIVED]: {
    deviceId?: string;
    message: string;
    timestamp: Date;
  };
  [EVENTS.CONNECTION_ESTABLISHED]: {
    brokerUrl: string;
    timestamp: Date;
  };
  [EVENTS.CONNECTION_ERROR]: {
    error: Error;
    timestamp: Date;
  };
};

export type EventHandler<T extends EventType> = (data: EventData[T]) => void;
