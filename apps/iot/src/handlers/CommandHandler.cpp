// Các quy tắc chuyển đổi trạng thái
//
// Nếu xe đang ở trạng thái RESERVED, nó chỉ có thể trở thành:
// - AVAILABLE (nếu việc đặt trước bị hủy).
// - BOOKED (nếu người dùng nhận xe).
// Mọi chuyển đổi khác đều bị từ chối.
//
// Nếu xe đang ở trạng thái BOOKED (đang được sử dụng), nó chỉ có thể trở thành:
// - AVAILABLE (khi người dùng trả xe).
// - BROKEN, MAINTAINED, hoặc UNAVAILABLE (nếu có sự cố được báo cáo hoặc phát hiện).
// Nó không thể được đặt trước hoặc thuê lại cho đến khi được trả lại.
//
// Nếu xe đang ở trạng thái BROKEN, nó chỉ có thể được chuyển sang:
// - MAINTAINED hoặc UNAVAILABLE.
// Nó không thể trở thành AVAILABLE hoặc được khách hàng sử dụng cho đến khi đã được bảo trì.
//
// Nếu xe đang trong trạng thái MAINTAINED, nó chỉ có thể trở thành:
// - AVAILABLE (sau khi bảo trì hoàn tất).
// - UNAVAILABLE.
// Nó không thể được thuê, đặt trước, hoặc báo hỏng trực tiếp từ trạng thái này.
//
// Nếu xe đang ở trạng thái AVAILABLE, nó có thể chuyển sang hầu hết các trạng thái hoạt động khác (RESERVED, BOOKED, BROKEN, v.v.).

#include "CommandHandler.h"
#include <ArduinoLog.h>
#include <string>
#include <unordered_map>
#include "globals.h"
#include "LEDStatusManager.h"
#include "StateMachine.h"

static bool matchesTopic(const char *incoming, const char *baseTopic, const std::string &deviceTopic)
{
    if (!incoming)
    {
        return false;
    }

    const std::string incomingStr(incoming);
    if (incomingStr == baseTopic)
    {
        return true;
    }
    return !deviceTopic.empty() && incomingStr == deviceTopic;
}

static const char *statusTopic()
{
    return Global::getTopics().statusTopic.c_str();
}

