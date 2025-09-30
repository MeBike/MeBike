#include "globals.h"
#include <Arduino.h>
#include <ArduinoLog.h>

DeviceState currentState;

namespace Global
{
    WiFiClient espClient;
    std::unique_ptr<MQTTManager> mqttManager = nullptr;
    std::string ssid;
    std::string password;

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
    }

    void setupMQTT(const char *brokerIP, int port, const char *username, const char *pass)
    {
        mqttManager.reset(new MQTTManager(espClient, brokerIP, port, username, pass));
        mqttManager->setCallback(mqttCallback);
        if (mqttManager->connect())
        {
            mqttManager->subscribe("esp/commands");
            mqttManager->publish("esp/status", "ESP32 online", true);
        }
    }
}