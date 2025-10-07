import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  CommandAcceptedResponse,
  ErrorResponse,
} from "@mebike/shared";
import type { Context } from "hono";

import { iotServiceRoutes } from "@mebike/shared";

import type { CommandPublisher } from "../../publishers";
import type { DeviceManager } from "../../services";

import { BusinessLogicError } from "../../middleware";
import { CommandController } from "../controllers/command-controller";

export type RegisterCommandRoutesOptions = {
  commandPublisher: CommandPublisher;
  deviceManager: DeviceManager;
};

export function registerCommandRoutes(
  app: OpenAPIHono,
  { commandPublisher, deviceManager }: RegisterCommandRoutesOptions,
): void {
  const controller = new CommandController({ commandPublisher, deviceManager });

  const handleCommandResponse = async (
    c: Context,
    handler: () => Promise<CommandAcceptedResponse>,
  ) => {
    try {
      const result = await handler();
      return c.json<CommandAcceptedResponse, 202>(result, 202);
    }
    catch (err) {
      if (err instanceof BusinessLogicError) {
        const details = err.details;
        const status: 400 | 409 = err.status === 409 ? 409 : 400;
        return c.json<ErrorResponse, typeof status>(
          {
            error: err.message,
            ...(details ? { details } : {}),
          },
          status,
        );
      }
      throw err;
    }
  };

  app.openapi(iotServiceRoutes.sendStateCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const { state } = c.req.valid("json");
    return handleCommandResponse(c, () => controller.sendStateCommand({ deviceId, state }));
  });

  app.openapi(iotServiceRoutes.sendBookingCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const { command } = c.req.valid("json");
    return handleCommandResponse(c, () => controller.sendBookingCommand({ deviceId, command }));
  });

  app.openapi(iotServiceRoutes.sendReservationCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const { command } = c.req.valid("json");
    return handleCommandResponse(c, () => controller.sendReservationCommand({ deviceId, command }));
  });

  app.openapi(iotServiceRoutes.sendMaintenanceCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const { command } = c.req.valid("json");
    return handleCommandResponse(c, () => controller.sendMaintenanceCommand({ deviceId, command }));
  });

  app.openapi(iotServiceRoutes.requestStatusCommand, async (c) => {
    const { deviceId } = c.req.valid("param");
    const body = c.req.valid("json");
    return handleCommandResponse(c, () => controller.requestStatusCommand({
      deviceId,
      command: body?.command,
    }));
  });
}
