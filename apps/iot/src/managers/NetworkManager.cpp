#include "NetworkManager.h"
#include "network.h"

NetworkManager::NetworkManager() {}

NetworkManager::~NetworkManager() {}

void NetworkManager::setCredentials(const std::string &ssid, const std::string &password)
{
    ssid_ = ssid;
    password_ = password;
}

bool NetworkManager::initialize()
{
    return ::initializeNetwork(ssid_.c_str(), password_.c_str(), topics_); 
}

const NetworkTopics &NetworkManager::getTopics() const
{
    return topics_;
}

WiFiClient &NetworkManager::getWiFiClient()
{
    return wifiClient_;
}