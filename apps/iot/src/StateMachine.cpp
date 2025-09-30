#include "StateMachine.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoLog.h>
#include "globals.h"

unsigned long lastRecoveryAttempt = 0;
int recoveryRetries = 0;

void handleConnectedState()
{
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost, entering ERROR state\n");
        recoveryRetries = 0;
    }
}

void handleErrorState()
{
    if (millis() - lastRecoveryAttempt > recoveryInterval)
    {
        lastRecoveryAttempt = millis();
        recoveryRetries++;
        Log.info("Attempting recovery... (attempt %d/%d)\n", recoveryRetries, maxRecoveryRetries);
        WiFi.reconnect();
        if (WiFi.status() == WL_CONNECTED)
        {
            currentState = STATE_CONNECTED;
            Log.info("Recovered to CONNECTED\n");
            recoveryRetries = 0;
        }
        else if (recoveryRetries >= maxRecoveryRetries)
        {
            Log.error("Max recovery attempts reached. Staying in ERROR state.\n");
        }
    }
}

void handleUnknownState()
{
    Log.error("Unknown state, transitioning to ERROR\n");
    currentState = STATE_ERROR;
}