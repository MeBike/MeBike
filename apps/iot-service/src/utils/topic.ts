/**
 *
 *
 * - "esp/status/MAC_ADDRESS" → MAC_ADDRESS at index 2
 * - "esp/logs/MAC_ADDRESS" → MAC_ADDRESS at index 2
 * - "esp/booking/status/MAC_ADDRESS" → MAC_ADDRESS at index 3
 * - "esp/maintenance/status/MAC_ADDRESS" → MAC_ADDRESS at index 3
 */
export function extractDeviceId(topic: string): string | undefined {
  const parts = topic.split("/");

  if (parts.length === 3) {
    return parts[2];
  }

  //  "esp/booking/status/MAC" or "esp/maintenance/status/MAC"
  if (parts.length === 4) {
    return parts[3];
  }

  // "esp/status" or "esp/logs"
  return undefined;
}
