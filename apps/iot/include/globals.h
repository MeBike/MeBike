#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <PubSubClient.h>

namespace Global
{
    extern WiFiClient espClient;
    extern PubSubClient client;
    extern const char *ssid;
    extern const char *password;
    void initializeNetwork();
}

#endif // GLOBALS_H