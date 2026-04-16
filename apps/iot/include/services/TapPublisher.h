#ifndef SERVICES_TAP_PUBLISHER_H
#define SERVICES_TAP_PUBLISHER_H

#include <cstdint>
#include <string>

#include "CardTapWatcher.h"
#include "app/DeviceContext.h"

class MQTTManager;
class NFCManager;

class TapPublisher
{
public:
    TapPublisher(NFCManager &nfcManager, const DeviceContext &deviceContext);

    bool pollAndPublish(MQTTManager &mqttManager);
    const std::string &lastRequestId() const;

private:
    bool publishTap(MQTTManager &mqttManager, const std::string &cardUid);
    std::string nextRequestId();

    CardTapWatcher watcher;
    DeviceContext deviceContext;
    uint32_t requestSequence = 0;
    std::string lastPublishedRequestId;
};

#endif // SERVICES_TAP_PUBLISHER_H
