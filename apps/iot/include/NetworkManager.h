#ifndef NETWORKMANAGER_H
#define NETWORKMANAGER_H

#include <WiFiClient.h>
#include <string>
#include "network.h"

class NetworkManager
{
public:
    NetworkManager();
    ~NetworkManager();

    void setCredentials(const std::string &ssid, const std::string &password);
    bool initialize();
    const NetworkTopics &getTopics() const;
    WiFiClient &getWiFiClient();

private:
    WiFiClient wifiClient_;
    std::string ssid_;
    std::string password_;
    NetworkTopics topics_;
};

#endif // NETWORKMANAGER_H