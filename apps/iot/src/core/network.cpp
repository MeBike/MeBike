#include "network.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoLog.h>
#include "DeviceUtils.h"

bool initializeNetwork(const char *ssid, const char *password, NetworkTopics &topics)
{
    Log.info("Connecting to WiFi...");
    WiFi.begin(ssid, password);

    const int maxAttempts = 20;
    int attempts = 0;

    while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts)
    {
        delay(500);
        attempts++;
        if (attempts % 4 == 0) // 4000 % 4 = 0 so log every 2 seconds == every 4 attempts
        {
            Log.info("WiFi connection attempt %d/%d...\n", attempts, maxAttempts);
        }
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Log.info("Connected to WiFi! IP: %s\n", WiFi.localIP().toString().c_str());
        topics.statusTopic = makeTopicWithMac("esp/status");
        topics.logTopic = makeTopicWithMac("esp/logs");
        topics.commandStateTopic = makeTopicWithMac("esp/commands/state");
        topics.commandBookingTopic = makeTopicWithMac("esp/commands/booking");
        topics.commandReservationTopic = makeTopicWithMac("esp/commands/reservation");
        topics.commandMaintenanceTopic = makeTopicWithMac("esp/commands/maintenance");
        topics.commandStatusTopic = makeTopicWithMac("esp/commands/status");
        topics.commandRootTopic = makeTopicWithMac("esp/commands");
        topics.maintenanceStatusTopic = makeTopicWithMac("esp/maintenance/status");
        topics.cardTapTopic = "mebike/rentals/card-tap";
        Log.info("Topics set with MAC address\n");
        return true;
    }
    else
    {
        Log.error("WiFi connection failed after %d attempts. Check credentials and network.\n", maxAttempts);
        return false;
    }
}
