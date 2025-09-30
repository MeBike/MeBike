#include "MQTTManager.h"
#include <ArduinoLog.h>

MQTTManager::MQTTManager(WiFiClient &wifiClient, const char *brokerIP, int port, const char *username, const char *password)
    : _client(wifiClient), _brokerIP(brokerIP), _port(port), _username(username), _password(password) // constructor cpp la
{
    _client.setServer(_brokerIP, _port);
}

bool MQTTManager::connect()
{
    if (_client.connect("ESP32Client", _username, _password))
    {
        Log.info("Connected to MQTT broker\n");
        return true;
    }
    else
    {
        Log.error("MQTT connection failed, state: %d\n", _client.state());
        return false;
    }
}

void MQTTManager::loop()
{
    _client.loop();
}

bool MQTTManager::publish(const char *topic, const char *message, bool retained)
{
    if (_client.publish(topic, message, retained))
    {
        Log.info("Published to %s: %s\n", topic, message);
        return true;
    }
    else
    {
        Log.error("Failed to publish to %s\n", topic);
        return false;
    }
}

bool MQTTManager::subscribe(const char *topic)
{
    if (_client.subscribe(topic))
    {
        Log.info("Subscribed to %s\n", topic);
        return true;
    }
    else
    {
        Log.error("Failed to subscribe to %s\n", topic);
        return false;
    }
}

void MQTTManager::setCallback(void (*callback)(char *, byte *, unsigned int))
{
    _client.setCallback(callback);
}