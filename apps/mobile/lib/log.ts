import { logger } from "react-native-logs";

export const log = logger.createLogger({
  severity: __DEV__ ? "debug" : "warn",
});
