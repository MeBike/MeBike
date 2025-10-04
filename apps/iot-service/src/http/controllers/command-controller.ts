import { IotService, IotTopics } from "@mebike/shared";

import type { CommandPublisher } from "../../publishers";
import type { DeviceManager } from "../../services";

import { BusinessLogicError } from "../../middleware";

type CommandAcceptedResponse = IotService.CommandAcceptedResponse;

const { validateStateTransition, ERROR_CODES } = IotService;
const { normalizeMac, topicWithMac, IOT_COMMAND_TOPICS } = IotTopics;

type Dependencies = {
  commandPublisher: CommandPublisher;
  deviceManager: DeviceManager;
};

type StateCommandValue = IotTopics.IotStateCommand;
type BookingCommandValue = IotTopics.IotBookingCommand;
type ReservationCommandValue = IotTopics.IotReservationCommand;
type MaintenanceCommandValue = IotTopics.IotMaintenanceCommand;
type StatusCommandValue = IotTopics.IotStatusCommand;

type StateCommandInput = {
  deviceId: string;
  state: StateCommandValue;
};

type BookingCommandInput = {
  deviceId: string;
  command: BookingCommandValue;
};

type ReservationCommandInput = {
  deviceId: string;
  command: ReservationCommandValue;
};

type MaintenanceCommandInput = {
  deviceId: string;
  command: MaintenanceCommandValue;
};

type StatusCommandInput = {
  deviceId: string;
  command?: StatusCommandValue;
};

export class CommandController {
  constructor(private readonly deps: Dependencies) {}

  async sendStateCommand(input: StateCommandInput): Promise<CommandAcceptedResponse> {
    const normalizedId = this.normalizeDeviceId(input.deviceId);

    const currentState = this.deps.deviceManager.getDeviceState(normalizedId);
    if (currentState) {
      if (currentState === input.state) {
        this.throwDeviceAlreadyInState(normalizedId, currentState, input.state);
      }

      this.ensureValidTransition(currentState, input.state);
    }

    await this.deps.commandPublisher.sendStateCommand(input.state, normalizedId);

    return this.createAcceptedResponse(
      normalizedId,
      topicWithMac(IOT_COMMAND_TOPICS.state, normalizedId),
      input.state,
    );
  }

  async sendBookingCommand(input: BookingCommandInput): Promise<CommandAcceptedResponse> {
    const normalizedId = this.normalizeDeviceId(input.deviceId);
    const currentState = this.getExistingDeviceState(normalizedId);

    const targetState: StateCommandValue = input.command === "release" ? "available" : "booked";

    if (currentState === targetState) {
      this.throwDeviceAlreadyInState(normalizedId, currentState, targetState);
    }

    this.ensureValidTransition(currentState, targetState);

    await this.deps.commandPublisher.sendBookingCommand(input.command, normalizedId);

    return this.createAcceptedResponse(
      normalizedId,
      topicWithMac(IOT_COMMAND_TOPICS.booking, normalizedId),
      input.command,
    );
  }

  async sendReservationCommand(input: ReservationCommandInput): Promise<CommandAcceptedResponse> {
    const normalizedId = this.normalizeDeviceId(input.deviceId);
    const currentState = this.getExistingDeviceState(normalizedId);

    const targetState: StateCommandValue = input.command === "reserve" ? "reserved" : "available";

    if (currentState === targetState) {
      this.throwDeviceAlreadyInState(normalizedId, currentState, targetState);
    }

    this.ensureValidTransition(currentState, targetState);

    await this.deps.commandPublisher.sendReservationCommand(input.command, normalizedId);

    return this.createAcceptedResponse(
      normalizedId,
      topicWithMac(IOT_COMMAND_TOPICS.reservation, normalizedId),
      input.command,
    );
  }

  async sendMaintenanceCommand(input: MaintenanceCommandInput): Promise<CommandAcceptedResponse> {
    const normalizedId = this.normalizeDeviceId(input.deviceId);
    const currentState = this.getExistingDeviceState(normalizedId);

    const targetState: StateCommandValue = input.command === "start" ? "maintained" : "available";

    if (currentState === targetState) {
      this.throwDeviceAlreadyInState(normalizedId, currentState, targetState);
    }

    this.ensureValidTransition(currentState, targetState);

    await this.deps.commandPublisher.sendMaintenanceCommand(input.command, normalizedId);

    return this.createAcceptedResponse(
      normalizedId,
      topicWithMac(IOT_COMMAND_TOPICS.maintenance, normalizedId),
      input.command,
    );
  }

  async requestStatusCommand(input: StatusCommandInput): Promise<CommandAcceptedResponse> {
    const normalizedId = this.normalizeDeviceId(input.deviceId);
    const command: StatusCommandValue = input.command ?? "request";

    await this.deps.commandPublisher.requestStatus(normalizedId);

    return this.createAcceptedResponse(
      normalizedId,
      topicWithMac(IOT_COMMAND_TOPICS.status, normalizedId),
      command,
    );
  }

  private normalizeDeviceId(deviceId: string): string {
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      throw new BusinessLogicError(
        "Invalid device identifier",
        {
          details: {
            code: "INVALID_DEVICE_IDENTIFIER",
            deviceId,
          },
          status: 400,
        },
      );
    }
    return normalized;
  }

  private getExistingDeviceState(deviceId: string): string {
    const state = this.deps.deviceManager.getDeviceState(deviceId);
    if (!state) {
      throw new BusinessLogicError(
        `Device ${deviceId} not found`,
        {
          details: {
            code: ERROR_CODES.DEVICE_NOT_FOUND,
            deviceId,
          },
          status: 400,
        },
      );
    }
    return state;
  }

  private ensureValidTransition(currentState: string, requestedState: string) {
    const validation = validateStateTransition(currentState, requestedState);
    if (!validation.valid) {
      throw new BusinessLogicError(
        validation.error.message,
        {
          details: {
            code: validation.error.code,
            ...validation.error.details,
          },
          status: 409,
        },
      );
    }
  }

  private throwDeviceAlreadyInState(
    deviceId: string,
    currentState: string,
    requestedState: string,
  ): never {
    throw new BusinessLogicError(
      `Device ${deviceId} is already in state ${currentState}`,
      {
        details: {
          code: ERROR_CODES.DEVICE_ALREADY_IN_STATE,
          deviceId,
          currentState,
          requestedState,
        },
        status: 409,
      },
    );
  }

  private createAcceptedResponse(
    deviceId: string,
    topic: string,
    payload: string,
  ): CommandAcceptedResponse {
    return {
      deviceId,
      topic,
      payload,
    };
  }
}
