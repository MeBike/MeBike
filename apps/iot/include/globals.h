#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include "MQTTManager.h"

namespace Global
{
    extern MQTTManager *mqttManager;
    extern const char *ssid;
    extern const char *password;
    void initializeNetwork();
    void mqttCallback(char *topic, byte *payload, unsigned int length);
    void setupMQTT(const char *brokerIP, int port, const char *username, const char *pass);
}

#endif // GLOBALS_H