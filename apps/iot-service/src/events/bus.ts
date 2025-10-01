import { EventEmitter } from "node:events";

import type { EventData, EventHandler, EventType } from "./types";

export class EventBus extends EventEmitter {
  emit<T extends EventType>(event: T, data: EventData[T]): boolean {
    return super.emit(event, data);
  }

  on<T extends EventType>(event: T, handler: EventHandler<T>): this {
    return super.on(event, handler);
  }

  off<T extends EventType>(event: T, handler: EventHandler<T>): this {
    return super.off(event, handler);
  }

  once<T extends EventType>(event: T, handler: EventHandler<T>): this {
    return super.once(event, handler);
  }
}

export const eventBus = new EventBus();
