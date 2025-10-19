import type { CommandPublisher } from "./commands";

let commandPublisherRef: CommandPublisher | null = null;

export function setCommandPublisherInstance(instance: CommandPublisher): void {
  commandPublisherRef = instance;
}

export function getCommandPublisherInstance(): CommandPublisher | null {
  return commandPublisherRef;
}
