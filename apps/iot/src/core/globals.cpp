#include "globals.h"
#include "LEDStatusManager.h"
#include "mqtt.h"

DeviceState currentState;
namespace Global
{
    std::unique_ptr<NetworkManager> networkManager = nullptr;
    std::unique_ptr<MQTTManager> mqttManager = nullptr;
    std::unique_ptr<BufferedLogger> bufferedLogger = nullptr;
    std::unique_ptr<LEDStatusManager> ledStatusManager = nullptr;

    bool setupMQTT(const char *brokerIP, int port, const char *username, const char *pass)
    {
        return ::setupMQTT(brokerIP, port, username, pass, "");
    }
}

const char *getStateName(DeviceState state)
{
    switch (state)
    {
    case STATE_INIT:
        return "INIT";
    case STATE_CONNECTING_WIFI:
        return "CONNECTING_WIFI";
    case STATE_CONNECTED:
        return "CONNECTED";
    case STATE_ERROR:
        return "ERROR";
    case STATE_RESERVED:
        return "RESERVED";
    case STATE_AVAILABLE:
        return "AVAILABLE";
    case STATE_BOOKED:
        return "BOOKED";
    case STATE_BROKEN:
        return "BROKEN";
    case STATE_MAINTAINED:
        return "MAINTAINED";
    case STATE_UNAVAILABLE:
        return "UNAVAILABLE";
    default:
        return "UNKNOWN";
    }
}
