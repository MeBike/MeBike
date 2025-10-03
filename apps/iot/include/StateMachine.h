#ifndef STATEMACHINE_H
#define STATEMACHINE_H

#include "globals.h"

extern unsigned long lastRecoveryAttempt;
extern int recoveryRetries;
const int maxRecoveryRetries = 5;
const unsigned long recoveryInterval = 5000;

extern unsigned long lastMqttReconnectAttempt;
extern int mqttReconnectRetries;
const int maxMqttReconnectRetries = 3;
const unsigned long mqttReconnectInterval = 5000;

void handleConnectedState();
void handleInitState();
void handleConnectingWifiState();
void handleErrorState();
void handleUnknownState();
void handleAvailableState();
void handleBookedState();
void handleReservedState();
void handleBrokenState();
void handleMaintainedState();
void handleUnavailableState();

void resetStateEntryFlags();
bool ensureMqttConnected();

#endif // STATEMACHINE_H