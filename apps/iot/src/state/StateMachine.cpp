#include "StateMachine.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoLog.h>
#include "globals.h"

unsigned long lastRecoveryAttempt = 0;
int recoveryRetries = 0;

unsigned long lastMqttReconnectAttempt = 0;
int mqttReconnectRetries = 0;

static bool availableStateEntryPublished = false;
static bool bookedStateEntryPublished = false;
static bool maintainedStateEntryPublished = false;
static bool unavailableStateEntryPublished = false;
static bool reservedStateEntryPublished = false;
static bool brokenStateEntryPublished = false;

static const char *statusTopic()
{
    return Global::getTopics().statusTopic.c_str();
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

bool ensureMqttConnected()
{
    if (!Global::mqttManager)
    {
        return false;
    }

    if (Global::mqttManager->isConnected())
    {
        mqttReconnectRetries = 0;
        return true;
    }

    unsigned long now = millis();

    if (now - lastMqttReconnectAttempt < mqttReconnectInterval)
    {
        return false;
    }

    lastMqttReconnectAttempt = now;
    mqttReconnectRetries++;

    Log.warning("MQTT disconnected, attempting reconnection (attempt %d/%d)...\n",
                mqttReconnectRetries, maxMqttReconnectRetries);

    if (Global::mqttManager->connect())
    {
        Log.info("MQTT reconnected successfully!\n");

        const auto &topics = Global::getTopics();
        Global::mqttManager->subscribe(topics.commandStateTopic.c_str());
        Global::mqttManager->subscribe(topics.commandBookingTopic.c_str());
        Global::mqttManager->subscribe(topics.commandReservationTopic.c_str());
        Global::mqttManager->subscribe(topics.commandMaintenanceTopic.c_str());
        Global::mqttManager->subscribe(topics.commandStatusTopic.c_str());
        Global::mqttManager->subscribe(topics.commandRootTopic.c_str());

        mqttReconnectRetries = 0;
        Global::logInfoBoth("MQTT reconnected and resubscribed to topics");
        return true;
    }
    else
    {
        Log.error("MQTT reconnection failed (state: %d)\n", mqttReconnectRetries);

        if (mqttReconnectRetries >= maxMqttReconnectRetries)
        {
            Log.error("Max MQTT reconnection attempts reached, entering ERROR state\n");
            currentState = STATE_ERROR;
            mqttReconnectRetries = 0;
        }
        return false;
    }
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
    unsigned long now = millis();
    if (now - lastRecoveryAttempt < recoveryInterval)
    {
        return;
    }

    lastRecoveryAttempt = now;

    if (WiFi.status() != WL_CONNECTED)
    {
        recoveryRetries++;
        Log.info("Attempting recovery... (attempt %d/%d)\n", recoveryRetries, maxRecoveryRetries);
        WiFi.reconnect();

        if (WiFi.status() != WL_CONNECTED)
        {
            if (recoveryRetries >= maxRecoveryRetries)
            {
                Log.error("Max recovery attempts reached. Staying in ERROR state.\n");
            }
            return;
        }

        Log.info("WiFi recovered\n");
        recoveryRetries = 0;
    }

    if (Global::mqttManager && !Global::mqttManager->isConnected())
    {
        Log.info("Attempting MQTT reconnection after WiFi recovery...\n");
        if (!ensureMqttConnected())
        {
            return;
        }
    }

    currentState = STATE_CONNECTED;
    Log.info("Recovered to CONNECTED state\n");
    mqttReconnectRetries = 0;
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!availableStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "available", true);
        }
        availableStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> available");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!bookedStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "booked", true);
        }
        bookedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> booked");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!maintainedStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "maintained", true);
        }
        maintainedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> maintained");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!unavailableStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "unavailable", true);
        }
        unavailableStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> unavailable");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!reservedStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "reserved", true);
        }
        reservedStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> reserved");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
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

    ensureMqttConnected();

    static unsigned long lastStatusPublish = 0;

    if (!brokenStateEntryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "broken", true);
        }
        brokenStateEntryPublished = true;
        lastStatusPublish = millis();
        Global::logInfoBoth("Status -> broken");
    }
    else if (millis() - lastStatusPublish > 10000)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), "broken", true); // no eerror checjing truly fired and forgot
        }
        lastStatusPublish = millis();
        Global::logInfoMQTT("Status heartbeat: broken");
    }
}
