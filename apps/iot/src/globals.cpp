#include "globals.h"
#include <Arduino.h>
#include <ArduinoLog.h>

namespace Global
{
    WiFiClient espClient;
    MQTTManager *mqttManager = nullptr;
    const char *ssid = nullptr;
    const char *password = nullptr;

    void initializeNetwork()
    {
        Log.info("Connecting to WiFi...");
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED)
        {
            delay(500);
        }
        Log.info("Connected to WiFi! IP: %s\n", WiFi.localIP().toString().c_str());
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
        mqttManager = new MQTTManager(espClient, brokerIP, port, username, pass);
        mqttManager->setCallback(mqttCallback);
        if (mqttManager->connect())
        {
            mqttManager->subscribe("esp/commands");
            mqttManager->publish("esp/status", "ESP32 online", true);
        }
    }
}