#include "NetworkManager.h"
#include "network.h"

NetworkManager::NetworkManager() {} // constructor

NetworkManager::~NetworkManager() {} // teardown // destructor

void NetworkManager::setCredentials(const std::string &ssid, const std::string &password)
{
    ssid_ = ssid;
    password_ = password;
}

bool NetworkManager::initialize()
{
    return ::initializeNetwork(ssid_.c_str(), password_.c_str(), topics_);  // call the global function check the global.h the network.h is in there or since this importing network.h we can see it there too
}

const NetworkTopics &NetworkManager::getTopics() const
{
    return topics_; // the thingy is intialized in initializeNetwork function in network.cpp
}

WiFiClient &NetworkManager::getWiFiClient()
{
    return wifiClient_;
}