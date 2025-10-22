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

    Global::logInfoBoth("MQTT disconnected, attempting reconnection (attempt %d/%d)", mqttReconnectRetries, maxMqttReconnectRetries);

    if (Global::mqttManager->connect())
    {
        Global::logInfoBoth("MQTT reconnected successfully!");

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
        Global::logInfoBoth("MQTT reconnection failed (attempt: %d)", mqttReconnectRetries);

        if (mqttReconnectRetries >= maxMqttReconnectRetries)
        {
            Global::logInfoBoth("Max MQTT reconnection attempts reached, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost, entering ERROR state");
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
        Global::logInfoBoth("Connection stable, transitioning to AVAILABLE state");
    }
}

void handleInitState()
{
    Global::logInfoBoth("Initializing device...");
    currentState = STATE_CONNECTING_WIFI;
}

void handleConnectingWifiState()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        currentState = STATE_CONNECTED;
        Global::logInfoBoth("WiFi connected, transitioning to CONNECTED state");
    }
    else
    {
        static unsigned long lastAttempt = 0;
        static unsigned int attemptCount = 0;
        constexpr unsigned long reconnectIntervalMs = 2000;

        unsigned long now = millis();
        if (now - lastAttempt >= reconnectIntervalMs)
        {
            lastAttempt = now;
            ++attemptCount;
            Global::logInfoBoth("Attempting WiFi connection... (attempt %u)", attemptCount);
            WiFi.reconnect();
        }
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
        Global::logInfoBoth("Attempting recovery... (attempt %d/%d)", recoveryRetries, maxRecoveryRetries);
        WiFi.reconnect();

        if (WiFi.status() != WL_CONNECTED)
        {
            if (recoveryRetries >= maxRecoveryRetries)
            {
                Global::logInfoBoth("Max recovery attempts reached. Staying in ERROR state.");
            }
            return;
        }

        Global::logInfoBoth("WiFi recovered");
        recoveryRetries = 0;
    }

    if (Global::mqttManager && !Global::mqttManager->isConnected())
    {
        Global::logInfoBoth("Attempting MQTT reconnection after WiFi recovery...");
        if (!ensureMqttConnected())
        {
            return;
        }
    }

    currentState = STATE_CONNECTED;
    Global::logInfoBoth("Recovered to CONNECTED state");
    mqttReconnectRetries = 0;
}

void handleUnknownState()
{
    Global::logInfoBoth("Unknown state, transitioning to ERROR");
    currentState = STATE_ERROR;
}

void handleAvailableState()
{

    if (Global::mqttManager)
        Global::mqttManager->loop();

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Global::logInfoBoth("WiFi lost in AVAILABLE state, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost in BOOKED state, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost in MAINTAINED state, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost in UNAVAILABLE state, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost in RESERVED state, entering ERROR state");
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
        Global::logInfoBoth("WiFi lost in BROKEN state, entering ERROR state");
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
