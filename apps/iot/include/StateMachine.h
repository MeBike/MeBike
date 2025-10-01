#ifndef STATEMACHINE_H
#define STATEMACHINE_H

#include "globals.h"

extern unsigned long lastRecoveryAttempt;
extern int recoveryRetries;
const int maxRecoveryRetries = 5;
const unsigned long recoveryInterval = 5000;

void handleConnectedState();
void handleErrorState();
void handleUnknownState();
void handleAvailableState();
void handleBookedState();
void handleMaintainedState();
void handleUnavailableState();

void resetStateEntryFlags();

#endif // STATEMACHINE_H