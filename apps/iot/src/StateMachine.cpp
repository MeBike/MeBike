#include "StateMachine.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoLog.h>
#include "globals.h"

unsigned long lastRecoveryAttempt = 0;
int recoveryRetries = 0;

static bool availableStateEntryPublished = false;
static bool bookedStateEntryPublished = false;
static bool maintainedStateEntryPublished = false;
static bool unavailableStateEntryPublished = false;

void resetStateEntryFlags()
{
    availableStateEntryPublished = false;
    bookedStateEntryPublished = false;
    maintainedStateEntryPublished = false;
    unavailableStateEntryPublished = false;
}

void handleConnectedState()
{
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    
    static unsigned long connectedStartTime = 0;
    if (connectedStartTime == 0)
    {
        connectedStartTime = millis();
    }

    // Wait 2 seconds for connection to stabilize, then go operational
    if (millis() - connectedStartTime > 2000)
    {
        currentState = STATE_AVAILABLE;
        Log.info("Connection stable, transitioning to AVAILABLE state\n");

        // Publish immediate status on state entry
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "available", true);
        }
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

void handleAvailableState()
{
    // Maintain MQTT connection and check WiFi
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in AVAILABLE state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    // Publish status immediately on state entry, then periodically
    static unsigned long lastStatusPublish = 0;

    if (!availableStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "available", true);
        }
        availableStateEntryPublished = true;
        lastStatusPublish = millis();
    }
    else if (millis() - lastStatusPublish > 10000)
    { // Every 10s
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "available", true);
        }
        lastStatusPublish = millis();
    }
    // Add logic for booking commands via MQTT
}

void handleBookedState()
{
    // Maintain MQTT connection and check WiFi
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in BOOKED state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    // Publish status immediately on state entry, then periodically
    static unsigned long lastStatusPublish = 0;

    if (!bookedStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "booked", true);
        }
        bookedStateEntryPublished = true;
        lastStatusPublish = millis();
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "booked", true);
        }
        lastStatusPublish = millis();
    }
    // Add logic for return/unbook commands
}

void handleMaintainedState()
{
    // Maintain MQTT connection and check WiFi
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in MAINTAINED state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    // Publish status immediately on state entry, then periodically
    static unsigned long lastStatusPublish = 0;

    if (!maintainedStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "maintained", true);
        }
        maintainedStateEntryPublished = true;
        lastStatusPublish = millis();
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "maintained", true);
        }
        lastStatusPublish = millis();
    }
    // Add logic for maintenance completion
}

void handleUnavailableState()
{
    // Maintain MQTT connection and check WiFi
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in UNAVAILABLE state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    // Publish status immediately on state entry, then periodically
    static unsigned long lastStatusPublish = 0;

    if (!unavailableStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "unavailable", true);
        }
        unavailableStateEntryPublished = true;
        lastStatusPublish = millis();
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish("esp/status", "unavailable", true);
        }
        lastStatusPublish = millis();
    }
    // Add logic for becoming available again
}