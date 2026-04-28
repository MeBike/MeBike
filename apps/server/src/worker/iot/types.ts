import type { DeviceAcknowledgement, DeviceRuntimeStatus, DeviceTapEvent } from "@mebike/shared";

export const IOT_MESSAGE_QUEUE_CAPACITY = 256;
export const IOT_MESSAGE_WORKER_CONCURRENCY = 4;
export const IOT_SHUTDOWN_DRAIN_TIMEOUT_MS = 5000;

/**
 * Thông điệp nội bộ đã được phân loại và kiểm tra schema từ MQTT.
 *
 * Worker chỉ xử lý kiểu này sau khi topic và payload thô đã đi qua lớp router.
 * Nhờ vậy phần xử lý domain không cần lặp lại logic parse JSON hoặc validate
 * payload cho từng nhánh tap/status/ack.
 */
export type IncomingDeviceRuntimeMessage
  = | { kind: "tap"; topic: string; payload: DeviceTapEvent }
    | { kind: "status"; topic: string; payload: DeviceRuntimeStatus }
    | { kind: "ack"; topic: string; payload: DeviceAcknowledgement };

export type IotMessageQueueRuntime = {
  /**
   * Đưa một thông điệp đã validate vào hàng đợi xử lý bất đồng bộ.
   *
   * @param message Thông điệp nội bộ đã được router tạo ra từ MQTT packet.
   */
  readonly enqueue: (message: IncomingDeviceRuntimeMessage) => void;

  /**
   * Dừng nhận thêm thông điệp mới vào queue.
   *
   * Hàm này không hủy các thông điệp đang xử lý. Nó chỉ đóng cửa intake để quá
   * trình shutdown có thể đợi queue hiện tại được drain.
   */
  readonly stopIntake: () => void;

  /**
   * Đợi các thông điệp đã queue hoặc đang chạy hoàn tất trong giới hạn timeout.
   *
   * @returns Promise resolve khi queue đã drain xong hoặc đã vượt timeout.
   */
  readonly waitForDrain: () => Promise<void>;
};
