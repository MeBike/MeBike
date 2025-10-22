#include "CardTapWatcher.h"

#include <ArduinoLog.h>
#include <cstdio>
#include <algorithm>
#include <cctype>

CardTapWatcher::CardTapWatcher(
    NFCManager& manager,
    unsigned long pollIntervalMs,
    unsigned long debounceMs,
    uint16_t scanTimeoutMs)
  : nfcManager(manager)
  , pollInterval(pollIntervalMs)
  , debounceInterval(debounceMs)
  , scanTimeout(scanTimeoutMs) {}

bool CardTapWatcher::poll(std::string& cardUidOut) {
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
  std::string decimalUid = convertUidToDecimal(uid, uidLength);

  auto stringsEqualIgnoreCase = [](const std::string& lhs, const std::string& rhs) {
    if (lhs.size() != rhs.size()) {
      return false;
    }
    for (size_t i = 0; i < lhs.size(); ++i) {
      if (std::tolower(static_cast<unsigned char>(lhs[i])) !=
          std::tolower(static_cast<unsigned char>(rhs[i]))) {
        return false;
      }
    }
    return true;
  };

  const bool sameUidAsLast = stringsEqualIgnoreCase(decimalUid, lastPublishedUid);
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
  cardUidOut = decimalUid;
  Serial.print("NFC card detected: ");
  Serial.println(decimalUid.c_str());
  return true;
}

std::string CardTapWatcher::convertUidToDecimal(const uint8_t* uidBytes, uint8_t length) {
  uint64_t uidValue = 0;
  for (uint8_t i = 0; i < length; i++) {
    uidValue = (uidValue << 8) | uidBytes[i];
  }

  if (length <= sizeof(uint64_t)) {
    char buffer[21];
    const int written = snprintf(buffer, sizeof(buffer), "%llu", static_cast<unsigned long long>(uidValue));
    if (written > 0) {
      return std::string(buffer, static_cast<size_t>(written));
    }
  }

  std::string fallback;
  fallback.reserve(static_cast<size_t>(length) * 2);
  for (uint8_t i = 0; i < length; i++) {
    char byteBuffer[3];
    snprintf(byteBuffer, sizeof(byteBuffer), "%02X", uidBytes[i]);
    fallback += byteBuffer;
  }
  return fallback;
}
