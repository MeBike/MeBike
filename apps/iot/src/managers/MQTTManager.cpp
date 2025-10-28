#include "MQTTManager.h"
#include <ArduinoLog.h>

MQTTManager::MQTTManager(WiFiClient &wifiClient, std::string_view brokerIP, int port, std::string_view username, std::string_view password)
    : _client(wifiClient), _brokerIP(brokerIP), _port(port), _username(username), _password(password)
{
    _client.setServer(_brokerIP.c_str(), _port);
}

bool MQTTManager::connect()
{
    if (_client.connect("ESP32Client", _username.c_str(), _password.c_str()))
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

bool MQTTManager::publish(std::string_view topic, std::string_view message, bool retained)
{
    std::string topicBuffer(topic);
    std::string messageBuffer(message);
    return publish(topicBuffer.c_str(), messageBuffer.c_str(), retained);
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

bool MQTTManager::subscribe(std::string_view topic)
{
    std::string topicBuffer(topic);
    return subscribe(topicBuffer.c_str());
}

void MQTTManager::setCallback(void (*callback)(char *, byte *, unsigned int))
{
    _client.setCallback(callback);
}

bool MQTTManager::isConnected()
{
    return _client.connected();
}
