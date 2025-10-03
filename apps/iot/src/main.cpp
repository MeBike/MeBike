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
  Global::bufferedLogger.reset(new BufferedLogger());
  Global::bufferedLogger->setTopic(Global::logTopic);
  Global::logInfoLocal("Buffered logger initialized");
  delay(5000);
  currentState = STATE_INIT;
  AppConfig config = loadConfig();
  Global::ssid = config.wifiSsid;
  Global::password = config.wifiPass;
  if (!Global::initializeNetwork())
  {
    currentState = STATE_ERROR;
    return;
  }
  if (!Global::setupMQTT(config.mqttBrokerIP.c_str(), config.mqttPort, config.mqttUsername.c_str(), config.mqttPassword.c_str()))
  {
    currentState = STATE_ERROR;
    return;
  }
  currentState = STATE_CONNECTED;
}

void loop()
{
  if (Global::bufferedLogger)
  {
    Global::bufferedLogger->loop();
  }
  switch (currentState)
  {
  case STATE_INIT:
    handleInitState();
    break;
  case STATE_CONNECTING_WIFI:
    handleConnectingWifiState();
    break;
  case STATE_CONNECTED:
    handleConnectedState();
    break;
  case STATE_ERROR:
    handleErrorState();
    break;
  case STATE_RESERVED:
    handleReservedState();
    break;
  case STATE_AVAILABLE:
    handleAvailableState();
    break;
  case STATE_BOOKED:
    handleBookedState();
    break;
  case STATE_BROKEN:
    handleBrokenState();
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
  Log.info("Loop running in state %s (%d)\n", getStateName(currentState), currentState);
  Global::logInfoMQTT("Loop running in state %s (%d)", getStateName(currentState), currentState);
  delay(2000);
}
