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

static unsigned long availableLastStatusPublish = 0;
static unsigned long bookedLastStatusPublish = 0;
static unsigned long maintainedLastStatusPublish = 0;
static unsigned long unavailableLastStatusPublish = 0;
static unsigned long reservedLastStatusPublish = 0;
static unsigned long brokenLastStatusPublish = 0;

constexpr unsigned long STATUS_HEARTBEAT_INTERVAL_MS = 10000;

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

    availableLastStatusPublish = 0;
    bookedLastStatusPublish = 0;
    maintainedLastStatusPublish = 0;
    unavailableLastStatusPublish = 0;
    reservedLastStatusPublish = 0;
    brokenLastStatusPublish = 0;
}

namespace
{
bool handleStandardOperationalState(bool &entryPublished,
                                    unsigned long &lastStatusPublish,
                                    const char *statusPayload,
                                    const char *stateName)
{
    if (Global::mqttManager)
    {
        Global::mqttManager->loop();
    }

    if (WiFi.status() != WL_CONNECTED)
    {
        currentState = STATE_ERROR;
        Log.error("WiFi lost in %s state, entering ERROR state\n", stateName);
        recoveryRetries = 0;
        return false;
    }

    ensureMqttConnected();

    const unsigned long now = millis();

    if (!entryPublished)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), statusPayload, true);
        }
        entryPublished = true;
        lastStatusPublish = now;
        Global::logInfoBoth("Status -> %s", statusPayload);
    }
    else if (now - lastStatusPublish > STATUS_HEARTBEAT_INTERVAL_MS)
    {
        if (Global::mqttManager && Global::mqttManager->isConnected())
        {
            Global::mqttManager->publish(statusTopic(), statusPayload, true);
        }
        lastStatusPublish = now;
        Global::logInfoMQTT("Status heartbeat: %s", statusPayload);
    }

    return true;
}
} // namespace

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

        const auto &topics = Global::getTopics(); // get topics from global which gets from network manager also the auto is for infering type from the return type of getTopics() which is const NetworkTopics& which is a struct
        // same as const NetworkTopics &topics = Global::getTopics(); no casting needed like lava
        Global::mqttManager->subscribe(topics.commandStateTopic.c_str()); // c_string is dfue to the lib
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
        Global::mqttManager->loop(); // stay connected

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

    if (millis() - connectedStartTime > 2000) // after 2 seconds of stable connection 
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
        static unsigned long lastAttempt = 0;
        static unsigned int attemptCount = 0;
        constexpr unsigned long reconnectIntervalMs = 3000;

        unsigned long now = millis();
        if (now - lastAttempt >= reconnectIntervalMs) // 2 sec re-try interval
        {
            lastAttempt = now;
            ++attemptCount;
            Log.info("Attempting WiFi connection... (attempt %u)\n", attemptCount);
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
    handleStandardOperationalState(availableStateEntryPublished,
                                   availableLastStatusPublish,
                                   "available",
                                   "AVAILABLE");
}

void handleBookedState()
{
    handleStandardOperationalState(bookedStateEntryPublished,
                                   bookedLastStatusPublish,
                                   "booked",
                                   "BOOKED");
}

void handleMaintainedState()
{
    handleStandardOperationalState(maintainedStateEntryPublished,
                                   maintainedLastStatusPublish,
                                   "maintained",
                                   "MAINTAINED");
}

void handleUnavailableState()
{
    handleStandardOperationalState(unavailableStateEntryPublished,
                                   unavailableLastStatusPublish,
                                   "unavailable",
                                   "UNAVAILABLE");
}

void handleReservedState()
{
    handleStandardOperationalState(reservedStateEntryPublished,
                                   reservedLastStatusPublish,
                                   "reserved",
                                   "RESERVED");
}

void handleBrokenState()
{
    handleStandardOperationalState(brokenStateEntryPublished,
                                   brokenLastStatusPublish,
                                   "broken",
                                   "BROKEN");
}
