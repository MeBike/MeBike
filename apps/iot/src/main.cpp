#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoLog.h>
#include "Config.h"
#include "globals.h"
#include "StateMachine.h"
#include "NetworkManager.h"
#include "LEDStatusManager.h"
#include <Wire.h>
#include "NFCManager.h"
#include "CardTapService.h"
#include <string>
#include <memory>
#include "HardwareConfig.h"
#include "DeviceUtils.h"

static std::unique_ptr<NFCManager> nfcManager;
static std::unique_ptr<CardTapService> cardTapService;

bool deviceConnected = false;
bool oldDeviceConnected = false;

static std::string deviceChipId;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

void setup()
{
  Serial.begin(74880);
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);

  Global::ledStatusManager.reset(new LEDStatusManager());
  Global::ledStatusManager->begin();

  Global::bufferedLogger.reset(new BufferedLogger());
  Global::bufferedLogger->setTopic("esp/logs"); // temporary
  Global::logInfoLocal("Buffered logger initialized");
  Wire.begin(HardwareConfig::I2C_SDA_PIN, HardwareConfig::I2C_SCL_PIN);
  nfcManager = std::unique_ptr<NFCManager>(new NFCManager(HardwareConfig::PN532_IRQ_PIN, HardwareConfig::PN532_RESET_PIN));
  if (!nfcManager->begin())
  {
    Log.error("PN532 not detected; continuing without NFC support\n");
    Global::logInfoLocal("PN532 not detected; continuing without NFC support");
    nfcManager.reset();
  }
  Serial.println("Hello from ESP32!");
  deviceChipId = getMacAddress();
  Serial.print("Chip ID: ");
  Serial.println(deviceChipId.c_str());
  if (nfcManager)
  {
    cardTapService = std::unique_ptr<CardTapService>(new CardTapService(*nfcManager));
    cardTapService->begin(deviceChipId);
  }

  Serial.println("BLE advertising started");

  Serial.println("\nWaiting for an NFC Card...");
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
  if (cardTapService)
  {
    cardTapService->loop();
  }

  if (Global::ledStatusManager)
  {
    Global::ledStatusManager->update();
  }

  if (Global::bufferedLogger)
  {
    Global::bufferedLogger->loop();
  }

  delay(5);

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
