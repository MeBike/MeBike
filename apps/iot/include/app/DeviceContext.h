#ifndef APP_DEVICE_CONTEXT_H
#define APP_DEVICE_CONTEXT_H

#include <string>

struct DeviceTopics
{
    std::string tapEventTopic;
    std::string commandTopic;
    std::string ackTopic;
    std::string statusTopic;
};

struct DeviceContext
{
    std::string deviceId;
    DeviceTopics topics;
};

inline DeviceContext makeDeviceContext(const std::string &deviceId)
{
    const std::string baseTopic = std::string("device/") + deviceId;

    return DeviceContext{
        deviceId,
        DeviceTopics{
            baseTopic + "/events/tap",
            baseTopic + "/commands",
            baseTopic + "/acks",
            baseTopic + "/status",
        },
    };
}

#endif // APP_DEVICE_CONTEXT_H
