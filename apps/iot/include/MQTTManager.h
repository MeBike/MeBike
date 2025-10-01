#ifndef MQTTMANAGER_H
#define MQTTMANAGER_H

#include <PubSubClient.h>
#include <WiFiClient.h>
#include <string>

class MQTTManager
{
public:
    MQTTManager(WiFiClient &wifiClient, const char *brokerIP, int port, const char *username, const char *password);
    bool connect();
    void loop();
    bool publish(const char *topic, const char *message, bool retained = false);
    bool subscribe(const char *topic);
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