void CommandHandler::processCommand(const char *topic, const char *message)
{
    Log.info("Processing command from topic %s: %s\n", topic, message);

    if (matchesTopic(topic, "esp/commands/state", Global::getTopics().commandStateTopic) ||
        matchesTopic(topic, "esp/commands", Global::getTopics().commandRootTopic))
    {
        handleStateCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/booking", Global::getTopics().commandBookingTopic))
    {
        handleBookingCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/reservation", Global::getTopics().commandReservationTopic))
    {
        handleReservationCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/maintenance", Global::getTopics().commandMaintenanceTopic))
    {
        handleMaintenanceCommand(message);
    }
    else if (matchesTopic(topic, "esp/commands/status", Global::getTopics().commandStatusTopic))
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
    if (!command)
    {
        Log.error("State command is null\n");
        return;
    }

    const std::string commandStr(command);
    Log.info("Handling state command: %s\n", commandStr.c_str());

    static const std::unordered_map<std::string, DeviceState> stateMap = {
        {"available", STATE_AVAILABLE},
        {"reserved", STATE_RESERVED},
        {"booked", STATE_BOOKED},
        {"broken", STATE_BROKEN},
        {"maintained", STATE_MAINTAINED},
        {"unavailable", STATE_UNAVAILABLE}
    };

    const auto targetIt = stateMap.find(commandStr);
    if (targetIt == stateMap.end())
    {
        Log.error("Unknown state command: %s\n", commandStr.c_str());
        return;
    }

    const DeviceState targetState = targetIt->second;

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
    if (!command)
    {
        Log.error("Booking command is null\n");
        return;
    }

    const std::string commandStr(command);
    Log.info("Handling booking command: %s\n", commandStr.c_str());

    if (commandStr == "book")
    {
        if (currentState == STATE_AVAILABLE || currentState == STATE_RESERVED) // nếu có hoặc người dùng muốn giữ chỗ
        {
            changeState(STATE_BOOKED);
            Log.info("Device booked successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().commandBookingTopic.c_str(), "booked", false);
            }
            Global::logInfoMQTT("Booking command: book");
        }
        else
        {
            Log.warning("Cannot book device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (commandStr == "claim" || commandStr == "claimed")
    {
        if (currentState == STATE_RESERVED)
        {
            changeState(STATE_BOOKED);
            Log.info("Device claimed successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().commandBookingTopic.c_str(), "claimed", false); 
            }
            Global::logInfoMQTT("Booking command: claim");
        }
        else
        {
            Log.warning("Cannot claim device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (commandStr == "release")
    {
        if (currentState == STATE_BOOKED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Device released successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().commandBookingTopic.c_str(), "available", false);
            }
            Global::logInfoMQTT("Booking command: release");
        }
        else
        {
            Log.warning("Cannot release device in current state: %s\n", getStateName(currentState));
        }
    }
    else
    {
        Log.error("Unknown booking command: %s\n", commandStr.c_str());
    }
}

void CommandHandler::handleReservationCommand(const char *command)
{
    if (!command)
    {
        Log.error("Reservation command is null\n");
        return;
    }

    const std::string commandStr(command);
    Log.info("Handling reservation command: %s\n", commandStr.c_str());

    if (commandStr == "reserve")
    {
        if (currentState == STATE_AVAILABLE)
        {
            changeState(STATE_RESERVED);
            Log.info("Device reserved successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().commandReservationTopic.c_str(), "reserved", false);
            }
            Global::logInfoMQTT("Reservation command: reserve");
        }
        else
        {
            Log.warning("Cannot reserve device in current state: %s\n", getStateName(currentState));
        }
    }
    else if (commandStr == "cancel")
    {
        if (currentState == STATE_RESERVED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Reservation cancelled successfully\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().commandReservationTopic.c_str(), "available", false);
            }
            Global::logInfoMQTT("Reservation command: cancel");
        }
        else
        {
            Log.warning("Cannot cancel reservation in current state: %s\n", getStateName(currentState));
        }
    }
    else
    {
        Log.error("Unknown reservation command: %s\n", commandStr.c_str());
    }
}

void CommandHandler::handleMaintenanceCommand(const char *command)
{
    if (!command)
    {
        Log.error("Maintenance command is null\n");
        return;
    }

    const std::string commandStr(command);
    Log.info("Handling maintenance command: %s\n", commandStr.c_str());

    if (commandStr == "start")
    {
        if (currentState == STATE_AVAILABLE ||
            currentState == STATE_UNAVAILABLE ||
            currentState == STATE_BROKEN ||
            currentState == STATE_BOOKED)
        {
            changeState(STATE_MAINTAINED);
            Log.info("Maintenance mode started\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().maintenanceStatusTopic.c_str(), "in_progress", false);
            }
            Global::logInfoMQTT("Maintenance command: start");
        }
        else
        {
            Log.warning("Cannot start maintenance in current state: %s\n", getStateName(currentState));
        }
    }
    else if (commandStr == "complete")
    {
        if (currentState == STATE_MAINTAINED)
        {
            changeState(STATE_AVAILABLE);
            Log.info("Maintenance completed\n");

            if (Global::mqttManager)
            {
                Global::mqttManager->publish(Global::getTopics().maintenanceStatusTopic.c_str(), "completed", false);
            }
            Global::logInfoMQTT("Maintenance command: complete");
        }
        else
        {
            Log.warning("Cannot complete maintenance in current state: %s\n", getStateName(currentState));
        }
    }
    else
    {
        Log.error("Unknown maintenance command: %s\n", commandStr.c_str());
    }
}

void CommandHandler::handleStatusCommand(const char *command)
{
    if (!command)
    {
        Log.error("Status command is null\n");
        return;
    }

    const std::string commandStr(command);
    Log.info("Handling status command: %s\n", commandStr.c_str());

    if (commandStr == "request")
    {
        if (Global::mqttManager)
        {
            char statusMsg[100];
            sprintf(statusMsg, "Current state: %s", getStateName(currentState));
            Global::mqttManager->publish(statusTopic(), statusMsg, false);
        }
        Global::logInfoMQTT("Status requested -> %s", getStateName(currentState));
    }
    else
    {
        Log.error("Unknown status command: %s\n", commandStr.c_str());
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

    if (Global::ledStatusManager)
    {
        Global::ledStatusManager->setStatus(newState);
    }

    resetStateEntryFlags();
}
