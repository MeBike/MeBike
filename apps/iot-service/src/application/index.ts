import type { MqttConnection } from "../connection/types";
import type { EventBus } from "../events";
import type { HttpServer } from "../http";
import type { CommandPublisher } from "../publishers";
import type { DeviceManager } from "../services";

import logger from "../lib/logger";

export type ApplicationDependencies = {
  connection: MqttConnection;
  eventBus: EventBus;
  commandPublisher: CommandPublisher;
  deviceManager: DeviceManager;
  httpServer: HttpServer;
  messageRouter: MessageRouter;
  deviceDiscovery: DeviceDiscovery;
};

export type ApplicationConfig = {
  mqtt: {
    brokerUrl: string;
    username: string;
    password: string;
  };
  http: {
    port: number;
    hostname: string;
  };
  deviceMac?: string;
  stateMachine: {
    stepDelayMs: number;
    transitionTimeoutMs: number;
  };
};

export class IotApplication {
  private httpServer: HttpServer | null = null;
  private shuttingDown = false;

  constructor(private deps: ApplicationDependencies) {}

  async start(config: ApplicationConfig): Promise<void> {
    logger.warn("Starting IoT Application...");

    this.setupEventListeners();

    this.setupConnectionHandlers(config.mqtt.brokerUrl);

    await this.deps.connection.connect();

    this.deps.messageRouter.start();

    this.deps.deviceDiscovery.start();

    await this.deps.messageRouter.subscribeToTopics(config.deviceMac);

    this.httpServer = this.deps.httpServer;

    await this.deps.commandPublisher.requestStatus(config.deviceMac);

    logger.info("IoT Application started successfully");
  }

  async stop(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;
    logger.warn("Stopping IoT Application...");

    const results = await Promise.allSettled([
      this.deps.connection.disconnect(),
      this.closeHttpServer(),
      this.deps.deviceManager.destroy(),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error({ err: result.reason }, "Shutdown error");
      }
    }

    logger.warn("IoT Application stopped");
  }

  private setupEventListeners(): void {
    this.deps.eventBus.on("connection:established", (data) => {
      logger.info({ brokerUrl: data.brokerUrl }, "Connected to MQTT broker");
    });

    this.deps.eventBus.on("connection:error", (data) => {
      logger.error({ err: data.error }, "Connection error");
    });
  }

  private setupConnectionHandlers(brokerUrl: string): void {
    this.deps.connection.onConnect(() => {
      this.deps.eventBus.emit("connection:established", {
        brokerUrl,
        timestamp: new Date(),
      });
    });

    this.deps.connection.onError((error) => {
      this.deps.eventBus.emit("connection:error", {
        error,
        timestamp: new Date(),
      });
    });
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.close((error?: Error) => {
        if (error) {
          reject(error);
        }
        else {
          resolve();
        }
      });
    });
  }
}

export type MessageRouter = {
  start: () => void;
  subscribeToTopics: (deviceMac?: string) => Promise<void>;
};

export type DeviceDiscovery = {
  start: () => void;
};
