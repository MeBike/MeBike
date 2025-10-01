import type { MqttClient } from "mqtt";
import type { Buffer } from "node:buffer";

export type ConnectionConfig = {
  brokerUrl: string;
  username: string;
  password: string;
};

export type MqttConnection = {
  client: MqttClient;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (topics: string[]) => Promise<void>;
  publish: (topic: string, message: string | Buffer) => Promise<void>;
  onMessage: (handler: (topic: string, message: Buffer) => void) => void;
  onError: (handler: (error: Error) => void) => void;
  onConnect: (handler: () => void) => void;
};
