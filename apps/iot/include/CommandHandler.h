#ifndef COMMANDHANDLER_H
#define COMMANDHANDLER_H

#include <Arduino.h>
#include <string_view>
#include "globals.h"

class CommandHandler
{
public:
    static void processCommand(std::string_view topic, std::string_view message);
    static void processCommand(const char *topic, const char *message);

private:
    static void handleStateCommand(std::string_view command);
    static void handleBookingCommand(std::string_view command);
    static void handleReservationCommand(std::string_view command);
    static void handleMaintenanceCommand(std::string_view command);
    static void handleStatusCommand(std::string_view command);

    static bool canTransitionTo(DeviceState newState);
    static void changeState(DeviceState newState);
};

#endif // COMMANDHANDLER_H
