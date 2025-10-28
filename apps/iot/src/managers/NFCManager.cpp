#include "NFCManager.h"

#include <ArduinoLog.h>
#include <Wire.h>
#include <algorithm>

#include "HardwareConfig.h"
#include "globals.h"

NFCManager::NFCManager(uint8_t irqPin, uint8_t resetPin)
    : irqPin(irqPin), resetPin(resetPin), nfc(irqPin, resetPin) {}

bool NFCManager::begin()
{
    pinMode(resetPin, OUTPUT);
    digitalWrite(resetPin, HIGH);

    Wire.setTimeout(50);
    Wire.setClock(100000);

    nfc.begin();
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata)
    {
        Serial.print("Didn't find PN53x board");
        Serial.print("Check your wiring and the DIP switches!");
        healthState = HealthState::Unhealthy;
        lastRecoveryAttemptAt = millis() - recoveryBackoffMs;
        return false;
    }
    Serial.println("Found PN532 Board!");
    Serial.print("Firmware ver. ");
    Serial.print((versiondata >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versiondata >> 8) & 0xFF, DEC);
    nfc.SAMConfig();
    Serial.println("\nWaiting for an NFC Card...");
    healthState = HealthState::Healthy;
    recoveryBackoffMs = RECOVERY_BACKOFF_INITIAL_MS;
    lastRecoveryAttemptAt = 0;
    recoveryStep = 0;
    nextActionAt = 0;
    return true;
}

bool NFCManager::scanForCard(uint8_t *uid, uint8_t *uidLength, uint16_t timeoutMs)
//scan
{
    return nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, uidLength, timeoutMs);
}

void NFCManager::recoverTick()
{
    const unsigned long now = millis();

    if (healthState == HealthState::Healthy)
    {
        return;
    }

    if (healthState == HealthState::Unhealthy)
    {
        if ((now - lastRecoveryAttemptAt) < recoveryBackoffMs)
        {
            return;
        }
        startRecovery();
        healthState = HealthState::Recovering;
        recoveryStep = 0;
        nextActionAt = now;
        return;
    }

    if (healthState != HealthState::Recovering)
    {
        return;
    }

    if (now < nextActionAt)
    {
        return;
    }

    switch (recoveryStep)
    {
    case 0:
        Log.warning("PN532 recovery: restarting I2C bus\n");
        Wire.end();
        nextActionAt = now + I2C_RESTART_DELAY_MS;
        recoveryStep = 1;
        break;
    case 1:
        Wire.begin(HardwareConfig::I2C_SDA_PIN, HardwareConfig::I2C_SCL_PIN);
        Wire.setTimeout(50);
        Wire.setClock(100000);
        nextActionAt = now + I2C_RESTART_DELAY_MS;
        recoveryStep = 2;
        break;
    case 2:
        driveResetPulse();
        nextActionAt = now + PN532_RESET_LOW_MS;
        recoveryStep = 3;
        break;
    case 3:
        digitalWrite(resetPin, HIGH);
        nextActionAt = now + PN532_RESET_STABILIZE_MS;
        recoveryStep = 4;
        break;
    case 4:
        if (performReinitialization())
        {
            const unsigned long duration = now - recoveryStartedAt;
            Log.info("PN532 recovery successful after %lu ms (attempt %lu)\n", duration, static_cast<unsigned long>(recoveryAttempts));
            Global::logInfoBoth("PN532 recovery successful after %lu ms (attempt %lu)", duration, static_cast<unsigned long>(recoveryAttempts));
            healthState = HealthState::Healthy;
            recoveryBackoffMs = RECOVERY_BACKOFF_INITIAL_MS;
            recoveryStep = 0;
            lastRecoveryAttemptAt = 0;
            recoveryAttempts = 0;
            recoveryStartedAt = 0;
        }
        else
        {
            Log.error("PN532 recovery failed (attempt %lu)\n", static_cast<unsigned long>(recoveryAttempts));
            Global::logInfoLocal("PN532 recovery failed (attempt %lu)", static_cast<unsigned long>(recoveryAttempts));
            healthState = HealthState::Unhealthy;
            lastRecoveryAttemptAt = now;
            recoveryBackoffMs = std::min<unsigned long>(recoveryBackoffMs * 2, RECOVERY_BACKOFF_MAX_MS);
            recoveryStep = 0;
        }
        break;
    default:
        healthState = HealthState::Unhealthy;
        recoveryStep = 0;
        break;
    }
}

void NFCManager::markUnhealthy()
{
    if (healthState == HealthState::Recovering)
    {
        return;
    }
    healthState = HealthState::Unhealthy;
    recoveryStep = 0;
    nextActionAt = 0;
    recoveryAttempts = 0;
    recoveryStartedAt = 0;
    Log.warning("PN532 marked unhealthy, scheduling recovery\n");
    Global::logInfoLocal("PN532 marked unhealthy, scheduling recovery");
    lastRecoveryAttemptAt = millis() - recoveryBackoffMs;
}

bool NFCManager::isHealthy() const
{
    return healthState == HealthState::Healthy;
}

bool NFCManager::isRecovering() const
{
    return healthState == HealthState::Recovering;
}

bool NFCManager::healthCheck()
{
    if (healthState != HealthState::Healthy)
    {
        return false;
    }

    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata)
    {
        Log.warning("PN532 health check failed\n");
        markUnhealthy();
        return false;
    }
    return true;
}

void NFCManager::startRecovery()
{
    pinMode(resetPin, OUTPUT);
    digitalWrite(resetPin, HIGH);
    const unsigned long now = millis();
    lastRecoveryAttemptAt = now;
    recoveryStartedAt = now;
    recoveryAttempts += 1;
    Log.warning("PN532 recovery attempt %lu starting\n", static_cast<unsigned long>(recoveryAttempts));
    Global::logInfoLocal("PN532 recovery attempt %lu starting", static_cast<unsigned long>(recoveryAttempts));
    recoveryStep = 0;
    nextActionAt = now;
}

bool NFCManager::performReinitialization()
{
    nfc.begin();
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata)
    {
        return false;
    }
    nfc.SAMConfig();
    Serial.println("PN532 reinitialized");
    return true;
}

void NFCManager::driveResetPulse()
{
    digitalWrite(resetPin, LOW);
}
