#ifndef NETWORK_H
#define NETWORK_H

#include <string>

struct NetworkTopics
{
    std::string statusTopic;
    std::string logTopic;
    std::string commandStateTopic;
    std::string commandBookingTopic;
    std::string commandMaintenanceTopic;
    std::string commandStatusTopic;
    std::string commandRootTopic;
};

bool initializeNetwork(const char *ssid, const char *password, NetworkTopics &topics);

#endif // NETWORK_H