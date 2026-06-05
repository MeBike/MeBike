import { getMessaging, isSupported } from "firebase/messaging";
import { app } from "./firebase";

export const getFcmMessaging = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};