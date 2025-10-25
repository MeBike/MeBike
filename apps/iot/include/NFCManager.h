#ifndef NFCMANAGER_H
#define NFCMANAGER_H

#include <Arduino.h>
#include "Adafruit_PN532.h"

class NFCManager
{
public:
    NFCManager(uint8_t irqPin, uint8_t resetPin);
    bool begin();
    void recoverTick();
    void markUnhealthy();
    bool isHealthy() const; // const is because it does not modify any member variables
    bool isRecovering() const;
    bool healthCheck(); // not const because it may modify member variables
    bool scanForCard(uint8_t *uid, uint8_t *uidLength, uint16_t timeoutMs = 30);

private:
    enum class HealthState : uint8_t
    {
        Healthy,
        Unhealthy,
        Recovering
    };

    void startRecovery();
    bool performReinitialization();
    void driveResetPulse();

    static constexpr unsigned long I2C_RESTART_DELAY_MS = 10;
    static constexpr unsigned long PN532_RESET_LOW_MS = 30;
    static constexpr unsigned long PN532_RESET_STABILIZE_MS = 150;
    static constexpr unsigned long RECOVERY_BACKOFF_INITIAL_MS = 1000;
    static constexpr unsigned long RECOVERY_BACKOFF_MAX_MS = 15000;

    HealthState healthState = HealthState::Unhealthy; // Start as unhealty 
    uint8_t recoveryStep = 0;
    unsigned long nextActionAt = 0;
    unsigned long lastRecoveryAttemptAt = 0;
    unsigned long recoveryBackoffMs = RECOVERY_BACKOFF_INITIAL_MS;
    unsigned long recoveryStartedAt = 0;
    uint32_t recoveryAttempts = 0;

    const uint8_t irqPin;
    const uint8_t resetPin;
    Adafruit_PN532 nfc;
};

#endif
