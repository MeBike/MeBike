/* eslint-disable node/prefer-global/process, node/prefer-global/buffer */
import type {
  IotCommandPayloadByTopic,
  IotCommandTopic,
  IotStateCommand,
} from "@mebike/shared";
import type { IClientSubscribeOptions, MqttClient } from "mqtt";

import {
  IOT_COMMAND_TOPICS,
  IOT_PUBLISH_TOPICS,
  IOT_STATE_LABELS,
  IotStateCommandSchema,
  IotStatusMessageSchema,
  stateIndexToLabel,
  topicWithMac,
} from "@mebike/shared";
import mqtt from "mqtt";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../config";
import defaultLogger from "../lib/logger";

const FALLBACK_SEQUENCE: IotStateCommand[] = [
  "booked",
  "maintained",
  "unavailable",
  "available",
];

const brokerUrlFromEnv = env.MQTT_URL;
const usernameFromEnv = env.MQTT_USERNAME;
const passwordFromEnv = env.MQTT_PASSWORD;
const deviceMacFromEnv = env.DEVICE_MAC || null;
const stepDelayMsFromEnv = Number.parseInt(env.STATE_STEP_DELAY_MS, 10);
const transitionTimeoutMsFromEnv = Number.parseInt(env.STATE_TIMEOUT_MS, 10);

const sequenceInput = env.STATE_SEQUENCE;
const plannedSequenceFromEnv: IotStateCommand[] = sequenceInput
  ? parseSequence(sequenceInput)
  : [...FALLBACK_SEQUENCE];

export type RunnerLogger = Pick<typeof defaultLogger, "warn" | "error">;

export type StateMachineRunOptions = {
  brokerUrl?: string;
  username?: string;
  password?: string;
  deviceMac?: string | null;
  stepDelayMs?: number;
  transitionTimeoutMs?: number;
  plannedSequence?: IotStateCommand[];
  handleSignals?: boolean;
  client?: MqttClient;
  createClient?: () => MqttClient;
  logger?: RunnerLogger;
};

export async function runStateMachineSequence(
  overrides: StateMachineRunOptions = {},
) {
  const options = {
    brokerUrl: overrides.brokerUrl ?? brokerUrlFromEnv,
    username: overrides.username ?? usernameFromEnv,
    password: overrides.password ?? passwordFromEnv,
    deviceMac: overrides.deviceMac ?? deviceMacFromEnv,
    stepDelayMs: overrides.stepDelayMs ?? stepDelayMsFromEnv,
    transitionTimeoutMs:
      overrides.transitionTimeoutMs ?? transitionTimeoutMsFromEnv,
    plannedSequence: overrides.plannedSequence ?? plannedSequenceFromEnv,
    handleSignals: overrides.handleSignals ?? true,
  } satisfies {
    brokerUrl: string;
    username?: string;
    password?: string;
    deviceMac: string | null;
    stepDelayMs: number;
    transitionTimeoutMs: number;
    plannedSequence: IotStateCommand[];
    handleSignals: boolean;
  };

  const logger: RunnerLogger = overrides.logger ?? defaultLogger;

  const providedClient = overrides.client;
  const client
    = providedClient ?? (overrides.createClient?.() ?? createClient(options.brokerUrl, options.username, options.password));
  const shouldCloseClient = !providedClient;

  const errorHandler = (err: Error) => {
    logger.error({ err }, "MQTT error");
  };
  client.on("error", errorHandler);

  const detachSigint = options.handleSignals
    ? attachSigintHandler(client, logger)
    : undefined;

  try {
    await once(client, "connect");
    logger.warn(`Connected to MQTT broker at ${options.brokerUrl}`);

    await subscribe(client, [
      IOT_PUBLISH_TOPICS.status,
      `${IOT_PUBLISH_TOPICS.status}/#`,
      ...(options.deviceMac
        ? [topicWithMac(IOT_PUBLISH_TOPICS.status, options.deviceMac)]
        : []),
    ]);

    logger.warn("Subscribed to status topics");

    await publishCommand(
      client,
      options.deviceMac,
      IOT_COMMAND_TOPICS.status,
      "request",
    );
    logger.warn("Requested current state");

    const initialState = await waitForAnyState(
      client,
      "Initial state",
      10000,
    ).catch(() => null);
    logger.warn(
      initialState
        ? `Initial state reported as ${initialState}`
        : "Initial state could not be determined",
    );

    let currentState = initialState;
    const sequence = buildSequence(currentState, options.plannedSequence);
    logger.warn(`Planned transitions: ${sequence.join(" -> ") || "(none)"}`);

    for (const targetState of sequence) {
      const nextState = await driveToState(
        client,
        options.deviceMac,
        targetState,
        options.transitionTimeoutMs,
        logger,
      );
      currentState = nextState;
      await delay(options.stepDelayMs);
    }

    logger.warn("Sequence complete");
    return currentState ?? null;
  }
  catch (error) {
    logger.error({ err: error }, "Sequence failed");
    throw error;
  }
  finally {
    detachSigint?.();
    client.removeListener("error", errorHandler);
    if (shouldCloseClient) {
      client.end();
    }
  }
}

