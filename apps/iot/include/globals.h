#ifndef GLOBALS_H
#define GLOBALS_H

#include <memory>
#include <string>

#include "NetworkManager.h"
#include "MQTTManager.h"
#include "BufferedLogger.h"
#include "network.h"

class LEDStatusManager;

enum DeviceState
{
    // Connection states
    STATE_INIT,
    STATE_CONNECTING_WIFI,
    STATE_CONNECTED,
    STATE_ERROR,

    // Operational states
    STATE_RESERVED,   //  đã bị thuê Bike held for pre-booking.
    STATE_AVAILABLE,  //  Bike ready for rent/use
    STATE_BOOKED,     // IN_USE (or BOOKED/RENTED in context): Bike currently rented/active. cái này giống in_use trong doc
    STATE_BROKEN,     // hư
    STATE_MAINTAINED, // Under maintenance
    STATE_UNAVAILABLE // Offline or faulty
};

extern DeviceState currentState;

const char *getStateName(DeviceState state);

namespace Global
{
    extern std::unique_ptr<NetworkManager> networkManager;
    extern std::unique_ptr<MQTTManager> mqttManager;
    extern std::unique_ptr<BufferedLogger> bufferedLogger;
    extern std::unique_ptr<LEDStatusManager> ledStatusManager;

    inline const NetworkTopics &getTopics()
    {
        return networkManager->getTopics();
    }

    bool setupMQTT(const char *brokerIP, int port, const char *username, const char *pass);

    inline void logBuffered(LogSeverity severity, LogDestination destination, const std::string &message)
    {
        if (bufferedLogger)
        {
            bufferedLogger->log(severity, destination, message);
        }
    }

    inline void logBuffered(LogSeverity severity, LogDestination destination, const char *message)
    {
        if (bufferedLogger && message)
        {
            bufferedLogger->log(severity, destination, message);
        }
    }

    template <typename... Args>
    inline void logBuffered(LogSeverity severity, LogDestination destination, const char *fmt, Args... args)
    {
        if (bufferedLogger && fmt)
        {
            bufferedLogger->logf(severity, destination, fmt, args...);
        }
    }

    template <typename... Args>
    inline void logInfoMQTT(const char *fmt, Args... args)
    {
        logBuffered(LogSeverity::Info, LogDestination::MQTT, fmt, args...);
    }

    template <typename... Args>
    inline void logInfoBoth(const char *fmt, Args... args)
    {
        logBuffered(LogSeverity::Info, LogDestination::Both, fmt, args...);
    }

    template <typename... Args>
    inline void logInfoLocal(const char *fmt, Args... args)
    {
        logBuffered(LogSeverity::Info, LogDestination::Local, fmt, args...);
    }

    inline void logInfoMQTT(const std::string &message)
    {
        logBuffered(LogSeverity::Info, LogDestination::MQTT, message);
    }

    inline void logInfoBoth(const std::string &message)
    {
        logBuffered(LogSeverity::Info, LogDestination::Both, message);
    }

    inline void logInfoLocal(const std::string &message)
    {
        logBuffered(LogSeverity::Info, LogDestination::Local, message);
    }
}

#endif // GLOBALS_H
