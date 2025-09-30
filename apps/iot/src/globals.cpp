#include "globals.h"
#include <Arduino.h>
#include <ArduinoLog.h>

namespace Global
{
    WiFiClient espClient;
    PubSubClient client(espClient);
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
        Log.info("Connected to WiFi! IP: %s", WiFi.localIP().toString().c_str());
    }
}