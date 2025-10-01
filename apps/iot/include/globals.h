#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <memory>
#include <string>

#include "MQTTManager.h"
#include "BufferedLogger.h"
enum DeviceState
{
    // Connection states
    STATE_INIT,
    STATE_CONNECTING_WIFI,
    STATE_CONNECTED,
    STATE_ERROR,

    // Operational states
    STATE_AVAILABLE,  // Ready for use
    STATE_BOOKED,     // In use/reserved
    STATE_MAINTAINED, // Under maintenance
    STATE_UNAVAILABLE // Offline or faulty
};
extern DeviceState currentState;

const char *getStateName(DeviceState state);

namespace Global
{
    extern std::unique_ptr<MQTTManager> mqttManager;
    extern std::unique_ptr<BufferedLogger> bufferedLogger;
    extern std::string ssid;
    extern std::string password;
    extern std::string statusTopic;
    extern std::string logTopic;
    void initializeNetwork();
    void mqttCallback(char *topic, byte *payload, unsigned int length);
    void setupMQTT(const char *brokerIP, int port, const char *username, const char *pass);
}

#endif // GLOBALS_H
