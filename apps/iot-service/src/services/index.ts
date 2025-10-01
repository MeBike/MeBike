import type { CommandPublisher } from "../publishers";
import type { StateMachineOptions } from "./state-machine";

import { DeviceManager } from "./device-manager";
import { StateMachineService } from "./state-machine";

export function createDeviceManager(): DeviceManager {
  return new DeviceManager();
}

export function createStateMachineService(
  commandPublisher: CommandPublisher,
  options?: StateMachineOptions,
): StateMachineService {
  return new StateMachineService(commandPublisher, options);
}

export { DeviceManager, StateMachineService };
