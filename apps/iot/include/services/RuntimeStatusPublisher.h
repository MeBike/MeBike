#ifndef SERVICES_RUNTIME_STATUS_PUBLISHER_H
#define SERVICES_RUNTIME_STATUS_PUBLISHER_H

#include <optional>

#include "app/DeviceContext.h"
#include "app/RuntimeState.h"

class MQTTManager;

class RuntimeStatusPublisher
{
public:
    explicit RuntimeStatusPublisher(const DeviceContext &deviceContext);

    void publishIfNeeded(MQTTManager &mqttManager,
                         RuntimeState runtimeState,
                         bool wifiConnected,
                         bool mqttConnected,
                         bool nfcHealthy,
                         bool force = false);

private:
    void logPublishedStatus(RuntimeState runtimeState,
                            unsigned long timestampMs,
                            bool wifiConnected,
                            bool mqttConnected,
                            bool nfcHealthy) const;

    DeviceContext deviceContext;
    RuntimeState lastPublishedState = RuntimeState::Booting;
    std::optional<unsigned long> lastPublishedAt;
};

#endif // SERVICES_RUNTIME_STATUS_PUBLISHER_H
