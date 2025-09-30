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
  Global::initializeNetwork();
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);
  Log.info("Setup is now stable. Ready to connect to WiFi and MQTT.");
}

void loop()
{
  Log.info("Loop is running\n");
  delay(1000);
}
