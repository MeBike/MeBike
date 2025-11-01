import { ObjectId } from "mongodb";
import { SosAlertStatus } from "~/constants/enums";
import { getLocalTime } from "~/utils/date-time";

type LocationType = {
  type: 'Point';
  coordinates: [number, number];
};

type SosAlertType = {
  _id?: ObjectId;
  rental_id: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  issue: string;
  location: LocationType;
  status: SosAlertStatus;
  sos_agent_id?: ObjectId;
  resolved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
};

export default class SosAlert {
  _id?: ObjectId;
  rental_id: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  issue: string;
  location: LocationType;
  status: SosAlertStatus;
  sos_agent_id?: ObjectId;
  resolved_at?: Date;
  created_at?: Date;
  updated_at?: Date;

  constructor(alert: SosAlertType) {
    const now = getLocalTime();

    this._id = alert._id ?? new ObjectId();
    this.rental_id = alert.rental_id;
    this.user_id = alert.user_id;
    this.bike_id = alert.bike_id;
    this.issue = alert.issue;
    this.location = {
      type: 'Point',
      coordinates: alert.location.coordinates ?? [0, 0],
    };
    this.status = alert.status ?? SosAlertStatus.PENDING;
    this.sos_agent_id = alert.sos_agent_id ?? undefined;
    this.resolved_at = alert.resolved_at ?? undefined;
    this.created_at = alert.created_at ?? now;
    this.updated_at = alert.updated_at ?? now;
  }
}