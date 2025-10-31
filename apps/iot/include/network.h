#ifndef NETWORK_H
#define NETWORK_H

#include <string>

struct NetworkTopics
{
    std::string statusTopic;
    std::string logTopic;
    std::string commandStateTopic;
    std::string commandBookingTopic;
    std::string commandReservationTopic;
    std::string commandMaintenanceTopic;
    std::string commandStatusTopic;
    std::string commandRootTopic;
    std::string maintenanceStatusTopic;
    std::string cardTapTopic;
};

bool initializeNetwork(const char *ssid, const char *password, NetworkTopics &topics); // populate topics inside the function check the real implementation

#endif // NETWORK_H
