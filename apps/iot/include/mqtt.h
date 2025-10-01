#ifndef MQTT_H
#define MQTT_H

#include <Arduino.h>
#include <string>

void mqttCallback(char *topic, byte *payload, unsigned int length);
bool setupMQTT(const char *brokerIP, int port, const char *username, const char *pass, const std::string &logTopic);

#endif // MQTT_H