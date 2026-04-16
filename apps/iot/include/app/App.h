#ifndef APP_APP_H
#define APP_APP_H

#include <memory>

#include "NFCManager.h"
#include "app/DeviceContext.h"
#include "app/RuntimeState.h"
#include "drivers/LedController.h"
#include "services/CommandConsumer.h"
#include "services/ConnectivityService.h"
#include "services/FeedbackController.h"
#include "services/TapPublisher.h"

class App
{
public:
    ~App();

    void setup();
    void loop();

private:
    void setRuntimeState(RuntimeState state);
    void publishStatusIfNeeded(bool force = false);
    bool configLooksValid() const;

    RuntimeState runtimeState = RuntimeState::Booting;
    RuntimeState lastPublishedState = RuntimeState::Booting;
    DeviceContext deviceContext;
    LedController ledController;
    std::unique_ptr<NFCManager> nfcManager;
    std::unique_ptr<ConnectivityService> connectivityService;
    std::unique_ptr<TapPublisher> tapPublisher;
    std::unique_ptr<CommandConsumer> commandConsumer;
    std::unique_ptr<FeedbackController> feedbackController;
    unsigned long lastStatusPublishAt = 0;
    bool setupFailed = false;
};

#endif // APP_APP_H
