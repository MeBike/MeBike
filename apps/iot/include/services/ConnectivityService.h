#ifndef SERVICES_CONNECTIVITY_SERVICE_H
#define SERVICES_CONNECTIVITY_SERVICE_H

#include <optional>
#include <string>

#include <WiFiClient.h>

#include "Config.h"
#include "MQTTManager.h"
#include "app/DeviceContext.h"

class ConnectivityService
{
public:
    ConnectivityService(const AppConfig &config, const DeviceContext &deviceContext);

    void begin();
    void loop();

    bool isWifiConnected() const;
    bool isReady();

    void setCommandTopic(const std::string &topic);
    MQTTManager &mqtt();

private:
    void ensureWifiConnected();
    void ensureMqttConnected();

    AppConfig config;
    DeviceContext deviceContext;
    WiFiClient wifiClient;
    MQTTManager mqttManager;
    std::optional<std::string> commandTopic;
    unsigned long lastWifiAttemptAt = 0;
    unsigned long lastMqttAttemptAt = 0;
    bool wifiStarted = false;
    bool commandTopicSubscribed = false;
};

#endif // SERVICES_CONNECTIVITY_SERVICE_H
