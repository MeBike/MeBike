#include "Config.h"
#include "FS.h"
#include "SPIFFS.h"
#include <ArduinoLog.h>

AppConfig loadConfig()
{
    AppConfig config;

    if (!SPIFFS.begin(true))
    {
        Log.error("An error occurred while mounting SPIFFS");
        return config;
    }

    File file = SPIFFS.open("/.env");
    if (!file)
    {
        Log.error("Failed to open .env file for reading");
        return config;
    }

    Log.info("Reading configuration from .env file:");

    while (file.available())
    {
        String line = file.readStringUntil('\n');
        line.trim();

        if (line.isEmpty() || line.startsWith("#"))
        {
            continue;
        }

        int separatorPos = line.indexOf('=');
        if (separatorPos != -1)
        {
            String key = line.substring(0, separatorPos);
            String value = line.substring(separatorPos + 1);

            if (value.startsWith("\"") && value.endsWith("\""))
            {
                value = value.substring(1, value.length() - 1);
            }

            if (key == "WIFI_SSID")
            {
                config.wifiSsid = value;
            }
            else if (key == "WIFI_PASS")
            {
                config.wifiPass = value;
            }
            else if (key == "MQTT_BROKER_IP")
            {
                config.mqttBrokerIP = value;
            }
            else if (key == "MQTT_PORT")
            {
                config.mqttPort = value.toInt();
            }
            else if (key == "MQTT_USERNAME")
            {
                config.mqttUsername = value;
            }
            else if (key == "MQTT_PASSWORD")
            {
                config.mqttPassword = value;
            }
        }
    }
    Log.info("Loaded config from .env file:\n");
    file.close();
    return config;
}