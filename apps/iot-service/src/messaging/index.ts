import { IOT_PUBLISH_TOPICS } from "@mebike/shared";

import type { MqttConnection } from "../connection/types";
import type { MessageHandler } from "../handlers";

import { messageHandlers } from "../handlers";

export class MessageRouter {
  constructor(private connection: MqttConnection) {}

  start(): void {
    this.connection.onMessage((topic, message) => {
      this.handleMessage(topic, message.toString());
    });
  }

  async subscribeToTopics(deviceMac?: string): Promise<void> {
    const topics = this.getSubscriptionTopics(deviceMac);
    await this.connection.subscribe(topics);
  }

  private handleMessage(topic: string, payload: string): void {
    const handler = this.findHandlerForTopic(topic);
    if (handler) {
      try {
        Promise.resolve(handler(topic, payload)).catch((error) => {
          console.error(`Error handling message on topic ${topic}`, error);
        });
      }
      catch (error) {
        console.error(`Error handling message on topic ${topic}`, error);
      }
    }
    else {
      console.warn(`Received on ${topic}: ${payload}`);
    }
  }

  private findHandlerForTopic(topic: string): MessageHandler | undefined {
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

  private getSubscriptionTopics(deviceMac?: string): string[] {
    const topics = new Set<string>();

    topics.add(IOT_PUBLISH_TOPICS.status);
    topics.add(IOT_PUBLISH_TOPICS.logs);
    topics.add(IOT_PUBLISH_TOPICS.bookingStatus);
    topics.add(IOT_PUBLISH_TOPICS.maintenanceStatus);
    topics.add(IOT_PUBLISH_TOPICS.cardTap);

    topics.add(`${IOT_PUBLISH_TOPICS.logs}/#`);
    topics.add(`${IOT_PUBLISH_TOPICS.status}/#`);
    topics.add(`${IOT_PUBLISH_TOPICS.bookingStatus}/#`);
    topics.add(`${IOT_PUBLISH_TOPICS.maintenanceStatus}/#`);
    topics.add(`${IOT_PUBLISH_TOPICS.cardTap}/#`);

    if (deviceMac) {
      // cu the neu can
    }

    return Array.from(topics);
  }
}
