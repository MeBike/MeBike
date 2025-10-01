#include "network.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoLog.h>
#include "DeviceUtils.h"

bool initializeNetwork(const char *ssid, const char *password, NetworkTopics &topics)
{
    Log.info("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
    }
    if (WiFi.status() == WL_CONNECTED)
    {
        Log.info("Connected to WiFi! IP: %s\n", WiFi.localIP().toString().c_str());
        topics.statusTopic = makeTopicWithMac("esp/status");
        topics.logTopic = makeTopicWithMac("esp/logs");
        topics.commandStateTopic = makeTopicWithMac("esp/commands/state");
        topics.commandBookingTopic = makeTopicWithMac("esp/commands/booking");
        topics.commandMaintenanceTopic = makeTopicWithMac("esp/commands/maintenance");
        topics.commandStatusTopic = makeTopicWithMac("esp/commands/status");
        topics.commandRootTopic = makeTopicWithMac("esp/commands");
        Log.info("Topics set with MAC address\n");
        return true;
    }
    else
    {
        Log.error("WiFi connection failed\n");
        return false;
    }
}