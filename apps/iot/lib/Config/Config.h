#ifndef CONFIG_H
#define CONFIG_H

#include <string>

struct AppConfig
{
    std::string wifiSsid;
    std::string wifiPass;
    std::string mqttBrokerIP;
    int mqttPort;
    std::string mqttUsername;
    std::string mqttPassword;
};

AppConfig loadConfig();

#endif
