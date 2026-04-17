#include "services/CommandConsumer.h"

#include <ArduinoJson.h>
#include <ArduinoLog.h>

#include "MQTTManager.h"
#include "services/FeedbackController.h"

namespace
{
std::optional<std::string> readOptionalStringField(const JsonDocument &doc, const char *key)
{
    JsonVariantConst value = doc[key];
    if (value.isUnbound() || value.isNull())
    {
        return std::nullopt;
    }

    const char *text = value.as<const char *>();
    if (text == nullptr || text[0] == '\0')
    {
        return std::nullopt;
    }

    return std::string(text);
}
}

CommandConsumer *CommandConsumer::activeInstance = nullptr;

CommandConsumer::CommandConsumer(const DeviceContext &deviceContext)
    : deviceContext(deviceContext)
{
}

void CommandConsumer::attach(MQTTManager &mqttManager)
{
    activeInstance = this;
    mqttManager.setCallback(mqttCallback);
}

bool CommandConsumer::processPending(MQTTManager &mqttManager, FeedbackController &feedbackController)
{
    if (!hasPendingMessage)
    {
        return false;
    }

    DeviceCommand command;
    if (!parsePendingCommand(command))
    {
        const DeviceCommand invalidCommand{"invalid", "", std::nullopt, 0};
        publishAck(mqttManager, invalidCommand, "rejected", "invalid_payload");
        feedbackController.signalCommandFailed();
        hasPendingMessage = false;
        pendingPayload.clear();
        return true;
    }

    hasPendingMessage = false;
    pendingPayload.clear();

    if (command.action == "unlock")
    {
        feedbackController.signalUnlockGranted();
        publishAck(mqttManager, command, "done", "unlock_simulated");
        Log.notice("Executed unlock command %s\n", command.requestId.c_str());
        return true;
    }

    if (command.action == "deny")
    {
        feedbackController.signalAccessDenied();
        publishAck(mqttManager,
                   command,
                   "done",
                   command.reason.has_value() ? std::optional<std::string_view>(*command.reason) : std::optional<std::string_view>("denied"));
        Log.notice("Executed deny command %s\n", command.requestId.c_str());
        return true;
    }

    if (command.action == "ping")
    {
        publishAck(mqttManager, command, "done", "pong");
        Log.notice("Executed ping command %s\n", command.requestId.c_str());
        return true;
    }

    publishAck(mqttManager, command, "rejected", "unknown_action");
    feedbackController.signalCommandFailed();
    Log.warning("Unknown device action: %s\n", command.action.c_str());
    return true;
}

void CommandConsumer::mqttCallback(char *topic, byte *payload, unsigned int length)
{
    if (activeInstance != nullptr)
    {
        activeInstance->onMessage(topic, payload, length);
    }
}

void CommandConsumer::onMessage(char *topic, byte *payload, unsigned int length)
{
    if (topic == nullptr || deviceContext.topics.commandTopic != topic)
    {
        return;
    }

    pendingPayload.assign(reinterpret_cast<const char *>(payload), length);
    hasPendingMessage = true;
}

bool CommandConsumer::parsePendingCommand(DeviceCommand &command)
{
    if (pendingPayload.empty())
    {
        return false;
    }

    StaticJsonDocument<192> doc;
    const DeserializationError error = deserializeJson(doc, pendingPayload.c_str());
    if (error)
    {
        command.action = pendingPayload;
        command.requestId = "";
        command.reason = std::nullopt;
        command.durationMs = 0;
        return !command.action.empty();
    }

    const char *action = doc["action"] | "";
    command.action = action;
    command.requestId = doc["requestId"] | "";
    command.reason = readOptionalStringField(doc, "reason");
    command.durationMs = doc["durationMs"] | 0;
    return !command.action.empty();
}

void CommandConsumer::publishAck(MQTTManager &mqttManager,
                                 const DeviceCommand &command,
                                 const char *status,
                                 std::optional<std::string_view> detail)
{
    StaticJsonDocument<192> doc;
    doc["deviceId"] = deviceContext.deviceId.c_str();
    doc["requestId"] = command.requestId.c_str();
    doc["action"] = command.action.c_str();
    doc["status"] = status;
    if (detail.has_value())
    {
        const std::string detailText(detail->data(), detail->size());
        doc["detail"] = detailText.c_str();
    }

    char payload[192];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload))
    {
        Log.error("Failed to serialize command ack\n");
        return;
    }

    mqttManager.publish(deviceContext.topics.ackTopic, payload, false);
}
