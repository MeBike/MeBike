import type {
  IotCommandPayloadByTopic,
  IotCommandTopic,
} from "@mebike/shared";

import { topicWithMac } from "@mebike/shared";

import type { MqttConnection } from "../connection/types";

import logger from "../lib/logger";
import { InfrastructureError } from "../middleware";

export class CommandPublisher {
  constructor(private connection: MqttConnection) {}

  async publishCommand<T extends IotCommandTopic>(
    topic: T,
    payload: IotCommandPayloadByTopic[T],
    mac?: string | null,
  ): Promise<void> {
    const resolvedTopic = topicWithMac(topic, mac);

    try {
      await this.connection.publish(resolvedTopic, payload);
      logger.info({ topic: resolvedTopic, payload }, "command sent");
    }
    catch (error) {
      if (error instanceof InfrastructureError) {
        throw error;
      }

      throw new InfrastructureError("Failed to publish command to device", {
        topic: resolvedTopic,
        payload,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
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

  async sendReservationCommand(command: IotCommandPayloadByTopic["esp/commands/reservation"], mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/reservation", command, mac);
  }

  async sendMaintenanceCommand(command: IotCommandPayloadByTopic["esp/commands/maintenance"], mac?: string | null): Promise<void> {
    await this.publishCommand("esp/commands/maintenance", command, mac);
  }
}
