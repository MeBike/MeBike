import { createLogger } from "react-native-logs";

export const log = createLogger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
});
