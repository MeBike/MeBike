import type { CommandPublisher } from "../publishers";
import type { StateMachineOptions } from "./state-machine";

import { env } from "../config";
import { DeviceManager } from "./device-manager";
import { StateMachineService } from "./state-machine";

export function createDeviceManager(): DeviceManager {
  return new DeviceManager(env.DEVICE_TTL_MS, env.DEVICE_CLEANUP_INTERVAL_MS);
}

export function createStateMachineService(
  commandPublisher: CommandPublisher,
  options?: StateMachineOptions,
): StateMachineService {
  return new StateMachineService(commandPublisher, options);
}

export { DeviceManager, StateMachineService };
