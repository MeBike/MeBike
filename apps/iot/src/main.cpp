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
#include "Adafruit_PN532.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define I2C_SDA 21
#define I2C_SCL 22
#define PN532_IRQ (4)
#define PN532_RESET (5)
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
    Serial.println("Device connected");
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
    Serial.println("Device disconnected");
  }
};

void setup()
{
  Serial.begin(74880);
  Log.begin(LOG_LEVEL_VERBOSE, &Serial);

  Global::ledStatusManager.reset(new LEDStatusManager());
  Global::ledStatusManager->begin();

  Global::bufferedLogger.reset(new BufferedLogger());
  Global::bufferedLogger->setTopic("esp/logs"); // temporary
  Global::logInfoLocal("Buffered logger initialized");
  Wire.begin(I2C_SDA, I2C_SCL);
  nfc.begin();
  Serial.println("Hello from ESP32!");

  delay(5000);
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata)
  {
    Serial.print("Didn't find PN53x board");
    Serial.print("Check your wiring and the DIP switches!");
    while (1)
    {
      delay(10);
    }
  }
  Serial.println("Found PN532 Board!");
  Serial.print("Firmware ver. ");
  Serial.print((versiondata >> 16) & 0xFF, DEC);
  Serial.print('.');
  Serial.println((versiondata >> 8) & 0xFF, DEC);
  nfc.SAMConfig();

  Serial.println("\nWaiting for an NFC Card...");
  currentState = STATE_INIT;
  Global::ledStatusManager->setStatus(currentState);

  BLEDevice::init("MeBike-ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE);
  pCharacteristic->setValue("Hello from MeBike ESP32");
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // iphne
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE advertising started");

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
  uint8_t success;
  uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0}; // Buffer to store the card's UID 4 bytes th
  uint8_t uidLength;                   


  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success)
  {
    Serial.println("Found a card!");
    Serial.print("UID Length: ");
    Serial.print(uidLength, DEC);
    Serial.println(" bytes");
    Serial.print("UID Value: ");
    nfc.PrintHex(uid, uidLength); 
    Serial.println("");

    delay(1000);
  };

  if (deviceConnected && !oldDeviceConnected)
  {
    oldDeviceConnected = deviceConnected;
    Serial.println("Device connected, starting notification");
  }
  if (!deviceConnected && oldDeviceConnected)
  {
    delay(500);                  
    pServer->startAdvertising(); 
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }

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
