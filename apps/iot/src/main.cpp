#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoLog.h>
#include "Config.h"
#include "globals.h"

void setup()
{

  Serial.begin(74880);
  delay(5000);

  AppConfig config = loadConfig();
  Global::ssid = config.wifiSsid.c_str();
  Global::password = config.wifiPass.c_str();
  Global::initializeNetwork(); // this thing first
  Global::setupMQTT(config.mqttBrokerIP.c_str(), config.mqttPort, config.mqttUsername.c_str(), config.mqttPassword.c_str());
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);
  Log.info("Setup is now stable. Ready to connect to WiFi and MQTT.\n");
}

void loop()
{
  if (Global::mqttManager)
    Global::mqttManager->loop();
  Log.info("Loop is running\n");
  delay(1000);
}
