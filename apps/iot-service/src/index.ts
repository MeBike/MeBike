import { IOT_PUBLISH_TOPICS } from "@mebike/shared";
import process from "node:process";

import { env } from "./config";
import { MqttConnectionManager } from "./connection";
import { eventBus, EVENTS } from "./events";
import { messageHandlers } from "./handlers";
import { createCommandPublisher } from "./publishers";
import { createDeviceManager, createStateMachineService } from "./services";

async function main() {
  const connection = new MqttConnectionManager({
    brokerUrl: env.MQTT_URL,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
  });

  // event listeners
  eventBus.on(EVENTS.CONNECTION_ESTABLISHED, (data) => {
    console.warn(`Connected to MQTT broker at ${data.brokerUrl}`);
  });

  eventBus.on(EVENTS.CONNECTION_ERROR, (data) => {
    console.error("Connection error:", data.error);
  });

  // Sp connection event handlers
  connection.onConnect(() => {
    eventBus.emit(EVENTS.CONNECTION_ESTABLISHED, {
      brokerUrl: env.MQTT_URL,
      timestamp: new Date(),
    });
  });

  connection.onError((error) => {
    eventBus.emit(EVENTS.CONNECTION_ERROR, {
      error,
      timestamp: new Date(),
    });
  });

  // p message handler
  connection.onMessage((topic, message) => {
    const payload = message.toString();

    // Find and execute the appropriate handler
    const handler = findHandlerForTopic(topic);
    if (handler) {
      handler(topic, payload);
    }
    else {
      console.warn(`Received on ${topic}: ${payload}`);
    }
  });

  // Connect to MQTT broker
  await connection.connect();

  const topics = getSubscriptionTopics(env.DEVICE_MAC);
  await connection.subscribe(topics);

  const _commandPublisher = createCommandPublisher(connection);
  const _deviceManager = createDeviceManager(); // xai sao
  const _stateMachine = createStateMachineService(_commandPublisher, {
    deviceMac: env.DEVICE_MAC,
    stepDelayMs: Number.parseInt(env.STATE_STEP_DELAY_MS, 10),
    transitionTimeoutMs: Number.parseInt(env.STATE_TIMEOUT_MS, 10),
  });

  await _commandPublisher.requestStatus(env.DEVICE_MAC);

  process.on("SIGINT", async () => {
    console.warn("Shutting down...");
    await connection.disconnect();
    process.exit(0);
  });

  // await stateMachine.runSequence();
}

function getSubscriptionTopics(mac: string | undefined): string[] {
  const topics = new Set<string>();
  topics.add(IOT_PUBLISH_TOPICS.status);
  topics.add(IOT_PUBLISH_TOPICS.logs);
  topics.add(`${IOT_PUBLISH_TOPICS.logs}/#`);
  topics.add(IOT_PUBLISH_TOPICS.bookingStatus);
  topics.add(IOT_PUBLISH_TOPICS.maintenanceStatus);

  if (mac) {
    //
  }

  return Array.from(topics);
}

function findHandlerForTopic(topic: string): ((topic: string, payload: string) => void) | undefined {
  if (messageHandlers[topic as keyof typeof messageHandlers]) {
    return messageHandlers[topic as keyof typeof messageHandlers];
  }

  for (const [baseTopic, handler] of Object.entries(messageHandlers)) {
    if (topic === baseTopic || topic.startsWith(`${baseTopic}/`)) {
      return handler;
    }
  }

  return undefined;
}

main().catch((error) => {
  console.error("Application error:", error);
  process.exit(1);
});
