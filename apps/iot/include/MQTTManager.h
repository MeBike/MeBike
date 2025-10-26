#ifndef MQTTMANAGER_H
#define MQTTMANAGER_H

#include <PubSubClient.h>
#include <WiFiClient.h>
#include <string>
#include <string_view>

class MQTTManager
{
public:
    MQTTManager(WiFiClient &wifiClient, std::string_view brokerIP, int port, std::string_view username, std::string_view password);
    bool connect();
    void loop();
    bool publish(const char *topic, const char *message, bool retained = false);
    bool publish(std::string_view topic, std::string_view message, bool retained = false);
    bool subscribe(const char *topic);
    bool subscribe(std::string_view topic);
    void setCallback(void (*callback)(char *, byte *, unsigned int));
    bool isConnected();

private:
    PubSubClient _client;
    std::string _brokerIP;
    int _port;
    std::string _username;
    std::string _password;
};

#endif // MQTTMANAGER_H
