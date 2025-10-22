#ifndef NFCMANAGER_H
#define NFCMANAGER_H

#include <Arduino.h>
#include "Adafruit_PN532.h"

class NFCManager
{
public:
    NFCManager(uint8_t irqPin, uint8_t resetPin);
    bool begin();
    bool scanForCard(uint8_t *uid, uint8_t *uidLength, uint16_t timeoutMs = 30);

private:
    Adafruit_PN532 nfc;
};

#endif
