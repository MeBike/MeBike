#include "services/ProvisioningService.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <ArduinoLog.h>

namespace
{
constexpr size_t MAX_PROVISIONING_LINE_LENGTH = 512;
constexpr const char *PROVISIONING_PREFIX = "CFG ";

std::optional<std::string_view> readOptionalStringField(const JsonDocument &doc, const char *key)
{
    JsonVariantConst value = doc[key];
    if (value.isUnbound() || value.isNull())
    {
        return std::nullopt;
    }

    const char *text = value.as<const char *>();
    if (text == nullptr)
    {
        return std::nullopt;
    }

    return std::string_view(text);
}
}

ProvisioningService::ProvisioningService(Stream &serial)
    : serial(serial)
{
}

void ProvisioningService::poll(AppConfig &config)
{
    while (serial.available() > 0)
    {
        const int nextByte = serial.read();
        if (nextByte < 0)
        {
            break;
        }

        const char nextChar = static_cast<char>(nextByte);
        if (nextChar == '\r')
        {
            continue;
        }

        if (nextChar == '\n')
        {
            if (!buffer.empty())
            {
                handleLine(buffer, config);
                buffer.clear();
            }
            continue;
        }

        buffer.push_back(nextChar);
        if (buffer.size() > MAX_PROVISIONING_LINE_LENGTH)
        {
            buffer.clear();
            Log.warning("Provisioning input too long, dropping line\n");
        }
    }
}

void ProvisioningService::handleLine(const std::string &line, AppConfig &config)
{
    if (line.rfind(PROVISIONING_PREFIX, 0) != 0)
    {
        return;
    }

    StaticJsonDocument<384> request;
    const std::string payload = line.substr(strlen(PROVISIONING_PREFIX));
    const DeserializationError error = deserializeJson(request, payload.c_str());
    const std::optional<std::string_view> requestId = readOptionalStringField(request, "requestId");

    if (error)
    {
        writeResponse(requestId, false, nullptr, error.c_str(), "invalid_json");
        return;
    }

    const std::optional<std::string_view> type = readOptionalStringField(request, "type");
    if (type == "get-config")
    {
        writeConfigResponse(config, requestId);
        return;
    }

    if (type == "set-config")
    {
        AppConfig nextConfig = config;

        if (request.containsKey("bikeId"))
        {
            nextConfig.bikeId = request["bikeId"] | "";
        }
        if (request.containsKey("wifiSsid"))
        {
            nextConfig.wifiSsid = request["wifiSsid"] | "";
        }
        if (request.containsKey("wifiPass"))
        {
            nextConfig.wifiPass = request["wifiPass"] | "";
        }
        if (request.containsKey("mqttBrokerIP"))
        {
            nextConfig.mqttBrokerIP = request["mqttBrokerIP"] | "";
        }
        if (request.containsKey("mqttPort"))
        {
            nextConfig.mqttPort = request["mqttPort"] | 0;
        }
        if (request.containsKey("mqttUsername"))
        {
            nextConfig.mqttUsername = request["mqttUsername"] | "";
        }
        if (request.containsKey("mqttPassword"))
        {
            nextConfig.mqttPassword = request["mqttPassword"] | "";
        }

        if (!isConfigValid(nextConfig))
        {
            writeResponse(requestId,
                          false,
                          type,
                          "bikeId, wifiSsid, mqttBrokerIP, and mqttPort are required",
                          "invalid_config");
            return;
        }

        if (!saveConfig(nextConfig))
        {
            writeResponse(requestId, false, type, "failed to persist config", "save_failed");
            return;
        }

        config = nextConfig;
        writeResponse(requestId, true, type, "config saved, restarting");
        restartDevice();
        return;
    }

    if (type == "restart")
    {
        writeResponse(requestId, true, type, "restarting");
        restartDevice();
        return;
    }

    writeResponse(requestId, false, std::nullopt, type, "unknown_command");
}

void ProvisioningService::writeResponse(std::optional<std::string_view> requestId,
                                        bool ok,
                                        std::optional<std::string_view> type,
                                        std::optional<std::string_view> message,
                                        std::optional<std::string_view> error) const
{
    StaticJsonDocument<384> response;
    response["channel"] = "config";
    response["ok"] = ok;

    if (requestId.has_value())
    {
        response["requestId"] = requestId->data();
    }
    if (type.has_value())
    {
        response["type"] = type->data();
    }
    if (error.has_value())
    {
        response["error"] = error->data();
    }
    if (message.has_value())
    {
        response["message"] = message->data();
    }

    serial.print(PROVISIONING_PREFIX);
    serializeJson(response, serial);
    serial.print('\n');
}

void ProvisioningService::writeConfigResponse(const AppConfig &config, std::optional<std::string_view> requestId) const
{
    StaticJsonDocument<384> response;
    response["channel"] = "config";
    response["ok"] = true;
    response["type"] = "get-config";
    if (requestId.has_value())
    {
        response["requestId"] = requestId->data();
    }
    response["bikeId"] = config.bikeId.c_str();
    response["wifiSsid"] = config.wifiSsid.c_str();
    response["wifiPass"] = config.wifiPass.c_str();
    response["mqttBrokerIP"] = config.mqttBrokerIP.c_str();
    response["mqttPort"] = config.mqttPort;
    response["mqttUsername"] = config.mqttUsername.c_str();
    response["mqttPassword"] = config.mqttPassword.c_str();

    serial.print(PROVISIONING_PREFIX);
    serializeJson(response, serial);
    serial.print('\n');
}

void ProvisioningService::restartDevice() const
{
    serial.flush();
    delay(200);
    ESP.restart();
}
