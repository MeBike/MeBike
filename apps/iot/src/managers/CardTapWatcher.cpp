#include "CardTapWatcher.h"

#include <ArduinoLog.h>
#include <cstdio>
#include <algorithm>

CardTapWatcher::CardTapWatcher(
    NFCManager& manager,
    unsigned long pollIntervalMs,
    unsigned long debounceMs,
    uint16_t scanTimeoutMs)
  : nfcManager(manager)
  , pollInterval(pollIntervalMs)
  , debounceInterval(debounceMs)
  , scanTimeout(scanTimeoutMs) {}

bool CardTapWatcher::poll(String& cardUidDecimalOut) {
  const unsigned long now = millis();
  if (now - lastPollTime < pollInterval) {
    return false;
  }
  lastPollTime = now;

  uint8_t uid[7] = {0};
  uint8_t uidLength = 0;

  const bool success = nfcManager.scanForCard(uid, &uidLength, scanTimeout);
  if (!success) {
    if (cardPresent) {
      consecutiveMisses = std::min<uint8_t>(consecutiveMisses + 1, MAX_MISSES_BEFORE_RESET);
      if (consecutiveMisses >= MAX_MISSES_BEFORE_RESET) {
        cardPresent = false;
        consecutiveMisses = 0;
      }
    }
    return false;
  }

  consecutiveMisses = 0;
  String decimalUid = convertUidToDecimal(uid, uidLength);
  const bool sameUidAsLast = decimalUid.equalsIgnoreCase(lastPublishedUid);
  const bool withinDebounce = (now - lastPublishTime) < debounceInterval;
  const bool isDuplicate = cardPresent && sameUidAsLast && withinDebounce;

  if (isDuplicate) {
    return false;
  }

  if (cardPresent && sameUidAsLast && !withinDebounce) {
    return false;
  }

  cardPresent = true;
  lastPublishedUid = decimalUid;
  lastPublishTime = now;
  cardUidDecimalOut = decimalUid;
  Serial.print("NFC card detected: ");
  Serial.println(decimalUid);
  return true;
}

String CardTapWatcher::convertUidToDecimal(const uint8_t* uidBytes, uint8_t length) {
  uint64_t uidValue = 0;
  for (uint8_t i = 0; i < length; i++) {
    uidValue = (uidValue << 8) | uidBytes[i];
  }

  if (length <= sizeof(uint64_t)) {
    char buffer[21];
    const int written = snprintf(buffer, sizeof(buffer), "%llu", static_cast<unsigned long long>(uidValue));
    if (written > 0) {
      return String(buffer);
    }
  }

  String fallback;
  for (uint8_t i = 0; i < length; i++) {
    if (uidBytes[i] < 0x10) {
      fallback += "0";
    }
    fallback += String(uidBytes[i], HEX);
  }
  fallback.toUpperCase();
  return fallback;
}