function createClient(url: string, username?: string, password?: string) {
  return mqtt.connect(url, {
    username,
    password,
  });
}

function attachSigintHandler(client: MqttClient, logger: RunnerLogger) {
  const handler = () => {
    logger.warn("Received SIGINT, closing connection...");
    client.end(true, {}, () => {
      process.exit(0);
    });
  };

  process.on("SIGINT", handler);
  return () => {
    process.off("SIGINT", handler);
  };
}

async function driveToState(
  client: MqttClient,
  deviceMac: string | null,
  targetState: IotStateCommand,
  transitionTimeoutMs: number,
  logger: RunnerLogger,
) {
  logger.warn(`→ Commanding state: ${targetState}`);
  const awaited = waitForSpecificState(
    client,
    targetState,
    transitionTimeoutMs,
  );
  await publishCommand(client, deviceMac, IOT_COMMAND_TOPICS.state, targetState);
  const reached = await awaited;
  logger.warn(`← Reached state: ${reached}`);
  return reached;
}

export function parseSequence(input: string): IotStateCommand[] {
  const entries = input
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  return entries.map(value => IotStateCommandSchema.parse(value));
}

async function publishCommand<T extends IotCommandTopic>(
  client: MqttClient,
  deviceMac: string | null,
  topic: T,
  payload: IotCommandPayloadByTopic[T],
) {
  const resolvedTopic = topicWithMac(topic, deviceMac);
  await new Promise<void>((resolve, reject) => {
    client.publish(resolvedTopic, payload, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function waitForSpecificState(
  client: MqttClient,
  target: IotStateCommand,
  timeoutMs: number,
) {
  return waitForState(
    client,
    state => (state === target ? state : null),
    timeoutMs,
    `state ${target}`,
  );
}

function waitForAnyState(
  client: MqttClient,
  label: string,
  timeoutMs: number,
) {
  return waitForState(client, state => state, timeoutMs, label);
}

function waitForState(
  client: MqttClient,
  predicate: (state: IotStateCommand) => IotStateCommand | null,
  timeoutMs: number,
  label: string,
) {
  return new Promise<IotStateCommand | null>((resolve, reject) => {
    let timer: NodeJS.Timeout;
    let handler: (topic: string, buffer: Buffer) => void;

    const cleanup = () => {
      clearTimeout(timer);
      client.removeListener("message", handler);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for ${label}`));
    }, timeoutMs);

    handler = (topic: string, buffer: Buffer) => {
      if (!matchesTopic(topic, IOT_PUBLISH_TOPICS.status)) {
        return;
      }

      const interpreted = interpretStatus(buffer.toString());
      if (!interpreted) {
        return;
      }

      const result = predicate(interpreted as IotStateCommand);
      if (!result) {
        return;
      }

      cleanup();
      resolve(result);
    };

    client.on("message", handler);
  });
}

export function interpretStatus(message: string): IotStateCommand | null {
  const trimmed = message.trim();
  const parsed = IotStatusMessageSchema.safeParse(trimmed);
  if (!parsed.success) {
    return null;
  }

  if (IOT_STATE_LABELS.includes(parsed.data as IotStateCommand)) {
    return parsed.data as IotStateCommand;
  }

  if (trimmed.startsWith("State changed to ")) {
    const index = Number.parseInt(trimmed.replace("State changed to ", ""), 10);
    return stateIndexToLabel(index);
  }

  if (trimmed.startsWith("Current state: ")) {
    const index = Number.parseInt(trimmed.replace("Current state: ", ""), 10);
    return stateIndexToLabel(index);
  }

  return null;
}

export function buildSequence(
  initial: IotStateCommand | null,
  planned: IotStateCommand[],
) {
  if (!planned.length) {
    return [];
  }

  const result: IotStateCommand[] = [];
  let last = initial;

  for (const state of planned) {
    if (state === last) {
      continue;
    }
    result.push(state);
    last = state;
  }

  return result;
}

export function matchesTopic(incoming: string, baseTopic: string) {
  return incoming === baseTopic || incoming.startsWith(`${baseTopic}/`);
}

function subscribe(
  mqttClient: MqttClient,
  topics: string[],
  options?: IClientSubscribeOptions,
) {
  const uniqueTopics = Array.from(new Set(topics));
  return new Promise<void>((resolve, reject) => {
    mqttClient.subscribe(uniqueTopics, options ?? {}, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function once(emitter: MqttClient, eventName: "connect") {
  return new Promise<void>((resolve, reject) => {
    let onError: (err: Error) => void;
    let onEvent: () => void;

    const cleanup = () => {
      emitter.removeListener("error", onError);
      emitter.removeListener(eventName, onEvent);
    };

    onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    onEvent = () => {
      cleanup();
      resolve();
    };

    emitter.once(eventName, onEvent);
    emitter.once("error", onError);
  });
}

function delay(durationMs: number) {
  return new Promise<void>(resolve => setTimeout(resolve, durationMs));
}

const modulePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryPath && entryPath === modulePath) {
  runStateMachineSequence().catch(() => {
    process.exitCode = 1;
  });
}
