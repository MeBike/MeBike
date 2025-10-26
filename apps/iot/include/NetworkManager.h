#ifndef NETWORKMANAGER_H
#define NETWORKMANAGER_H

#include <WiFiClient.h>
#include <string>
#include <string_view>
#include "network.h"

class NetworkManager
{
public:
    NetworkManager();
    ~NetworkManager();

    void setCredentials(std::string_view ssid, std::string_view password);
    bool initialize();
    const NetworkTopics &getTopics() const;
    WiFiClient &getWiFiClient();

private:
    WiFiClient wifiClient_;
    std::string ssid_;
    std::string password_;
    NetworkTopics topics_; // from network.h to populate pass it in to the initializeNetwork function
};

#endif // NETWORKMANAGER_H
