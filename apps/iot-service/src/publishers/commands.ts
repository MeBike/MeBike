import type {
  IotCommandPayloadByTopic,
  IotCommandTopic,
} from "@mebike/shared";

import { topicWithMac } from "@mebike/shared";

import type { MqttConnection } from "../connection/types";

export class CommandPublisher {
  constructor(private connection: MqttConnection) {}

  async publishCommand<T extends IotCommandTopic>(
    topic: T,
    payload: IotCommandPayloadByTopic[T],
    mac?: string | null,
  ): Promise<void> {
    const resolvedTopic = topicWithMac(topic, mac);
    await this.connection.publish(resolvedTopic, payload);

    console.warn(`Command sent to ${resolvedTopic}: ${payload}`);
  }

  async requestStatus(mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/status", "request", mac);
  }

  async sendStateCommand(state: IotCommandPayloadByTopic["esp/commands/state"], mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/state", state, mac);
  }

  async sendBookingCommand(command: IotCommandPayloadByTopic["esp/commands/booking"], mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/booking", command, mac);
  }

  async sendMaintenanceCommand(command: IotCommandPayloadByTopic["esp/commands/maintenance"], mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/maintenance", command, mac);
  }
}
