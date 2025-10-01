import type { MqttConnection } from "../connection/types";

import { CommandPublisher } from "./commands";

export function createCommandPublisher(connection: MqttConnection): CommandPublisher {
  return new CommandPublisher(connection);
}

export { CommandPublisher };
