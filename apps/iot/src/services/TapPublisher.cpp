#include "services/TapPublisher.h"

#include <ArduinoJson.h>
#include <ArduinoLog.h>

#include "MQTTManager.h"

TapPublisher::TapPublisher(NFCManager &nfcManager, const DeviceContext &deviceContext)
    : watcher(nfcManager), deviceContext(deviceContext)
{
}

bool TapPublisher::pollAndPublish(MQTTManager &mqttManager)
{
    std::string cardUid;
    if (!watcher.poll(cardUid))
    {
        return false;
    }

    return publishTap(mqttManager, cardUid);
}

const std::string &TapPublisher::lastRequestId() const
{
    return lastPublishedRequestId;
}

bool TapPublisher::publishTap(MQTTManager &mqttManager, const std::string &cardUid)
{
    lastPublishedRequestId = nextRequestId();

    StaticJsonDocument<192> doc;
    doc["requestId"] = lastPublishedRequestId.c_str();
    doc["deviceId"] = deviceContext.deviceId.c_str();
    doc["cardUid"] = cardUid.c_str();
    doc["timestampMs"] = millis();

    char payload[192];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload))
    {
        Log.error("Failed to serialize tap payload\n");
        return false;
    }

    if (!mqttManager.publish(deviceContext.topics.tapEventTopic, payload, false))
    {
        Log.error("Failed to publish tap event\n");
        return false;
    }

    Log.notice("Published card tap request %s\n", lastPublishedRequestId.c_str());
    return true;
}

std::string TapPublisher::nextRequestId()
{
    ++requestSequence;
    return deviceContext.deviceId + "-" + std::to_string(millis()) + "-" + std::to_string(requestSequence);
}
