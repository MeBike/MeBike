#ifndef CARD_TAP_WATCHER_H
#define CARD_TAP_WATCHER_H

#include <Arduino.h>
#include <string>

#include "NFCManager.h"

class CardTapWatcher {
public:
  CardTapWatcher(
    NFCManager& manager,
    unsigned long pollIntervalMs = 80,
    unsigned long debounceMs = 600,
    uint16_t scanTimeoutMs = 75
  );

  bool poll(std::string& cardUidOut);

private:
  NFCManager& nfcManager;
  const unsigned long pollInterval;
  const unsigned long debounceInterval;
  const uint16_t scanTimeout;

  unsigned long lastPollTime = 0;
  unsigned long lastPublishTime = 0;
  std::string lastPublishedUid;
  bool cardPresent = false;
  uint8_t consecutiveMisses = 0;
  static constexpr uint8_t MAX_MISSES_BEFORE_RESET = 3;

  static std::string convertUidToDecimal(const uint8_t* uidBytes, uint8_t length);
};

#endif // CARD_TAP_WATCHER_H
