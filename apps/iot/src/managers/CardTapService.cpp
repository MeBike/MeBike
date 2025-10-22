#include "CardTapService.h"

#include <ArduinoLog.h>
#include <ArduinoJson.h>
#include <string>

#include "DeviceUtils.h"
#include "globals.h"

CardTapService::CardTapService(NFCManager& manager)
  : watcher(manager) {}

void CardTapService::begin(const std::string& chipId) {
  deviceChipId = chipId;
}

void CardTapService::loop() {
  std::string cardUid;
  if (!watcher.poll(cardUid)) {
    return;
  }
  publishCardTap(cardUid);
}

void CardTapService::publishCardTap(const std::string& cardUid) {
  if (!Global::mqttManager || !Global::mqttManager->isConnected()) {
    Global::logInfoBoth("MQTT not ready, skipping card tap publish");
    return;
  }

  if (deviceChipId.empty()) {
    deviceChipId = getMacAddress();
  }

  const std::string& topicRef = Global::getTopics().cardTapTopic;
  if (topicRef.empty()) {
    Global::logInfoBoth("Card tap topic is not configured");
    return;
  }

  DynamicJsonDocument doc(128);
  doc["chip_id"] = deviceChipId.c_str();
  doc["card_uid"] = cardUid.c_str();

  char payload[128];
  const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
  if (payloadLength == 0 || payloadLength >= sizeof(payload))
  {
    Global::logInfoBoth("Failed to serialize card tap payload");
    return;
  }
  if (Global::mqttManager->publish(topicRef.c_str(), payload, false)) {
    Global::logInfoBoth("Card tap published: chip_id=%s card_uid=%s", deviceChipId.c_str(), cardUid.c_str());
  } else {
    Global::logInfoBoth("Failed to publish card tap payload");
  }
}
