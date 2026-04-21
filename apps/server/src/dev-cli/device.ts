import type { Buffer } from "node:buffer";

import { execFile } from "node:child_process";
import { open } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PROVISIONING_PREFIX = "CFG ";
const DEFAULT_BAUD_RATE = 115200;
const DEFAULT_TIMEOUT_MS = 5000;
const SERIAL_SETTLE_MS = 250;

export type DeviceConfig = {
  bikeId: string;
  wifiSsid: string;
  wifiPass: string;
  mqttBrokerIP: string;
  mqttPort: number;
  mqttUsername: string;
  mqttPassword: string;
};

type ProvisioningResponse = {
  ok: boolean;
  type?: string;
  error?: string;
  message?: string;
  requestId?: string;
  bikeId?: string;
  wifiSsid?: string;
  wifiPass?: string;
  mqttBrokerIP?: string;
  mqttPort?: number;
  mqttUsername?: string;
  mqttPassword?: string;
};

export async function getDeviceConfig(portPath: string) {
  const response = await sendProvisioningCommand(portPath, { type: "get-config" });
  return {
    bikeId: response.bikeId ?? "",
    wifiSsid: response.wifiSsid ?? "",
    wifiPass: response.wifiPass ?? "",
    mqttBrokerIP: response.mqttBrokerIP ?? "",
    mqttPort: response.mqttPort ?? 0,
    mqttUsername: response.mqttUsername ?? "",
    mqttPassword: response.mqttPassword ?? "",
  } satisfies DeviceConfig;
}

export async function setDeviceConfig(portPath: string, updates: Partial<DeviceConfig>) {
  await sendProvisioningCommand(portPath, {
    type: "set-config",
    ...updates,
  }, 8000);
}

export async function restartDevice(portPath: string) {
  await sendProvisioningCommand(portPath, { type: "restart" }, 8000);
}

async function sendProvisioningCommand(
  portPath: string,
  payload: Record<string, string | number | undefined>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const request = `${PROVISIONING_PREFIX}${JSON.stringify({ ...payload, requestId })}\n`;

    await execFileAsync("stty", ["-F", portPath, String(DEFAULT_BAUD_RATE), "raw", "-echo", "-icanon", "min", "0", "time", "5"]);

    const handle = await open(portPath, "r+");
    const stream = handle.createReadStream({ encoding: "utf8" });

    try {
      await sleep(SERIAL_SETTLE_MS);
      const responsePromise = waitForProvisioningResponse(stream, requestId, timeoutMs);
      await handle.writeFile(request, { encoding: "utf8" });
      const response = await responsePromise;
      if (!response.ok) {
        throw new Error(response.message ?? response.error ?? "device rejected request");
      }
      return response;
    }
    catch (error) {
      lastError = error;
      if (!isTimeoutError(error) || attempt === 2) {
        throw error;
      }
      await sleep(750);
    }
    finally {
      stream.destroy();
      await handle.close();
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function waitForProvisioningResponse(stream: NodeJS.ReadableStream, requestId: string, timeoutMs: number) {
  return new Promise<ProvisioningResponse>((resolve, reject) => {
    let buffer = "";
    let cleanup = () => {};

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for device response on serial port for request ${requestId}`));
    }, timeoutMs);

    const onData = (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith(PROVISIONING_PREFIX)) {
          continue;
        }

        let parsed: ProvisioningResponse;
        try {
          parsed = JSON.parse(line.slice(PROVISIONING_PREFIX.length)) as ProvisioningResponse;
        }
        catch {
          continue;
        }

        if (parsed.requestId !== requestId) {
          continue;
        }

        cleanup();
        resolve(parsed);
        return;
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    cleanup = () => {
      clearTimeout(timeout);
      stream.off("data", onData);
      stream.off("error", onError);
    };

    stream.on("data", onData);
    stream.on("error", onError);
  });
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.message.includes("Timed out waiting for device response");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
