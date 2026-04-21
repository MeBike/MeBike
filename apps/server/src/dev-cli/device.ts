import type { Buffer } from "node:buffer";

import { SerialPort } from "serialport";

const PROVISIONING_PREFIX = "CFG ";
const DEFAULT_BAUD_RATE = 115200;
const DEFAULT_TIMEOUT_MS = 5000;
const SERIAL_SETTLE_MS = 250;
const KNOWN_USB_SERIAL_VENDOR_IDS = new Set(["0403", "10c4", "1a86", "303a"]);

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

type PortInfo = Awaited<ReturnType<typeof SerialPort.list>>[number];

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

export async function suggestDevicePort() {
  const ports = await SerialPort.list();
  const detection = detectDevicePort(ports);
  return detection.kind === "single" ? detection.port.path : null;
}

export async function resolveDevicePort(portPath?: string) {
  if (portPath) {
    return portPath;
  }

  const ports = await SerialPort.list();
  const detection = detectDevicePort(ports);

  if (detection.kind === "single") {
    return detection.port.path;
  }

  const availablePortsMessage = formatAvailablePortsMessage(ports);
  if (detection.kind === "ambiguous") {
    throw new Error(
      `Multiple likely device ports detected: ${detection.ports.map(port => port.path).join(", ")}. Use --port <serial-port> to choose manually. ${availablePortsMessage}`,
    );
  }

  throw new Error(`Could not auto-detect an ESP32 serial port. Use --port <serial-port> to choose manually. ${availablePortsMessage}`);
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
    const port = new SerialPort({
      path: portPath,
      baudRate: DEFAULT_BAUD_RATE,
      autoOpen: false,
    });

    try {
      await openSerialPort(port);
      port.setEncoding("utf8");
      await sleep(SERIAL_SETTLE_MS);
      const responsePromise = waitForProvisioningResponse(port, requestId, timeoutMs);
      await writeSerialPort(port, request);
      await drainSerialPort(port);
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
      await closeSerialPort(port).catch(() => {});
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

function detectDevicePort(ports: PortInfo[]) {
  const rankedPorts = ports
    .map(port => ({ port, score: scorePort(port) }))
    .filter(candidate => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.port.path.localeCompare(right.port.path));

  if (rankedPorts.length === 0) {
    return { kind: "none" as const };
  }

  const topScore = rankedPorts[0].score;
  const topPorts = rankedPorts.filter(candidate => candidate.score === topScore).map(candidate => candidate.port);
  if (topPorts.length > 1) {
    return { kind: "ambiguous" as const, ports: topPorts };
  }

  return { kind: "single" as const, port: rankedPorts[0].port };
}

function scorePort(port: PortInfo) {
  let score = 0;
  const vendorId = port.vendorId?.toLowerCase();
  const combined = [port.path, port.manufacturer, port.pnpId, port.vendorId, port.productId]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("esp32") || combined.includes("espressif")) {
    score += 100;
  }
  if (vendorId && KNOWN_USB_SERIAL_VENDOR_IDS.has(vendorId)) {
    score += 50;
  }
  if (combined.includes("cp210") || combined.includes("silicon labs")) {
    score += 35;
  }
  if (combined.includes("ch340") || combined.includes("wch")) {
    score += 35;
  }
  if (combined.includes("ftdi")) {
    score += 30;
  }
  if (combined.includes("usb serial") || combined.includes("usb-serial")) {
    score += 20;
  }
  if (port.pnpId?.toLowerCase().includes("usb")) {
    score += 15;
  }
  if (isLikelySerialPath(port.path)) {
    score += 15;
  }

  return score;
}

function isLikelySerialPath(path: string) {
  return /^COM\d+$/i.test(path)
    || /^\/dev\/tty(?:USB|ACM)\d+$/i.test(path)
    || /^\/dev\/tty\.usb(?:serial|modem)/i.test(path);
}

function formatAvailablePortsMessage(ports: PortInfo[]) {
  if (ports.length === 0) {
    return "No serial ports found.";
  }

  return `Available ports: ${ports.map(formatPortSummary).join(", ")}.`;
}

function formatPortSummary(port: PortInfo) {
  const details = [
    port.manufacturer,
    port.vendorId ? `VID:${port.vendorId}` : undefined,
    port.productId ? `PID:${port.productId}` : undefined,
  ].filter(Boolean);

  return details.length > 0 ? `${port.path} (${details.join(", ")})` : port.path;
}

function openSerialPort(port: SerialPort) {
  return new Promise<void>((resolve, reject) => {
    port.open((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function writeSerialPort(port: SerialPort, value: string) {
  return new Promise<void>((resolve, reject) => {
    port.write(value, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function drainSerialPort(port: SerialPort) {
  return new Promise<void>((resolve, reject) => {
    port.drain((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function closeSerialPort(port: SerialPort) {
  if (!port.isOpen) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    port.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.message.includes("Timed out waiting for device response");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
