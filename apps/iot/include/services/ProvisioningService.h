#ifndef SERVICES_PROVISIONING_SERVICE_H
#define SERVICES_PROVISIONING_SERVICE_H

#include <optional>
#include <string>
#include <string_view>

#include "Config.h"

class Stream;

class ProvisioningService
{
public:
    explicit ProvisioningService(Stream &serial);

    void poll(AppConfig &config);

private:
    void handleLine(const std::string &line, AppConfig &config);
    void writeResponse(std::optional<std::string_view> requestId,
                       bool ok,
                       std::optional<std::string_view> type,
                       std::optional<std::string_view> message,
                       std::optional<std::string_view> error = std::nullopt) const;
    void writeConfigResponse(const AppConfig &config, std::optional<std::string_view> requestId) const;
    void restartDevice() const;

    Stream &serial;
    std::string buffer;
};

#endif // SERVICES_PROVISIONING_SERVICE_H
