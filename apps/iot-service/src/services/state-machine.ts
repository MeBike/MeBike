import type { IotStateCommand } from "@mebike/shared";

import type { CommandPublisher } from "../publishers";

import logger from "../lib/logger";

const FALLBACK_SEQUENCE: IotStateCommand[] = [
  "booked",
  "maintained",
  "unavailable",
  "available",
];

export type StateMachineOptions = {
  sequence?: IotStateCommand[];
  stepDelayMs?: number;
  transitionTimeoutMs?: number;
  deviceMac?: string | null;
};

export class StateMachineService {
  private sequence: IotStateCommand[];
  private stepDelayMs: number;
  private transitionTimeoutMs: number;
  private deviceMac: string | null;

  constructor(
    private commandPublisher: CommandPublisher,
    options: StateMachineOptions = {},
  ) {
    this.sequence = options.sequence ?? [...FALLBACK_SEQUENCE];
    this.stepDelayMs = options.stepDelayMs ?? 5000;
    this.transitionTimeoutMs = options.transitionTimeoutMs ?? 10000;
    this.deviceMac = options.deviceMac ?? null;
  }

  async runSequence(): Promise<void> {
    logger.info("Starting state machine sequence...");

    for (const state of this.sequence) {
      logger.info({ state }, "transitioning to state");

      await this.commandPublisher.sendStateCommand(state, this.deviceMac);

      await this.delay(this.stepDelayMs);

      await this.delay(this.transitionTimeoutMs);
    }

    logger.info("State machine sequence completed");
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setSequence(sequence: IotStateCommand[]): void {
    this.sequence = [...sequence];
  }

  getSequence(): IotStateCommand[] {
    return [...this.sequence];
  }
}
