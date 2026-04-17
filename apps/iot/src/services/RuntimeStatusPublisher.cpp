#include "services/RuntimeStatusPublisher.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <ArduinoLog.h>

#include "MQTTManager.h"

namespace
{
constexpr unsigned long STATUS_HEARTBEAT_INTERVAL_MS = 15000;
}

RuntimeStatusPublisher::RuntimeStatusPublisher(const DeviceContext &deviceContext)
    : deviceContext(deviceContext)
{
}

void RuntimeStatusPublisher::publishIfNeeded(MQTTManager &mqttManager,
                                             RuntimeState runtimeState,
                                             bool wifiConnected,
                                             bool mqttConnected,
                                             bool nfcHealthy,
                                             bool force)
{
    const unsigned long now = millis();
    const bool stateChanged = runtimeState != lastPublishedState;
    const bool heartbeatDue = !lastPublishedAt.has_value() || now - *lastPublishedAt >= STATUS_HEARTBEAT_INTERVAL_MS;
    if (!force && !stateChanged && !heartbeatDue)
    {
        return;
    }

    StaticJsonDocument<192> doc;
    doc["deviceId"] = deviceContext.deviceId.c_str();
    doc["runtimeState"] = runtimeStateName(runtimeState);
    doc["wifiConnected"] = wifiConnected;
    doc["mqttConnected"] = mqttConnected;
    doc["nfcHealthy"] = nfcHealthy;
    doc["timestampMs"] = now;

    char payload[192];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload))
    {
        Log.error("Failed to serialize runtime status\n");
        return;
    }

    if (mqttManager.publish(deviceContext.topics.statusTopic, payload, true, false))
    {
        lastPublishedState = runtimeState;
        lastPublishedAt = now;
        logPublishedStatus(runtimeState, now, wifiConnected, mqttConnected, nfcHealthy);
    }
}

void RuntimeStatusPublisher::logPublishedStatus(RuntimeState runtimeState,
                                                unsigned long timestampMs,
                                                bool wifiConnected,
                                                bool mqttConnected,
                                                bool nfcHealthy) const
{
    Log.info(
        "Published runtime status\n"
        "  topic: %s\n"
        "  deviceId: %s\n"
        "  runtimeState: %s\n"
        "  wifiConnected: %s\n"
        "  mqttConnected: %s\n"
        "  nfcHealthy: %s\n"
        "  timestampMs: %lu\n",
        deviceContext.topics.statusTopic.c_str(),
        deviceContext.deviceId.c_str(),
        runtimeStateName(runtimeState),
        wifiConnected ? "true" : "false",
        mqttConnected ? "true" : "false",
        nfcHealthy ? "true" : "false",
        timestampMs);
}
