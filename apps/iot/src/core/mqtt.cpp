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
    Global::mqttManager.reset(new MQTTManager(Global::networkManager->getWiFiClient(), brokerIP, port, username, pass));
    Global::mqttManager->setCallback(mqttCallback);
    if (Global::bufferedLogger)
    {
        Global::bufferedLogger->setMQTTManager(Global::mqttManager.get());
        Global::bufferedLogger->setTopic(Global::getTopics().logTopic);
    }
    if (Global::mqttManager->connect())
    {
        const auto &topics = Global::getTopics();
        Global::mqttManager->subscribe(topics.commandStateTopic.c_str());
        Global::mqttManager->subscribe(topics.commandBookingTopic.c_str());
        Global::mqttManager->subscribe(topics.commandReservationTopic.c_str());
        Global::mqttManager->subscribe(topics.commandMaintenanceTopic.c_str());
        Global::mqttManager->subscribe(topics.commandStatusTopic.c_str());
        Global::mqttManager->subscribe(topics.commandRootTopic.c_str());

        const char *topic = Global::getTopics().statusTopic.c_str();
        Global::mqttManager->publish(topic, "ESP32 online", true);
        if (Global::bufferedLogger)
        {
            Global::bufferedLogger->log(LogSeverity::Info, LogDestination::Both, "MQTT connected and status published");
        }
        return true;
    }
    return false;
}