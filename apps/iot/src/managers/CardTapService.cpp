#include "CardTapService.h"

#include <ArduinoLog.h>

#include "DeviceUtils.h"
#include "globals.h"

CardTapService::CardTapService(NFCManager& manager)
  : watcher(manager) {}

void CardTapService::begin(const std::string& chipId) {
  deviceChipId = chipId;
}

void CardTapService::loop() {
  String cardUidDecimal;
  if (!watcher.poll(cardUidDecimal)) {
    return;
  }
  publishCardTap(cardUidDecimal);
}

void CardTapService::publishCardTap(const String& cardUid) {
  if (!Global::mqttManager || !Global::mqttManager->isConnected()) {
    Log.warning("MQTT not ready, skipping card tap publish\n");
    return;
  }

  if (deviceChipId.empty()) {
    deviceChipId = getMacAddress();
  }

  const std::string& topicRef = Global::getTopics().cardTapTopic;
  if (topicRef.empty()) {
    Log.error("Card tap topic is not configured\n");
    return;
  }

  String payload = "{\"chip_id\":\"";
  payload += deviceChipId.c_str();
  payload += "\",\"card_uid\":\"";
  payload += cardUid;
  payload += "\"}";

  if (Global::mqttManager->publish(topicRef.c_str(), payload.c_str(), false)) {
    Global::logInfoBoth("Card tap published: chip_id=%s card_uid=%s", deviceChipId.c_str(), cardUid.c_str());
  } else {
    Log.error("Failed to publish card tap payload\n");
  }
}
