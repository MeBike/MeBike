#include "services/ConnectivityService.h"

#include <ArduinoLog.h>
#include <WiFi.h>

namespace
{
constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 5000;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 3000;
}

ConnectivityService::ConnectivityService(const AppConfig &config, const DeviceContext &deviceContext)
    : config(config),
      deviceContext(deviceContext),
      mqttManager(wifiClient,
                  std::string("iot-device-") + deviceContext.deviceId,
                  config.mqttBrokerIP,
                  config.mqttPort,
                  config.mqttUsername,
                  config.mqttPassword)
{
}

void ConnectivityService::begin()
{
    WiFi.mode(WIFI_STA);
    lastWifiAttemptAt = 0;
    lastMqttAttemptAt = 0;
    wifiStarted = false;
    commandTopicSubscribed = false;
}

void ConnectivityService::loop()
{
    ensureWifiConnected();

    if (!isWifiConnected())
    {
        commandTopicSubscribed = false;
        return;
    }

    ensureMqttConnected();

    if (mqttManager.isConnected())
    {
        mqttManager.loop();
    }
    else
    {
        commandTopicSubscribed = false;
    }
}

bool ConnectivityService::isWifiConnected() const
{
    return WiFi.status() == WL_CONNECTED;
}

bool ConnectivityService::isReady()
{
    return isWifiConnected() && mqttManager.isConnected();
}

void ConnectivityService::setCommandTopic(const std::string &topic)
{
    commandTopic = topic;
}

MQTTManager &ConnectivityService::mqtt()
{
    return mqttManager;
}

void ConnectivityService::ensureWifiConnected()
{
    const unsigned long now = millis();
    if (isWifiConnected())
    {
        return;
    }

    if (wifiStarted && now - lastWifiAttemptAt < WIFI_RETRY_INTERVAL_MS)
    {
        return;
    }

    lastWifiAttemptAt = now;
    if (!wifiStarted)
    {
        Log.notice("Connecting WiFi SSID %s\n", config.wifiSsid.c_str());
        WiFi.begin(config.wifiSsid.c_str(), config.wifiPass.c_str());
        wifiStarted = true;
    }
    else
    {
        Log.warning("WiFi disconnected, retrying connection\n");
        WiFi.reconnect();
    }
}

void ConnectivityService::ensureMqttConnected()
{
    if (mqttManager.isConnected())
    {
        if (!commandTopicSubscribed && commandTopic.has_value())
        {
            commandTopicSubscribed = mqttManager.subscribe(*commandTopic);
        }
        return;
    }

    const unsigned long now = millis();
    if (now - lastMqttAttemptAt < MQTT_RETRY_INTERVAL_MS)
    {
        return;
    }

    lastMqttAttemptAt = now;
    if (!mqttManager.connect())
    {
        return;
    }

    commandTopicSubscribed = false;
    if (commandTopic.has_value())
    {
        commandTopicSubscribed = mqttManager.subscribe(*commandTopic);
    }
    Log.notice("Device MQTT session ready on %s\n", deviceContext.topics.commandTopic.c_str());
}
