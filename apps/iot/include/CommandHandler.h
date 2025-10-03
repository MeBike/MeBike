#ifndef COMMANDHANDLER_H
#define COMMANDHANDLER_H

#include <Arduino.h>
#include "globals.h"

class CommandHandler
{
public:
    static void processCommand(const char *topic, const char *message);

private:
    static void handleStateCommand(const char *command);
    static void handleBookingCommand(const char *command);
    static void handleReservationCommand(const char *command);
    static void handleMaintenanceCommand(const char *command);
    static void handleStatusCommand(const char *command);

    static bool canTransitionTo(DeviceState newState);
    static void changeState(DeviceState newState);
};

#endif // COMMANDHANDLER_H