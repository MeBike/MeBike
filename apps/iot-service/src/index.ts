import type {
  IotCommandPayloadByTopic,
  IotCommandTopic,
} from "@mebike/shared";
import type { MqttClient } from "mqtt";

import {
  IOT_COMMAND_TOPICS,
  IOT_PUBLISH_TOPICS,
  IotBookingStatusMessageSchema,
  IotMaintenanceStatusMessageSchema,
  IotStatusMessageSchema,
  topicWithMac,
} from "@mebike/shared";
import mqtt from "mqtt";

import { env } from "./env";

const brokerUrl = env.MQTT_URL;
const username = env.MQTT_USERNAME;
const password = env.MQTT_PASSWORD;
const deviceMac = env.DEVICE_MAC || null;

const client = mqtt.connect(brokerUrl, {
  username,
  password,
});

client.on("connect", () => {
  console.warn(`Connected to MQTT broker at ${brokerUrl}`);
  subscribeToTopics(client, deviceMac);
  publishCommand(IOT_COMMAND_TOPICS.status, "request");
});

client.on("message", (topic, message) => {
  const payload = message.toString();

  if (matchesTopic(topic, IOT_PUBLISH_TOPICS.status)) {
    const parsed = IotStatusMessageSchema.safeParse(payload);
    if (parsed.success) {
      console.warn(`[status] ${topic}: ${parsed.data}`);
    }
    else {
      console.warn(`[status] ${topic}: ${payload} (unparsed)`);
    }
  }
  else if (matchesTopic(topic, IOT_PUBLISH_TOPICS.logs)) {
    console.warn(`[log] ${topic}: ${payload}`);
  }
  else if (matchesTopic(topic, IOT_PUBLISH_TOPICS.bookingStatus)) {
    const parsed = IotBookingStatusMessageSchema.safeParse(payload);
    if (parsed.success) {
      console.warn(`[booking] ${topic}: ${parsed.data}`);
    }
    else {
      console.warn(`[booking] ${topic}: ${payload} (unexpected format)`);
    }
  }
  else if (matchesTopic(topic, IOT_PUBLISH_TOPICS.maintenanceStatus)) {
    const parsed = IotMaintenanceStatusMessageSchema.safeParse(payload);
    if (parsed.success) {
      console.warn(`[maintenance] ${topic}: ${parsed.data}`);
    }
    else {
      console.warn(`[maintenance] ${topic}: ${payload} (unexpected format)`);
    }
  }
  else {
    console.warn(`Received on ${topic}: ${payload}`);
  }
});

client.on("error", (err) => {
  console.error("Connection error:", err);
});

function subscribeToTopics(client: MqttClient, mac: string | null) {
  const topics = new Set<string>();
  topics.add(IOT_PUBLISH_TOPICS.status);
  topics.add(IOT_PUBLISH_TOPICS.logs);
  topics.add(`${IOT_PUBLISH_TOPICS.logs}/#`);
  topics.add(IOT_PUBLISH_TOPICS.bookingStatus);
  topics.add(IOT_PUBLISH_TOPICS.maintenanceStatus);

  if (mac) {
    topics.add(topicWithMac(IOT_PUBLISH_TOPICS.status, mac));
    topics.add(topicWithMac(IOT_PUBLISH_TOPICS.logs, mac));
  }

  client.subscribe(Array.from(topics), (err) => {
    if (err) {
      console.error("Subscribe error:", err);
    }
    else {
      console.warn("Subscribed to topics:", Array.from(topics).join(", "));
    }
  });
}

function publishCommand<T extends IotCommandTopic>(
  topic: T,
  payload: IotCommandPayloadByTopic[T],
  mac: string | null = deviceMac,
) {
  const resolvedTopic = topicWithMac(topic, mac);
  client.publish(resolvedTopic, payload, (err) => {
    if (err) {
      console.error("Publish error:", err);
    }
    else {
      console.warn(`Command sent to ${resolvedTopic}: ${payload}`);
    }
  });
}

function matchesTopic(incoming: string, baseTopic: string) {
  return incoming === baseTopic || incoming.startsWith(`${baseTopic}/`);
}
