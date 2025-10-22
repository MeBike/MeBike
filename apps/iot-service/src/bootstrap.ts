import { IotApplication } from "./application";
import { env } from "./config";
import { MqttConnectionManager } from "./connection";
import { DeviceDiscovery } from "./discovery";
import { eventBus } from "./events";
import { createHttpApp, startHttpServer } from "./http";
import { MessageRouter } from "./messaging";
import { createCommandPublisher } from "./publishers";
import { setCommandPublisherInstance } from "./publishers/context";
import { createDeviceManager, createStateMachineService } from "./services";

export async function bootstrap(): Promise<IotApplication> {
  const deviceManager = createDeviceManager();
  const connection = new MqttConnectionManager({
    brokerUrl: env.MQTT_URL,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
  });

  const messageRouter = new MessageRouter(connection);
  const deviceDiscovery = new DeviceDiscovery(deviceManager);

  const commandPublisher = createCommandPublisher(connection);
  setCommandPublisherInstance(commandPublisher);

  const httpApp = createHttpApp({
    commandPublisher,
    deviceManager,
  });

  const httpServer = startHttpServer(httpApp, {
    port: env.HTTP_PORT,
    hostname: env.HTTP_HOST,
  });
  // nay de test dung dung
  const _stateMachine = createStateMachineService(commandPublisher, {
    deviceMac: env.DEVICE_MAC,
    stepDelayMs: Number.parseInt(env.STATE_STEP_DELAY_MS, 10),
    transitionTimeoutMs: Number.parseInt(env.STATE_TIMEOUT_MS, 10),
  });

  return new IotApplication({
    connection,
    eventBus,
    commandPublisher,
    deviceManager,
    httpServer,
    messageRouter,
    deviceDiscovery,
  });
}
