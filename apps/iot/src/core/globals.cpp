#include "globals.h"
#include <Arduino.h>
#include <ArduinoLog.h>
#include "CommandHandler.h"
#include "DeviceUtils.h"

DeviceState currentState;
// TODO: THIS IS TOO MUCH REPonsibilty
namespace Global
{
    WiFiClient espClient;
    std::unique_ptr<MQTTManager> mqttManager = nullptr;
    std::unique_ptr<BufferedLogger> bufferedLogger = nullptr;
    std::string ssid;
    std::string password;
    std::string statusTopic = "esp/status";
    std::string logTopic = "esp/logs";
    std::string commandStateTopic = "esp/commands/state";
    std::string commandBookingTopic = "esp/commands/booking";
    std::string commandMaintenanceTopic = "esp/commands/maintenance";
    std::string commandStatusTopic = "esp/commands/status";
    std::string commandRootTopic = "esp/commands";

    bool initializeNetwork()
    {
        NetworkTopics topics;
        if (::initializeNetwork(ssid.c_str(), password.c_str(), topics))
        {
            statusTopic = topics.statusTopic;
            logTopic = topics.logTopic;
            commandStateTopic = topics.commandStateTopic;
            commandBookingTopic = topics.commandBookingTopic;
            commandMaintenanceTopic = topics.commandMaintenanceTopic;
            commandStatusTopic = topics.commandStatusTopic;
            commandRootTopic = topics.commandRootTopic;
            if (bufferedLogger)
            {
                bufferedLogger->setTopic(logTopic);
            }
            Log.info("Status topic set to %s\n", statusTopic.c_str());
            return true;
        }
        return false;
    }

    bool setupMQTT(const char *brokerIP, int port, const char *username, const char *pass)
    {
        return ::setupMQTT(brokerIP, port, username, pass, logTopic);
    }
}

const char *getStateName(DeviceState state)
{
    switch (state)
    {
    case STATE_INIT:
        return "INIT";
    case STATE_CONNECTING_WIFI:
        return "CONNECTING_WIFI";
    case STATE_CONNECTED:
        return "CONNECTED";
    case STATE_ERROR:
        return "ERROR";
    case STATE_AVAILABLE:
        return "AVAILABLE";
    case STATE_BOOKED:
        return "BOOKED";
    case STATE_MAINTAINED:
        return "MAINTAINED";
    case STATE_UNAVAILABLE:
        return "UNAVAILABLE";
    default:
        return "UNKNOWN";
    }
}
