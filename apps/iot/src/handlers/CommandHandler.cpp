#include "CommandHandler.h"
#include <ArduinoLog.h>
#include <cstring>
#include "globals.h"
#include "StateMachine.h"

static bool matchesTopic(const char *incoming, const char *baseTopic, const std::string &deviceTopic)
{
    if (strcmp(incoming, baseTopic) == 0)
    {
        return true;
    }
    return !deviceTopic.empty() && strcmp(incoming, deviceTopic.c_str()) == 0;
}

static const char *statusTopic()
{
    return Global::statusTopic.empty() ? "esp/status" : Global::statusTopic.c_str();
}

void CommandHandler::processCommand(const char *topic, const char *message)
{
    Log.info("Processing command from topic %s: %s\n", topic, message);

    if (matchesTopic(topic, "esp/commands/state", Global::commandStateTopic) ||
        matchesTopic(topic, "esp/commands", Global::commandRootTopic))
    {
        handleStateCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/booking", Global::commandBookingTopic))
    {
        handleBookingCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/reservation", Global::commandReservationTopic))
    {
        handleReservationCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/maintenance", Global::commandMaintenanceTopic))
    {
        handleMaintenanceCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/status", Global::commandStatusTopic))
    {
        handleStatusCommand(message);
    }
    else
    {
        Log.warning("Unknown command topic: %s\n", topic);
    }
}

void CommandHandler::handleStateCommand(const char *command)
{
    Log.info("Handling state command: %s\n", command);

    DeviceState targetState = currentState; // Default to current state

    if (strcmp(command, "available") == 0)
    {
        targetState = STATE_AVAILABLE;
    }
    else if (strcmp(command, "reserved") == 0)
    {
        targetState = STATE_RESERVED;
    }
    else if (strcmp(command, "booked") == 0)
    {
        targetState = STATE_BOOKED;
    }
    else if (strcmp(command, "broken") == 0)
    {
        targetState = STATE_BROKEN;
    }
    else if (strcmp(command, "maintained") == 0)
    {
        targetState = STATE_MAINTAINED;
    }
    else if (strcmp(command, "unavailable") == 0)
    {
        targetState = STATE_UNAVAILABLE;
    }
    else
    {
        Log.error("Unknown state command: %s\n", command);
        return;
    }

    if (canTransitionTo(targetState))
    {
        changeState(targetState);
        Log.info("State changed to: %s\n", getStateName(targetState));

        if (Global::mqttManager)
        {
            char statusMsg[50];
            sprintf(statusMsg, "State changed to %s", getStateName(targetState));
            Global::mqttManager->publish(statusTopic(), statusMsg, false);
        }
        Global::logInfoBoth("Command state -> %s", getStateName(targetState));
    }
    else
    {
        Log.warning("Cannot transition to state %s from current state %s\n", getStateName(targetState), getStateName(currentState));
    }
}

void CommandHandler::handleBookingCommand(const char *command)
{
    Log.info("Handling booking command: %s\n", command);

    if (strcmp(command, "book") == 0)
    {
        if (currentState == STATE_AVAILABLE || currentState == STATE_RESERVED)
        {
            changeState(STATE_BOOKED);
            Log.info("Device booked successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::commandBookingTopic.c_str(), "booked", false);
            }
            Global::logInfoMQTT("Booking command: book");
        }
        else
        {
            Log.warning("Cannot book device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (strcmp(command, "claim") == 0)
    {
        if (currentState == STATE_RESERVED)
        {
            changeState(STATE_BOOKED);
            Log.info("Device claimed successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::commandBookingTopic.c_str(), "claimed", false);
            }
            Global::logInfoMQTT("Booking command: claim");
        }
        else
        {
            Log.warning("Cannot claim device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (strcmp(command, "release") == 0)
    {
        if (currentState == STATE_BOOKED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Device released successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::commandBookingTopic.c_str(), "available", false);
            }
            Global::logInfoMQTT("Booking command: release");
        }
        else
        {
            Log.warning("Cannot release device in current state: %s\n", getStateName(currentState));
        }
    }
}

void CommandHandler::handleReservationCommand(const char *command)
{
    Log.info("Handling reservation command: %s\n", command);

    if (strcmp(command, "reserve") == 0)
    {
        if (currentState == STATE_AVAILABLE)
        {
            changeState(STATE_RESERVED);
            Log.info("Device reserved successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::commandReservationTopic.c_str(), "reserved", false);
            }
            Global::logInfoMQTT("Reservation command: reserve");
        }
        else
        {
            Log.warning("Cannot reserve device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (strcmp(command, "cancel") == 0)
    {
        if (currentState == STATE_RESERVED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Reservation cancelled successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::commandReservationTopic.c_str(), "available", false);
            }
            Global::logInfoMQTT("Reservation command: cancel");
        }
        else
        {
            Log.warning("Cannot cancel reservation in current state: %s\n", getStateName(currentState));
        }
    }
}

void CommandHandler::handleMaintenanceCommand(const char *command)
{
    Log.info("Handling maintenance command: %s\n", command);

    if (strcmp(command, "start") == 0)
    {
        if (currentState == STATE_AVAILABLE || currentState == STATE_UNAVAILABLE || currentState == STATE_BROKEN)
        {
            changeState(STATE_MAINTAINED);
            Log.info("Maintenance mode started\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish("esp/maintenance/status", "in_progress", false);
            }
            Global::logInfoMQTT("Maintenance command: start");
        }
        else
        {
            Log.warning("Cannot start maintenance in current state: %s\n", getStateName(currentState));
        }
    }
    else if (strcmp(command, "complete") == 0)
    {
        if (currentState == STATE_MAINTAINED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Maintenance completed\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish("esp/maintenance/status", "completed", false);
            }
            Global::logInfoMQTT("Maintenance command: complete");
        }
        else
        {
            Log.warning("Cannot complete maintenance in current state: %s\n", getStateName(currentState));
        }
    }
}

void CommandHandler::handleStatusCommand(const char *command)
{
    Log.info("Handling status command: %s\n", command);

    if (strcmp(command, "request") == 0)
    {
        // Publish current status
        if (Global::mqttManager)
        {
            char statusMsg[100];
            sprintf(statusMsg, "Current state: %s", getStateName(currentState));
            Global::mqttManager->publish(statusTopic(), statusMsg, false);
        }
        Global::logInfoMQTT("Status requested -> %s", getStateName(currentState));
    }
}

bool CommandHandler::canTransitionTo(DeviceState newState)
{

    switch (currentState)
    {
    case STATE_RESERVED:
        return (newState == STATE_AVAILABLE ||
                newState == STATE_BOOKED);

    case STATE_AVAILABLE:
        return (newState == STATE_RESERVED ||
                newState == STATE_BOOKED ||
                newState == STATE_BROKEN ||
                newState == STATE_MAINTAINED ||
                newState == STATE_UNAVAILABLE);

    case STATE_BOOKED:
        return (newState == STATE_AVAILABLE ||
                newState == STATE_BROKEN ||
                newState == STATE_MAINTAINED ||
                newState == STATE_UNAVAILABLE);

    case STATE_BROKEN:
        return (newState == STATE_MAINTAINED ||
                newState == STATE_UNAVAILABLE);

    case STATE_MAINTAINED:
        return (newState == STATE_AVAILABLE ||
                newState == STATE_UNAVAILABLE);

    case STATE_UNAVAILABLE:
        return (newState == STATE_AVAILABLE ||
                newState == STATE_MAINTAINED);

    case STATE_CONNECTED:
    case STATE_ERROR:

        return (newState == STATE_AVAILABLE ||
                newState == STATE_MAINTAINED ||
                newState == STATE_UNAVAILABLE);

    default:
        return false;
    }
}

void CommandHandler::changeState(DeviceState newState)
{
    Log.info("Changing state from %s to %s\n", getStateName(currentState), getStateName(newState));
    currentState = newState;
    resetStateEntryFlags();
}
