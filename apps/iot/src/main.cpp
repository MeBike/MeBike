#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoLog.h>
#include "Config.h"
#include "globals.h"
#include "StateMachine.h"

void setup()
{

  Serial.begin(74880);
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);
  delay(5000);
  currentState = STATE_INIT;
  AppConfig config = loadConfig();
  Global::ssid = config.wifiSsid;
  Global::password = config.wifiPass;
  Global::initializeNetwork(); // this thing first
  currentState = STATE_CONNECTING_WIFI;
  Global::setupMQTT(config.mqttBrokerIP.c_str(), config.mqttPort, config.mqttUsername.c_str(), config.mqttPassword.c_str());
  currentState = STATE_CONNECTED; 
}

void loop()
{
  switch (currentState)
  {
  case STATE_CONNECTED:
    handleConnectedState();
    break;
  case STATE_ERROR:
    handleErrorState();
    break;
  case STATE_AVAILABLE:
    handleAvailableState();
    break;
  case STATE_BOOKED:
    handleBookedState();
    break;
  case STATE_MAINTAINED:
    handleMaintainedState();
    break;
  case STATE_UNAVAILABLE:
    handleUnavailableState();
    break;
  default:
    handleUnknownState();
    break;
  }
  Log.info("Loop running in state %d\n", currentState);
  delay(2000);
}