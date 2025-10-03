import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  CommandAcceptedResponse,
  ErrorResponse,
} from "@mebike/shared";

import {
  IOT_COMMAND_TOPICS,
  iotServiceRoutes,
  normalizeMac,
  topicWithMac,
} from "@mebike/shared";

import type { CommandPublisher } from "../../publishers";

export type RegisterCommandRoutesOptions = {
  commandPublisher: CommandPublisher;
};

export function registerCommandRoutes(
  app: OpenAPIHono,
  { commandPublisher }: RegisterCommandRoutesOptions,
): void {
  app.openapi(iotServiceRoutes.sendStateCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const { state } = c.req.valid("json");
    await commandPublisher.sendStateCommand(state, normalized);

    return c.json<CommandAcceptedResponse, 202>({
      deviceId: normalized,
      topic: topicWithMac(IOT_COMMAND_TOPICS.state, normalized),
      payload: state,
    }, 202);
  });

  app.openapi(iotServiceRoutes.sendBookingCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const { command } = c.req.valid("json");
    await commandPublisher.sendBookingCommand(command, normalized);

    return c.json<CommandAcceptedResponse, 202>({
      deviceId: normalized,
      topic: topicWithMac(IOT_COMMAND_TOPICS.booking, normalized),
      payload: command,
    }, 202);
  });

  app.openapi(iotServiceRoutes.sendReservationCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const { command } = c.req.valid("json");
    await commandPublisher.sendReservationCommand(command, normalized);

    return c.json<CommandAcceptedResponse, 202>({
      deviceId: normalized,
      topic: topicWithMac(IOT_COMMAND_TOPICS.reservation, normalized),
      payload: command,
    }, 202);
  });

  app.openapi(iotServiceRoutes.sendMaintenanceCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const { command } = c.req.valid("json");
    await commandPublisher.sendMaintenanceCommand(command, normalized);

    return c.json<CommandAcceptedResponse, 202>({
      deviceId: normalized,
      topic: topicWithMac(IOT_COMMAND_TOPICS.maintenance, normalized),
      payload: command,
    }, 202);
  });

  app.openapi(iotServiceRoutes.requestStatusCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const normalized = normalizeMac(deviceId);
    if (!normalized) {
      return c.json<ErrorResponse, 400>({
        error: "Invalid device identifier",
        details: { deviceId },
      }, 400);
    }

    const body = c.req.valid("json");
    const command = body?.command ?? "request";
    await commandPublisher.requestStatus(normalized);

    return c.json<CommandAcceptedResponse, 202>({
      deviceId: normalized,
      topic: topicWithMac(IOT_COMMAND_TOPICS.status, normalized),
      payload: command,
    }, 202);
  });
}
