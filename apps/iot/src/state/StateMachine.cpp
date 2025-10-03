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
static bool reservedStateEntryPublished = false;
static bool brokenStateEntryPublished = false;

static const char *statusTopic()
{
    return Global::statusTopic.empty() ? "esp/status" : Global::statusTopic.c_str();
}

void resetStateEntryFlags()
{
    availableStateEntryPublished = false;
    bookedStateEntryPublished = false;
    maintainedStateEntryPublished = false;
    unavailableStateEntryPublished = false;
    reservedStateEntryPublished = false;
    brokenStateEntryPublished = false;
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

    if (millis() - connectedStartTime > 2000)
    {
        currentState = STATE_AVAILABLE;
        Log.info("Connection stable, transitioning to AVAILABLE state\n");
        Global::logInfoBoth("Status -> available (from CONNECTED)");
    }
}

void handleInitState()
{
    Log.info("Initializing device...\n");
    currentState = STATE_CONNECTING_WIFI;
}

void handleConnectingWifiState()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        currentState = STATE_CONNECTED;
        Log.info("WiFi connected, transitioning to CONNECTED state\n");
    }
    else
    {

        Log.info("Attempting WiFi connection...\n");
        WiFi.reconnect();
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

    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in AVAILABLE state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!availableStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "available", true);
        }
        availableStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> available");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "available", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: available");
    }
}

void handleBookedState()
{

    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in BOOKED state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!bookedStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "booked", true);
        }
        bookedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> booked");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "booked", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: booked");
    }
}

void handleMaintainedState()
{

    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in MAINTAINED state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!maintainedStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "maintained", true);
        }
        maintainedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> maintained");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "maintained", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: maintained");
    }
}

void handleUnavailableState()
{

    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in UNAVAILABLE state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!unavailableStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "unavailable", true);
        }
        unavailableStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> unavailable");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "unavailable", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: unavailable");
    }
}

void handleReservedState()
{
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in RESERVED state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!reservedStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "reserved", true);
        }
        reservedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> reserved");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "reserved", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: reserved");
    }
}

void handleBrokenState()
{
    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in BROKEN state, entering ERROR state\n");
        recoveryRetries = 0;
        return;
    }

    static unsigned long lastStatusPublish = 0;

    if (!brokenStateEntryPublished)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "broken", true);
        }
        brokenStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> broken");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager)
        {
            Global::mqttManager->publish(statusTopic(), "broken", true);
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: broken");
    }
}
