#include "Config.h"
#include "FS.h"
#include "SPIFFS.h"
#include <ArduinoLog.h>

namespace
{
constexpr const char *CONFIG_PATH = "/.env";

bool ensureConfigFilesystemMounted()
{
    if (!SPIFFS.begin(true))
    {
        Log.error("An error occurred while mounting SPIFFS\n");
        return false;
    }

    return true;
}
}

AppConfig loadConfig()
{
    AppConfig config;

    if (!ensureConfigFilesystemMounted())
    {
        return config;
    }

    File file = SPIFFS.open(CONFIG_PATH);
    if (!file)
    {
        Log.error("Failed to open .env file for reading\n");
        return config;
    }

    Log.info("Reading configuration from .env file\n");

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
                config.wifiSsid = value.c_str();
            }
            else if (key == "BIKE_ID")
            {
                config.bikeId = value.c_str();
            }
            else if (key == "WIFI_PASS")
            {
                config.wifiPass = value.c_str();
            }
            else if (key == "MQTT_BROKER_IP")
            {
                config.mqttBrokerIP = value.c_str();
            }
            else if (key == "MQTT_PORT")
            {
                config.mqttPort = value.toInt();
            }
            else if (key == "MQTT_USERNAME")
            {
                config.mqttUsername = value.c_str();
            }
            else if (key == "MQTT_PASSWORD")
            {
                config.mqttPassword = value.c_str();
            }
        }
    }
    Log.info("Loaded config from .env file\n");
    file.close();
    return config;
}

bool saveConfig(const AppConfig &config)
{
    if (!ensureConfigFilesystemMounted())
    {
        return false;
    }

    File file = SPIFFS.open(CONFIG_PATH, FILE_WRITE, true);
    if (!file)
    {
        Log.error("Failed to open .env file for writing\n");
        return false;
    }

    file.seek(0, SeekSet);
    file.print("BIKE_ID=");
    file.println(config.bikeId.c_str());
    file.print("WIFI_SSID=");
    file.println(config.wifiSsid.c_str());
    file.print("WIFI_PASS=");
    file.println(config.wifiPass.c_str());
    file.print("MQTT_BROKER_IP=");
    file.println(config.mqttBrokerIP.c_str());
    file.print("MQTT_PORT=");
    file.println(config.mqttPort);
    file.print("MQTT_USERNAME=");
    file.println(config.mqttUsername.c_str());
    file.print("MQTT_PASSWORD=");
    file.println(config.mqttPassword.c_str());
    file.close();

    Log.notice("Saved runtime config to SPIFFS\n");
    return true;
}

bool isConfigValid(const AppConfig &config)
{
    return !config.bikeId.empty() && !config.wifiSsid.empty() && !config.mqttBrokerIP.empty() && config.mqttPort > 0;
}
