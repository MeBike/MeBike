#include "mqtt.h"
#include <Arduino.h>
#include <ArduinoLog.h>
#include "globals.h"
#include "CommandHandler.h"

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
    Log.info("Message arrived on topic: %s\n", topic);
    String message;
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }
    Log.info("Message: %s\n", message.c_str());

    CommandHandler::processCommand(topic, message.c_str());
}

bool setupMQTT(const char *brokerIP, int port, const char *username, const char *pass, const std::string &logTopic)
{
    Global::mqttManager.reset(new MQTTManager(Global::espClient, brokerIP, port, username, pass));
    Global::mqttManager->setCallback(mqttCallback);
    if (Global::bufferedLogger)
    {
        Global::bufferedLogger->setMQTTManager(Global::mqttManager.get());
        Global::bufferedLogger->setTopic(logTopic);
    }
    if (Global::mqttManager->connect())
    {
        Global::mqttManager->subscribe("esp/commands/state");
        Global::mqttManager->subscribe("esp/commands/booking");
        Global::mqttManager->subscribe("esp/commands/reservation");
        Global::mqttManager->subscribe("esp/commands/maintenance");
        Global::mqttManager->subscribe("esp/commands/status");

        if (!Global::commandStateTopic.empty())
            Global::mqttManager->subscribe(Global::commandStateTopic.c_str());
        if (!Global::commandBookingTopic.empty())
            Global::mqttManager->subscribe(Global::commandBookingTopic.c_str());
        if (!Global::commandReservationTopic.empty())
            Global::mqttManager->subscribe(Global::commandReservationTopic.c_str());
        if (!Global::commandMaintenanceTopic.empty())
            Global::mqttManager->subscribe(Global::commandMaintenanceTopic.c_str());
        if (!Global::commandStatusTopic.empty())
            Global::mqttManager->subscribe(Global::commandStatusTopic.c_str());

        Global::mqttManager->subscribe("esp/commands");
        if (!Global::commandRootTopic.empty())
            Global::mqttManager->subscribe(Global::commandRootTopic.c_str());

        const char *topic = Global::statusTopic.empty() ? "esp/status" : Global::statusTopic.c_str();
        Global::mqttManager->publish(topic, "ESP32 online", true);
        if (Global::bufferedLogger)
        {
            Global::bufferedLogger->log(LogSeverity::Info, LogDestination::Both, "MQTT connected and status published");
        }
        return true;
    }
    return false;
}