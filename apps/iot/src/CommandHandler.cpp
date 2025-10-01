#include "CommandHandler.h"
#include <ArduinoLog.h>
#include "globals.h"
#include "StateMachine.h"

void CommandHandler::processCommand(const char *topic, const char *message)
{
    Log.info("Processing command from topic %s: %s\n", topic, message);

    
    if (strcmp(topic, "esp/commands/state") == 0 || strcmp(topic, "esp/commands") == 0)
    {
        handleStateCommand(message);
    }
    else if (strcmp(topic, "esp/commands/booking") == 0)
    {
        handleBookingCommand(message);
    }
    else if (strcmp(topic, "esp/commands/maintenance") == 0)
    {
        handleMaintenanceCommand(message);
    }
    else if (strcmp(topic, "esp/commands/status") == 0)
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
    else if (strcmp(command, "booked") == 0)
    {
        targetState = STATE_BOOKED;
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
        Log.info("State changed to: %d\n", targetState);

       
        if (Global::mqttManager)
        {
            char statusMsg[50];
            sprintf(statusMsg, "State changed to %d", targetState);
            Global::mqttManager->publish("esp/status", statusMsg, false);
        }
    }
    else
    {
        Log.warning("Cannot transition to state %d from current state %d\n", targetState, currentState);
    }
}

void CommandHandler::handleBookingCommand(const char *command)
{
    Log.info("Handling booking command: %s\n", command);

    if (strcmp(command, "book") == 0)
    {
        if (currentState == STATE_AVAILABLE)
        {
            changeState(STATE_BOOKED);
            Log.info("Device booked successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish("esp/booking/status", "booked", false);
            }
        }
        else
        {
            Log.warning("Cannot book device in current state: %d\n", currentState);
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
                Global::mqttManager->publish("esp/booking/status", "available", false);
            }
        }
        else
        {
            Log.warning("Cannot release device in current state: %d\n", currentState);
        }
    }
}

void CommandHandler::handleMaintenanceCommand(const char *command)
{
    Log.info("Handling maintenance command: %s\n", command);

    if (strcmp(command, "start") == 0)
    {
        if (currentState == STATE_AVAILABLE || currentState == STATE_UNAVAILABLE)
        {
            changeState(STATE_MAINTAINED);
            Log.info("Maintenance mode started\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish("esp/maintenance/status", "in_progress", false);
            }
        }
        else
        {
            Log.warning("Cannot start maintenance in current state: %d\n", currentState);
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
        }
        else
        {
            Log.warning("Cannot complete maintenance in current state: %d\n", currentState);
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
            sprintf(statusMsg, "Current state: %d", currentState);
            Global::mqttManager->publish("esp/status", statusMsg, false);
        }
    }
}

bool CommandHandler::canTransitionTo(DeviceState newState)
{
 
    switch (currentState)
    {
    case STATE_AVAILABLE:
        return (newState == STATE_BOOKED ||
                newState == STATE_MAINTAINED ||
                newState == STATE_UNAVAILABLE);

    case STATE_BOOKED:
        return (newState == STATE_AVAILABLE ||
                newState == STATE_MAINTAINED ||
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
    Log.info("Changing state from %d to %d\n", currentState, newState);
    currentState = newState;
    resetStateEntryFlags(); 
}