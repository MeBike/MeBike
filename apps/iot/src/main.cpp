#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoLog.h>
#include "Config.h"
#include "globals.h"
#include "StateMachine.h"
#include "NetworkManager.h"
#include "LEDStatusManager.h"

void setup()
{
  Serial.begin(74880);
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);

  Global::ledStatusManager.reset(new LEDStatusManager());
  Global::ledStatusManager->begin();

  Global::bufferedLogger.reset(new BufferedLogger());
  Global::bufferedLogger->setTopic("esp/logs"); // temporary
  Global::logInfoLocal("Buffered logger initialized");
  delay(5000);

  currentState = STATE_INIT;
  Global::ledStatusManager->setStatus(currentState);

  AppConfig config = loadConfig();
  Global::networkManager.reset(new NetworkManager());
  Global::networkManager->setCredentials(config.wifiSsid, config.wifiPass);
  if (!Global::networkManager->initialize())
  {
    currentState = STATE_ERROR;
    Global::ledStatusManager->setStatus(currentState);
    return;
  }
  if (!Global::setupMQTT(config.mqttBrokerIP.c_str(), config.mqttPort, config.mqttUsername.c_str(), config.mqttPassword.c_str()))
  {
    currentState = STATE_ERROR;
    Global::ledStatusManager->setStatus(currentState);
    return;
  }
  currentState = STATE_CONNECTED;
  Global::ledStatusManager->setStatus(currentState);
}

void loop()
{
 
  if (Global::ledStatusManager)
  {
    Global::ledStatusManager->update();
  }

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

  static DeviceState lastLoggedState = STATE_INIT;
  if (currentState != lastLoggedState)
  {
    Log.info("State changed to %s (%d)\n", getStateName(currentState), currentState);
    Global::logInfoMQTT("State changed to %s (%d)", getStateName(currentState), currentState);

   
    if (Global::ledStatusManager)
    {
      Global::ledStatusManager->setStatus(currentState);
    }

    lastLoggedState = currentState;
  }
}
