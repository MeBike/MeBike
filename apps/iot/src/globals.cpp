#include "globals.h"
#include <Arduino.h>
#include <ArduinoLog.h>
#include "CommandHandler.h"
#include "DeviceUtils.h"

DeviceState currentState;
//TODO: THIS IS TOO MUCH REPonsibilty
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

    void initializeNetwork()
    {
        Log.info("Connecting to WiFi...");
        WiFi.begin(ssid.c_str(), password.c_str());
        while (WiFi.status() != WL_CONNECTED)
        {
            delay(500);
        }
        if (WiFi.status() == WL_CONNECTED)
        {
            Log.info("Connected to WiFi! IP: %s\n", WiFi.localIP().toString().c_str());
            statusTopic = makeTopicWithMac("esp/status");
            logTopic = makeTopicWithMac("esp/logs");
            commandStateTopic = makeTopicWithMac("esp/commands/state");
            commandBookingTopic = makeTopicWithMac("esp/commands/booking");
            commandMaintenanceTopic = makeTopicWithMac("esp/commands/maintenance");
            commandStatusTopic = makeTopicWithMac("esp/commands/status");
            commandRootTopic = makeTopicWithMac("esp/commands");
            if (bufferedLogger)
            {
                bufferedLogger->setTopic(logTopic);
            }
            Log.info("Status topic set to %s\n", statusTopic.c_str());
        }
        else
        {
            Log.error("WiFi connection failed\n");
        }
    }
    void mqttCallback(char *topic, byte *payload, unsigned int length)
    {
        Log.info("Message arrived on topic: %s\n", topic);
        String message;
        for (unsigned int i = 0; i < length; i++)
        {
            message += (char)payload[i];
        }
        Log.info("Message: %s\n", message.c_str());

        CommandHandler::processCommand(topic, message.c_str()); // CHECK HERE FOR COMMANDD PROVCIDIEDS
    }

    void setupMQTT(const char *brokerIP, int port, const char *username, const char *pass)
    {
        mqttManager.reset(new MQTTManager(espClient, brokerIP, port, username, pass));
        mqttManager->setCallback(mqttCallback);
        if (bufferedLogger)
        {
            bufferedLogger->setMQTTManager(mqttManager.get());
        }
        if (mqttManager->connect())
        {
            // global
            mqttManager->subscribe("esp/commands/state");
            mqttManager->subscribe("esp/commands/booking");
            mqttManager->subscribe("esp/commands/maintenance");
            mqttManager->subscribe("esp/commands/status");
            // INVIDIDUAL COMMANDS
            if (!commandStateTopic.empty())
                mqttManager->subscribe(commandStateTopic.c_str());
            if (!commandBookingTopic.empty())
                mqttManager->subscribe(commandBookingTopic.c_str());
            if (!commandMaintenanceTopic.empty())
                mqttManager->subscribe(commandMaintenanceTopic.c_str());
            if (!commandStatusTopic.empty())
                mqttManager->subscribe(commandStatusTopic.c_str());

            mqttManager->subscribe("esp/commands");
            if (!commandRootTopic.empty())
                mqttManager->subscribe(commandRootTopic.c_str());

            const char *topic = statusTopic.empty() ? "esp/status" : statusTopic.c_str();
            mqttManager->publish(topic, "ESP32 online", true);
            if (bufferedLogger)
            {
                bufferedLogger->log(LogSeverity::Info, LogDestination::Both, "MQTT connected and status published");
            }
        }
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
