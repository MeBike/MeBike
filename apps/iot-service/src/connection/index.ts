import type { Buffer } from "node:buffer";

import mqtt from "mqtt";

import type { ConnectionConfig, MqttConnection } from "./types";

import { InfrastructureError } from "../middleware";

export class MqttConnectionManager implements MqttConnection {
  public client: mqtt.MqttClient;
  private hasPendingConnect = false;

  constructor(private config: ConnectionConfig) {
    this.client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password,
    });
    this.client.on("error", (error) => {
      if (this.hasPendingConnect) {
        return;
      }
      console.error("MQTT client error:", error);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client.connected) {
        resolve();
        return;
      }

      let onConnect: () => void;
      let onError: (error: Error) => void;

      const cleanup = () => {
        this.hasPendingConnect = false;
        this.client.off("connect", onConnect);
        this.client.off("error", onError);
      };

      onConnect = () => {
        cleanup();
        resolve();
      };

      onError = (error: Error) => {
        cleanup();
        reject(new InfrastructureError("Failed to connect to MQTT broker", {
          brokerUrl: this.config.brokerUrl,
          originalError: error.message,
        }));
      };

      this.hasPendingConnect = true;
      this.client.once("connect", onConnect);
      this.client.once("error", onError);
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
          reject(new InfrastructureError("Failed to subscribe to MQTT topics", {
            topics,
            originalError: err.message,
          }));
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
          reject(new InfrastructureError("Failed to publish MQTT message", {
            topic,
            originalError: err.message,
          }));
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
