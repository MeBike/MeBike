#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

struct AppConfig
{
    String wifiSsid;
    String wifiPass;
    String mqttBrokerIP;
    int mqttPort;
    String mqttUsername;
    String mqttPassword;
};

AppConfig loadConfig();

#endif
