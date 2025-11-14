import { Role, SosAlertStatus } from "~/constants/enums";
import SosAlert from "~/models/schemas/sos-alert.schema";
import User from "~/models/schemas/user.schema";

export function canAccessSosByRole(user: User, sos: SosAlert): boolean {
  // User & Staff được xem toàn bộ status (để tracking)
  if (user.role === Role.Staff) {
    return true;
  }

  // User rules
  if(user.role === Role.User){
    if(!user._id?.equals(sos.requester_id)){
        return false
    }
    return true
  }

  // SOS Agent rules
  if (user.role === Role.Sos) {
    const forbiddenStatuses = [
      SosAlertStatus.PENDING,
      SosAlertStatus.CANCELLED
    ];

    // SOS agent chỉ được xem các request được assign, không được xem PENDING hoặc CANCELLED requests
    if (!sos.sos_agent_id || !user._id?.equals(sos.sos_agent_id) || forbiddenStatuses.includes(sos.status)) {
      return false;
    }
    return true;
  }

  return false;
}

export function canCancelSosByRole(user: User, sos: SosAlert): boolean {
  if (user.role === Role.Staff) {
    return true;
  }

  if(user.role === Role.User){
    if(!user._id?.equals(sos.requester_id)){
        return false
    }
    return true
  }

  return false;
}