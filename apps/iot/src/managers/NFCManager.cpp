#include "NFCManager.h"
#include <Wire.h>

NFCManager::NFCManager(uint8_t irqPin, uint8_t resetPin) : nfc(irqPin, resetPin) {}

bool NFCManager::begin()
{
    nfc.begin();
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata)
    {
        Serial.print("Didn't find PN53x board");
        Serial.print("Check your wiring and the DIP switches!");
        return false;
    }
    Serial.println("Found PN532 Board!");
    Serial.print("Firmware ver. ");
    Serial.print((versiondata >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versiondata >> 8) & 0xFF, DEC);
    nfc.SAMConfig();
    Serial.println("\nWaiting for an NFC Card...");
    return true;
}

bool NFCManager::scanForCard(uint8_t *uid, uint8_t *uidLength, uint16_t timeoutMs)
{
    return nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, uidLength, timeoutMs);
}
