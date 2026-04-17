import type { DeviceCommand } from "@mebike/shared";
import type { Effect } from "effect";

import { deviceCommandTopic } from "@mebike/shared";

import type { MqttPublishError, MqttService } from "@/infrastructure/mqtt";

/**
 * Dữ liệu đầu vào để publish một command xuống bike qua MQTT.
 */
export type SendDeviceCommandInput = {
  readonly deviceId: string;
  readonly command: DeviceCommand;
};

/**
 * Service chịu trách nhiệm gửi command xuống firmware.
 */
export type DeviceCommandService = {
  readonly sendCommand: (input: SendDeviceCommandInput) => Effect.Effect<void, MqttPublishError>;
  readonly sendUnlock: (input: {
    readonly deviceId: string;
    readonly requestId: string;
    readonly durationMs?: number;
  }) => Effect.Effect<void, MqttPublishError>;
  readonly sendDeny: (input: {
    readonly deviceId: string;
    readonly requestId: string;
    readonly reason: string;
  }) => Effect.Effect<void, MqttPublishError>;
  readonly sendPing: (input: {
    readonly deviceId: string;
    readonly requestId: string;
  }) => Effect.Effect<void, MqttPublishError>;
};

/**
 * Tạo service publish command xuống thiết bị từ MQTT service.
 */
export function makeDeviceCommandService({
  mqtt,
}: {
  readonly mqtt: MqttService;
}): DeviceCommandService {
  const sendCommand = ({ deviceId, command }: SendDeviceCommandInput) =>
    mqtt.publish(deviceCommandTopic(deviceId), JSON.stringify(command));

  return {
    sendCommand,
    sendUnlock: ({ deviceId, requestId, durationMs }) =>
      sendCommand({
        deviceId,
        command: {
          requestId,
          action: "unlock",
          ...(typeof durationMs === "number" ? { durationMs } : {}),
        },
      }),
    sendDeny: ({ deviceId, requestId, reason }) =>
      sendCommand({
        deviceId,
        command: {
          requestId,
          action: "deny",
          reason,
        },
      }),
    sendPing: ({ deviceId, requestId }) =>
      sendCommand({
        deviceId,
        command: {
          requestId,
          action: "ping",
        },
      }),
  };
}
