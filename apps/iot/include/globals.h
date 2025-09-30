#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <memory>
#include "MQTTManager.h"
enum DeviceState
{
    STATE_INIT,
    STATE_CONNECTING_WIFI,
    STATE_CONNECTED,
    STATE_ERROR
};
extern DeviceState currentState;

namespace Global
{
    extern std::unique_ptr<MQTTManager> mqttManager;
    extern std::string ssid;
    extern std::string password;
    void initializeNetwork();
    void mqttCallback(char *topic, byte *payload, unsigned int length);
    void setupMQTT(const char *brokerIP, int port, const char *username, const char *pass);
}

#endif // GLOBALS_H