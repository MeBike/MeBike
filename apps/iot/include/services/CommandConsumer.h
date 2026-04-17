#ifndef SERVICES_COMMAND_CONSUMER_H
#define SERVICES_COMMAND_CONSUMER_H

#include <Arduino.h>

#include <optional>
#include <string>
#include <string_view>

#include "app/DeviceContext.h"

class MQTTManager;
class FeedbackController;

struct DeviceCommand
{
    std::string action;
    std::string requestId;
    std::optional<std::string> reason;
    uint32_t durationMs = 0;
};

class CommandConsumer
{
public:
    explicit CommandConsumer(const DeviceContext &deviceContext);

    void attach(MQTTManager &mqttManager);
    bool processPending(MQTTManager &mqttManager, FeedbackController &feedbackController);

private:
    static void mqttCallback(char *topic, byte *payload, unsigned int length);
    void onMessage(char *topic, byte *payload, unsigned int length);
    bool parsePendingCommand(DeviceCommand &command);
    void publishAck(MQTTManager &mqttManager,
                    const DeviceCommand &command,
                    const char *status,
                    std::optional<std::string_view> detail = std::nullopt);

    static CommandConsumer *activeInstance;

    DeviceContext deviceContext;
    bool hasPendingMessage = false;
    std::string pendingPayload;
};

#endif // SERVICES_COMMAND_CONSUMER_H
