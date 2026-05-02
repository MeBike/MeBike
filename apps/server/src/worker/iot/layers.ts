import { Layer } from "effect";

import {
  DeviceAccessCommandServiceLive,
  DeviceCommandServiceLive,
  DeviceTapDecisionServiceLive,
  DeviceTapServiceLive,
} from "@/domain/iot";
import { NfcCardDepsLive, ReservationDepsLive } from "@/http/shared/providers";
import { MqttLive } from "@/infrastructure/mqtt";

const DeviceCommandDepsLive = DeviceCommandServiceLive.pipe(
  Layer.provide(MqttLive),
);

const DeviceAccessCommandDepsLive = DeviceAccessCommandServiceLive.pipe(
  Layer.provide(ReservationDepsLive),
);

const DeviceTapDecisionDepsLive = DeviceTapDecisionServiceLive.pipe(
  Layer.provide(NfcCardDepsLive),
  Layer.provide(ReservationDepsLive),
  Layer.provide(DeviceAccessCommandDepsLive),
);

/**
 * Layer runtime dài hạn cho tiến trình IoT MQTT worker.
 *
 * Layer này gom toàn bộ dependency mà worker cần trong suốt vòng đời process:
 * MQTT connection, user/reservation deps, service gửi command xuống thiết bị và
 * service xử lý tap event. `ManagedRuntime` sẽ acquire các resource này một lần
 * khi worker khởi động và release một lần khi process shutdown.
 */
export const DeviceRuntimeWorkerLive = Layer.mergeAll(
  MqttLive,
  NfcCardDepsLive,
  ReservationDepsLive,
  DeviceCommandDepsLive,
  DeviceAccessCommandDepsLive,
  DeviceTapDecisionDepsLive,
  DeviceTapServiceLive.pipe(
    Layer.provide(DeviceCommandDepsLive),
    Layer.provide(DeviceTapDecisionDepsLive),
  ),
);
