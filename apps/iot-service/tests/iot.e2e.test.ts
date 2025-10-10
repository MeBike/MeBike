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
import { z } from "zod";

import type { MqttConnection } from "../src/connection/types";

import { env } from "../src/config";
import { eventBus, EVENTS } from "../src/events";
import { createHttpApp } from "../src/http";
import { CommandPublisher } from "../src/publishers";
import { createDeviceManager } from "../src/services";

const runtimeModeSchema = z.object({
  REAL_HTTP: z.enum(["0", "1"]).default("0"),
  TEST_DEVICE_ID: z.string().optional(),
});

const runtimeEnv = runtimeModeSchema.parse({
  REAL_HTTP: process.env.REAL_HTTP,
  TEST_DEVICE_ID: process.env.TEST_DEVICE_ID,
});

const isRealHttp = runtimeEnv.REAL_HTTP === "1";

const inMemoryDeviceManager = !isRealHttp ? createDeviceManager() : undefined;
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

const inMemoryApp = !isRealHttp
  ? createHttpApp({
      commandPublisher: new CommandPublisher(mqttConnectionStub),
      deviceManager: inMemoryDeviceManager!,
    })
  : null;

function emitStatus(deviceId: string, status: string) {
  if (isRealHttp) {
    return;
  }

  eventBus.emit(EVENTS.DEVICE_STATUS_CHANGED, {
    deviceId,
    status,
    timestamp: new Date(),
  });
}

const defaultRawDeviceId = "aa:bb:cc:dd:ee:ff";
const envProvidedDeviceId = runtimeEnv.TEST_DEVICE_ID ?? env.DEVICE_MAC ?? undefined;
const rawDeviceId = isRealHttp
  ? envProvidedDeviceId ?? defaultRawDeviceId
  : defaultRawDeviceId;
const normalizedDeviceId = normalizeMac(rawDeviceId);

if (!normalizedDeviceId) {
  throw new Error(`Unable to normalize device identifier "${rawDeviceId}"`);
}

async function waitForStatus(expectedStatus: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await getV1DevicesDeviceId(rawDeviceId);
    if (response.status === 200 && response.data.status === expectedStatus) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for status "${expectedStatus}"`);
}

const hardwarePauseMs = (() => {
  const parsed = Number.parseInt(env.STATE_STEP_DELAY_MS, 10);
  if (Number.isNaN(parsed)) {
    return 2000;
  }
  return Math.max(parsed, 1000);
})();

async function pauseBetweenTransitions(label: string): Promise<void> {
  if (!isRealHttp) {
    return;
  }

  console.info(`[iot-service:test] waiting ${hardwarePauseMs}ms after ${label}`);
  await new Promise(resolve => setTimeout(resolve, hardwarePauseMs));
}

describe("IoT service HTTP contract", () => {
  let originalFetch: typeof global.fetch | undefined;
  let previousBaseUrl: string | undefined;
  let warnSpy: jest.SpyInstance;

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
        return inMemoryApp!.fetch(request);
      };
    }
    else {
      if (!envProvidedDeviceId) {
        throw new Error("REAL_HTTP=1 requires TEST_DEVICE_ID or DEVICE_MAC to be set.");
      }
      if (!process.env.IOT_SERVICE_BASE_URL) {
        process.env.IOT_SERVICE_BASE_URL = "http://localhost:3000";
      }
    }

    console.info(
      `[iot-service:test] Mode=${useInMemoryServer ? "in-memory" : "real-http"} baseUrl=${process.env.IOT_SERVICE_BASE_URL} device=${normalizedDeviceId}`,
    );
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
    if (isRealHttp) {
      const deviceResponse = await getV1DevicesDeviceId(rawDeviceId);
      if (deviceResponse.status !== 200) {
        throw new Error(`Expected device ${rawDeviceId} to exist, received status ${deviceResponse.status}`);
      }

      expect(deviceResponse.data.deviceId).toBe(normalizedDeviceId);
    }
    else {
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
    }
  });

  test("sequential workflow commands enforce state transitions", async () => {
    commandLog.length = 0;

    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "available");
    }
    else {
      await postV1DevicesDeviceIdCommandsStatus(rawDeviceId, { command: "request" });
      await waitForStatus("available", 15_000);
      await pauseBetweenTransitions("status -> available");
    }

    const deviceResponse = await getV1DevicesDeviceId(rawDeviceId);
    if (deviceResponse.status !== 200) {
      throw new Error(`Expected device details, received status ${deviceResponse.status}`);
    }
    expect(deviceResponse.data.deviceId).toBe(normalizedDeviceId);

    const reserveResponse = await postV1DevicesDeviceIdCommandsReservation(rawDeviceId, { command: "reserve" });
    expect(reserveResponse.status).toBe(202);
    expect(reserveResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.reservation}/${normalizedDeviceId}`,
      payload: "reserve",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "reserved");
    }
    else {
      await waitForStatus("reserved", 15_000);
      await pauseBetweenTransitions("reserve");
    }

    const claimResponse = await postV1DevicesDeviceIdCommandsBooking(rawDeviceId, { command: "claim" });
    expect(claimResponse.status).toBe(202);
    expect(claimResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
      payload: "claim",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "booked");
    }
    else {
      await waitForStatus("booked", 15_000);
      await pauseBetweenTransitions("claim");
    }

    const releaseResponse = await postV1DevicesDeviceIdCommandsBooking(rawDeviceId, { command: "release" });
    expect(releaseResponse.status).toBe(202);
    expect(releaseResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.booking}/${normalizedDeviceId}`,
      payload: "release",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "available");
    }
    else {
      await waitForStatus("available", 15_000);
      await pauseBetweenTransitions("release");
    }

    const maintenanceStartResponse = await postV1DevicesDeviceIdCommandsMaintenance(rawDeviceId, { command: "start" });
    expect(maintenanceStartResponse.status).toBe(202);
    expect(maintenanceStartResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
      payload: "start",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "maintained");
    }
    else {
      await waitForStatus("maintained", 15_000);
      await pauseBetweenTransitions("maintenance start");
    }

    const maintenanceCompleteResponse = await postV1DevicesDeviceIdCommandsMaintenance(rawDeviceId, { command: "complete" });
    expect(maintenanceCompleteResponse.status).toBe(202);
    expect(maintenanceCompleteResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.maintenance}/${normalizedDeviceId}`,
      payload: "complete",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "available");
    }
    else {
      await waitForStatus("available", 15_000);
      await pauseBetweenTransitions("maintenance complete");
    }

    const directStateResponse = await postV1DevicesDeviceIdCommandsState(rawDeviceId, { state: "broken" });
    expect(directStateResponse.status).toBe(202);
    expect(directStateResponse.data).toEqual({
      deviceId: normalizedDeviceId,
      topic: `${IOT_COMMAND_TOPICS.state}/${normalizedDeviceId}`,
      payload: "broken",
    });
    if (!isRealHttp) {
      emitStatus(normalizedDeviceId, "broken");
    }
    else {
      await waitForStatus("broken", 15_000);
      await pauseBetweenTransitions("state -> broken");
    }

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

    if (!isRealHttp) {
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
    }
  });
});
