import type { Buffer } from "node:buffer";

import mqtt from "mqtt";

import type { ConnectionConfig, MqttConnection } from "./types";

export class MqttConnectionManager implements MqttConnection {
  public client: mqtt.MqttClient;

  constructor(private config: ConnectionConfig) {
    this.client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password,
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on("connect", () => resolve());
      this.client.on("error", reject);
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.client.end(false, {}, () => resolve());
    });
  }

  subscribe(topics: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topics, (err) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  publish(topic: string, message: string | Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, (err) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  onMessage(handler: (topic: string, message: Buffer) => void): void {
    this.client.on("message", handler);
  }

  onError(handler: (error: Error) => void): void {
    this.client.on("error", handler);
  }

  onConnect(handler: () => void): void {
    this.client.on("connect", handler);
  }
}
