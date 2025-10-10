import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { IOT_COMMAND_TOPICS, normalizeMac } from "@mebike/shared";
import {
  getV1Devices,
  getV1DevicesDeviceId,
  getV1Health,
  postV1DevicesDeviceIdCommandsBooking,
  postV1DevicesDeviceIdCommandsMaintenance,
  postV1DevicesDeviceIdCommandsReservation,
  postV1DevicesDeviceIdCommandsState,
  postV1DevicesDeviceIdCommandsStatus,
} from "@mebike/shared/sdk/iot-service/client";

import type { MqttConnection } from "../src/connection/types";

import { eventBus, EVENTS } from "../src/events";
import { createHttpApp } from "../src/http";
import { CommandPublisher } from "../src/publishers";
import { createDeviceManager } from "../src/services";

const deviceManager = createDeviceManager();
const commandLog: Array<{ topic: string; payload: string }> = [];

const mqttConnectionStub: MqttConnection = {
  client: {} as any,
  async connect() {},
  async disconnect() {},
  async subscribe() {},
  async publish(topic, message) {
    commandLog.push({
      topic,
      payload: typeof message === "string" ? message : message.toString(),
    });
  },
  onMessage() {},
  onError() {},
  onConnect() {},
};

const commandPublisher = new CommandPublisher(mqttConnectionStub);

const app = createHttpApp({
  commandPublisher,
  deviceManager,
});

function emitStatus(deviceId: string, status: string) {
  eventBus.emit(EVENTS.DEVICE_STATUS_CHANGED, {
    deviceId,
    status,
    timestamp: new Date(),
  });
}

describe("IoT service HTTP contract", () => {
  let originalFetch: typeof global.fetch | undefined;
  let previousBaseUrl: string | undefined;
  let warnSpy: jest.SpyInstance;
  const rawDeviceId = "aa:bb:cc:dd:ee:ff";
  const normalizedDeviceId = normalizeMac(rawDeviceId) ?? "AABBCCDDEEFF";

  beforeAll(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    previousBaseUrl = process.env.IOT_SERVICE_BASE_URL;

    const useInMemoryServer = process.env.REAL_HTTP !== "1";

    if (useInMemoryServer) {
      process.env.IOT_SERVICE_BASE_URL = "http://iot-service.test";
      originalFetch = global.fetch;
      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request
          ? input
          : new Request(
            input instanceof URL ? input : String(input),
            init,
          );
        return app.fetch(request);
      };
    }
    else if (!process.env.IOT_SERVICE_BASE_URL) {
      process.env.IOT_SERVICE_BASE_URL = "http://localhost:3000";
    }
  });

  afterAll(() => {
    warnSpy.mockRestore();
    process.env.IOT_SERVICE_BASE_URL = previousBaseUrl;
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    eventBus.removeAllListeners();
  });

  test("health endpoint returns current uptime", async () => {
    const response = await getV1Health();
    if (response.status !== 200) {
      throw new Error(`Expected health status 200, received ${response.status}`);
    }

    expect(response.data.status).toBe("ok");
    expect(response.data.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof response.data.timestamp).toBe("string");
  });

  test("device listing and lookup reflect manager state", async () => {
    const initialList = await getV1Devices();
    if (initialList.status !== 200) {
      throw new Error(`Expected initial device list 200, received ${initialList.status}`);
    }
    expect(initialList.data.items).toEqual([]);

    const missingDevice = await getV1DevicesDeviceId("11:22:33:44:55:66");
    expect(missingDevice.status).toBe(404);
    expect(missingDevice.data.error).toBe("Device not found");

    emitStatus(normalizedDeviceId, "available");

    const updatedList = await getV1Devices();
    expect(updatedList.status).toBe(200);
    expect(updatedList.data.items).toEqual([
      { deviceId: normalizedDeviceId, status: "available" },
    ]);
  });

  test("sequential workflow commands enforce state transitions", async () => {
    commandLog.length = 0;

    const deviceResponse = await getV1DevicesDeviceId(rawDeviceId);
    if (deviceResponse.status !== 200) {
      throw new Error(`Expected device details, received status ${deviceResponse.status}`);
    }
    expect(deviceResponse.data.deviceId).toBe(normalizedDeviceId);
    expect(deviceResponse.data.status).toBe("available");

    const reserveResponse = await postV1DevicesDeviceIdCommandsReservation(rawDeviceId, { command: "reserve" });
    expect(reserveResponse.status).toBe(202);
    expect(reserveResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.reservation}/${normalizedDeviceId}`,
      payload: "reserve",
    });
    emitStatus(normalizedDeviceId, "reserved");

    const claimResponse = await postV1DevicesDeviceIdCommandsBooking(rawDeviceId, { command: "claim" });
    expect(claimResponse.status).toBe(202);
    expect(claimResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
      payload: "claim",
    });
    emitStatus(normalizedDeviceId, "booked");

    const releaseResponse = await postV1DevicesDeviceIdCommandsBooking(rawDeviceId, { command: "release" });
    expect(releaseResponse.status).toBe(202);
    expect(releaseResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
      payload: "release",
    });
    emitStatus(normalizedDeviceId, "available");

    const maintenanceStartResponse = await postV1DevicesDeviceIdCommandsMaintenance(rawDeviceId, { command: "start" });
    expect(maintenanceStartResponse.status).toBe(202);
    expect(maintenanceStartResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
      payload: "start",
    });
    emitStatus(normalizedDeviceId, "maintained");

    const maintenanceCompleteResponse = await postV1DevicesDeviceIdCommandsMaintenance(rawDeviceId, { command: "complete" });
    expect(maintenanceCompleteResponse.status).toBe(202);
    expect(maintenanceCompleteResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
      payload: "complete",
    });
    emitStatus(normalizedDeviceId, "available");

    const directStateResponse = await postV1DevicesDeviceIdCommandsState(rawDeviceId, { state: "broken" });
    expect(directStateResponse.status).toBe(202);
    expect(directStateResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.state}/${normalizedDeviceId}`,
      payload: "broken",
    });
    emitStatus(normalizedDeviceId, "broken");

    const invalidReservation = await postV1DevicesDeviceIdCommandsReservation(rawDeviceId, { command: "cancel" });
    expect(invalidReservation.status).toBe(409);
    expect(invalidReservation.data.error).toBe("Cannot transition from broken to available");

    const statusRequestResponse = await postV1DevicesDeviceIdCommandsStatus(rawDeviceId, { command: "request" });
    expect(statusRequestResponse.status).toBe(202);
    expect(statusRequestResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.status}/${normalizedDeviceId}`,
      payload: "request",
    });

    expect(commandLog).toEqual([
      {
        topic: `${IOT_COMMAND_TOPICS.reservation}/${normalizedDeviceId}`,
        payload: "reserve",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
        payload: "claim",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
        payload: "release",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
        payload: "start",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
        payload: "complete",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.state}/${normalizedDeviceId}`,
        payload: "broken",
      },
      {
        topic: `${IOT_COMMAND_TOPICS.status}/${normalizedDeviceId}`,
        payload: "request",
      },
    ]);
  });
});
